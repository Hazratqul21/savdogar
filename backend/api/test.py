"""
Minimal test handler to verify Vercel Python detection
"""
def handler(event, context=None):
    """Minimal test handler"""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": '{"message": "Vercel Python is working!", "status": "ok"}'
    }
