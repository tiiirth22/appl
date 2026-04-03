"""Backend Service - ML Service Client (Simple, Focused)"""
import asyncio
import httpx
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class MLServiceError(Exception):
    """Error communicating with ML Service"""
    pass


class MLServiceClient:
    """
    Simple HTTP client for ML Service communication.
    
    - Async/await support
    - Simple retry logic for network failures
    - Timeout handling
    - Clear error messages
    """
    
    def __init__(
        self,
        ml_service_url: str,
        timeout: float = 300,
        max_retries: int = 2,
    ):
        # Ensure protocol is present
        url = ml_service_url.strip().rstrip("/")
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        self.ml_service_url = url
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self._client = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self._client:
            await self._client.aclose()
    
    async def _ensure_client(self) -> httpx.AsyncClient:
        """Get or create client"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client
    
    async def _make_request(
        self,
        method: str,
        url: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Make HTTP request with simple retry logic.
        
        Args:
            method: HTTP method
            url: Full URL
            data: Request payload
            
        Returns:
            Response JSON
            
        Raises:
            MLServiceError: If all retries fail
        """
        client = await self._ensure_client()
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"Calling {url} (attempt {attempt + 1}/{self.max_retries + 1})")
                
                response = await client.post(
                    url,
                    json=data,
                    timeout=self.timeout,
                )
                
                # Check for HTTP errors
                if response.status_code >= 400:
                    error_msg = response.text or f"HTTP {response.status_code}"
                    logger.error(f"ML Service error: {error_msg}")
                    raise MLServiceError(f"ML Service error: {error_msg}")
                
                # Parse and return response
                try:
                    result = response.json()
                    logger.info(f"Success: {url}")
                    return result
                except Exception as e:
                    logger.error(f"Failed to parse ML Service response: {str(e)}")
                    raise MLServiceError(f"Invalid response: {str(e)}")
            
            except (httpx.TimeoutException, asyncio.TimeoutError):
                logger.warning(f"Timeout on {url}")
                last_error = MLServiceError("ML Service request timed out")
                
                # Retry on timeout
                if attempt < self.max_retries:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying after {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
            
            except (httpx.NetworkError, httpx.ConnectError) as e:
                logger.warning(f"Network error: {str(e)}")
                last_error = MLServiceError(f"Network error: {str(e)}")
                
                # Retry on network error
                if attempt < self.max_retries:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying after {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
            
            except MLServiceError:
                # Re-raise ML Service error details
                raise
            
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}", exc_info=True)
                last_error = MLServiceError(f"Unexpected error: {str(e)}")
        
        # All retries exhausted
        if last_error:
            raise last_error
        raise MLServiceError("Unknown error")

    
    async def process_manual(
        self,
        manual_id: str,
        manual_name: str,
        version: str,
        file_url: str,
        file_type: str,
    ) -> Dict[str, Any]:
        """
        Send file to ML Service for processing.
        
        Args:
            manual_id: Unique ID for manual
            manual_name: Display name
            version: Model version
            file_url: URL to file (Cloudinary URL)
            file_type: "pdf" or "image"
            
        Returns:
            Processing result
            
        Raises:
            MLServiceError: If processing fails
        """
        # Validate file_url before making network call
        if not file_url or not file_url.strip():
            logger.error(f"[MLClient] BLOCKED: file_url is empty/None for manual {manual_id}")
            raise MLServiceError(
                f"Cannot process manual {manual_id}: file_url is empty. "
                "The file was not uploaded to Cloudinary successfully."
            )
        
        url = f"{self.ml_service_url}/process_manual"
        data = {
            "manual_id": manual_id,
            "manual_name": manual_name,
            "version": version,
            "file_url": file_url,
            "file_type": file_type,
        }
        logger.info(f"[MLClient] process_manual payload: {data}")
        return await self._make_request("POST", url, data)
    
    async def query_manual(
        self,
        manual_id: str,
        question: str,
        history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Query manual using RAG."""
        payload = {
            "manual_id": manual_id,
            "question": question,
            "top_k": top_k,
            "history": history
        }
        return await self._make_request("POST", f"{self.ml_service_url}/query", payload)

    async def analyze_image(
        self,
        image_b64: str,
        manual_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Analyze image and query RAG via ML Service."""
        payload = {
            "manual_id": manual_id,
            "image_b64": image_b64,
            "top_k": top_k,
            "history": history
        }
        return await self._make_request("POST", f"{self.ml_service_url}/analyze-image", payload)

    
    async def close(self):
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
