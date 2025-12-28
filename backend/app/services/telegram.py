import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional

# Telegram Bot Service
class TelegramService:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.enabled = bool(self.token and self.chat_id)
    
    async def send_message(self, text: str):
        """Send message to configured Telegram chat."""
        if not self.enabled:
            print(f"[Telegram disabled] Would send: {text}")
            return False
        
        try:
            from telegram import Bot
            bot = Bot(token=self.token)
            await bot.send_message(chat_id=self.chat_id, text=text, parse_mode="HTML")
            return True
        except Exception as e:
            print(f"Telegram error: {e}")
            return False
    
    def send_sync(self, text: str):
        """Synchronous wrapper for sending messages."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.send_message(text))
            else:
                loop.run_until_complete(self.send_message(text))
        except RuntimeError:
            asyncio.run(self.send_message(text))
    
    def notify_sale(self, sale_id: int, total: float, items_count: int, payment_method: str):
        """Send sale notification."""
        text = f"""🛒 <b>Yangi savdo #{sale_id}</b>

💰 Summa: {total:,.0f} so'm
📦 Mahsulotlar: {items_count} ta
💳 To'lov: {payment_method}
🕐 Vaqt: {datetime.now().strftime('%H:%M')}"""
        self.send_sync(text)
    
    def notify_low_stock(self, product_name: str, quantity: float, unit: str):
        """Send low stock alert."""
        text = f"""⚠️ <b>Kam qolgan mahsulot</b>

📦 {product_name}
📉 Qoldi: {quantity} {unit}

Zaxirani to'ldiring!"""
        self.send_sync(text)
    
    def send_daily_report(self, today_sales: float, today_transactions: int, 
                          low_stock_count: int, top_product: str):
        """Send daily summary report."""
        text = f"""📊 <b>Kunlik hisobot</b>
{datetime.now().strftime('%d.%m.%Y')}

💰 Bugungi savdo: {today_sales:,.0f} so'm
🛒 Tranzaksiyalar: {today_transactions} ta
⚠️ Kam qolgan: {low_stock_count} ta
🏆 Top mahsulot: {top_product}"""
        self.send_sync(text)

# Global instance
telegram_service = TelegramService()
