"""
Document Processing Pipeline (Ingestion)
==========================================
Unified version — uses the shared ONNX model manager and embedding cache.
Runs as a background task to prevent blocking chat requests.
"""

import asyncio
import io
import os
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import httpx

# Optional imports — lazy loaded
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
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except Exception as e:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"CRITICAL: Failed to load Pinecone SDK in processor: {e}")
    PINECONE_AVAILABLE = False

from config import (
    PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_NAMESPACE,
    EMBEDDING_MODEL, MAX_FILE_SIZE_BYTES, CHUNK_SIZE, CHUNK_OVERLAP,
    DOWNLOAD_TIMEOUT, OCR_TIMEOUT, EMBEDDING_TIMEOUT, PINECONE_TIMEOUT,
    TESSERACT_PATH, POPPLER_PATH,
)
from model_manager import model_manager
from cache import embedding_cache
from errors import (
    FileDownloadError, FileSizeError, UnsupportedFormatError,
    OCRError, EmbeddingError, PineconeError, TimeoutError as TimeoutErrorException,
    ServiceUnavailableError, MLServiceException, ErrorType,
)
from logger_config import get_processing_logger
from storage import storage_manager

logger = get_processing_logger(__name__)

_global_pinecone_client = None
_global_pinecone_index = None


class AsyncDocumentProcessor:
    """Async document processing pipeline — download → extract → chunk → embed → index"""

    SUPPORTED_FORMATS = {"pdf", "image", "jpg", "jpeg", "png"}

    def __init__(self, manual_id: Optional[str] = None, request_id: Optional[str] = None):
        self.manual_id = manual_id
        self.request_id = request_id
        self.logger = get_processing_logger(__name__, manual_id, request_id)

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
        """Full pipeline: download → extract → chunk → embed → index"""
        local_path = None
        try:
            self.logger.info(f"Starting processing: {manual_name} v{version} (file_type={file_type})")

            if file_type.lower() not in self.SUPPORTED_FORMATS:
                raise UnsupportedFormatError(file_type, list(self.SUPPORTED_FORMATS))

            # Stage 1: Download to Disk
            self.logger.info("Stage 1/5: Downloading file to temp storage")
            local_path = await storage_manager.get_file(file_url, f"{manual_id}_{version}.{file_type}")
            
            # Security: Validate file before processing
            self._validate_file(local_path, file_type)
            
            file_size_mb = local_path.stat().st_size / (1024 * 1024)
            self.logger.info(f"Downloaded and validated {file_size_mb:.2f}MB")

            # Stage 2: Extract text
            self.logger.info("Stage 2/5: Extracting text from disk")
            pages_text = await self._extract_text(local_path, file_type)

            total_chars = sum(len(text) for text, _ in pages_text)
            if not pages_text or total_chars < 50:
                raise MLServiceException(
                    ErrorType.INVALID_INPUT,
                    f"Extracted text is too short or empty ({total_chars} chars)",
                    retryable=False,
                )
            self.logger.info(f"Extracted {total_chars} characters from {len(pages_text)} pages")

            # Stage 3: Chunk
            self.logger.info("Stage 3/5: Chunking text")
            chunks = self._chunk_text(pages_text)
            self.logger.info(f"Created {len(chunks)} chunks")

            # Stage 4: Embed
            self.logger.info("Stage 4/5: Generating embeddings")
            embeddings = await self._generate_embeddings(chunks)

            # Stage 5: Index
            self.logger.info("Stage 5/5: Indexing to Pinecone")
            indexed_count = await self._index_to_pinecone(
                manual_id, manual_name, chunks, embeddings
            )
            self.logger.info(f"Indexed {indexed_count} vectors")

            return {
                "manual_id": manual_id,
                "chunks_count": len(chunks),
                "status": "completed",
            }

        except MLServiceException:
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise MLServiceException(
                ErrorType.INTERNAL_ERROR,
                f"Processing error: {str(e)}",
                retryable=True,
            )
        finally:
            if local_path:
                storage_manager.cleanup(local_path)

    def _validate_file(self, file_path: Path, file_type: str):
        """Security: Validate file size and magic bytes."""
        size = file_path.stat().st_size
        if size > MAX_FILE_SIZE_BYTES:
            raise FileSizeError(size / (1024*1024), MAX_FILE_SIZE_BYTES / (1024*1024))
            
        with open(file_path, "rb") as f:
            header = f.read(8)
            if file_type.lower() == "pdf":
                if not header.startswith(b"%PDF"):
                    raise UnsupportedFormatError("invalid_pdf_header", ["%PDF"])
            elif file_type.lower() in ["jpg", "jpeg", "png"]:
                if not any(header.startswith(m) for m in [b"\xff\xd8", b"\x89PNG"]):
                    raise UnsupportedFormatError("invalid_image_header", ["JPEG", "PNG"])

    # ─── Stages ───────────────────────────────────────────────────────

    async def _download_file(self, url: str, timeout: int = DOWNLOAD_TIMEOUT) -> bytes:
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
        self, file_path: Path, file_type: str, timeout: int = OCR_TIMEOUT
    ) -> List[Tuple[str, int]]:
        try:
            if file_type.lower() == "pdf":
                return await asyncio.wait_for(
                    asyncio.to_thread(self._extract_text_pdf, file_path),
                    timeout=timeout,
                )
            else:
                text = await asyncio.wait_for(
                    asyncio.to_thread(self._extract_text_image, file_path),
                    timeout=timeout,
                )
                return [(text, 1)]
        except asyncio.TimeoutError:
            raise TimeoutErrorException("extract_text", timeout)

    def _extract_text_pdf(self, file_path: Path) -> List[Tuple[str, int]]:
        if not PDF_AVAILABLE:
            raise ServiceUnavailableError("pdfminer", "pdfminer.six not installed")

        try:
            pages_text = []
            with open(file_path, "rb") as pdf_file:
                resource_manager = PDFResourceManager()
                laparams = LAParams()

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

    def _extract_text_image(self, file_path: Path) -> str:
        if not PIL_AVAILABLE or not TESSERACT_AVAILABLE:
            raise ServiceUnavailableError("pytesseract", "PIL or pytesseract not installed")

        try:
            image = Image.open(file_path)
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
        chunks = []

        for text, page_num in pages_text:
            words = text.split()
            current_chunk = []
            current_size = 0

            for word in words:
                current_chunk.append(word)
                current_size += len(word) + 1

                if current_size >= chunk_size:
                    chunk_text = " ".join(current_chunk)
                    if chunk_text.strip():
                        chunks.append({"text": chunk_text, "page_number": page_num})

                    overlap_words = min(overlap // 5, len(current_chunk) - 1)
                    current_chunk = current_chunk[-overlap_words:] if overlap_words > 0 else []
                    current_size = sum(len(w) + 1 for w in current_chunk)

            if current_chunk:
                chunk_text = " ".join(current_chunk)
                if chunk_text.strip():
                    chunks.append({"text": chunk_text, "page_number": page_num})

        return chunks

    async def _generate_embeddings(
        self, chunks: List[Dict[str, Any]], timeout: int = EMBEDDING_TIMEOUT
    ) -> List[List[float]]:
        """Generate embeddings using the shared model manager + embedding cache."""
        try:
            import numpy as np

            texts = [c["text"] for c in chunks]
            results = [None] * len(texts)
            uncached_indices = []
            uncached_texts = []

            # Check cache first
            for i, text in enumerate(texts):
                cached = embedding_cache.get(text)
                if cached is not None:
                    results[i] = cached.tolist() if hasattr(cached, "tolist") else cached
                else:
                    uncached_indices.append(i)
                    uncached_texts.append(text)

            cache_hits = len(texts) - len(uncached_texts)
            if cache_hits > 0:
                self.logger.info(f"Cache hits: {cache_hits}/{len(texts)}")

            # Encode uncached texts
            if uncached_texts:
                embeddings = await asyncio.wait_for(
                    model_manager.encode(uncached_texts),
                    timeout=timeout,
                )

                for idx, emb in zip(uncached_indices, embeddings):
                    emb_array = np.array(emb)
                    results[idx] = emb_array.tolist()
                    embedding_cache.put(texts[idx], emb_array)

            return results

        except asyncio.TimeoutError:
            raise TimeoutErrorException("embedding", timeout)
        except Exception as e:
            raise EmbeddingError(str(e), retryable=True)

    async def _get_pinecone_index(self):
        global _global_pinecone_client, _global_pinecone_index

        if _global_pinecone_index is not None:
            self._pinecone_client = _global_pinecone_client
            self._pinecone_index = _global_pinecone_index
            return _global_pinecone_index

        if not PINECONE_AVAILABLE:
            raise ServiceUnavailableError("pinecone", "pinecone SDK not installed")

        if not PINECONE_API_KEY:
            raise ServiceUnavailableError("pinecone", "PINECONE_API_KEY not configured")

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
            raise PineconeError(f"Failed to initialize Pinecone: {str(e)}", retryable=True)

    async def _index_to_pinecone(
        self,
        manual_id: str,
        manual_name: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
        timeout: int = PINECONE_TIMEOUT,
    ) -> int:
        try:
            index = await self._get_pinecone_index()

            vectors_to_upsert = []
            for i, (chunk_data, embedding) in enumerate(zip(chunks, embeddings)):
                vector_id = f"{manual_id}_{i}_{uuid.uuid4().hex[:8]}"
                metadata = {
                    "manual_id": manual_id,
                    "manual_name": manual_name,
                    "chunk_index": i,
                    "page_number": chunk_data.get("page_number", 1),
                    "text": chunk_data["text"][:1000],
                    "indexed_at": datetime.now(timezone.utc).isoformat(),
                }
                vectors_to_upsert.append((vector_id, embedding, metadata))

            indexed_count = await asyncio.wait_for(
                asyncio.to_thread(lambda: self._batch_upsert(index, vectors_to_upsert)),
                timeout=timeout,
            )
            return indexed_count
        except asyncio.TimeoutError:
            raise TimeoutErrorException("pinecone_indexing", timeout)
        except Exception as e:
            raise PineconeError(str(e), retryable=True)

    def _batch_upsert(self, index, vectors: List[Tuple], batch_size: int = 100) -> int:
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i : i + batch_size]
            index.upsert(vectors=batch, namespace=PINECONE_NAMESPACE)
        return len(vectors)
