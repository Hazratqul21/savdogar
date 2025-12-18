#!/bin/bash

# Database ulanish muammosini hal qilish skripti

echo "=== Database Ulanish Muammosini Hal Qilish ==="
echo ""

# 1. IP manzilni aniqlash
echo "1. Sizning IP manzilingiz:"
CURRENT_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null)
if [ -n "$CURRENT_IP" ]; then
    echo "   IP: $CURRENT_IP"
    echo ""
    echo "   ⚠️  Bu IP manzilni Azure Portal da PostgreSQL firewall qoidalariga qo'shishingiz kerak!"
    echo ""
else
    echo "   IP manzil aniqlanmadi"
fi

# 2. Network connectivity tekshirish
echo "2. Azure PostgreSQL serverga ulanish tekshirilmoqda..."
if timeout 5 nc -zv aifoundry-postgres-dev-postgre.postgres.database.azure.com 5432 2>&1 | grep -q "succeeded"; then
    echo "   ✅ Ulanish muvaffaqiyatli!"
else
    echo "   ❌ Ulanish muvaffaqiyatsiz (Timeout)"
    echo ""
    echo "   Yechimlar:"
    echo "   a) Azure Portal da firewall qoidalariga IP manzilingizni qo'shing"
    echo "   b) Local PostgreSQL ishlatish:"
    echo "      sudo apt-get install postgresql"
    echo "      sudo -u postgres createdb smartpos"
    echo ""
fi

# 3. Local PostgreSQL tekshirish
echo "3. Local PostgreSQL tekshirilmoqda..."
if command -v psql &> /dev/null; then
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw smartpos; then
        echo "   ✅ Local 'smartpos' database mavjud"
        echo ""
        echo "   Local database ishlatish uchun:"
        echo "   export DATABASE_URL='postgresql+pg8000://postgres:password@localhost:5432/smartpos'"
    else
        echo "   ⚠️  Local 'smartpos' database topilmadi"
    fi
else
    echo "   ⚠️  PostgreSQL o'rnatilmagan"
fi

echo ""
echo "=== Xulosa ==="
echo "Agar Azure ga ulanishda muammo bo'lsa:"
echo "1. Azure Portal: https://portal.azure.com"
echo "2. PostgreSQL server: aifoundry-postgres-dev-postgre"
echo "3. Firewall rules ga IP manzilingizni qo'shing: $CURRENT_IP"
echo ""
echo "Yoki local database ishlatish:"
echo "cd /home/ali/dokon/backend"
echo "export DATABASE_URL='postgresql+pg8000://postgres:password@localhost:5432/smartpos'"
echo "pm2 restart smartpos-backend"








