from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.ai_service import ai_service
from app.services.inflation_service import InflationShieldService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/ai/customer-habits/{customer_id}")
async def get_customer_habits(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mijozning xarid odatlarini AI orqali tahlil qilish"""
    try:
        summary = await ai_service.analyze_customer_habits(customer_id, db)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inflation/update-usd-rate")
async def update_usd_rate(
    new_rate: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dollar kursini yangilash va barcha narxlarni avtomatik qayta hisoblash"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID not found")
        
    updated_tenant = InflationShieldService.update_tenant_exchange_rate(
        db, current_user.tenant_id, new_rate
    )
    
    if not updated_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
from app.services.daily_strategy import DailyStrategyService
from app.services.promo_generator import PromoGeneratorService

@router.get("/ai/daily-strategy")
async def get_daily_strategy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kechagi savdo tahlili va bugungi strategiya"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    return await DailyStrategyService.generate_daily_report(db, current_user.tenant_id)

from app.services.stock_predictor import StockPredictorService

@router.get("/ai/stock-alerts")
async def get_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tugash ehtimoli bor tovarlar ro'yxati"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    # Velocity ni yangilab olamiz (ishlab chiqarishda background task bo'lishi kerak)
    StockPredictorService.calculate_velocity(db, current_user.tenant_id)
    return StockPredictorService.get_stock_alerts(db, current_user.tenant_id)

@router.post("/ai/generate-promo")
async def generate_promo(
    product_name: str,
    price: float,
    platform: str = "telegram",
    current_user: User = Depends(get_current_user)
):
    """Ijtimoiy tarmoqlar uchun reklama matni yaratish"""
    return {"post": await PromoGeneratorService.generate_social_post(product_name, price, platform)}

@router.get("/ai/semantic-search")
async def semantic_search(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ma'no bo'yicha mahsulot qidirish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    return await ai_service.search_semantic(db, current_user.tenant_id, query)

@router.post("/ai/debt-reminder/{customer_id}")
async def generate_debt_reminder(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Qarzni qaytarish bo'yicha AI tavsiya matni"""
    from app.models.customer_v2 import CustomerV2
    customer = db.query(CustomerV2).filter(CustomerV2.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
        
    prompt = f"""
    Mijoz: {customer.name}
    Qarzi: {abs(customer.balance):,.0f} so'm
    
    Ushbu mijozga qarzni qaytarishni eslatuvchi, juda muloyim, lekin professional o'zbekcha xabar yozing. 
    Telegram uchun mos bo'lsin. Link yoki emoji kiritmang. Matnni JSON formatda qaytaring: {{"message": "..."}}
    """
    from app.services.azure_openai_client import azure_openai
    result = await azure_openai.generate_json("You are a helpful assistant.", prompt)
    return result

@router.get("/ai/price-optimize/{variant_id}")
async def get_price_optimization(
    variant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mahsulot uchun optimal narx tavsiyasi"""
    from app.services.price_oracle import PriceOracleService
    return PriceOracleService.analyze_price_elasticity(db, variant_id)

@router.get("/ai/fraud-check")
async def get_fraud_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Oxirgi shubhali tranzaksiyalarni ko'rish"""
    from app.models.sale_v2 import SaleV2
    from app.services.anomaly_service import AnomalyService
    
    sales = db.query(SaleV2).filter(SaleV2.tenant_id == current_user.tenant_id).order_by(SaleV2.created_at.desc()).limit(10).all()
    
    results = []
    for s in sales:
        anomalies = AnomalyService.detect_sale_anomaly(s, None)
        if anomalies:
            results.append({
                "sale_id": s.id,
                "anomalies": anomalies,
                "created_at": s.created_at
            })
    return results

@router.get("/ai/procurement-autopilot")
async def get_procurement_autopilot(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Avtonom xarid rejasi (Singularity Logic)"""
    from app.services.procurement_engine import ProcurementEngineService
    return ProcurementEngineService.calculate_jit_restock(db, current_user.tenant_id)

@router.get("/ai/product-dna")
async def get_product_dna(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mahsulotlar DNK tahlili (Pattern Recognition)"""
    from app.services.dna_service import ProductDNAService
    return ProductDNAService.extract_winning_dna(db, current_user.tenant_id)

@router.get("/ai/cfo-boardroom")
async def get_cfo_boardroom(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Avtonom CFO strategik hisoboti (Neural Core)"""
    from app.services.cfo_agent import CFOAgentService
    return await CFOAgentService.generate_boardroom_report(db, current_user.tenant_id)

@router.post("/ai/vision-analyze")
async def vision_analyze(
    image: str, # Base64 encoded image
    context: str = "inventory",
    current_user: User = Depends(get_current_user)
):
    """Vizual tahlil (Omni-Vision Neural Core)"""
    from app.services.vision_service import VisionService
    import base64
    img_bytes = base64.b64decode(image.split(",")[-1])
    return await VisionService.process_image_to_data(img_bytes, context)

@router.post("/ai/scenario-simulate")
async def run_simulation(
    metrics: dict,
    changes: dict,
    current_user: User = Depends(get_current_user)
):
    """Biznes simulyatsiyasi (Monte-Carlo Neural Engine)"""
    from app.services.simulator_service import BusinessSimulatorService
    return await BusinessSimulatorService.simulate_scenario(metrics, changes)


