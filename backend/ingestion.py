
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

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Handles document ingestion pipeline."""
    
    def __init__(self, qdrant_client: QdrantClient, collection_name: str):
        self.qdrant_client = qdrant_client
        self.collection_name = collection_name
        
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
        """Create collection if it doesn't exist."""
        try:
            collections = self.qdrant_client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 dimension
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring collection: {e}")
            raise
    
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
        """Process a manual file and store in Qdrant."""
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
            
            # Prepare points for Qdrant
            points = []
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "manual_id": manual_id,
                        "chunk_index": idx,
                        "content": chunk,
                        "total_chunks": len(chunks)
                    }
                )
                points.append(point)
            
            # Upsert to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True
            )
            
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