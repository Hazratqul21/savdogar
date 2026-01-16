"""
Schemas for Hybrid AI Invoice Scanner
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class ScannedInvoiceItem(BaseModel):
    """Single item extracted from invoice"""
    product_name: str = Field(..., description="Product name as written on invoice")
    quantity: float = Field(..., gt=0, description="Quantity (must be > 0)")
    price: float = Field(..., ge=0, description="Unit price per item")
    unit: str = Field(default="dona", description="Measurement unit (kg, dona, L, etc.)")


class HybridScanRequest(BaseModel):
    """Request model for hybrid scanner (optional - can use query params instead)"""
    mode: Literal["printed", "handwritten"] = Field(
        default="printed",
        description="Scan mode: 'printed' for fast/cost-effective, 'handwritten' for high precision"
    )


class HybridScanResponse(BaseModel):
    """Response from hybrid invoice scanner"""
    success: bool = Field(..., description="Whether scan was successful")
    items: List[ScannedInvoiceItem] = Field(default_factory=list, description="Extracted items")
    model_used: str = Field(..., description="AI model used (gpt-4o-mini or gpt-4o)")
    mode: str = Field(..., description="Scan mode used")
    image_path: Optional[str] = Field(None, description="Path to saved image (if saved)")
    error: Optional[str] = Field(None, description="Error message if scan failed")


class HybridScanError(BaseModel):
    """Structured error response"""
    success: bool = Field(False, description="Always false for errors")
    error: str = Field(..., description="Human-readable error message")
    error_code: Optional[str] = Field(None, description="Error code for frontend handling")
    items: List[ScannedInvoiceItem] = Field(default_factory=list, description="Empty items on error")
