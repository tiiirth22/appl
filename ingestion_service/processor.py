"""ML Service - Document Processing Pipeline"""
import asyncio
import io
import os
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid
import hashlib
import httpx

# Optional imports - lazy loaded
try:
    from pdfminer.high_level import extract_text, extract_pages
    from pdfminer.layout import LTTextContainer, LAParams
    from pdfminer.pdfpage import PDFPage
    from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
    from pdfminer.converter import TextConverter
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False

try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

from config import (
    PINECONE_API_KEY, PINECONE_INDEX_NAME,
    EMBEDDING_MODEL, MAX_FILE_SIZE_BYTES, CHUNK_SIZE, CHUNK_OVERLAP,
    DOWNLOAD_TIMEOUT, OCR_TIMEOUT, EMBEDDING_TIMEOUT, PINECONE_TIMEOUT,
    TESSERACT_PATH, POPPLER_PATH,
)
from model_manager import model_manager
from errors import (
    FileDownloadError, FileSizeError, UnsupportedFormatError, 
    OCRError, EmbeddingError, PineconeError, TimeoutError as TimeoutErrorException,
    ServiceUnavailableError, MLServiceException,
)
from logger_config import get_processing_logger

logger = get_processing_logger(__name__)

_global_pinecone_client = None
_global_pinecone_index = None


