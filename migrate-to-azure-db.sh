#!/bin/bash

# Azure PostgreSQL Migration Script
# Bu skript local PostgreSQL dan Azure PostgreSQL ga ma'lumotlarni ko'chiradi

echo "🔄 Azure PostgreSQL Migration"
echo "=============================="
echo ""

# Sozlamalar
LOCAL_DB="postgresql://postgres:postgres@localhost:5433/smartpos"
AZURE_DB="postgresql+pg8000://smartpos_admin:YOUR_PASSWORD@smartpos-db.postgres.database.azure.com:5432/smartpos"

echo "⚠️  DIQQAT: Bu skript local ma'lumotlarni Azure ga ko'chiradi"
echo ""
read -p "Davom etasizmi? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Bekor qilindi"
    exit 1
fi

echo ""
echo "📦 1. Local database dan backup olish..."
pg_dump "$LOCAL_DB" > /tmp/smartpos_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup muvaffaqiyatli"
else
    echo "❌ Backup xatolik"
    exit 1
fi

echo ""
echo "📤 2. Azure PostgreSQL ga yuklash..."
echo "   AZURE_DB connection string ni kiriting:"
read -p "   Connection string: " azure_conn

psql "$azure_conn" < /tmp/smartpos_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Ma'lumotlar muvaffaqiyatli ko'chirildi"
else
    echo "❌ Yuklashda xatolik"
    exit 1
fi

echo ""
echo "🧹 3. Backup faylni tozalash..."
rm /tmp/smartpos_backup.sql

echo ""
echo "✅ Migration tugadi!"
echo ""
echo "📝 Keyingi qadamlar:"
echo "   1. .env faylda DATABASE_URL ni yangilang"
echo "   2. Backend serverni qayta ishga tushiring"
echo "   3. Login qilib tekshiring"
echo ""
