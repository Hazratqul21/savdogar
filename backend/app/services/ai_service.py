from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from app.services.openai_client import openai_client
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.product_v2 import ProductVariant, ProductV2
from app.models.audit_log import AuditLog, AuditSeverity, AuditCategory
from rapidfuzz import process, fuzz
import json
import logging
from typing import Union, List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy import select

logger = logging.getLogger(__name__)

class AIService:
    """
    Enhanced AI Service with CFO-style analysis
    """
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test OpenAI connection with a simple prompt.
        
        Returns:
            dict with 'success' (bool) and 'response' (str) or 'error' (str)
        """
        try:
            system_prompt = "You are a helpful assistant. Respond briefly and concisely. Return your response as JSON with a 'description' field."
            user_prompt = "Describe a plumbing business in 5 words."
            
            response = await openai_client.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )
            
            # Extract response text - try different possible keys
            response_text = (
                response.get("description") or 
                response.get("response") or 
                response.get("answer") or
                str(response)
            )
            
            return {
                "success": True,
                "response": response_text
            }
        except Exception as e:
            logger.error(f"AI connection test failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def analyze_data(self, context: str, query: str) -> Dict[str, Any]:
        """
        Core AI reasoning method - allows AI to analyze database records
        
        Args:
            context: Contextual data (JSON string of records)
            query: Specific question or analysis request
            
        Returns:
            AI analysis result
        """
        from app.services.openai_client import openai_client
        
        cfo_system_prompt = """You are a Chief Financial Officer (CFO) for a retail business.
Your role is to analyze financial and operational data with precision and professionalism.

Guidelines:
- Be systematic and data-driven
- Focus on anomalies, risks, and opportunities
- Provide clear, actionable insights
- Use professional business language
- Quantify findings with specific numbers
- Prioritize by financial impact

Output format: Always return structured JSON."""
        
        user_prompt = f"""Context Data:
{context}

Analysis Request:
{query}

Provide a systematic analysis following CFO guidelines."""

        try:
            result = await openai_client.generate_json(
                system_prompt=cfo_system_prompt,
                user_prompt=user_prompt
            )
            return result
        except Exception as e:
            logger.error(f"Error in analyze_data: {e}")
            raise
    
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
            if is_image and image_url:
                result = await openai_client.analyze_image(system_prompt, image_url)
            else:
                user_prompt = f"Faktura matni:\n{invoice_content}"
                result = await openai_client.generate_json(system_prompt, user_prompt)
            
            items_data = result.get("items", [])
            supplier_name = result.get("supplier_name", "Noma'lum yetkazib beruvchi")
            total_amount = result.get("total_amount", 0.0)
            
            # Create invoice
            invoice = Invoice(
                supplier_name=supplier_name,
                total_amount=total_amount,
                status=InvoiceStatus.PENDING,
                organization_id=organization_id
            )
            db.add(invoice)
            db.commit()
            db.refresh(invoice)
            
            created_products = []
            matched_items = []
            
            for item_data in items_data:
                product_name = item_data.get("product_name", "").strip()
                if not product_name:
                    continue
                
                quantity = float(item_data.get("quantity", 1.0))
                unit_cost = float(item_data.get("unit_cost", 0.0))
                
                # Fuzzy match with existing products
                existing_products = db.query(Product).filter(
                    Product.organization_id == organization_id
                ).all()
                
                if existing_products:
                    product_names = [p.name for p in existing_products]
                    match = process.extractOne(product_name, product_names, scorer=fuzz.WRatio)
                    
                    if match and match[1] >= 85:  # 85% similarity threshold
                        matched_product = next(p for p in existing_products if p.name == match[0])
                        product = matched_product
                    else:
                        product = None
                else:
                    product = None
                
                if not product:
                    # Create new product
                    product = Product(
                        name=product_name,
                        cost_price=unit_cost,
                        price=unit_cost * 1.25,  # 25% markup
                        stock_quantity=0.0,
                        organization_id=organization_id
                    )
                    db.add(product)
                    db.commit()
                    db.refresh(product)
                    created_products.append(product)
                
                # Create invoice item
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_name_raw=product_name,
                    quantity=quantity,
                    price=unit_cost,
                    product_id=product.id
                )
                db.add(invoice_item)
                
                # Update stock
                product.stock_quantity += quantity
                matched_items.append({
                    "product_name": product.name,
                    "quantity": quantity,
                    "matched": product.id in [p.id for p in existing_products] if existing_products else False
                })
            
            db.commit()
            db.refresh(invoice)
            
            # Log audit
            audit = AuditLog(
                category=AuditCategory.INVENTORY,
                severity=AuditSeverity.INFO,
                message=f"Invoice parsed and stock updated: {len(matched_items)} items",
                metadata={
                    "invoice_id": invoice.id,
                    "supplier": supplier_name,
                    "items_count": len(matched_items),
                    "created_products": len(created_products)
                },
                organization_id=organization_id
            )
            db.add(audit)
            db.commit()
            
            return invoice
            
        except Exception as e:
            logger.error(f"Error parsing invoice: {e}", exc_info=True)
            raise
    
    async def analyze_customer_habits(self, customer_id: int, db: Session) -> str:
        """
        Feature B: Customer Behavior Analysis
        Analyzes customer purchase patterns and provides insights.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise ValueError(f"Customer {customer_id} not found")
        
        # Get customer transactions
        transactions = db.query(Sale).filter(Sale.customer_id == customer_id).all()
        
        if not transactions:
            return "Bu mijoz hali xarid qilmagan."
        
        # Analyze transaction data
        total_spent = sum(t.total_amount for t in transactions)
        avg_transaction = total_spent / len(transactions)
        transaction_count = len(transactions)
        
        # Get top products
        sale_items = db.query(SaleItem).join(Sale).filter(Sale.customer_id == customer_id).all()
        product_counts = {}
        for item in sale_items:
            product_name = item.product.name if item.product else "Noma'lum"
            product_counts[product_name] = product_counts.get(product_name, 0) + item.quantity
        
        top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        context = {
            "customer_name": customer.name,
            "total_spent": total_spent,
            "transaction_count": transaction_count,
            "avg_transaction": avg_transaction,
            "top_products": [{"name": name, "quantity": qty} for name, qty in top_products]
        }
        
        system_prompt = """You are a customer insights analyst. Analyze customer purchase data and provide insights in Uzbek language."""
        user_prompt = f"""Mijoz ma'lumotlari:
{json.dumps(context, indent=2)}

Ushbu mijozning xarid qilish odatlarini tahlil qiling va qisqa tavsiyalar bering."""
        
        try:
            result = await openai_client.generate_json(system_prompt, user_prompt)
            return result.get("analysis", result.get("summary", str(result)))
        except Exception as e:
            logger.error(f"Error analyzing customer habits: {e}")
            return f"Tahlil xatosi: {str(e)}"
    
    async def semantic_search_products(self, query: str, db: Session, tenant_id: int, limit: int = 10) -> List[ProductVariant]:
        """
        Feature C: Semantic Product Search using embeddings
        """
        # This would require embeddings to be pre-computed
        # For now, return empty list as placeholder
        # In production, you'd use pgvector for similarity search
        return []
    
    def _compute_product_embedding(self, product: ProductVariant) -> List[float]:
        """
        Compute embedding vector for a product (placeholder).
        In production, use OpenAI embeddings API.
        """
        # Placeholder - return empty list
        return []

ai_service = AIService()
