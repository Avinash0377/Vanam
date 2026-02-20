import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const DELIVERY_SETTINGS_ID = 'default';

// GET /api/pincode/check?pincode=XXXXXX
// Public endpoint — no auth required
export async function GET(request: NextRequest) {
    try {
        // Rate limit: 30 checks per minute per IP
        const ip = getClientIp(request);
        const rateCheck = checkRateLimit(`pincode:${ip}`, { maxRequests: 30, windowSeconds: 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { available: false, error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');

        if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
            return NextResponse.json(
                { available: false, error: 'Valid 6-digit pincode is required' },
                { status: 400 }
            );
        }

        // Check if Pan India delivery is enabled
        const deliverySettings = await prisma.deliverySettings.findUnique({
            where: { id: DELIVERY_SETTINGS_ID },
            select: { panIndiaEnabled: true },
        });

        // If Pan India is enabled, accept ALL valid 6-digit pincodes
        if (deliverySettings?.panIndiaEnabled) {
            return NextResponse.json({
                available: true,
                city: null,
                state: null,
            });
        }

        // Otherwise, check the ServiceablePincode database
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
