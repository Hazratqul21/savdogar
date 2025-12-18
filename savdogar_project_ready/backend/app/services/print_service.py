"""
Print Service
Generate printable receipts and reports
"""

from typing import Dict, List, Optional
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
import io
import logging

logger = logging.getLogger(__name__)


def generate_receipt_pdf(
    sale_data: Dict,
    items: List[Dict],
    store_name: str = "SmartPOS",
    store_address: str = "",
    store_phone: str = ""
) -> bytes:
    """
    Generate printable receipt PDF.
    
    Args:
        sale_data: Sale information (id, date, total, etc.)
        items: List of sale items
        store_name: Store name
        store_address: Store address
        store_phone: Store phone
    
    Returns:
        PDF as bytes
    """
    try:
        buffer = io.BytesIO()
        # 80mm width (standard receipt width)
        width = 80 * mm
        height = 200 * mm
        doc = SimpleDocTemplate(buffer, pagesize=(width, height), 
                                rightMargin=5*mm, leftMargin=5*mm,
                                topMargin=5*mm, bottomMargin=5*mm)
        story = []
        styles = getSampleStyleSheet()
        
        # Store header
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.black,
            alignment=1,  # Center
            spaceAfter=5
        )
        
        story.append(Paragraph(store_name, header_style))
        if store_address:
            story.append(Paragraph(store_address, styles['Normal']))
        if store_phone:
            story.append(Paragraph(f"Tel: {store_phone}", styles['Normal']))
        story.append(Spacer(1, 5*mm))
        
        # Receipt info
        receipt_style = ParagraphStyle(
            'Receipt',
            parent=styles['Normal'],
            fontSize=9,
            alignment=0  # Left
        )
        
        receipt_id = sale_data.get('id', 'N/A')
        receipt_date = sale_data.get('created_at', datetime.now().isoformat())
        if isinstance(receipt_date, str):
            receipt_date = receipt_date[:19].replace('T', ' ')
        
        story.append(Paragraph(f"Chek №: {receipt_id}", receipt_style))
        story.append(Paragraph(f"Sana: {receipt_date}", receipt_style))
        story.append(Spacer(1, 3*mm))
        
        # Items table
        table_data = [['Mahsulot', 'Miq.', 'Narx', 'Jami']]
        
        for item in items:
            table_data.append([
                item.get('product_name', '')[:20],  # Truncate long names
                f"{item.get('quantity', 0):.1f}",
                f"{item.get('unit_price', 0):,.0f}",
                f"{item.get('total', 0):,.0f}"
            ])
        
        # Total row
        total = sale_data.get('total_amount', 0)
        table_data.append(['', '', 'JAMI:', f"{total:,.0f}"])
        
        items_table = Table(table_data, colWidths=[30*mm, 15*mm, 15*mm, 20*mm])
        items_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -2), 7),
            ('FONTSIZE', (0, -1), (-1, -1), 9),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 5*mm))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1  # Center
        )
        story.append(Paragraph("Rahmat!", footer_style))
        story.append(Paragraph("Yana kelib turing!", footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
        
    except Exception as e:
        logger.error(f"Error generating receipt PDF: {e}")
        raise Exception(f"Chek yaratishda xatolik: {str(e)}")








