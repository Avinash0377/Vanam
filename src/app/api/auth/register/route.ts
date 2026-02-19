import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIp(request);
        const rateLimit = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
            );
        }

        const body = await request.json();
        // Validate input
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }
        const { name, mobile, email, password } = validation.data;

        // Check if mobile already exists
        const userWithMobile = await prisma.user.findFirst({
            where: { mobile },
        });

        if (userWithMobile) {
            return NextResponse.json(
                { error: 'Mobile number already registered' },
                { status: 400 }
            );
        }

        // Check if email already exists
        if (email) {
            const userWithEmail = await prisma.user.findFirst({
                where: { email },
            });

            if (userWithEmail) {
                return NextResponse.json(
                    { error: 'Email already registered' },
                    { status: 400 }
                );
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                mobile,
                email: email || null,
                password: hashedPassword,
                role: 'CUSTOMER',
            },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate token
        const tokenData = generateToken({
            userId: user.id,
            mobile: user.mobile,
            role: user.role,
        });

        return NextResponse.json({
            message: 'Registration successful',
            user,
            ...tokenData,
        }, { status: 201 });

    } catch (error) {
        // Handle unique constraint violations (race condition: two users register same mobile/email simultaneously)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const field = (error.meta?.target as string[])?.includes('mobile') ? 'Mobile number' : 'Email';
            return NextResponse.json(
                { error: `${field} already registered` },
                { status: 400 }
            );
        }
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to register user. Please try again.' },
            { status: 500 }
        );
    }
}
