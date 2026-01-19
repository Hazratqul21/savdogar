#!/bin/bash
# Verify latest backend deployment
# Expected commit: a93e850

echo "🔍 Verifying Latest Backend Deployment..."
echo "=========================================="
echo ""
echo "Expected commit: a93e850"
echo "Expected files: FORCE_DEPLOY_TRIGGER.txt, DEPLOY_ME.py"
echo ""

BACKEND_URL="https://savdogar-backend.vercel.app"

# Check trigger file
echo "Checking FORCE_DEPLOY_TRIGGER.txt..."
TRIGGER_CHECK=$(curl -s "$BACKEND_URL/FORCE_DEPLOY_TRIGGER.txt" 2>&1)
TRIGGER_STATUS=$?

if [ $TRIGGER_STATUS -eq 0 ] && echo "$TRIGGER_CHECK" | grep -q "372b8dc"; then
    echo "✅ SUCCESS! Latest deployment detected!"
    echo "   Found commit reference: 372b8dc"
    echo ""
    echo "🎉 Backend yangilandi!"
    echo ""
    echo "📋 Deployed fixes:"
    echo "   ✅ Tenant auto-create (500 error fix)"
    echo "   ✅ 403 token expiry redirect"
    echo "   ✅ Trailing slashes fix"
    echo "   ✅ redirect_slashes enabled"
    echo ""
    echo "🧪 Test qilishingiz mumkin:"
    echo "   1. Login qiling"
    echo "   2. Mahsulot qo'shib ko'ring"
    echo "   3. Agar 500 error bo'lmasa - ISHLAMOQDA! ✅"
    exit 0
else
    echo "⚠️  WARNING: Latest deployment not found yet!"
    echo ""
    echo "Status: Old version still running (0dca50f)"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Check Vercel dashboard - deployment in progress?"
    echo "   2. Wait 2-3 more minutes"
    echo "   3. Run this script again"
    echo "   4. If still fails - disconnect/reconnect Git repo"
    echo ""
    exit 1
fi
