# Database Ulanish Muammosini Hal Qilish

## Muammo
Azure PostgreSQL serverga ulanish timeout bo'lyapti. Bu quyidagi sabablarga bog'liq bo'lishi mumkin:

1. **Azure Firewall Qoidalari** - Sizning IP manzilingiz ruxsat berilmagan
2. **Network Connectivity** - Internet yoki firewall muammosi
3. **Azure Server Status** - Server o'chirilgan yoki mavjud emas

## Tekshirish Usullari

### 1. IP Manzilingizni Bilish
```bash
curl ifconfig.me
# yoki
curl ipinfo.io/ip
```

### 2. Azure Portal da Firewall Qoidalarini Tekshirish
1. Azure Portal ga kiring: https://portal.azure.com
2. PostgreSQL serveringizni toping: `aifoundry-postgres-dev-postgre`
3. "Connection security" yoki "Networking" bo'limiga kiring
4. "Firewall rules" ga kiring
5. Sizning IP manzilingizni qo'shing yoki "Allow access to Azure services" ni yoqing

### 3. Local Database Ishlatish (Tez Yechim)

Agar Azure ga ulanishda muammo bo'lsa, local PostgreSQL yoki SQLite ishlatishingiz mumkin.

#### Local PostgreSQL O'rnatish:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb smartpos
sudo -u postgres createuser -P engineer
# Parol so'ralganda: Xazrat_ali571
```

#### Environment Variable O'zgartirish:
```bash
export DATABASE_URL="postgresql+pg8000://engineer:Xazrat_ali571@localhost:5432/smartpos"
```

## Hozirgi Holat
- Azure PostgreSQL: **Ulanish timeout** (Firewall muammosi)
- Backend: **Ishlayapti** (lekin database ga ulanib bo'lmayapti)
- Frontend: **Ishlayapti**

## Tavsiya
1. Avval IP manzilingizni biling: `curl ifconfig.me`
2. Azure Portal da firewall qoidalariga IP manzilingizni qo'shing
3. Yoki local database ishlatishga o'ting








