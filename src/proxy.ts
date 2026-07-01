import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limit store for basic protection (Note: Vercel Edge resets this often, but it helps mitigate bursts)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

export function proxy(request: NextRequest) {
  // 1. Basic Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown-ip';
    const now = Date.now();
    
    const store = rateLimitStore.get(ip);
    if (!store || now - store.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.set(ip, { count: 1, timestamp: now });
    } else {
      store.count++;
      if (store.count > MAX_REQUESTS_PER_WINDOW) {
        return new NextResponse(
          JSON.stringify({ error: 'Too Many Requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // 2. Security Headers
  const response = NextResponse.next();
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
