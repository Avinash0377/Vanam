import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Strict rate limiting for admin login
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`admin-login:${ip}`, RATE_LIMITS.adminAuth);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find admin user by email
        const user = await prisma.user.findFirst({
            where: {
                email,
                role: 'ADMIN',
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid admin credentials' },
                { status: 401 }
            );
        }

        // Generate token
        const tokenData = generateToken({
            userId: user.id,
            mobile: user.mobile,
            role: user.role,
        });

        return NextResponse.json({
            message: 'Admin login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokenData,
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { error: 'Failed to login' },
            { status: 500 }
        );
    }
}
