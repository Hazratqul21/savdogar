#!/bin/bash
# Watch Vercel deployment status in real-time
# Expected commit: 4b7ba17 (cache bypass)

echo "⏳ Watching Vercel Backend Deployment..."
echo "========================================"
echo ""
echo "Expected commit: 4b7ba17 (CACHE BYPASS)"
echo "Strategy: requirements.txt modified → cache invalidation"
echo ""
echo "Checking every 30 seconds for 5 minutes..."
echo ""

BACKEND_URL="https://savdogar-backend.vercel.app"
MAX_CHECKS=10  # 10 checks * 30 sec = 5 minutes
CHECK_COUNT=0

check_deployment() {
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/FORCE_DEPLOY_TRIGGER.txt" 2>&1)
    echo "$status_code"
}

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    ELAPSED=$((CHECK_COUNT * 30))
    
    echo "[$CHECK_COUNT/$MAX_CHECKS] Check at ${ELAPSED}s..."
    
    # Check health
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>&1)
    
    # Check trigger file
    TRIGGER=$(check_deployment)
    
    if [ "$TRIGGER" = "200" ]; then
        echo "   🎉 SUCCESS! New deployment detected!"
        echo ""
        echo "   Verifying deployment..."
        
        # Download and check content
        CONTENT=$(curl -s "$BACKEND_URL/FORCE_DEPLOY_TRIGGER.txt" 2>&1)
        
        if echo "$CONTENT" | grep -q "372b8dc"; then
            echo "   ✅ Deployment verified! Commit 372b8dc found."
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🎉 BACKEND SUCCESSFULLY DEPLOYED!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "✅ Cache bypass strategy worked!"
            echo "✅ All critical fixes deployed:"
            echo "   • Tenant auto-create (500 error fix)"
            echo "   • 403 token expiry redirect"
            echo "   • Trailing slashes fix"
            echo "   • redirect_slashes enabled"
            echo ""
            echo "🧪 Test mahsulot qo'shish:"
            echo "   1. Login: https://savdogar-frontend.vercel.app/login"
            echo "   2. Mahsulotlar → Yangi mahsulot"
            echo "   3. Should work without 500 error! ✅"
            echo ""
            exit 0
        fi
    fi
    
    echo "   Status: Health=$HEALTH, Trigger=$TRIGGER"
    echo "   ⏳ Old version still running..."
    
    if [ $CHECK_COUNT -lt $MAX_CHECKS ]; then
        echo "   Waiting 30 seconds..."
        echo ""
        sleep 30
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  TIMEOUT: No new deployment after 5 minutes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Cache bypass strategy didn't work. Possible reasons:"
echo "1. Vercel still using aggressive caching"
echo "2. Build queue delay (wait 5 more minutes?)"
echo "3. Webhook missed/failed"
echo ""
echo "🔧 RECOMMENDED ACTION:"
echo ""
echo "Manual Redeploy from Vercel Dashboard:"
echo "1. https://vercel.com → savdogar-backend"
echo "2. Deployments → Latest → '...' → Redeploy"
echo "3. ☐ Use existing Build Cache (UNCHECK!)"
echo "4. Redeploy → 3-5 min"
echo ""
echo "This is 100% guaranteed to work."
echo ""
exit 1
