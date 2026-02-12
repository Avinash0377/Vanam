import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`login:${ip}`, RATE_LIMITS.auth);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        // Validate input
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }
        const { mobile, email, password } = validation.data;

        // Find user by mobile (primary login method)
        let user = null;

        if (mobile) {
            user = await prisma.user.findUnique({
                where: { mobile },
            });
        } else if (email) {
            user = await prisma.user.findUnique({
                where: { email },
            });
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update lastLoginAt timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        // Generate token
        const tokenData = generateToken({
            userId: user.id,
            mobile: user.mobile,
            role: user.role,
        });

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: 'Login successful',
            user: userWithoutPassword,
            ...tokenData,
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Failed to login' },
            { status: 500 }
        );
    }
}
