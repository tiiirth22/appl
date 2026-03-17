import os
import json
import hmac
import hashlib
import qrcode
from io import BytesIO
import base64
from datetime import datetime
import uuid

class QRHandler:
    """Handles QR code generation and verification."""
    
    def __init__(self):
        self.secret_key = os.getenv("QR_SECRET_KEY", "change-me")
        self.app_base_url = os.getenv("APP_BASE_URL", "http://localhost:3000")
    
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

    def generate_qr_code(self, manual_id: str, version: str) -> tuple:
        """Generate QR code image for a NEW manual (creates a new qr_id)."""
        payload, qr_id = self.create_qr_payload(manual_id, version)
        
        short_url = f"{self.app_base_url}/device/{qr_id}"
        image_base64 = self._make_qr_image_base64(short_url)
        
        return {
            "qr_id": qr_id,
            "short_url": short_url,
            "payload": payload,
            "image_base64": image_base64
        }

    def regenerate_qr_image(self, qr_id: str) -> str:
        """Regenerate QR code image for an EXISTING qr_id (no new UUID)."""
        short_url = f"{self.app_base_url}/device/{qr_id}"
        return self._make_qr_image_base64(short_url)