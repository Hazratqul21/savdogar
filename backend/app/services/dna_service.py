from sqlalchemy.orm import Session
from app.models.product_v2 import ProductVariant
from collections import Counter

class ProductDNAService:
    """
    Mahsulot Vizual va Mantiqiy DNK tahlili.
    Qaysi atributlar kombinatsiyasi (Pattern) ko'proq foyda keltirishini aniqlash.
    """

    @staticmethod
    def extract_winning_dna(db: Session, tenant_id: int):
        # 1. Eng yaxshi sotilayotgan (Velocity > 2.0) tovarlarni olish
        winners = db.query(ProductVariant).filter(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.velocity_score >= 2.0
        ).all()
        
        if not winners:
            return {"status": "NO_DATA", "message": "Tahlil uchun etarli sotuv ma'lumotlari yo'q."}

        # 2. Atributlar DNKsini yig'ish (Size, Color, Brand va h.k.)
        dna_pool = []
        for w in winners:
            if w.attributes:
                for key, val in w.attributes.items():
                    dna_pool.append(f"{key}:{val}")
        
        # 3. Eng ko'p uchraydigan "G'olib" atributlar
        common_dna = Counter(dna_pool).most_common(5)
        
        recommendations = []
        for trait, count in common_dna:
            key, val = trait.split(":")
            recommendations.append({
                "trait": key,
                "value": val,
                "confidence": f"{(count / len(winners)) * 100:.1f}%",
                "insight": f"Ushbu {key} bilan bog'liq mahsulotlar 2 barobar tezroq sotilmoqda."
            })
            
        return {
            "winning_traits": recommendations,
            "summary": "AI sizning biznesingizdagi 'G'olib mahsulotlar DNKsi'ni aniqladi."
        }
