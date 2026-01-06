"""
Inventory Service - Double-Entry Inventory Management
=====================================================

Enterprise-grade inventory service implementing Odoo-style double-entry logic.
Provides high-level API for inventory operations while maintaining backward compatibility.
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from app.models.stock_engine import (
    StockLocation, StockMove, StockQuant, StockLot,
    MoveState, QuantStatus
)
from app.models.product_v2 import ProductVariant
from app.models.product import Product
from app.services.logging import get_logger

logger = get_logger(__name__)


class InventoryService:
    """
    Service for managing inventory using double-entry accounting.
    
    This service implements Odoo-style double-entry inventory logic,
    providing a clean API while maintaining backward compatibility with
    existing Product.stock_quantity and ProductVariant.stock_quantity fields.
    """
    
    @staticmethod
    def process_stock_move(
        db: Session,
        tenant_id: int,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None,
        location_id: int = None,
        location_dest_id: int = None,
        quantity: float = 0.0,
        auto_confirm: bool = False,
        lot_id: Optional[int] = None,
        package_id: Optional[int] = None,
        owner_id: Optional[int] = None,
        origin: Optional[str] = None,
        reference: Optional[str] = None,
    ) -> StockMove:
        """
        Process a stock move through the double-entry inventory system.
        
        This function implements the core double-entry logic:
        1. Creates a StockMove record
        2. If auto_confirm=True, immediately executes the move
        3. When executed, creates two quant adjustments:
           - Negative quant at source location
           - Positive quant at destination location
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            variant_id: ProductVariant ID (preferred for V2 system)
            product_id: Product ID (legacy Product)
            location_id: Source location ID
            location_dest_id: Destination location ID
            quantity: Quantity to move (must be positive)
            auto_confirm: If True, immediately execute the move
            lot_id: Optional lot/batch ID
            package_id: Optional package ID
            owner_id: Optional owner ID (for consignment)
            origin: Optional origin reference (e.g., "SO001")
            reference: Optional move reference
        
        Returns:
            Created StockMove object
        
        Raises:
            ValueError: If locations are invalid or quantities are negative
        """
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        
        if not variant_id and not product_id:
            raise ValueError("Either variant_id or product_id must be provided")
        
        # Validate locations exist
        source_loc = db.query(StockLocation).filter(
            StockLocation.id == location_id,
            StockLocation.tenant_id == tenant_id
        ).first()
        
        dest_loc = db.query(StockLocation).filter(
            StockLocation.id == location_dest_id,
            StockLocation.tenant_id == tenant_id
        ).first()
        
        if not source_loc:
            raise ValueError(f"Source location {location_id} not found")
        if not dest_loc:
            raise ValueError(f"Destination location {location_dest_id} not found")
        
        # Create the move
        move = StockMove(
            tenant_id=tenant_id,
            variant_id=variant_id,
            product_id=product_id,
            location_id=location_id,
            location_dest_id=location_dest_id,
            product_uom_qty=Decimal(str(quantity)),
            quantity_done=Decimal("0"),
            state=MoveState.DRAFT,
            lot_id=lot_id,
            package_id=package_id,
            owner_id=owner_id,
            origin=origin,
            reference=reference,
            date=datetime.utcnow()
        )
        
        db.add(move)
        db.flush()  # Get the ID
        
        # If auto_confirm, execute immediately
        if auto_confirm:
            InventoryService._execute_move(db, move)
        
        # Sync stock quantity for backward compatibility
        InventoryService._sync_stock_quantity(db, tenant_id, variant_id, product_id)
        
        return move
    
    @staticmethod
    def _execute_move(db: Session, move: StockMove) -> None:
        """
        Execute a stock move by creating the double-entry quant adjustments.
        
        This is the core of the double-entry system:
        - Creates negative quant at source location
        - Creates positive quant at destination location
        
        Args:
            db: SQLAlchemy database session
            move: StockMove to execute
        """
        if move.state == MoveState.DONE:
            return  # Already executed
        
        if move.state == MoveState.CANCELLED:
            raise ValueError("Cannot execute a cancelled move")
        
        quantity = move.quantity_done if move.quantity_done > 0 else move.product_uom_qty
        
        # Double-entry: Create quant at source location (negative)
        source_quant = StockQuant(
            tenant_id=move.tenant_id,
            variant_id=move.variant_id,
            product_id=move.product_id,
            location_id=move.location_id,
            quantity=-quantity,  # Negative for outgoing
            reserved_quantity=Decimal("0"),
            lot_id=move.lot_id,
            package_id=move.package_id,
            owner_id=move.owner_id,
            status=QuantStatus.AVAILABLE,
            move_id=move.id,
            in_date=datetime.utcnow()
        )
        
        # Double-entry: Create quant at destination location (positive)
        dest_quant = StockQuant(
            tenant_id=move.tenant_id,
            variant_id=move.variant_id,
            product_id=move.product_id,
            location_id=move.location_dest_id,
            quantity=quantity,  # Positive for incoming
            reserved_quantity=Decimal("0"),
            lot_id=move.lot_id,
            package_id=move.package_id,
            owner_id=move.owner_id,
            status=QuantStatus.AVAILABLE,
            move_id=move.id,
            in_date=datetime.utcnow()
        )
        
        db.add(source_quant)
        db.add(dest_quant)
        
        # Update move state
        move.state = MoveState.DONE
        move.quantity_done = quantity
        move.date_done = datetime.utcnow()
        
        db.flush()
    
    @staticmethod
    def confirm_move(db: Session, move_id: int, tenant_id: int) -> StockMove:
        """
        Confirm a draft move and change its state to CONFIRMED.
        
        Args:
            db: SQLAlchemy database session
            move_id: ID of the move to confirm
            tenant_id: Tenant ID for security
        
        Returns:
            Updated StockMove
        """
        move = db.query(StockMove).filter(
            StockMove.id == move_id,
            StockMove.tenant_id == tenant_id
        ).first()
        
        if not move:
            raise ValueError(f"Move {move_id} not found")
        
        if move.state != MoveState.DRAFT:
            raise ValueError(f"Move {move_id} is not in DRAFT state")
        
        move.state = MoveState.CONFIRMED
        db.flush()
        return move
    
    @staticmethod
    def execute_move(db: Session, move_id: int, tenant_id: int) -> StockMove:
        """
        Execute a confirmed move by creating the double-entry quant adjustments.
        
        Args:
            db: SQLAlchemy database session
            move_id: ID of the move to execute
            tenant_id: Tenant ID for security
        
        Returns:
            Executed StockMove
        """
        move = db.query(StockMove).filter(
            StockMove.id == move_id,
            StockMove.tenant_id == tenant_id
        ).first()
        
        if not move:
            raise ValueError(f"Move {move_id} not found")
        
        if move.state not in (MoveState.CONFIRMED, MoveState.ASSIGNED):
            raise ValueError(f"Move {move_id} must be CONFIRMED or ASSIGNED to execute")
        
        InventoryService._execute_move(db, move)
        
        # Sync stock quantity for backward compatibility
        InventoryService._sync_stock_quantity(
            db, tenant_id, move.variant_id, move.product_id
        )
        
        db.commit()
        return move
    
    @staticmethod
    def get_available_quantity(
        db: Session,
        tenant_id: int,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None,
        location_id: Optional[int] = None,
        lot_id: Optional[int] = None,
        package_id: Optional[int] = None,
        owner_id: Optional[int] = None
    ) -> float:
        """
        Get available quantity for a product/variant at a location.
        
        Available = Total Quantity - Reserved Quantity
        
        If location_id is None, sums across all locations.
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            variant_id: ProductVariant ID
            product_id: Product ID (legacy)
            location_id: Location ID (None for all locations)
            lot_id: Optional lot filter
            package_id: Optional package filter
            owner_id: Optional owner filter
        
        Returns:
            Available quantity as float
        """
        query = db.query(
            func.sum(StockQuant.quantity).label('total_qty'),
            func.sum(StockQuant.reserved_quantity).label('total_reserved')
        ).filter(
            StockQuant.tenant_id == tenant_id
        )
        
        if variant_id:
            query = query.filter(StockQuant.variant_id == variant_id)
        elif product_id:
            query = query.filter(StockQuant.product_id == product_id)
        else:
            raise ValueError("Either variant_id or product_id must be provided")
        
        if location_id is not None:
            query = query.filter(StockQuant.location_id == location_id)
        
        if lot_id is not None:
            query = query.filter(StockQuant.lot_id == lot_id)
        if package_id is not None:
            query = query.filter(StockQuant.package_id == package_id)
        if owner_id is not None:
            query = query.filter(StockQuant.owner_id == owner_id)
        
        result = query.first()
        
        total_qty = float(result.total_qty or 0)
        total_reserved = float(result.total_reserved or 0)
        
        return total_qty - total_reserved
    
    @staticmethod
    def reserve_quantity(
        db: Session,
        tenant_id: int,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None,
        location_id: int = None,
        quantity: float = 0.0,
        lot_id: Optional[int] = None,
        package_id: Optional[int] = None,
        owner_id: Optional[int] = None
    ) -> bool:
        """
        Reserve quantity for a pending move.
        
        This increases the reserved_quantity on quants without actually moving them.
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            variant_id: ProductVariant ID
            product_id: Product ID (legacy)
            location_id: Location ID
            quantity: Quantity to reserve
            lot_id: Optional lot filter
            package_id: Optional package filter
            owner_id: Optional owner filter
        
        Returns:
            True if reservation successful, False if insufficient quantity
        """
        available = InventoryService.get_available_quantity(
            db, tenant_id, variant_id, product_id, location_id, lot_id, package_id, owner_id
        )
        
        if available < quantity:
            return False
        
        # Find quants to reserve from (FIFO - oldest first)
        query = db.query(StockQuant).filter(
            StockQuant.tenant_id == tenant_id,
            StockQuant.quantity > StockQuant.reserved_quantity  # Has available quantity
        ).order_by(StockQuant.in_date.asc())
        
        if variant_id:
            query = query.filter(StockQuant.variant_id == variant_id)
        elif product_id:
            query = query.filter(StockQuant.product_id == product_id)
        
        if location_id is not None:
            query = query.filter(StockQuant.location_id == location_id)
        
        if lot_id is not None:
            query = query.filter(StockQuant.lot_id == lot_id)
        if package_id is not None:
            query = query.filter(StockQuant.package_id == package_id)
        if owner_id is not None:
            query = query.filter(StockQuant.owner_id == owner_id)
        
        quants = query.all()
        remaining = Decimal(str(quantity))
        
        for quant in quants:
            if remaining <= 0:
                break
            
            available_in_quant = quant.quantity - quant.reserved_quantity
            to_reserve = min(available_in_quant, remaining)
            
            quant.reserved_quantity += to_reserve
            remaining -= to_reserve
        
        db.flush()
        return remaining <= 0
    
    @staticmethod
    def _sync_stock_quantity(
        db: Session,
        tenant_id: int,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None
    ) -> None:
        """
        Sync quant totals to Product.stock_quantity or ProductVariant.stock_quantity.
        
        This maintains backward compatibility with existing APIs that read
        stock_quantity directly from Product/ProductVariant.
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            variant_id: ProductVariant ID
            product_id: Product ID (legacy)
        """
        total_qty = InventoryService.get_available_quantity(
            db, tenant_id, variant_id, product_id
        )
        
        if variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == variant_id,
                ProductVariant.tenant_id == tenant_id
            ).first()
            if variant:
                variant.stock_quantity = total_qty
                db.flush()
        elif product_id:
            product = db.query(Product).filter(Product.id == product_id).first()
            if product:
                product.stock_quantity = total_qty
                db.flush()
    
    @staticmethod
    def create_or_get_location(
        db: Session,
        tenant_id: int,
        name: str,
        code: str,
        usage: str = "internal",
        parent_id: Optional[int] = None
    ) -> StockLocation:
        """
        Create a new location or get existing one by code.
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            name: Location name
            code: Location code (unique per tenant)
            usage: Location usage (internal, supplier, customer, inventory, transit)
            parent_id: Optional parent location ID
        
        Returns:
            StockLocation object
        """
        location = db.query(StockLocation).filter(
            StockLocation.tenant_id == tenant_id,
            StockLocation.code == code
        ).first()
        
        if location:
            return location
        
        location = StockLocation(
            tenant_id=tenant_id,
            name=name,
            code=code,
            usage=usage,
            parent_id=parent_id
        )
        
        db.add(location)
        db.flush()
        return location
    
    @staticmethod
    def get_stock_by_location(
        db: Session,
        tenant_id: int,
        variant_id: Optional[int] = None,
        product_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get stock quantities by location.
        
        Args:
            db: SQLAlchemy database session
            tenant_id: Tenant ID
            variant_id: ProductVariant ID
            product_id: Product ID (legacy)
        
        Returns:
            List of dicts with location info and quantities
        """
        query = db.query(
            StockLocation.id,
            StockLocation.name,
            StockLocation.code,
            func.sum(StockQuant.quantity).label('total_qty'),
            func.sum(StockQuant.reserved_quantity).label('reserved_qty')
        ).join(
            StockQuant, StockQuant.location_id == StockLocation.id
        ).filter(
            StockLocation.tenant_id == tenant_id
        )
        
        if variant_id:
            query = query.filter(StockQuant.variant_id == variant_id)
        elif product_id:
            query = query.filter(StockQuant.product_id == product_id)
        
        query = query.group_by(
            StockLocation.id,
            StockLocation.name,
            StockLocation.code
        )
        
        results = query.all()
        
        return [
            {
                'location_id': r.id,
                'location_name': r.name,
                'location_code': r.code,
                'quantity': float(r.total_qty or 0),
                'reserved_quantity': float(r.reserved_qty or 0),
                'available_quantity': float((r.total_qty or 0) - (r.reserved_qty or 0))
            }
            for r in results
        ]


# Convenience functions for backward compatibility
def process_stock_move(
    db: Session,
    tenant_id: int,
    variant_id: Optional[int] = None,
    product_id: Optional[int] = None,
    location_id: int = None,
    location_dest_id: int = None,
    quantity: float = 0.0,
    auto_confirm: bool = False,
    **kwargs
) -> StockMove:
    """Convenience function for stock move processing"""
    return InventoryService.process_stock_move(
        db, tenant_id, variant_id, product_id,
        location_id, location_dest_id, quantity,
        auto_confirm, **kwargs
    )

