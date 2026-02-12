
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

async function handleTestDb(request: NextRequest, user: JWTPayload) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
    }

    try {
        await prisma.$connect();
        const count = await prisma.user.count();
        return NextResponse.json({ status: 'ok', userCount: count });
    } catch {
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, handleTestDb);
}
