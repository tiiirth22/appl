import os
import io
import hashlib
from typing import List, Dict, Any, Tuple, Optional
from pdfminer.high_level import extract_text, extract_pages
from pdfminer.layout import LTTextContainer, LAParams
from PIL import Image
import pytesseract
import uuid
import logging
from datetime import datetime, timezone
import importlib

# Optional import for sentence transformers
SentenceTransformer = None
sentence_transformers_available = False
try:
    sentence_transformers = importlib.import_module('sentence_transformers')
    SentenceTransformer = sentence_transformers.SentenceTransformer
    sentence_transformers_available = True
except ImportError as e:
    print(f"Warning: sentence_transformers not available: {e}")


logger = logging.getLogger(__name__)

# Pinecone imports
Pinecone = None
ServerlessSpec = None
pinecone_available = False
try:
    import pinecone
    from pinecone import Pinecone, ServerlessSpec
    pinecone_available = True
except ImportError:
    logger.warning("Pinecone library not installed - ML features will be disabled")

class DocumentProcessor:
    """Handles document ingestion pipeline."""
    
    
    def __init__(self, pinecone_client: Pinecone = None, index_name: str = "appliance-manuals"):
        self.pc = pinecone_client
        self.index_name = index_name
        self.index = None
        
        # Initialize embedding model if available
        if sentence_transformers_available and SentenceTransformer:
            try:
                self.embedding_model = SentenceTransformer(
                    os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
                )
            except Exception as e:
                logger.warning(f"Failed to load embedding model: {e}")
                self.embedding_model = None
        else:
            self.embedding_model = None
            logger.warning("Embedding model not available - RAG features will be limited")
        
        if self.pc:
            self._ensure_collection()
        else:
            logger.warning("Pinecone client not provided - vector search will be disabled")
    
    def _ensure_collection(self):
        """Create index if it doesn't exist."""
        try:
            existing_indexes = [i.name for i in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                # Create serverless index
                cloud = os.getenv("PINECONE_CLOUD", "aws")
                region = os.getenv("PINECONE_REGION", "us-east-1")
                
                self.pc.create_index(
                    name=self.index_name,
                    dimension=384,  # all-MiniLM-L6-v2 dimension
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud=cloud,
                        region=region
                    )
                )
                logger.info(f"Created Pinecone index: {self.index_name}")
            
            self.index = self.pc.Index(self.index_name)
            
        except Exception as e:
            logger.error(f"Error ensuring index: {e}")
            # If creation fails, try to get the index anyway (might be pod-based or pre-existing)
            try:
                self.index = self.pc.Index(self.index_name)
            except Exception as e2:
                raise e
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file (full text, fallback)."""
        try:
            text = extract_text(file_path)
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_text_by_page(self, file_path: str) -> List[Tuple[int, str]]:
        """Extract text from PDF page-by-page. Returns (page_number, text) list (1-indexed)."""
        pages = []
        try:
            for page_num, page_layout in enumerate(extract_pages(file_path, laparams=LAParams()), start=1):
                page_text = ""
                for element in page_layout:
                    if isinstance(element, LTTextContainer):
                        page_text += element.get_text()
                if page_text.strip():
                    pages.append((page_num, page_text))
            
            if not pages:
                full_text = self.extract_text_from_pdf(file_path)
                if full_text.strip(): pages = [(1, full_text)]
            return pages
        except Exception as e:
            logger.error(f"Error extracting text by page: {e}")
            full_text = self.extract_text_from_pdf(file_path)
            return [(1, full_text)] if full_text.strip() else []
    
    def extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using OCR."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            raise
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Chunk text into overlapping segments."""
        try:
            try:
                from langchain_text_splitters import RecursiveCharacterTextSplitter
            except ImportError:
                from langchain.text_splitter import RecursiveCharacterTextSplitter
            
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            return splitter.split_text(text)
        except ImportError:
            logger.warning("LangChain not available, fallback to simple splitting")
            chunks = []
            words = text.split()
            for i in range(0, len(words), chunk_size - overlap):
                chunk_words = words[i:i + chunk_size]
                chunk = ' '.join(chunk_words)
                if chunk.strip(): chunks.append(chunk)
            return chunks

    def chunk_text_with_pages(self, pages: List[Tuple[int, str]], chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
        """Chunk page-segmented text, tracking page numbers."""
        result_chunks = []
        for page_num, page_text in pages:
            page_chunks = self.chunk_text(page_text, chunk_size, overlap)
            for chunk in page_chunks:
                result_chunks.append({"content": chunk, "page_number": page_num})
        return result_chunks

    async def generate_embeddings_with_cache(self, texts: List[str], db) -> List[List[float]]:
        """Generate embeddings with MongoDB caching."""
        if self.embedding_model is None or db is None:
            return []
            
        final_embeddings = [None] * len(texts)
        to_embed_indices = []
        to_embed_texts = []
        
        # 1. Check Cache
        for i, text in enumerate(texts):
            text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            cached = await db.embedding_cache.find_one({"hash": text_hash})
            if cached:
                final_embeddings[i] = cached["embedding"]
            else:
                to_embed_indices.append(i)
                to_embed_texts.append(text)
        
        # 2. Batch Embed missing ones
        if to_embed_texts:
            logger.info(f"Cache miss: Embedding {len(to_embed_texts)} new chunks")
            new_embeddings = self.embedding_model.encode(to_embed_texts, convert_to_numpy=False)
            
            cache_docs = []
            for i, (idx, emb) in enumerate(zip(to_embed_indices, new_embeddings)):
                emb_list = emb.tolist() if hasattr(emb, 'tolist') else emb
                final_embeddings[idx] = emb_list
                cache_docs.append({
                    "hash": hashlib.sha256(to_embed_texts[i].encode('utf-8')).hexdigest(),
                    "embedding": emb_list,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            if cache_docs:
                await db.embedding_cache.insert_many(cache_docs, ordered=False)
                # Ensure index on hash
                await db.embedding_cache.create_index("hash", unique=True)
                
        return final_embeddings
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks."""
        if self.embedding_model is None:
            logger.warning("Embedding model not available - skipping embedding generation")
            return []
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_numpy=False)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return []
    
    async def process_manual(self, manual_id: str, file_path: str, file_type: str, db) -> int:
        """Process a manual file and store in Pinecone and MongoDB."""
        try:
            # Extract and chunk with page numbers
            if file_type == "pdf":
                pages = self.extract_text_by_page(file_path)
                chunked_data = self.chunk_text_with_pages(pages)
            elif file_type in ["image", "png", "jpg", "jpeg"]:
                text = self.extract_text_from_image(file_path)
                chunks = self.chunk_text(text)
                chunked_data = [{"content": c, "page_number": 1} for c in chunks]
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            if not chunked_data:
                raise ValueError("No text extracted from file")
            
            chunk_texts = [c["content"] for c in chunked_data]
            
            # Generate/Cache embeddings
            if self.index and self.embedding_model:
                embeddings = await self.generate_embeddings_with_cache(chunk_texts, db)
                
                if embeddings:
                    vectors = []
                    for idx, (chunk_info, embedding) in enumerate(zip(chunked_data, embeddings)):
                        vector_id = str(uuid.uuid4())
                        metadata = {
                            "manual_id": manual_id,
                            "chunk_index": idx,
                            "page_number": chunk_info["page_number"],
                            "content": chunk_info["content"],
                            "total_chunks": len(chunked_data)
                        }
                        vectors.append((vector_id, embedding, metadata))
                    
                    batch_size = 100
                    for i in range(0, len(vectors), batch_size):
                        batch = vectors[i:i + batch_size]
                        self.index.upsert(vectors=batch)
            
            # Store chunks in MongoDB
            mongo_chunks = []
            for idx, chunk_info in enumerate(chunked_data):
                mongo_chunks.append({
                    "id": str(uuid.uuid4()),
                    "manual_id": manual_id,
                    "chunk_index": idx,
                    "page_number": chunk_info["page_number"],
                    "content": chunk_info["content"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            if mongo_chunks:
                await db.manual_chunks.insert_many(mongo_chunks)
                await db.manual_chunks.create_index([("content", "text")])
            
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {
                    "status": "completed",
                    "chunks_count": len(chunked_data),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Processed manual {manual_id}: {len(chunked_data)} chunks with cache check")
            return len(chunked_data)
        except Exception as e:
            logger.error(f"Error processing manual {manual_id}: {e}")
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            raise