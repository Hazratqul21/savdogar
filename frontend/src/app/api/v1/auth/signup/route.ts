import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

/**
 * Next.js API Route Handler for User Signup
 * 
 * CRITICAL: This handler prevents 405 errors by ensuring POST requests are properly handled.
 * 
 * On Vercel:
 * - vercel.json routes /api/v1/* to Python backend
 * - But Next.js intercepts /api/* routes first if they exist in app directory
 * - This handler proxies the request to the Python backend
 * 
 * The handler uses an internal fetch that bypasses Next.js routing to avoid loops.
 */
async function logDebug(data: any) {
  try {
    const logPath = '/home/ali/dokon/savdogar_project_ready/.cursor/debug.log';
    const logLine = JSON.stringify({...data, timestamp: Date.now()}) + '\n';
    await appendFile(logPath, logLine);
  } catch (e) {}
}

export async function POST(request: NextRequest) {
  // #region agent log
  await logDebug({location:'route.ts:25',message:'POST handler entry',data:{hasNextPublicApiUrl:!!process.env.NEXT_PUBLIC_API_URL,host:request.headers.get('host'),method:request.method},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
  // #endregion
  try {
    // Get the request body
    const body = await request.json();
    // #region agent log
    await logDebug({location:'route.ts:30',message:'POST handler body parsed',data:{hasUsername:!!body.username,hasEmail:!!body.email},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion

    // Determine backend URL
    let backendUrl: string;
    
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Explicit backend URL (for external deployments)
      backendUrl = process.env.NEXT_PUBLIC_API_URL;
      // #region agent log
      await logDebug({location:'route.ts:37',message:'backendUrl from env',data:{backendUrl},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      // #endregion
    } else {
      // On Vercel, construct URL from request
      // Use host header to get the current domain
      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      backendUrl = host.includes('localhost') ? 'http://localhost:8000' : `${protocol}://${host}`;
      // #region agent log
      await logDebug({location:'route.ts:43',message:'backendUrl constructed',data:{host,protocol,backendUrl},sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      // #endregion
    }

    // Make request to backend
    // CRITICAL: Use absolute URL to ensure Vercel routes it correctly
    // Add a query parameter to help with routing if needed
    const backendEndpoint = `${backendUrl}/api/v1/auth/signup`;
    // #region agent log
    await logDebug({location:'route.ts:50',message:'fetch to backend before',data:{backendEndpoint},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward important headers
        'User-Agent': request.headers.get('user-agent') || 'Next.js',
      },
      body: JSON.stringify(body),
      // Important: Don't cache this request
      cache: 'no-store',
    });

    // #region agent log
    await logDebug({location:'route.ts:65',message:'fetch to backend after',data:{status:response.status,statusText:response.statusText,ok:response.ok,url:response.url},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion

    // Get response data
    const data = await response.json().catch(() => {
      // If JSON parsing fails, return a generic error
      // #region agent log
      logDebug({location:'route.ts:70',message:'JSON parse failed',data:{status:response.status},sessionId:'debug-session',runId:'run1',hypothesisId:'B'}).catch(()=>{});
      // #endregion
      return { detail: "Ro'yxatdan o'tishda xatolik yuz berdi" };
    });

    // #region agent log
    await logDebug({location:'route.ts:75',message:'returning response',data:{status:response.status,hasData:!!data},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    // Return response with same status code
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    // #region agent log
    await logDebug({location:'route.ts:85',message:'POST handler error',data:{errorMessage:error.message,errorName:error.name,errorStack:error.stack},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    console.error('Signup API route error:', error);
    return NextResponse.json(
      { 
        detail: error.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
