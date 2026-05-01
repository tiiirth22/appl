"""
Storage Abstraction Layer
=========================
Handles file retrieval from S3, Cloudinary, or Local storage.
Ensures temp file cleanup and stateless processing.
"""

import os
import shutil
import logging
import httpx
import boto3
from pathlib import Path
from typing import Optional
from botocore.exceptions import ClientError
from config import (
    STORAGE_BACKEND, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, 
    AWS_REGION, AWS_S3_BUCKET, TEMP_DIR, DOWNLOAD_TIMEOUT
)

logger = logging.getLogger(__name__)

class StorageManager:
    """Handles file operations across different storage backends."""
    
    def __init__(self):
        self.backend = STORAGE_BACKEND.lower()
        self.temp_dir = Path(TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
        self.s3 = None
        if self.backend == "s3" or AWS_ACCESS_KEY_ID:
            try:
                self.s3 = boto3.client(
                    's3',
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                    region_name=AWS_REGION
                )
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")

    async def get_file(self, url_or_path: str, local_name: Optional[str] = None) -> Path:
        """
        Retrieves a file and stores it in the local temp directory.
        Returns the Path to the local file.
        """
        if not local_name:
            local_name = f"manual_{os.urandom(4).hex()}.pdf"
            
        local_path = self.temp_dir / local_name
        
        # 1. Handle S3 URI (s3://bucket/key)
        if url_or_path.startswith("s3://"):
            if not self.s3:
                raise ValueError("S3 client not initialized but S3 URL provided")
            try:
                parts = url_or_path.replace("s3://", "").split("/", 1)
                bucket = parts[0]
                key = parts[1]
                logger.info(f"Downloading from S3: {bucket}/{key}")
                self.s3.download_file(bucket, key, str(local_path))
                return local_path
            except ClientError as e:
                logger.error(f"S3 download failed: {e}")
                raise

        # 2. Handle Cloudinary / HTTP URL
        if url_or_path.startswith(("http://", "https://")):
            logger.info(f"Downloading via HTTP: {url_or_path}")
            async with httpx.AsyncClient(timeout=DOWNLOAD_TIMEOUT) as client:
                async with client.stream("GET", url_or_path, follow_redirects=True) as response:
                    response.raise_for_status()
                    with open(local_path, "wb") as f:
                        async for chunk in response.aiter_bytes():
                            f.write(chunk)
            return local_path

        # 3. Handle Local Path
        src_path = Path(url_or_path)
        if src_path.exists():
            if src_path != local_path:
                shutil.copy2(src_path, local_path)
            return local_path

        raise FileNotFoundError(f"Could not retrieve file: {url_or_path}")

    def cleanup(self, path: Path):
        """Safely remove a temporary file."""
        try:
            if path.exists() and str(self.temp_dir) in str(path):
                path.unlink()
                logger.debug(f"Cleaned up temp file: {path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup {path}: {e}")

storage_manager = StorageManager()
