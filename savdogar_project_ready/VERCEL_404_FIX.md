# Vercel 404 NOT_FOUND Error - Comprehensive Fix Guide

## 🔍 1. Root Cause Analysis

### What Was Happening:
- Vercel was receiving requests to `/api/*` endpoints
- The `vercel.json` had `rewrites` pointing to `/api/index.py`
- But Vercel wasn't building or routing to the Python serverless function correctly

### Why It Failed:
1. **Wrong routing method**: Using `rewrites` instead of `routes` for serverless functions
2. **Missing explicit build**: While Vercel auto-detects `api/` folder, explicit configuration helps
3. **Path resolution**: The destination path might not resolve correctly in serverless context

### The Misconception:
- **Assumption**: `rewrites` work the same as `routes` for serverless functions
- **Reality**: `routes` are for serverless functions, `rewrites` are for static assets/redirects
- **Vercel's model**: Serverless functions need explicit routing via `routes`, not `rewrites`

## 🛠️ 2. The Fix

### Changed:
```json
// BEFORE (Wrong)
"rewrites": [
  {
    "source": "/api/(.*)",
    "destination": "/api/index.py"
  }
]

// AFTER (Correct)
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/index.py"
  }
]
```

### Why This Works:
- `routes` explicitly map requests to serverless functions
- `dest` (not `destination`) is the correct property for routes
- Vercel will now properly invoke the Python function for `/api/*` requests

## 📚 3. Understanding the Concept

### Vercel's Routing Model:

**Three Types of Routing:**
1. **Routes** (`routes`): Map requests to serverless functions
   - Used for: API endpoints, dynamic functions
   - Syntax: `{ "src": "/path", "dest": "/function.py" }`
   
2. **Rewrites** (`rewrites`): Internal URL rewriting (client doesn't see change)
   - Used for: Proxying, internal redirects
   - Syntax: `{ "source": "/path", "destination": "/other-path" }`
   
3. **Redirects** (`redirects`): External redirects (client sees new URL)
   - Used for: HTTP redirects
   - Syntax: `{ "source": "/old", "destination": "/new", "permanent": true }`

### Serverless Function Detection:
- Vercel auto-detects functions in `api/` folder
- But explicit routing via `routes` is more reliable
- Python functions need `handler` export (✅ you have this)

### Mental Model:
```
Request → Routes → Serverless Function → Response
         (explicit mapping)
```

Not:
```
Request → Rewrites → Static Asset/Redirect
         (internal rewriting)
```

## ⚠️ 4. Warning Signs to Watch For

### Red Flags:
1. ✅ **Using `rewrites` for API endpoints** → Should use `routes`
2. ✅ **Missing `handler` export in Python** → Vercel can't invoke function
3. ✅ **Wrong `dest` vs `destination`** → Routes use `dest`, rewrites use `destination`
4. ✅ **Path not starting with `/`** → Vercel needs absolute paths from root

### Code Smells:
- `vercel.json` has `rewrites` but you're building API endpoints
- Python function exists but returns 404
- Build succeeds but function not accessible

### Similar Mistakes:
- Using `redirects` instead of `routes` for APIs
- Forgetting `handler = app` in Python functions
- Wrong file structure (function not in `api/` folder)

## 🔄 5. Alternative Approaches

### Option 1: Auto-Detection (Current - Recommended)
```json
{
  "version": 2,
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.py" }
  ]
}
```
**Pros**: Simple, explicit routing
**Cons**: None for this use case

### Option 2: Explicit Builds
```json
{
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.py" }
  ]
}
```
**Pros**: More control over build process
**Cons**: Redundant (Vercel auto-detects)

### Option 3: Next.js API Routes (Not Applicable)
If you wanted to use Next.js API routes instead:
- Move functions to `frontend/pages/api/`
- But you're using FastAPI, so this doesn't apply

## ✅ Verification Steps

1. **Check Build Logs**:
   - Vercel Dashboard → Deployment → Build Logs
   - Look for: "Installing Python dependencies"
   - Look for: "Building serverless function"

2. **Test Endpoints**:
   ```bash
   curl https://savdogar.vercel.app/api/health
   curl https://savdogar.vercel.app/api/v1/health
   ```

3. **Check Function Logs**:
   - Vercel Dashboard → Deployment → Function Logs
   - Should see function invocations

## 🎓 Key Takeaways

1. **Routes vs Rewrites**: Use `routes` for serverless functions, `rewrites` for static assets
2. **Explicit is Better**: Even with auto-detection, explicit routing is clearer
3. **Property Names Matter**: `dest` for routes, `destination` for rewrites
4. **Handler Export**: Python functions MUST export `handler` variable
5. **Path Resolution**: Always use absolute paths from project root

## 📖 Further Reading

- [Vercel Routing Documentation](https://vercel.com/docs/concepts/projects/project-configuration#routes)
- [Vercel Python Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [FastAPI on Vercel](https://vercel.com/guides/deploying-fastapi-with-vercel)

