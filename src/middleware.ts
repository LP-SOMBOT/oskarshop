import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * 
 * Ensures public API routes are never intercepted by redirects.
 */

const PUBLIC_API_ROUTES = [
  '/api/sms-webhook',
  '/api/sms-test',
  '/api/fazercards/webhook',
  '/api/notify-telegram',
  '/api/cron',
  '/api/check-ff-player',
  '/api/generate-otp',
  '/api/verify-otp',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API webhook and public routes through without any check
  const isPublicApi = PUBLIC_API_ROUTES.some(
    route => pathname.startsWith(route)
  );
  
  if (isPublicApi) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// matcher pattern excludes ALL /api/ routes from middleware processing entirely
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};
