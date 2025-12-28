from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, 
    users,
    health, 
    products, 
    categories, 
    invoices, 
    sales, 
    dashboard, 
    reports, 
    customers, 
    inventory, 
    suppliers, 
    analytics, 
    branches, 
    notifications, 
    receipts, 
    recommendations, 
    payments, 
    receipt_scanner,
    ai_analytics,
    product_lookup,
    employees,
    work_sessions,
    ai_employee,
    image_finder_api,
    ai_recommendations,
    ai_chatbot,
    organizations,
    smart_inventory,
    # New v2 endpoints
    products_v2,
    sales_v2,
    customers_v2,
    tenants,
    labels,
    settings
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(branches.router, prefix="/branches", tags=["branches"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(receipt_scanner.router, prefix="/receipt-scanner", tags=["receipt-scanner"])
api_router.include_router(ai_analytics.router, prefix="/ai-analytics", tags=["ai-analytics"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(product_lookup.router, prefix="/products", tags=["product-lookup"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(work_sessions.router, prefix="/work-sessions", tags=["work-sessions"])
api_router.include_router(ai_employee.router, prefix="/ai-employee", tags=["ai-employee"])
api_router.include_router(image_finder_api.router, prefix="/products", tags=["product-image"])
api_router.include_router(ai_recommendations.router, prefix="/ai", tags=["ai-recommendations"])
api_router.include_router(ai_chatbot.router, prefix="/ai", tags=["ai-chatbot"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(smart_inventory.router, prefix="/inventory", tags=["smart-inventory"])

# V2 Multi-tenant endpoints
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(products_v2.router, prefix="/v2/products", tags=["products-v2"])
api_router.include_router(sales_v2.router, prefix="/v2/sales", tags=["sales-v2"])
api_router.include_router(customers_v2.router, prefix="/v2/customers", tags=["customers-v2"])
api_router.include_router(labels.router, prefix="/labels", tags=["labels"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])

