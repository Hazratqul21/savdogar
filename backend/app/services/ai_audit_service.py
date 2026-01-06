"""
AI Audit & Automation Service
✅ Active AI Audit Platform - CFO-style analysis and anomaly detection
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case
from app.services.azure_openai_client import azure_openai
from app.models.audit_log import AuditLog, AuditSeverity, AuditCategory
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.product_v2 import ProductV2, ProductVariant
from app.models.user import User
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)

class AIAuditService:
    """
    CFO-style AI Audit Service
    Acts as a Chief Financial Officer, not a chatty bot
    """
    
    def __init__(self):
        self.cfo_system_prompt = """You are a Chief Financial Officer (CFO) for a retail business.
Your role is to analyze financial and operational data with precision and professionalism.

Guidelines:
- Be systematic and data-driven
- Focus on anomalies, risks, and opportunities
- Provide clear, actionable insights
- Use professional business language
- Quantify findings with specific numbers
- Prioritize by financial impact

Output format: Always return structured JSON with:
{
    "findings": [
        {
            "severity": "low|medium|critical",
            "category": "discount_anomaly|inventory_mismatch|transaction_anomaly|etc",
            "title": "Brief title",
            "description": "Detailed description with numbers",
            "confidence": 0.0-1.0,
            "reasoning": "Why this is flagged",
            "context": {}
        }
    ],
    "summary": "Overall assessment"
}"""

    async def analyze_data(self, context: str, query: str) -> Dict[str, Any]:
        """
        Core AI reasoning method - allows AI to analyze database records
        
        Args:
            context: Contextual data (JSON string of records)
            query: Specific question or analysis request
            
        Returns:
            AI analysis result
        """
        user_prompt = f"""Context Data:
{context}

Analysis Request:
{query}

Provide a systematic analysis following CFO guidelines."""

        try:
            result = await azure_openai.generate_json(
                system_prompt=self.cfo_system_prompt,
                user_prompt=user_prompt
            )
            return result
        except Exception as e:
            logger.error(f"Error in analyze_data: {e}")
            raise

    async def daily_audit_scan(
        self,
        db: Session,
        tenant_id: int,
        scan_date: Optional[date] = None
    ) -> List[AuditLog]:
        """
        Feature A: The "Invisible Auditor" - Background job
        Scans the day's transactions and inventory logs for anomalies
        
        Anomalies detected:
        - Suspicious discount patterns (e.g., "Cashier A gave 50% discount 10 times in 1 hour")
        - Inventory mismatches (e.g., "Sold 20 items, but stock was only 5")
        - Transaction anomalies
        - Cashier behavior patterns
        """
        if scan_date is None:
            scan_date = date.today()
        
        logger.info(f"Starting daily audit scan for tenant {tenant_id} on {scan_date}")
        
        # Collect transaction data
        start_datetime = datetime.combine(scan_date, datetime.min.time())
        end_datetime = datetime.combine(scan_date, datetime.max.time())
        
        # Get all sales for the day
        sales = db.query(SaleV2).filter(
            and_(
                SaleV2.tenant_id == tenant_id,
                SaleV2.created_at >= start_datetime,
                SaleV2.created_at <= end_datetime,
                SaleV2.status == "completed"
            )
        ).all()
        
        # Get sale items with discounts
        sale_items = db.query(SaleItemV2).join(SaleV2).filter(
            and_(
                SaleV2.tenant_id == tenant_id,
                SaleV2.created_at >= start_datetime,
                SaleV2.created_at <= end_datetime,
                SaleItemV2.discount_percent > 0
            )
        ).all()
        
        # Build context for AI analysis
        context_data = {
            "scan_date": scan_date.isoformat(),
            "total_sales": len(sales),
            "total_revenue": sum(s.total_amount for s in sales),
            "sales_with_discounts": len(sale_items),
            "cashiers": {}
        }
        
        # Analyze cashier discount patterns
        cashier_discounts = {}
        for item in sale_items:
            sale = db.query(SaleV2).filter(SaleV2.id == item.sale_id).first()
            if sale and sale.cashier_id:
                cashier_id = sale.cashier_id
                if cashier_id not in cashier_discounts:
                    cashier_discounts[cashier_id] = {
                        "count": 0,
                        "total_discount": 0.0,
                        "max_discount": 0.0,
                        "items": []
                    }
                cashier_discounts[cashier_id]["count"] += 1
                cashier_discounts[cashier_id]["total_discount"] += item.discount_amount
                cashier_discounts[cashier_id]["max_discount"] = max(
                    cashier_discounts[cashier_id]["max_discount"],
                    item.discount_percent
                )
                cashier_discounts[cashier_id]["items"].append({
                    "discount_percent": item.discount_percent,
                    "amount": item.discount_amount,
                    "time": sale.created_at.isoformat()
                })
        
        # Get cashier names
        for cashier_id, data in cashier_discounts.items():
            cashier = db.query(User).filter(User.id == cashier_id).first()
            cashier_name = cashier.full_name if cashier else f"User {cashier_id}"
            context_data["cashiers"][cashier_name] = data
        
        # Check inventory mismatches (negative stock)
        negative_stock_variants = db.query(ProductVariant).filter(
            and_(
                ProductVariant.tenant_id == tenant_id,
                ProductVariant.stock_quantity < 0
            )
        ).all()
        
        context_data["negative_stock_items"] = [
            {
                "variant_id": v.id,
                "sku": v.sku,
                "product_name": v.product_v2.name if v.product_v2 else "Unknown",
                "current_stock": v.stock_quantity,
                "sold_today": 0  # Will calculate
            }
            for v in negative_stock_variants
        ]
        
        # Calculate items sold today for negative stock items
        for neg_item in context_data["negative_stock_items"]:
            variant_id = neg_item["variant_id"]
            sold_count = db.query(func.sum(SaleItemV2.quantity)).join(SaleV2).filter(
                and_(
                    SaleItemV2.variant_id == variant_id,
                    SaleV2.created_at >= start_datetime,
                    SaleV2.created_at <= end_datetime
                )
            ).scalar() or 0
            neg_item["sold_today"] = float(sold_count)
        
        # Prepare AI analysis prompt
        analysis_query = f"""Analyze the following daily transaction and inventory data for anomalies.

