import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pincode/check?pincode=XXXXXX
// Public endpoint — no auth required
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');

        if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
            return NextResponse.json(
                { available: false, error: 'Valid 6-digit pincode is required' },
                { status: 400 }
            );
        }

        const record = await prisma.serviceablePincode.findFirst({
            where: {
                pincode: pincode.trim(),
                isActive: true,
            },
            select: { id: true, city: true, state: true },
        });

        return NextResponse.json({
            available: !!record,
            city: record?.city || null,
            state: record?.state || null,
        });
    } catch (error) {
        console.error('Pincode check error:', error);
        return NextResponse.json(
            { available: false, error: 'Service unavailable' },
            { status: 500 }
        );
    }
}
