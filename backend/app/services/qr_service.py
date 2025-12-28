"""
QR Code Service
Generate QR codes for products, receipts, etc.
"""

import qrcode
import io
from typing import Optional
from PIL import Image
import base64
import logging

logger = logging.getLogger(__name__)


def generate_qr_code(
    data: str,
    size: int = 200,
    border: int = 2
) -> str:
    """
    Generate QR code as base64 image.
    
    Args:
        data: Data to encode in QR code
        size: Image size in pixels
        border: Border size
    
    Returns:
        Base64 encoded image string
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=border,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
        
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        raise Exception(f"QR kod yaratishda xatolik: {str(e)}")


def generate_product_qr(product_id: int, product_name: str, barcode: Optional[str] = None) -> str:
    """Generate QR code for product."""
    data = f"PRODUCT:{product_id}:{product_name}"
    if barcode:
        data += f":{barcode}"
    return generate_qr_code(data)


def generate_receipt_qr(receipt_id: int, total_amount: float) -> str:
    """Generate QR code for receipt."""
    data = f"RECEIPT:{receipt_id}:{total_amount}"
    return generate_qr_code(data)


def generate_sale_qr(sale_id: int) -> str:
    """Generate QR code for sale."""
    data = f"SALE:{sale_id}"
    return generate_qr_code(data)


def generate_receipt_id(sale_id: int) -> str:
    """
    Generate a unique receipt ID for a sale.
    Format: REC-{sale_id}-{hash}
    """
    import hashlib
    hash_str = hashlib.md5(f"SALE_{sale_id}".encode()).hexdigest()[:8].upper()
    return f"REC-{sale_id}-{hash_str}"


def verify_receipt_id(receipt_id: str, sale_id: int) -> bool:
    """
    Verify if a receipt ID matches a sale ID.
    """
    expected_id = generate_receipt_id(sale_id)
    return receipt_id == expected_id
