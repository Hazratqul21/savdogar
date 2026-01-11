#!/bin/bash
# Deployment status checker script

echo "================================================"
echo "🚀 VERCEL DEPLOYMENT STATUS CHECKER"
echo "================================================"
echo ""

BACKEND_URL="https://savdogar-backend.vercel.app"
echo "📡 Testing backend: $BACKEND_URL"
echo ""

# 1. Health check
echo "1️⃣  Health check..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Backend is healthy (200 OK)"
    curl -s "$BACKEND_URL/health" | python3 -m json.tool 2>/dev/null | grep -E "status|version|database" | head -5
else
    echo "   ❌ Backend is not healthy (HTTP $HEALTH_STATUS)"
fi
echo ""

# 2. OPTIONS request (CORS preflight)
echo "2️⃣  Testing OPTIONS request (CORS)..."
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$BACKEND_URL/api/v1/v2/products")
if [ "$OPTIONS_STATUS" = "200" ]; then
    echo "   ✅ OPTIONS request successful (200 OK)"
else
    echo "   ❌ OPTIONS request failed (HTTP $OPTIONS_STATUS)"
fi
echo ""

# 3. POST request (without auth - should return 401 or 422, NOT 405)
echo "3️⃣  Testing POST request..."
POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/v2/products" \
    -H "Content-Type: application/json" \
    -d '{"test":true}')

if [ "$POST_STATUS" = "405" ]; then
    echo "   ❌ POST request failed with 405 Method Not Allowed"
    echo "   ⚠️  DEPLOYMENT NOT READY YET - Wait 2-3 more minutes"
elif [ "$POST_STATUS" = "401" ] || [ "$POST_STATUS" = "422" ]; then
    echo "   ✅ POST request working (HTTP $POST_STATUS - auth/validation error is expected)"
    echo "   🎉 DEPLOYMENT SUCCESSFUL!"
elif [ "$POST_STATUS" = "200" ] || [ "$POST_STATUS" = "201" ]; then
    echo "   ✅ POST request successful (HTTP $POST_STATUS)"
    echo "   🎉 DEPLOYMENT SUCCESSFUL!"
else
    echo "   ⚠️  POST request returned HTTP $POST_STATUS"
    echo "   ℹ️  Check logs for details"
fi
echo ""

# 4. Summary
echo "================================================"
echo "📊 SUMMARY"
echo "================================================"
if [ "$POST_STATUS" != "405" ] && [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Backend is READY and working properly!"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Open https://savdogar.vercel.app"
    echo "2. Dashboard → Mahsulotlar → Yangi"
    echo "3. Try adding a product"
    echo ""
    echo "Expected: Product should be added successfully ✓"
elif [ "$POST_STATUS" = "405" ]; then
    echo "⏳ Deployment in progress... (POST still returns 405)"
    echo ""
    echo "Please wait 2-3 more minutes and run this script again:"
    echo "   bash check_deployment.sh"
else
    echo "⚠️  Status unclear - check Vercel dashboard"
    echo "   Health: HTTP $HEALTH_STATUS"
    echo "   POST:   HTTP $POST_STATUS"
fi
echo "================================================"
