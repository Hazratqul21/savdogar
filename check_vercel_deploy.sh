#!/bin/bash
# Vercel backend deployment checker
# 2026-01-12

echo "🔍 Checking Vercel Backend Deployment Status..."
echo "================================================"
echo ""

BACKEND_URL="https://savdogar-backend.vercel.app"
EXPECTED_COMMIT="a93e850"

echo "📍 Backend URL: $BACKEND_URL"
echo "✅ Expected Commit: $EXPECTED_COMMIT"
echo ""

# Check health endpoint
echo "1️⃣ Checking health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Health: OK ($HEALTH_STATUS)"
else
    echo "   ❌ Health: FAILED ($HEALTH_STATUS)"
fi
echo ""

# Check products endpoint (OPTIONS for CORS)
echo "2️⃣ Checking products endpoint (OPTIONS)..."
PRODUCTS_OPTIONS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/api/v1/v2/products/" || echo "000")
if [ "$PRODUCTS_OPTIONS" = "200" ]; then
    echo "   ✅ Products OPTIONS: OK ($PRODUCTS_OPTIONS)"
else
    echo "   ❌ Products OPTIONS: FAILED ($PRODUCTS_OPTIONS)"
fi
echo ""

# Check if trigger file exists (indicates new deployment)
echo "3️⃣ Checking for deployment trigger file..."
TRIGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/FORCE_DEPLOY_TRIGGER.txt" || echo "000")
if [ "$TRIGGER_STATUS" = "200" ]; then
    echo "   ✅ Trigger file: FOUND ($TRIGGER_STATUS)"
    echo "   🎉 NEW DEPLOYMENT DETECTED!"
elif [ "$TRIGGER_STATUS" = "404" ]; then
    echo "   ⚠️  Trigger file: NOT FOUND (404)"
    echo "   ⏳ Deployment might not be complete yet..."
else
    echo "   ❌ Trigger file: ERROR ($TRIGGER_STATUS)"
fi
echo ""

# Check Python file
echo "4️⃣ Checking DEPLOY_ME.py marker..."
DEPLOY_PY=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/DEPLOY_ME.py" || echo "000")
if [ "$DEPLOY_PY" = "200" ] || [ "$DEPLOY_PY" = "404" ]; then
    echo "   ℹ️  DEPLOY_ME.py: $DEPLOY_PY (might not be publicly accessible)"
else
    echo "   ⚠️  DEPLOY_ME.py: $DEPLOY_PY"
fi
echo ""

echo "================================================"
echo "📊 SUMMARY"
echo "================================================"
if [ "$HEALTH_STATUS" = "200" ] && [ "$PRODUCTS_OPTIONS" = "200" ]; then
    if [ "$TRIGGER_STATUS" = "200" ]; then
        echo "✅ Backend is LIVE and UPDATED!"
        echo "✅ Latest commit deployed successfully!"
        echo ""
        echo "🎯 Next steps:"
        echo "   1. Test mahsulot qo'shish"
        echo "   2. Verify tenant auto-create works"
        echo "   3. Check 403 auto-redirect"
    else
        echo "⚠️  Backend is LIVE but OLD VERSION!"
        echo "⏳ New deployment not detected yet."
        echo ""
        echo "🔧 Action required:"
        echo "   1. Wait 2-3 minutes for deployment"
        echo "   2. Run this script again"
        echo "   3. Or manually redeploy from Vercel dashboard"
    fi
else
    echo "❌ Backend has ISSUES!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check Vercel dashboard logs"
    echo "   2. Verify build succeeded"
    echo "   3. Check function errors"
fi
echo ""
echo "🌐 Vercel Dashboard:"
echo "   https://vercel.com/your-team/savdogar-backend/deployments"
echo ""
