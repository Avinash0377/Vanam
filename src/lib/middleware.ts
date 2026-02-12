import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
    user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function withAuth(
    request: NextRequest,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
        );
    }

    return handler(request, payload);
}

/**
 * Middleware to verify admin role
 */
export async function withAdmin(
    request: NextRequest,
    handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
    return withAuth(request, async (req, user) => {
        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        return handler(req, user);
    });
}

/**
 * Get user from request without throwing error
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) return null;

    return verifyToken(token);
}
