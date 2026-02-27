
import os
import io
from typing import List, Dict, Any
from pdfminer.high_level import extract_text
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

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document ingestion pipeline."""
    
    
    def __init__(self, pinecone_client: Pinecone, index_name: str):
        self.pc = pinecone_client
        self.index_name = index_name
        
        # Initialize embedding model if available
        if sentence_transformers_available and SentenceTransformer:
            self.embedding_model = SentenceTransformer(
                os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
            )
        else:
            self.embedding_model = None
            logger.warning("Embedding model not available - document processing will be limited")
        
        self._ensure_collection()
    
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
        """Extract text from PDF file."""
        try:
            text = extract_text(file_path)
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
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
        """Chunk text into overlapping segments using LangChain's splitter."""
        try:
            from langchain.text_splitter import RecursiveCharacterTextSplitter
            
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            return splitter.split_text(text)
        except ImportError:
            # Fallback to simple splitting if langchain is not available
            logger.warning("LangChain not available, falling back to simple chunking")
            chunks = []
            words = text.split()
            for i in range(0, len(words), chunk_size - overlap):
                chunk_words = words[i:i + chunk_size]
                chunk = ' '.join(chunk_words)
                if chunk.strip():
                    chunks.append(chunk)
            return chunks
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks."""
        if self.embedding_model is None:
            raise RuntimeError("Embedding model not available - cannot generate embeddings")
        embeddings = self.embedding_model.encode(texts, convert_to_numpy=False)
        return [emb.tolist() for emb in embeddings]
    
    async def process_manual(self, manual_id: str, file_path: str, file_type: str, db) -> int:
        """Process a manual file and store in Pinecone."""
        try:
            # Extract text based on file type
            if file_type == "pdf":
                text = self.extract_text_from_pdf(file_path)
            elif file_type in ["image", "png", "jpg", "jpeg"]:
                text = self.extract_text_from_image(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Chunk text
            chunks = self.chunk_text(text, chunk_size=500, overlap=50)
            
            if not chunks:
                raise ValueError("No text extracted from file")
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Prepare vectors for Pinecone
            vectors = []
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = str(uuid.uuid4())
                metadata = {
                    "manual_id": manual_id,
                    "chunk_index": idx,
                    "content": chunk,
                    "total_chunks": len(chunks)
                }
                vectors.append((vector_id, embedding, metadata))
            
            # Upsert to Pinecone
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self.index.upsert(vectors=batch)
            
            # Store chunks in MongoDB for keyword search (Hybrid Search)
            mongo_chunks = []
            for idx, chunk in enumerate(chunks):
                mongo_chunks.append({
                    "id": str(uuid.uuid4()),
                    "manual_id": manual_id,
                    "chunk_index": idx,
                    "content": chunk,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            if mongo_chunks:
                await db.manual_chunks.insert_many(mongo_chunks)
                # Create text index for hybrid search if it doesn't exist
                await db.manual_chunks.create_index([("content", "text")])
            
            # Update manual status in MongoDB
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {
                    "status": "completed",
                    "chunks_count": len(chunks),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Processed manual {manual_id}: {len(chunks)} chunks")
            return len(chunks)
            
        except Exception as e:
            logger.error(f"Error processing manual {manual_id}: {e}")
            # Update manual status to failed
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {
                    "status": "failed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            raise