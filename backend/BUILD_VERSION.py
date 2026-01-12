# Build Version Marker - Vercel Deployment Trigger
# DO NOT DELETE - Used for deployment verification

BUILD_TIMESTAMP = "2026-01-12T06:15:00Z"
BUILD_VERSION = "3.0.0"
COMMIT_HASH = "4b7ba17"
DEPLOY_REASON = "Tenant auto-create fix for products_v2"

# Critical changes in this build:
# - 67e77a8: Auto-create tenant for products_v2 FK constraint
# - 6ca76fc: Auto-redirect to login on 403 token expired
# - 1b07e83: Trailing slashes fix
# - 81d4857: redirect_slashes enabled
# - b1ba7cc: Vercel handler routing fix

def get_build_info():
    return {
        "timestamp": BUILD_TIMESTAMP,
        "version": BUILD_VERSION,
        "commit": COMMIT_HASH,
        "reason": DEPLOY_REASON
    }
