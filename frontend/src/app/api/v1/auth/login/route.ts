import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route Handler for User Login
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
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Convert JSON body to form data format (FastAPI expects form data for login)
    const formData = new URLSearchParams();
    formData.append('username', body.username);
    formData.append('password', body.password);

    // Determine backend URL
    let backendUrl: string;
    
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Explicit backend URL (for external deployments)
      backendUrl = process.env.NEXT_PUBLIC_API_URL;
    } else {
      // On Vercel, construct URL from request
      // Use host header to get the current domain
      const host = request.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      backendUrl = host.includes('localhost') ? 'http://localhost:8000' : `${protocol}://${host}`;
    }

    // Make request to backend
    // CRITICAL: Use absolute URL to ensure Vercel routes it correctly
    const backendEndpoint = `${backendUrl}/api/v1/auth/login`;
    
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Forward important headers
        'User-Agent': request.headers.get('user-agent') || 'Next.js',
      },
      body: formData.toString(),
      // Important: Don't cache this request
      cache: 'no-store',
    });

    // Get response data
    const data = await response.json().catch(() => {
      // If JSON parsing fails, return a generic error
      return { detail: 'Kirishda xatolik yuz berdi' };
    });

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
    console.error('Login API route error:', error);
    return NextResponse.json(
      { 
        detail: error.message || 'Kirishda xatolik yuz berdi',
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
