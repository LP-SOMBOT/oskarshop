
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * 
 * CRITICAL: This file ensures that internal API routes used for automation
 * (webhooks, crons, telegram notifications) are never intercepted by 
 * authentication guards or redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // EXCLUSION LIST: These routes must always be accessible via POST/GET 
  // without any redirection or auth interference.
  if (
    pathname.startsWith('/api/sms-webhook') ||
    pathname.startsWith('/api/fazercards/webhook') ||
    pathname.startsWith('/api/notify-telegram') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/sms-test')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Ensure the middleware only runs for relevant paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
