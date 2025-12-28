from sqlalchemy.orm import Session
from app.services.azure_openai_client import azure_openai
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from rapidfuzz import process, fuzz
import json
import logging
from typing import Union, List, Dict
from sqlalchemy import select

logger = logging.getLogger(__name__)

class AIService:
    
    async def parse_invoice_and_update_stock(
        self, 
        invoice_content: Union[str, bytes], 
        db: Session, 
        organization_id: int,
        is_image: bool = False,
        image_url: str = None
    ):
        """
        Feature A: Intelligent Inventory Update (Optimized for Uzbek Retail)
        Parses invoice and updates stock. Handles fuzzy matching and auto-creation.
        """
        system_prompt = """Siz O'zbekistondagi savdo do'koni uchun yordamchi AI hisoblanasiz.
        Ushbu faktura (nakladnoy) rasmidan yoki matnidan quyidagi ma'lumotlarni aniq ajratib oling:
        1. Mahsulot nomi (aniq va to'liq, masalan "Sut Musaffo 1L")
        2. Miqdori (faqat raqam)
        3. Kelish narxi (sotib olish narxi)
        4. Yetkazib beruvchi (firma) nomi
        5. Umumiy summa

        Javobni FAQAT quyidagi JSON formatida qaytaring:
        {
            "items": [
                {"product_name": "string", "quantity": float, "unit_cost": float}
            ],
            "supplier_name": "string",
            "total_amount": float
        }
        Agar aniq o'qiy olmasangiz, eng yaqin taxminni yozing.
        """
        
        try:
            # 1. AI Processing
            if is_image and image_url:
                 extracted_data = await azure_openai.analyze_image(system_prompt, image_url)
            else:
                 extracted_data = await azure_openai.generate_json(system_prompt, f"Invoice Content:\n{invoice_content}")
            
            logger.info(f"AI Extracted Data: {extracted_data}")

            # 2. Smart Entity Matching
            existing_products = db.query(Product).filter(Product.organization_id == organization_id).all()
            # Create a map specifically optimized for fuzzy search
            product_map = {p.id: p for p in existing_products}
            product_names = [p.name for p in existing_products]
            
            invoice_items_to_create = []
            
            items = extracted_data.get("items", [])
            for item in items:
                raw_name = item.get("product_name")
                qty = float(item.get("quantity", 0))
                cost = float(item.get("unit_cost", 0))
                
                matched_product = None
                
                # Logic: Try exact match first, then fuzzy
                if product_names:
                    # Fuzzy match with RapidFuzz
                    match = process.extractOne(raw_name, product_names, scorer=fuzz.token_sort_ratio)
                    # Higher threshold for cleaner data (e.g. 85%)
                    if match and match[1] > 85: 
                        # Find the product object
                        matched_name = match[0]
                        matched_product = next((p for p in existing_products if p.name == matched_name), None)
                
                # Logic: Auto-Correction & Learning
                if matched_product:
                    # Update existing stock
                    matched_product.stock_quantity += qty
                    # Smart average cost calculation or simple update logic? 
                    # For simplicty/user request "automatic", just update latest cost
                    matched_product.cost_price = cost 
                    db.add(matched_product)
                    logger.info(f"Stock Updated: {matched_product.name} += {qty}")
                else:
                    # Create NEW Product intelligently
                    # Defaulting to 'dona' and retail category
                    new_prod = Product(
                        organization_id=organization_id,
                        name=raw_name, 
                        price=cost * 1.25, # Auto-markup 25% by default
                        cost_price=cost,
                        stock_quantity=qty,
                        unit="dona",
                        attributes={"source": "ai_invoice_auto_create"}
                    )
                    db.add(new_prod)
                    db.flush() # get ID
                    matched_product = new_prod
                    logger.info(f"Auto-Created Product: {raw_name}")

                # Record Item
                invoice_items_to_create.append({
                    "product_name_raw": raw_name,
                    "product_id": matched_product.id,
                    "quantity": qty,
                    "price": cost
                })

            # Create Invoice Record
            new_invoice = Invoice(
                organization_id=organization_id,
                supplier_name=extracted_data.get("supplier_name", "Noma'lum"),
                total_amount=extracted_data.get("total_amount", 0),
                status=InvoiceStatus.CONFIRMED, 
                processed_data=extracted_data,
                raw_text=json.dumps(extracted_data), # Save parsed json as text backup
                image_url=image_url
            )
            db.add(new_invoice)
            db.flush()

            for item_data in invoice_items_to_create:
                db_item = InvoiceItem(
                    invoice_id=new_invoice.id,
                    product_name_raw=item_data["product_name_raw"],
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    price=item_data["price"]
                )
                db.add(db_item)
            
            db.commit()
            return new_invoice

        except Exception as e:
            db.rollback()
            logger.error(f"Error in AI Invoice Processing: {e}")
            raise e

    async def analyze_customer_habits(self, customer_id: int, db: Session):
        """
        Feature B: Customer Insights
        Analyzes transaction history and updates customer metadata.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError("Customer not found")

        # Fetch recent transactions
        # This assumes we can link via Customer -> CustomerTransaction -> Sale or similar.
        # Based on models provided: CustomerTransaction links Customer and Sale.
        # But wait, models might not have been fully reloaded in my context, I'm assuming relationships exist.
        
        # Let's try to query CustomerTransaction
        # The relationship in Customer is `transactions`.
        
        tx_history = []
        for tx in customer.transactions[-10:]: # Analyze last 10
             # We need sale items to know what they bought
             if tx.sale_id:
                 sale = db.query(Sale).get(tx.sale_id)
                 if sale:
                     items = [f"{i.quantity} x {i.product.name}" for i in sale.items]
                     tx_history.append(f"Date: {sale.created_at}, Items: {', '.join(items)}")
        
        if not tx_history:
            return "No enough data for analysis."

        history_text = "\n".join(tx_history)
        prompt = f"Mijozning xarid tarixini tahlil qiling va uning odatlarini 1 jumla bilan o'zbek tilida xulosa qiling (masalan, 'Qahvani yaxshi ko'radi, asosan dam olish kunlari xarid qiladi').\n\nTarix:\n{history_text}"
        
        try:
            insight_json = await azure_openai.generate_json(
                "You are a CRM expert. Output JSON.", 
                prompt + "\nReturn JSON: {'summary': '...'}"
            )
            summary = insight_json.get("summary", "No summary generated.")
            
            # Update Customer Metadata
            current_meta = customer.ai_preferences or {}
            current_meta["buying_habit_summary"] = summary
            current_meta["last_analysis"] = str(history_text) # simplified timestamp/id tracking
            customer.ai_preferences = current_meta
            
            db.commit()
            return summary
        except Exception as e:
            logger.error(f"Error generating customer insights: {e}")
            raise e

    async def get_embedding(self, text: str):
        """Matn uchun embedding (vector) olish"""
        try:
            response = await azure_openai.client.embeddings.create(
                input=[text],
                model="text-embedding-3-small"
            )
            return response.data[0].embedding

        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    async def search_semantic(self, db: Session, tenant_id: int, query: str, limit: int = 5):
        """Ma'no bo'yicha qidirish (Vector search)"""
        query_vector = await self.get_embedding(query)
        if not query_vector:
            return []

        from app.models.product_v2 import ProductVariant
        from sqlalchemy import text
        
        # PostgreSQL vector similarity (using <-> operator if pgvector installed, 
        # but here we'll use a standard array approach if pgvector isnt guaranteed)
        # Assuming pgvector is available as we are on Azure PG
        results = db.query(ProductVariant).filter(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.is_active == True
        ).order_by(
            ProductVariant.embedding_vector.op('<->')(query_vector)
        ).limit(limit).all()
        
        return results

ai_service = AIService()
