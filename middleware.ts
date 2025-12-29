import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  // Extract subdomain from host
  // Examples:
  // - pizzeria-roma.yourplatform.com → subdomain = "pizzeria-roma"
  // - localhost:3000 → subdomain = "localhost"
  // - pizzeria-roma.localhost:3000 → subdomain = "pizzeria-roma"

  const parts = host.split('.');
  let subdomain = parts[0];

  // Handle localhost development
  if (host.includes('localhost')) {
    // Extract subdomain from pizzeria-roma.localhost:3000
    if (parts.length > 1 && parts[1].includes('localhost')) {
      subdomain = parts[0];
    } else {
      subdomain = 'localhost';
    }
  }

  // Skip for main domain pages (www, root domain)
  const mainDomainPages = ['www', 'localhost', 'yourplatform'];
  const isMainDomain = mainDomainPages.some(page => subdomain === page || subdomain.includes(page));

  // Skip for static files, API routes, and Next.js internals
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.')  // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // For main domain, allow access to public pages
  if (isMainDomain) {
    // Allow access to login, register, landing page, etc.
    const publicPaths = ['/', '/login', '/register', '/pricing', '/features', '/help'];
    if (publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path))) {
      return NextResponse.next();
    }
  }

  // For subdomains (restaurant-specific)
  if (!isMainDomain) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant', subdomain);

    // Rewrite the URL to include the subdomain in the path internally
    // subdomain.yourplatform.com/path -> app/[subdomain]/path
    const rewriteUrl = new URL(`/${subdomain}${url.pathname}`, request.url);

    // If the path is just "/", rewrite to "/[subdomain]/menu" for customers
    if (url.pathname === '/') {
      rewriteUrl.pathname = `/${subdomain}/menu`;
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
