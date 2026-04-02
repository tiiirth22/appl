import os
import json
import hmac
import hashlib
import qrcode
import logging
from io import BytesIO
import base64
from datetime import datetime
import uuid
import cloudinary
import cloudinary.uploader

# Initialize logger
logger = logging.getLogger(__name__)

class QRHandler:
    """Handles QR code generation and verification."""
    
    def __init__(self):
        self.secret_key = os.getenv("QR_SECRET_KEY", "change-me")
        self.app_base_url = os.getenv("APP_BASE_URL", "http://localhost:3000")
        
        # Cloudinary setup is handled globally in server.py, but we can verify here
        self.cloudinary_available = os.getenv("CLOUDINARY_URL") is not None
    
    def generate_signature(self, payload: dict) -> str:
        """Generate HMAC signature for payload."""
        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            self.secret_key.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def verify_signature(self, payload: dict, signature: str) -> bool:
        """Verify HMAC signature."""
        expected_signature = self.generate_signature(payload)
        return hmac.compare_digest(signature, expected_signature)
    
    def create_qr_payload(self, manual_id: str, version: str) -> dict:
        """Create QR code payload."""
        qr_id = str(uuid.uuid4())[:8]
        payload = {
            "manual_id": manual_id,
            "version": version,
            "ts": int(datetime.now().timestamp()),
            "qr_id": qr_id
        }
        signature = self.generate_signature(payload)
        payload["sig"] = signature
        return payload, qr_id
    
    def _make_qr_image_base64(self, url: str) -> str:
        """Generate a QR code image as a base64 data URI for the given URL."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"

    def _make_qr_image_bytes(self, url: str) -> BytesIO:
        """Generate a QR code image as bytes."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        buffered.seek(0)
        return buffered

    def generate_qr_code(self, manual_id: str, version: str) -> tuple:
        """Generate QR code image and upload to Cloudinary if available."""
        payload, qr_id = self.create_qr_payload(manual_id, version)
        # QR now points directly to frontend chat page with manual_id
        qr_url = f"{self.app_base_url}/chat/{manual_id}"
        
        # 1. Always generate base64 for local fallback/immediate display
        qr_bytes = self._make_qr_image_bytes(qr_url)
        image_base64 = f"data:image/png;base64,{base64.b64encode(qr_bytes.getvalue()).decode()}"
        
        cloudinary_url = None
        if self.cloudinary_available:
            try:
                # 2. Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    qr_bytes,
                    public_id=f"qr_{qr_id}",
                    folder="appliance_iq/qrs",
                    overwrite=True,
                    resource_type="image"
                )
                cloudinary_url = upload_result.get("secure_url")
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}", exc_info=True)
        
        return {
            "qr_id": qr_id,
            "qr_url": qr_url,
            "manual_id": manual_id,
            "payload": payload,
            "image_base64": image_base64,
            "cloudinary_url": cloudinary_url
        }

    def regenerate_qr_image(self, manual_id: str) -> str:
        """Regenerate QR code image for a manual."""
        qr_url = f"{self.app_base_url}/chat/{manual_id}"
        return self._make_qr_image_base64(qr_url)