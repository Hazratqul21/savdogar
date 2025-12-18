import io
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import base64

def generate_qr_pdf(products: list[dict]):
    """
    Generates a printable PDF with QR codes for a list of products.
    Each product dict should have: {'name': str, 'sku': str, 'price': float}
    Layout: 3x7 grid per page (standard sticker sheet).
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Sticker dimensions
    sticker_w = 60 * mm
    sticker_h = 40 * mm
    margin_x = 10 * mm
    margin_y = 10 * mm
    gap_x = 5 * mm
    gap_y = 5 * mm
    
    cols = 3
    rows = 7
    
    x_curr = margin_x
    y_curr = height - margin_y - sticker_h
    
    for i, product in enumerate(products):
        # Draw Border (optional, for cutting guide)
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.rect(x_curr, y_curr, sticker_w, sticker_h)
        
        # QR Code
        qr = qrcode.QRCode(box_size=10, border=1)
        qr.add_data(product['sku'])
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR to temporary buffer
        qr_buffer = io.BytesIO()
        img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        
        # Draw QR Image
        c.drawImage(
            "data:image/png;base64," + base64.b64encode(qr_buffer.getvalue()).decode(),
            x_curr + 2*mm, 
            y_curr + 5*mm, 
            width=30*mm, 
            height=30*mm,
            mask='auto'
        )
        
        # Text Info
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_curr + 35*mm, y_curr + 30*mm, product['name'][:15]) # Truncate
        c.setFont("Helvetica", 8)
        c.drawString(x_curr + 35*mm, y_curr + 25*mm, product['sku'])
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x_curr + 35*mm, y_curr + 15*mm, f"{product['price']:,.0f}")
        c.drawString(x_curr + 35*mm, y_curr + 10*mm, "so'm")

        # Move position
        if (i + 1) % cols == 0:
            x_curr = margin_x
            y_curr -= (sticker_h + gap_y)
        else:
            x_curr += (sticker_w + gap_x)
            
        # New Page
        if (i + 1) % (cols * rows) == 0:
            c.showPage()
            y_curr = height - margin_y - sticker_h
            
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
