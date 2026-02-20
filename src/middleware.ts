import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Next.js Edge Middleware — runs before every matching route.
 *
 * Protects /admin/* pages: redirects unauthenticated visitors and
 * non-admin users to /admin/login immediately at the edge,
 * before any page bundle is served.
 *
 * NOTE: This is separate from src/lib/middleware.ts which is the
 * API route wrapper (withAdmin/withAuth). Both are needed:
 * - This file = page-level protection (edge, fast redirect)
 * - lib/middleware.ts = API route protection (server-side auth verification)
 */

// BUG-12 fix: throw in production if JWT_SECRET is missing (same as auth.ts)
const JWT_SECRET_STRING = process.env.JWT_SECRET || (
    process.env.NODE_ENV === 'production'
        ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
        : 'dev-secret-not-for-production'
);

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin routes (skip /admin/login itself to avoid redirect loops)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const token =
            request.cookies.get('auth_token')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);

            // Check admin role
            if (payload.role !== 'ADMIN') {
                const loginUrl = new URL('/admin/login', request.url);
                loginUrl.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(loginUrl);
            }

            // Token valid and role is ADMIN — allow through
            return NextResponse.next();

        } catch {
            // Token invalid or expired
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    // BUG-11 fix: match both /admin (root) and /admin/* sub-paths
    // Without '/admin' in the matcher, navigating directly to /admin bypasses this middleware
    matcher: [
        '/admin',
        '/admin/:path*',
    ],
};