Key Areas to Check:
1. Discount Anomalies: Are there cashiers giving excessive discounts? (e.g., 50% discount 10+ times in 1 hour)
2. Inventory Mismatches: Are there items sold but stock was negative or insufficient?
3. Transaction Patterns: Any unusual transaction volumes or amounts?
4. Cashier Behavior: Any suspicious patterns in cashier activity?

Data:
{json.dumps(context_data, indent=2, default=str)}

Identify all anomalies and rate their severity."""

        try:
            # Get AI analysis
            ai_result = await self.analyze_data(
                context=json.dumps(context_data, indent=2, default=str),
                query=analysis_query
            )
            
            # Create audit logs from AI findings
            audit_logs = []
            findings = ai_result.get("findings", [])
            
            for finding in findings:
                # Map AI category to our enum
                category_str = finding.get("category", "other")
                try:
                    category = AuditCategory(category_str)
                except ValueError:
                    category = AuditCategory.OTHER
                
                # Map severity
                severity_str = finding.get("severity", "low")
                try:
                    severity = AuditSeverity(severity_str)
                except ValueError:
                    severity = AuditSeverity.LOW
                
                # Extract related IDs from context if available
                context_finding = finding.get("context", {})
                related_sale_id = context_finding.get("sale_id")
                related_variant_id = context_finding.get("variant_id")
                related_user_id = context_finding.get("cashier_id")
                
                audit_log = AuditLog(
                    tenant_id=tenant_id,
                    category=category,
                    severity=severity,
                    title=finding.get("title", "Anomaly Detected"),
                    description=finding.get("description", ""),
                    context_data=context_finding,
                    related_sale_id=related_sale_id,
                    related_variant_id=related_variant_id,
                    related_user_id=related_user_id,
                    ai_confidence=finding.get("confidence", 0.5),
                    ai_reasoning=finding.get("reasoning", ""),
                    is_resolved=False
                )
                
                db.add(audit_log)
                audit_logs.append(audit_log)
            
            db.commit()
            
            # Refresh all logs
            for log in audit_logs:
                db.refresh(log)
            
            logger.info(f"Daily audit scan completed: {len(audit_logs)} findings created")
            
            return audit_logs
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error in daily_audit_scan: {e}")
            raise

    async def suggest_stock_correction(
        self,
        db: Session,
        tenant_id: int,
        variant_id: int
    ) -> Dict[str, Any]:
        """
        Feature B: Smart Inventory - Solving the Cold Start Problem
        
        If stock is negative (e.g., -15), analyze sales history to suggest correction.
        
        Logic:
        1. Look at sales history for this variant
        2. Calculate average daily sales
        3. Suggest: "Based on sales velocity, you likely started with X units.
           Shall I create an Inbound Document for X units to fix the negative balance?"
        """
        variant = db.query(ProductVariant).filter(
            and_(
                ProductVariant.id == variant_id,
                ProductVariant.tenant_id == tenant_id
            )
        ).first()
        
        if not variant:
            raise ValueError(f"Variant {variant_id} not found")
        
        current_stock = variant.stock_quantity
        
        # Get sales history (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        sales_history = db.query(
            func.date(SaleV2.created_at).label("sale_date"),
            func.sum(SaleItemV2.quantity).label("total_quantity")
        ).join(SaleItemV2).filter(
            and_(
                SaleItemV2.variant_id == variant_id,
                SaleV2.tenant_id == tenant_id,
                SaleV2.created_at >= thirty_days_ago,
                SaleV2.status == "completed"
            )
        ).group_by(func.date(SaleV2.created_at)).order_by(func.date(SaleV2.created_at).desc()).all()
        
        # Calculate metrics
        total_sold = sum(float(row.total_quantity) for row in sales_history)
        days_with_sales = len(sales_history)
        avg_daily_sales = total_sold / max(days_with_sales, 1)
        
        # If negative stock, estimate starting stock
        if current_stock < 0:
            # Estimate: current_stock + (avg_daily_sales * days_with_sales)
            estimated_starting_stock = abs(current_stock) + (avg_daily_sales * days_with_sales)
            suggested_correction = int(estimated_starting_stock) + 10  # Add buffer
        else:
            # Even if not negative, suggest based on sales velocity
            suggested_correction = int(avg_daily_sales * 7)  # 7 days worth
        
        # Build context for AI
        context = {
            "variant_id": variant_id,
            "sku": variant.sku,
            "product_name": variant.product_v2.name if variant.product_v2 else "Unknown",
            "current_stock": current_stock,
            "total_sold_30d": total_sold,
            "days_with_sales": days_with_sales,
            "avg_daily_sales": avg_daily_sales,
            "suggested_correction": suggested_correction
        }
        
        # Get AI reasoning
        query = f"""Analyze inventory correction for this product:

