# Vercel NOT_FOUND Error - Fix and Explanation

## 🎯 The Fix

### Changes Made:

1. **Updated `vercel.json` routing** - Changed `dest` from `"api/index.py"` to `"/api/index.py"` (added leading slash)
2. **Enhanced handler export** - Added assertion to ensure handler is callable

### Critical Vercel Configuration:

**IMPORTANT**: You MUST set the **Root Directory** in Vercel project settings:

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Under "Root Directory", set it to: `backend`
3. Save and redeploy

This is the **MOST COMMON CAUSE** of NOT_FOUND errors!

## 📖 Root Cause Explanation

### What Was Happening:

1. **Vercel couldn't find the handler function** because:
   - The Root Directory wasn't set to `backend/`
   - OR the route destination path was incorrect
   - OR the handler wasn't being detected properly

2. **What the code was doing vs. what it needed to do**:
   - **What it was doing**: Routing all requests to `api/index.py` (relative path)
   - **What it needed to do**: Route all requests to `/api/index.py` (absolute path from project root) OR ensure Root Directory is set correctly

3. **What triggered this error**:
   - Deploying to Vercel without setting Root Directory
   - Vercel trying to find `api/index.py` from repository root instead of `backend/api/index.py`
   - Handler function not being detected by Vercel's Python runtime

### Why This Error Exists:

The NOT_FOUND error protects you from:
- **Incorrect deployment configuration** - Prevents deploying broken applications
- **Missing handlers** - Ensures serverless functions are properly exported
- **Wrong project structure** - Forces correct directory configuration

### The Correct Mental Model:

**Vercel Serverless Functions Work Like This:**

```
Request → Vercel Router → vercel.json routes → Function Handler → Response
```

1. **Vercel receives request** (e.g., `GET /api/v1/health`)
2. **Vercel checks `vercel.json` routes** - Finds matching route pattern
3. **Vercel loads function** from `dest` path (relative to Root Directory!)
4. **Vercel calls `handler()` function** in that file
5. **Handler processes request** (Mangum converts Lambda event → FastAPI request)
6. **Handler returns response** (Mangum converts FastAPI response → Lambda response)

**Key Points:**
- Root Directory determines where Vercel looks for files
- `vercel.json` routes determine which function handles which paths
- Handler function must be named `handler` and be callable
- Mangum wraps FastAPI to make it compatible with serverless

## ⚠️ Warning Signs to Watch For

### Signs This Issue Might Occur:

1. **Configuration Issues:**
   - ❌ No Root Directory set in Vercel project settings
   - ❌ `vercel.json` in wrong location (should be in `backend/`)
   - ❌ Incorrect `dest` paths in routes (missing leading slash or wrong path)

2. **Code Issues:**
   - ❌ Handler function not exported (`handler` not defined)
   - ❌ Handler not callable (e.g., wrong type)
   - ❌ Import errors in `api/index.py` (causes handler creation to fail)
   - ❌ Syntax errors in Python files (prevents module import)

3. **Deployment Issues:**
   - ❌ Build succeeds but all requests return 404/NOT_FOUND
   - ❌ Function logs show "Handler not found"
   - ❌ Function appears in dashboard but returns 404

### Code Smells:

```python
# ❌ BAD: Handler not defined at module level
def create_handler():
    return Mangum(app)
handler = create_handler()  # Might work, but risky

# ✅ GOOD: Handler defined at module level
handler = Mangum(app)

# ❌ BAD: Handler name mismatch
my_handler = Mangum(app)  # Vercel looks for 'handler', not 'my_handler'

# ✅ GOOD: Correct handler name
handler = Mangum(app)
```

```json
// ❌ BAD: Missing leading slash in dest
{
  "routes": [{
    "src": "/(.*)",
    "dest": "api/index.py"  // Missing leading slash
  }]
}

// ✅ GOOD: Absolute path with leading slash
{
  "routes": [{
    "src": "/(.*)",
    "dest": "/api/index.py"  // Has leading slash
  }]
}
```

## 🔄 Alternative Approaches

### Option 1: Single Function (Current - Recommended)

**Structure:**
```
backend/
  ├── api/
  │   └── index.py  (single handler for all routes)
  ├── app/
  │   └── main.py   (FastAPI app with all routers)
  └── vercel.json
```

**Pros:**
- ✅ Single function = faster cold starts
- ✅ Simpler configuration
- ✅ Better for monoliths

**Cons:**
- ❌ All routes in one function (larger bundle size)
- ❌ All routes share same timeout/memory limits

### Option 2: Multiple Functions (Advanced)

**Structure:**
```
backend/
  ├── api/
  │   ├── index.py       (root handler)
  │   ├── auth.py        (auth handler)
  │   └── products.py    (products handler)
  ├── app/
  │   └── main.py
  └── vercel.json
```

**vercel.json:**
```json
{
  "routes": [
    {
      "src": "/api/v1/auth/(.*)",
      "dest": "/api/auth.py"
    },
    {
      "src": "/api/v1/products/(.*)",
      "dest": "/api/products.py"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
```

**Pros:**
- ✅ Smaller individual functions
- ✅ Independent scaling per route
- ✅ Independent timeout/memory settings

**Cons:**
- ❌ More complex configuration
- ❌ Code duplication (each handler imports FastAPI app)
- ❌ More cold starts (one per function)

### Option 3: Edge Functions (Not Recommended for FastAPI)

**Why Not:**
- Edge Functions run on V8 (JavaScript/WebAssembly)
- FastAPI is Python (CPython)
- Would require rewriting entire backend

## ✅ Verification Steps

After deploying the fix:

1. **Check Root Directory:**
   ```
   Vercel Dashboard → Settings → General → Root Directory
   Should be: backend
   ```

2. **Test Root Endpoint:**
   ```bash
   curl https://your-backend.vercel.app/
   # Should return: {"message": "Welcome to SmartPOS CRM API", ...}
   ```

3. **Test Health Check:**
   ```bash
   curl https://your-backend.vercel.app/health
   # Should return: {"status": "healthy", ...}
   ```

4. **Test API Endpoint:**
   ```bash
   curl https://your-backend.vercel.app/api/v1/health
   # Should return health status
   ```

5. **Check Function Logs:**
   ```
   Vercel Dashboard → Deployments → [Latest] → Functions → Logs
   Should see: "✅ Mangum handler initialized successfully"
   ```

## 🚀 Next Steps

1. **Set Root Directory in Vercel** (CRITICAL!)
2. **Redeploy the backend**
3. **Test all endpoints**
4. **Monitor function logs for any errors**

## 📚 Related Concepts

- **Serverless Functions**: Stateless functions that scale automatically
- **ASGI (Asynchronous Server Gateway Interface)**: Python standard for async web apps
- **Mangum**: Adapter that converts ASGI → AWS Lambda format (used by Vercel)
- **FastAPI**: Modern Python web framework (ASGI-compatible)
- **Vercel Routing**: Pattern matching system that routes requests to functions

## 💡 Key Takeaway

**The #1 cause of NOT_FOUND errors in Vercel is incorrect Root Directory configuration.**

Always verify:
1. Root Directory is set correctly
2. `vercel.json` paths match the Root Directory structure
3. Handler function is exported correctly
4. All dependencies are in `requirements.txt`
