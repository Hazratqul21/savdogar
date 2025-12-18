# Azure PostgreSQL Firewall Qoidasini Qo'shish

## Sizning IP manzilingiz: **37.110.210.174**

## Qadamlar:

1. **Azure Portal ga kiring:**
   - https://portal.azure.com
   - Login qiling

2. **PostgreSQL serverni toping:**
   - Qidiruv bo'limida: `aifoundry-postgres-dev-postgre` yozing
   - Yoki: All resources → PostgreSQL servers → `aifoundry-postgres-dev-postgre`

3. **Firewall qoidalariga kiring:**
   - Left menu dan: **"Networking"** yoki **"Connection security"** ni tanlang
   - **"Firewall rules"** bo'limiga kiring

4. **Yangi qoida qo'shing:**
   - **"Add client IP"** tugmasini bosing
   - Yoki qo'lda:
     - Rule name: `MyIP` yoki `HomeIP`
     - Start IP: `37.110.210.174`
     - End IP: `37.110.210.174`
   - **"Save"** tugmasini bosing

5. **Tekshirish:**
   - Bir necha soniyadan keyin backend ni qayta ishga tushiring:
   ```bash
   pm2 restart smartpos-backend
   ```

## Alternative: Barcha IP lardan ruxsat berish (Xavfsizlik uchun tavsiya etilmaydi)

Agar tez yechim kerak bo'lsa:
- Start IP: `0.0.0.0`
- End IP: `255.255.255.255`
- ⚠️ Bu barcha IP lardan ruxsat beradi - faqat test uchun!








