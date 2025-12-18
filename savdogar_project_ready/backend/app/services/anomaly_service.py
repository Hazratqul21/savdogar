from datetime import datetime
from app.models.sale_v2 import SaleV2
from app.schemas.sale_v2 import CartCalculationResult

class AnomalyService:
    """
    Shubhali amallarni aniqlash servisi (Deep Security Logic).
    """

    @staticmethod
    def detect_sale_anomaly(sale: SaleV2, cart_result: CartCalculationResult):
        anomalies = []
        
        # 1. G'ayritabiiy katta chegirma (30% dan ko'p)
        total_discount_pct = (sale.discount_amount / (sale.total_amount + sale.discount_amount)) * 100 if (sale.total_amount + sale.discount_amount) > 0 else 0
        if total_discount_pct > 30:
            anomalies.append({
                "type": "HIGH_DISCOUNT",
                "severity": "CRITICAL",
                "message": f"G'ayritabiiy katta chegirma: {total_discount_pct:.1f}%"
            })

        # 2. Ish vaqtidan tashqari savdo (masalan tungi 00:00 dan 06:00 gacha)
        hour = datetime.utcnow().hour + 5 # UTC+5 (Uzbekistan)
        if 0 <= hour <= 6:
            anomalies.append({
                "type": "OUT_OF_HOURS",
                "severity": "WARNING",
                "message": f"Tungi savdo aniqlandi: soat {hour:02d}:00"
            })

        # 3. Kichik tranzaksiya lekin katta check (Audit mantiqi)
        # Kelajakda AI pattern matching bilan kengaytiriladi.

        return anomalies
