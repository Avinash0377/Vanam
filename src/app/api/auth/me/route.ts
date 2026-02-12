import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

async function handler(request: NextRequest, user: JWTPayload) {
    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: dbUser });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Failed to get user data' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAuth(request, handler);
}
