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
    
    def generate_qr_code(self, manual_id: str, version: str) -> tuple:
        """Generate QR code image."""
        payload, qr_id = self.create_qr_payload(manual_id, version)
        
        # Create short URL
        short_url = f"{self.app_base_url}/device/{qr_id}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(short_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "qr_id": qr_id,
            "short_url": short_url,
            "payload": payload,
            "image_base64": f"data:image/png;base64,{img_str}"
        }