class AsyncDocumentProcessor:
    """Async document processing pipeline"""
    
    SUPPORTED_FORMATS = {"pdf", "image", "jpg", "jpeg", "png"}
    
    def __init__(self, manual_id: Optional[str] = None, request_id: Optional[str] = None):
        self.manual_id = manual_id
        self.request_id = request_id
        self.logger = get_processing_logger(__name__, manual_id, request_id)
        
        # Lazy-initialized components
        self._embedding_model = None
        self._pinecone_client = None
        self._pinecone_index = None
    
    async def process_manual(
        self,
        file_url: str,
        manual_id: str,
        manual_name: str,
        version: str,
        file_type: str,
    ) -> Dict[str, Any]:
        """
        Full pipeline: download → extract → chunk → embed → index
        
        Returns:
            {
                "manual_id": str,
                "chunks_count": int,
                "embedding_model": str,
                "status": "completed" | "failed"
            }
        """
        try:
            self.logger.info(f"Starting processing: {manual_name} v{version} (file_type={file_type})")
            
            # Validate file type
            if file_type.lower() not in self.SUPPORTED_FORMATS:
                raise UnsupportedFormatError(file_type, list(self.SUPPORTED_FORMATS))
            
            # Stage 1: Download file
            self.logger.info("Stage 1/5: Downloading file")
            file_content = await self._download_file(file_url)
            
            # Validate file size
            file_size_mb = len(file_content) / (1024 * 1024)
            max_size_mb = MAX_FILE_SIZE_BYTES / (1024 * 1024)
            if len(file_content) > MAX_FILE_SIZE_BYTES:
                raise FileSizeError(file_size_mb, max_size_mb)
            self.logger.info(f"Downloaded {file_size_mb:.2f}MB")
            
            # Stage 2: Extract text
            self.logger.info("Stage 2/5: Extracting text")
            text = await self._extract_text(file_content, file_type)
            if not text or len(text.strip()) < 50:
                raise MLServiceException(
                    "invalid_input",
                    "Extracted text is too short or empty",
                    retryable=False,
                )
            self.logger.info(f"Extracted {len(text)} characters")
            
            # Stage 3: Chunk text
            self.logger.info("Stage 3/5: Chunking text")
            chunks = self._chunk_text(text)
            self.logger.info(f"Created {len(chunks)} chunks")
            
            # Stage 4: Generate embeddings
            self.logger.info("Stage 4/5: Generating embeddings")
            embeddings = await self._generate_embeddings(chunks)
            self.logger.info(f"Generated {len(embeddings)} embeddings")
            
            # Stage 5: Index to Pinecone
            self.logger.info("Stage 5/5: Indexing to Pinecone")
            indexed_count = await self._index_to_pinecone(
                manual_id, manual_name, chunks, embeddings
            )
            self.logger.info(f"Indexed {indexed_count} vectors")
            
            self.logger.info("Processing completed successfully")
            return {
                "manual_id": manual_id,
                "chunks_count": len(chunks),
                "embedding_model": EMBEDDING_MODEL,
                "status": "completed",
            }
            
        except MLServiceException as e:
            self.logger.error(f"Processing failed: {e.message}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise MLServiceException(
                "internal_error",
                f"Unexpected error during processing: {str(e)}",
                retryable=True,
            )
    
    async def _download_file(self, url: str, timeout: int = DOWNLOAD_TIMEOUT) -> bytes:
        """Download file from URL with timeout"""
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                return response.content
        except httpx.TimeoutException:
            raise TimeoutErrorException("download", timeout)
        except httpx.HTTPStatusError as e:
            retryable = 500 <= e.response.status_code < 600
            raise FileDownloadError(
                f"HTTP {e.response.status_code}: {e.response.reason_phrase}",
                retryable=retryable,
            )
        except Exception as e:
            raise FileDownloadError(str(e), retryable=True)
    
    async def _extract_text(
        self, file_content: bytes, file_type: str, timeout: int = OCR_TIMEOUT
    ) -> List[Tuple[str, int]]:
        """Extract text from PDF or image with page numbers"""
        try:
            if file_type.lower() == "pdf":
                return await asyncio.wait_for(
                    asyncio.to_thread(self._extract_text_pdf, file_content),
                    timeout=timeout,
                )
            else:  # image
                text = await asyncio.wait_for(
                    asyncio.to_thread(self._extract_text_image, file_content),
                    timeout=timeout,
                )
                return [(text, 1)]  # Images are treated as a single page
        except asyncio.TimeoutError:
            raise TimeoutErrorException("extract_text", timeout)
    
    def _extract_text_pdf(self, file_content: bytes) -> List[Tuple[str, int]]:
        """Extract text from PDF page-by-page (blocking)"""
        if not PDF_AVAILABLE:
            raise ServiceUnavailableError("pdfminer", "pdfminer.six not installed")
        
        try:
            pdf_file = io.BytesIO(file_content)
            resource_manager = PDFResourceManager()
            laparams = LAParams()
            
            pages_text = []
            
            for page_num, page in enumerate(PDFPage.get_pages(pdf_file), start=1):
                fake_file_handle = io.StringIO()
                with TextConverter(resource_manager, fake_file_handle, laparams=laparams) as converter:
                    interpreter = PDFPageInterpreter(resource_manager, converter)
                    interpreter.process_page(page)
                    text = fake_file_handle.getvalue()
                    if text.strip():
                        pages_text.append((text, page_num))
                fake_file_handle.close()
                
            return pages_text
        except Exception as e:
            raise OCRError(f"PDF extraction failed: {str(e)}", retryable=True)
    
    def _extract_text_image(self, file_content: bytes) -> str:
        """Extract text from image via OCR (blocking)"""
        if not PIL_AVAILABLE or not TESSERACT_AVAILABLE:
            raise ServiceUnavailableError(
                "pytesseract",
                "PIL or pytesseract not installed",
            )
        
        try:
            image = Image.open(io.BytesIO(file_content))
            if TESSERACT_PATH:
                pytesseract.pytesseract.pytesseract_cmd = TESSERACT_PATH
            text = pytesseract.image_to_string(image)
            return text or ""
        except Exception as e:
            raise OCRError(f"OCR extraction failed: {str(e)}", retryable=True)
    
    def _chunk_text(
        self,
        pages_text: List[Tuple[str, int]],
        chunk_size: int = CHUNK_SIZE,
        overlap: int = CHUNK_OVERLAP,
    ) -> List[Dict[str, Any]]:
        """Split page-based text into chunks, preserving page associations"""
        chunks = []
        
        for text, page_num in pages_text:
            words = text.split()
            current_chunk = []
            current_size = 0
            
            # Simple chunking within each page for now
            # If a page is very long, it splits. If short, it's one chunk.
            # We don't merge across pages to keep page mapping simple and accurate.
            for word in words:
                current_chunk.append(word)
                current_size += len(word) + 1
                
                if current_size >= chunk_size:
                    chunk_text = " ".join(current_chunk)
                    if chunk_text.strip():
                        chunks.append({
                            "text": chunk_text,
                            "page_number": page_num
                        })
                    
                    # Overlap
                    overlap_words = min(overlap // 5, len(current_chunk) - 1)
                    current_chunk = current_chunk[-overlap_words:] if overlap_words > 0 else []
                    current_size = sum(len(w) + 1 for w in current_chunk)
                    
            if current_chunk:
                chunk_text = " ".join(current_chunk)
                if chunk_text.strip():
                    chunks.append({
                        "text": chunk_text,
                        "page_number": page_num
                    })
        
        return chunks
    
    async def _get_embedding_model(self):
        """Lazy load embedding model via ModelManager singleton"""
        try:
            return await model_manager.get_model()
        except Exception as e:
            raise EmbeddingError(
                f"Failed to load embedding model: {str(e)}",
                retryable=True,
            )
    
    async def _generate_embeddings(
        self, chunks: List[Dict[str, Any]], timeout: int = EMBEDDING_TIMEOUT
    ) -> List[List[float]]:
        """Generate embeddings for chunks"""
        try:
            model = await self._get_embedding_model()
            texts = [c["text"] for c in chunks]
            
            embeddings = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: model.encode(texts, convert_to_tensor=False)
                ),
                timeout=timeout,
            )
            
            return embeddings.tolist() if hasattr(embeddings, "tolist") else embeddings
        except asyncio.TimeoutError:
            raise TimeoutErrorException("embedding", timeout)
        except Exception as e:
            raise EmbeddingError(str(e), retryable=True)
    
    async def _get_pinecone_index(self):
        """Lazy load Pinecone client and index as a global singleton"""
        global _global_pinecone_client, _global_pinecone_index
        
        if _global_pinecone_index is not None:
            self._pinecone_client = _global_pinecone_client
            self._pinecone_index = _global_pinecone_index
            return _global_pinecone_index
        
        if not PINECONE_AVAILABLE:
            raise ServiceUnavailableError(
                "pinecone",
                "pinecone SDK not installed",
            )
        
        if not PINECONE_API_KEY:
            raise ServiceUnavailableError(
                "pinecone",
                "PINECONE_API_KEY not configured",
            )
        
        try:
            if _global_pinecone_client is None:
                self.logger.info("Initializing global Pinecone client pool")
                _global_pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
            
            self.logger.info(f"Connecting to Pinecone index: {PINECONE_INDEX_NAME}")
            _global_pinecone_index = _global_pinecone_client.Index(PINECONE_INDEX_NAME)
            
            self._pinecone_client = _global_pinecone_client
            self._pinecone_index = _global_pinecone_index
            return _global_pinecone_index
        except Exception as e:
            raise PineconeError(
                f"Failed to initialize Pinecone: {str(e)}",
                retryable=True,
            )
    
    async def _index_to_pinecone(
        self,
        manual_id: str,
        manual_name: str,
        chunks: List[str],
        embeddings: List[List[float]],
        timeout: int = PINECONE_TIMEOUT,
    ) -> int:
        """Index chunks to Pinecone with metadata"""
        try:
            index = await self._get_pinecone_index()
            
            # Prepare vectors for upsert
            vectors_to_upsert = []
            for i, (chunk_data, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{manual_id}_{i}_{uuid.uuid4().hex[:8]}"
                metadata = {
                    "manual_id": manual_id,
                    "manual_name": manual_name,
                    "chunk_index": i,
                    "page_number": chunk_data.get("page_number", 1),
                    "text": chunk_data["text"][:1000],  # Store first 1000 chars as preview
                    "indexed_at": datetime.now(timezone.utc).isoformat(),
                }
                vectors_to_upsert.append((vector_id, embedding, metadata))
            
            # Batch upsert with timeout
            indexed_count = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: self._batch_upsert(index, vectors_to_upsert)
                ),
                timeout=timeout,
            )
            
            return indexed_count
        except asyncio.TimeoutError:
            raise TimeoutErrorException("pinecone_indexing", timeout)
        except Exception as e:
            raise PineconeError(str(e), retryable=True)
    
    def _batch_upsert(self, index, vectors: List[Tuple], batch_size: int = 100) -> int:
        """Batch upsert vectors to Pinecone"""
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch)
        return len(vectors)
