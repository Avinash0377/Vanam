import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/forgot-password
 * 
 * Accepts { email } or { mobile } and sends a password reset link.
 * SECURITY:
 * - Never reveals if email/mobile exists (anti-enumeration)
 * - Stores HASHED token in DB
 * - Token expires after 30 minutes
 * - Rate limited: 5 attempts per 15 minutes per IP
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitKey = `forgot-password:${ip}`;
        const rateCheck = checkRateLimit(rateLimitKey, { maxRequests: 5, windowSeconds: 15 * 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { message: 'If an account exists, a reset link has been sent.' },
                { status: 200 }
            );
        }

        const body = await request.json();
        const { email, mobile } = body;

        if (!email && !mobile) {
            return NextResponse.json(
                { error: 'Email or mobile number is required' },
                { status: 400 }
            );
        }

        // Generic success message (anti-enumeration)
        const successMessage = 'If an account exists with this information, a password reset link has been sent to the registered email.';

        // Find user by email or mobile
        const user = await prisma.user.findFirst({
            where: email
                ? { email: email.toLowerCase().trim() }
                : { mobile: mobile.trim() },
            select: { id: true, name: true, email: true },
        });

        // If no user found OR user has no email, silently return success
        if (!user || !user.email) {
            // Add small delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
            return NextResponse.json({ message: successMessage });
        }

        // Generate cryptographically secure token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Store hashed token in DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
            },
        });

        // Send reset email with RAW token (not hashed)
        await sendPasswordResetEmail(user.email, rawToken, user.name);

        return NextResponse.json({ message: successMessage });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'If an account exists with this information, a password reset link has been sent to the registered email.' },
        );
    }
}