Current Stock: {current_stock}
Average Daily Sales (30 days): {avg_daily_sales:.2f}
Total Sold (30 days): {total_sold:.2f}
Days with Sales: {days_with_sales}

Suggested Correction: {suggested_correction} units

Provide:
1. Confidence in the suggestion (0-1)
2. Reasoning for the suggested quantity
3. Any warnings or considerations"""
        
        try:
            ai_analysis = await self.analyze_data(
                context=json.dumps(context, indent=2),
                query=query
            )
            
            result = {
                "variant_id": variant_id,
                "current_stock": current_stock,
                "suggested_correction": suggested_correction,
                "analysis": {
                    "total_sold_30d": total_sold,
                    "avg_daily_sales": avg_daily_sales,
                    "days_with_sales": days_with_sales,
                    "confidence": ai_analysis.get("confidence", 0.7),
                    "reasoning": ai_analysis.get("reasoning", ""),
                    "warnings": ai_analysis.get("warnings", [])
                },
                "draft_document": {
                    "type": "inbound",
                    "variant_id": variant_id,
                    "quantity": suggested_correction,
                    "reason": f"Stock correction: Current {current_stock}, Suggested {suggested_correction}"
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in suggest_stock_correction: {e}")
            # Return basic suggestion even if AI fails
            return {
                "variant_id": variant_id,
                "current_stock": current_stock,
                "suggested_correction": suggested_correction,
                "analysis": {
                    "total_sold_30d": total_sold,
                    "avg_daily_sales": avg_daily_sales,
                    "days_with_sales": days_with_sales,
                    "confidence": 0.6,
                    "reasoning": f"Based on average daily sales of {avg_daily_sales:.2f} units over {days_with_sales} days",
                    "warnings": []
                },
                "draft_document": {
                    "type": "inbound",
                    "variant_id": variant_id,
                    "quantity": suggested_correction,
                    "reason": f"Stock correction: Current {current_stock}, Suggested {suggested_correction}"
                }
            }

# Global instance
ai_audit_service = AIAuditService()





