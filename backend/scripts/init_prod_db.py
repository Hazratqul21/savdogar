import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

# Import all models to register them with Base
from app.core.database import engine, Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.product_v2 import ProductVariant, ProductV2
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.customer_v2 import CustomerV2
from app.models.branch import Branch
from app.models.invoice import Invoice, InvoiceItem

def init_db():
    print("[INIT] Connecting to database...")
    # This will create all tables defined in models imported above
    Base.metadata.create_all(bind=engine)
    print("[INIT] All tables created successfully.")

if __name__ == "__main__":
    init_db()
