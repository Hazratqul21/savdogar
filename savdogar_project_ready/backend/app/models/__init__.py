from app.core.database import Base
from .organization import Organization
from .user import User, UserRole
from .product import Product, Category  # Legacy Product (products table)
from .sale import Sale, SaleItem
from .receipt import ScannedReceipt, ScannedReceiptItem
from .customer import Customer, CustomerTransaction
from .inventory import InventoryMovement, Supplier, MovementType
from .branch import Branch, BranchStock, StockTransfer, TransferStatus
from .work_session import WorkSession, SessionStatus
from .attendance import Attendance, AttendanceStatus
from .employee_document import EmployeeDocument
from .employee_ai_insights import EmployeeAIInsights
from .invoice import Invoice, InvoiceItem

# V2 Multi-tenant models
from .tenant import Tenant, BusinessType
from .product_v2 import ProductV2, ProductVariant, ProductType
from .pricing import PriceTier, PriceTierType
from .customer_v2 import CustomerV2, CustomerTransactionV2, CustomerLedger, CustomerTier
from .sale_v2 import SaleV2, SaleItemV2, PaymentMethod, SaleStatus
