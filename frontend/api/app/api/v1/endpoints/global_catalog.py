"""
Global Product Catalog API Endpoints

This module handles queries to the global_catalog table (Supabase),
which stores a crowdsourced catalog of products shared across all stores.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/lookup/{barcode}")
def lookup_global_catalog(
    barcode: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Look up a product in the global catalog by barcode.
    
    Returns product data if found, None otherwise.
    This allows stores to import products that other stores have added.
    """
    try:
        # Query the global_catalog table directly using raw SQL
        # (Since it's a Supabase table, not in our SQLAlchemy models)
        query = text("""
            SELECT 
                barcode,
                name,
                category,
                image_url,
                description,
                created_at,
                updated_at,
                contribution_count
            FROM public.global_catalog
            WHERE barcode = :barcode
            LIMIT 1
        """)
        
        result = db.execute(query, {"barcode": barcode}).fetchone()
        
        if result:
            return {
                "found": True,
                "barcode": result.barcode,
                "name": result.name,
                "category": result.category,
                "image_url": result.image_url,
                "description": result.description,
                "created_at": result.created_at.isoformat() if result.created_at else None,
                "updated_at": result.updated_at.isoformat() if result.updated_at else None,
                "contribution_count": result.contribution_count,
            }
        else:
            return {
                "found": False,
                "barcode": barcode,
            }
    except Exception as e:
        # Log error but don't expose internal details
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query global catalog: {str(e)}"
        )


@router.post("/contribute")
def contribute_to_global_catalog(
    barcode: str,
    name: str,
    category: Optional[str] = None,
    image_url: Optional[str] = None,
    description: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Contribute a product to the global catalog.
    
    Uses the upsert_global_catalog function (defined in Supabase SQL)
    to insert or update contribution count.
    
    This is called automatically when a store adds a new product.
    """
    try:
        # Call the upsert function defined in Supabase
        query = text("""
            SELECT * FROM public.upsert_global_catalog(
                :barcode,
                :name,
                :category,
                :image_url,
                :description
            )
        """)
        
        result = db.execute(
            query,
            {
                "barcode": barcode,
                "name": name,
                "category": category,
                "image_url": image_url,
                "description": description,
            }
        ).fetchone()
        
        db.commit()
        
        if result:
            return {
                "success": True,
                "barcode": result.barcode,
                "name": result.name,
                "category": result.category,
                "contribution_count": result.contribution_count,
                "message": "Product contributed to global catalog",
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to contribute product to global catalog"
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to contribute to global catalog: {str(e)}"
        )


@router.get("/search")
def search_global_catalog(
    query: str,
    limit: int = 10,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search the global catalog by name (for future use).
    """
    try:
        search_query = text("""
            SELECT 
                barcode,
                name,
                category,
                image_url,
                description,
                contribution_count
            FROM public.global_catalog
            WHERE name ILIKE :query
            ORDER BY contribution_count DESC, name ASC
            LIMIT :limit
        """)
        
        results = db.execute(
            search_query,
            {"query": f"%{query}%", "limit": limit}
        ).fetchall()
        
        return {
            "results": [
                {
                    "barcode": r.barcode,
                    "name": r.name,
                    "category": r.category,
                    "image_url": r.image_url,
                    "description": r.description,
                    "contribution_count": r.contribution_count,
                }
                for r in results
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search global catalog: {str(e)}"
        )
