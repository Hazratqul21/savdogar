"""
Role-Based Permissions System
=============================
Oddiy rol asosidagi ruxsatlar tizimi.
Har bir rol uchun belgilangan ruxsatlar mavjud.
"""
from typing import List, Optional
from functools import wraps
from fastapi import HTTPException, status
from app.models.user import UserRole


# =============================================================================
# Role Permissions Definition
# =============================================================================

ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: ["*"],  # Barcha ruxsatlar
    UserRole.OWNER: [
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
    UserRole.MANAGER: [
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
    UserRole.CASHIER: [
        "pos",
        "customers",
        "customers.view",
    ],
    UserRole.WAREHOUSE_MANAGER: [
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

# Role labels for UI
ROLE_LABELS = {
    UserRole.SUPER_ADMIN: "Super Admin",
    UserRole.OWNER: "Egasi",
    UserRole.MANAGER: "Menejer",
    UserRole.CASHIER: "Kassir",
    UserRole.WAREHOUSE_MANAGER: "Omborchi",
}


# =============================================================================
# Permission Checking Functions
# =============================================================================

def has_permission(role: UserRole, permission: str) -> bool:
    """
    Check if a role has a specific permission.
    
    Args:
        role: User's role
        permission: Permission string (e.g., "products.edit")
    
    Returns:
        bool: True if role has permission
    """
    if role not in ROLE_PERMISSIONS:
        return False
    
    permissions = ROLE_PERMISSIONS[role]
    
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


def get_role_permissions(role: UserRole) -> List[str]:
    """
    Get all permissions for a role.
    
    Args:
        role: User's role
    
    Returns:
        List of permission strings
    """
    return ROLE_PERMISSIONS.get(role, [])


def get_permission_label(permission: str) -> str:
    """
    Get human-readable label for a permission.
    
    Args:
        permission: Permission string
    
    Returns:
        Human-readable label
    """
    return PERMISSION_LABELS.get(permission, permission)


def get_role_label(role: UserRole) -> str:
    """
    Get human-readable label for a role.
    
    Args:
        role: User's role
    
    Returns:
        Human-readable label
    """
    return ROLE_LABELS.get(role, str(role.value))


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
