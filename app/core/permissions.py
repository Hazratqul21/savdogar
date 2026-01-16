"""
Role-Based Permissions System
=============================
Oddiy rol asosidagi ruxsatlar tizimi.
Har bir rol uchun belgilangan ruxsatlar mavjud.

IMPORTANT: role endi string sifatida saqlanadi (enum emas!)
Qiymatlar: "super_admin", "owner", "manager", "cashier", "warehouse_manager"
"""
from typing import List, Optional, Union
from functools import wraps
from fastapi import HTTPException, status
from app.models.user import UserRole


# =============================================================================
# Role Permissions Definition (STRING KEYS!)
# =============================================================================

ROLE_PERMISSIONS = {
    "super_admin": ["*"],  # Barcha ruxsatlar
    "owner": [
        "dashboard",
        "dashboard.analytics",
        "pos",
        "pos.discount",
        "pos.refund",
        "products",
        "products.create",
        "products.edit",
        "products.delete",
        "products.price",
        "inventory",
        "inventory.edit",
        "customers",
        "customers.create",
        "customers.edit",
        "customers.delete",
        "team",
        "team.invite",
        "team.edit",
        "team.delete",
        "reports",
        "reports.sales",
        "reports.inventory",
        "reports.financial",
        "settings",
        "settings.tenant",
        "settings.billing",
    ],
    "manager": [
        "dashboard",
        "pos",
        "pos.discount",
        "pos.refund",
        "products",
        "products.create",
        "products.edit",
        "products.price",
        "inventory",
        "inventory.edit",
        "customers",
        "customers.create",
        "customers.edit",
        "reports",
        "reports.sales",
        "reports.inventory",
    ],
    "cashier": [
        "pos",
        "customers",
        "customers.view",
    ],
    "warehouse_manager": [
        "products",
        "products.create",
        "products.edit",
        "inventory",
        "inventory.edit",
        "reports.inventory",
    ],
}

# Human-readable permission names (for UI)
PERMISSION_LABELS = {
    "dashboard": "Boshqaruv paneli",
    "dashboard.analytics": "Tahlillar",
    "pos": "POS terminali",
    "pos.discount": "Chegirma berish",
    "pos.refund": "Qaytarish",
    "products": "Mahsulotlar",
    "products.create": "Mahsulot qo'shish",
    "products.edit": "Mahsulot tahrirlash",
    "products.delete": "Mahsulot o'chirish",
    "products.price": "Narx o'zgartirish",
    "inventory": "Ombor",
    "inventory.edit": "Ombor o'zgartirish",
    "customers": "Mijozlar",
    "customers.view": "Mijozlarni ko'rish",
    "customers.create": "Mijoz qo'shish",
    "customers.edit": "Mijoz tahrirlash",
    "customers.delete": "Mijoz o'chirish",
    "team": "Jamoa",
    "team.invite": "Xodim qo'shish",
    "team.edit": "Xodim tahrirlash",
    "team.delete": "Xodim o'chirish",
    "reports": "Hisobotlar",
    "reports.sales": "Savdo hisoboti",
    "reports.inventory": "Ombor hisoboti",
    "reports.financial": "Moliyaviy hisobot",
    "settings": "Sozlamalar",
    "settings.tenant": "Tashkilot sozlamalari",
    "settings.billing": "To'lov sozlamalari",
}

# Role labels for UI (STRING KEYS!)
ROLE_LABELS = {
    "super_admin": "Super Admin",
    "owner": "Egasi",
    "manager": "Menejer",
    "cashier": "Kassir",
    "warehouse_manager": "Omborchi",
}


# =============================================================================
# Helper: Normalize role to string
# =============================================================================

def _normalize_role(role: Union[str, UserRole, None]) -> str:
    """Convert role to lowercase string."""
    if role is None:
        return ""
    if isinstance(role, str):
        return role.lower()
    if hasattr(role, 'value'):
        return role.value.lower()
    return str(role).lower()


# =============================================================================
# Permission Checking Functions
# =============================================================================

def has_permission(role: Union[str, UserRole, None], permission: str) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: User's role (string or UserRole enum)
        permission: Permission string (e.g., "products.edit")
    
    Returns:
        bool: True if role has permission
    """
    role_str = _normalize_role(role)
    
    if role_str not in ROLE_PERMISSIONS:
        return False
    
    permissions = ROLE_PERMISSIONS[role_str]
    
    # Super admin has all permissions
    if "*" in permissions:
        return True
    
    # Exact match
    if permission in permissions:
        return True
    
    # Parent permission check (e.g., "products" grants "products.edit")
    parts = permission.split(".")
    for i in range(len(parts)):
        parent = ".".join(parts[:i+1])
        if parent in permissions:
            return True
    
    return False


def get_role_permissions(role: Union[str, UserRole, None]) -> List[str]:
    """
    Get all permissions for a role.
    
    Args:
        role: User's role (string or UserRole enum)
    
    Returns:
        List of permission strings
    """
    role_str = _normalize_role(role)
    return ROLE_PERMISSIONS.get(role_str, [])


def get_permission_label(permission: str) -> str:
    """
    Get human-readable label for a permission.
    
    Args:
        permission: Permission string
    
    Returns:
        Human-readable label
    """
    return PERMISSION_LABELS.get(permission, permission)


def get_role_label(role: Union[str, UserRole, None]) -> str:
    """
    Get human-readable label for a role.
    
    Args:
        role: User's role (string or UserRole enum)
    
    Returns:
        Human-readable label
    """
    role_str = _normalize_role(role)
    return ROLE_LABELS.get(role_str, role_str)


# =============================================================================
# Permission Decorators for API Endpoints
# =============================================================================

def require_permission(permission: str):
    """
    Decorator to require a specific permission for an endpoint.
    
    Usage:
        @router.get("/products")
        @require_permission("products")
        async def get_products(current_user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Avtorizatsiya talab qilinadi"
                )
            
            if not has_permission(current_user.role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Sizda '{get_permission_label(permission)}' ruxsati yo'q"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def check_permission(user, permission: str) -> None:
    """
    Check permission and raise exception if not allowed.
    
    Args:
        user: User object with role
        permission: Permission string
    
    Raises:
        HTTPException: If user doesn't have permission
    """
    if not has_permission(user.role, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Sizda '{get_permission_label(permission)}' ruxsati yo'q"
        )
