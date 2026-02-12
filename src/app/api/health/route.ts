import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const startTime = Date.now();

    try {
        // Check database connection by running a simple query
        await prisma.$runCommandRaw({ ping: 1 });

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            responseTime: `${responseTime}ms`,
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;

        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            responseTime: `${responseTime}ms`,
            error: 'Database connection failed',
        }, { status: 503 });
    }
}
