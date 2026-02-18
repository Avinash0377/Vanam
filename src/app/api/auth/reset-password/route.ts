import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/reset-password
 * 
 * Accepts { token, newPassword } and resets the user's password.
 * SECURITY:
 * - Token is hashed before DB lookup
 * - Validates token expiry
 * - One-time use: clears token after successful reset
 * - Rate limited: 10 attempts per 15 minutes per IP
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitKey = `reset-password:${ip}`;
        const rateCheck = checkRateLimit(rateLimitKey, { maxRequests: 10, windowSeconds: 15 * 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: 'Token and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Hash the token to match what's stored in DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with matching token that hasn't expired
        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset link. Please request a new one.' },
                { status: 400 }
            );
        }

        // Hash new password and clear reset token (one-time use)
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({
            message: 'Password reset successful. You can now login with your new password.',
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Failed to reset password. Please try again.' },
            { status: 500 }
        );
    }
}
