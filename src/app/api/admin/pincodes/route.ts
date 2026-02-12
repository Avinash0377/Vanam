import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET — List pincodes (paginated, searchable)
async function getPincodes(request: NextRequest, user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const search = searchParams.get('search') || '';

        const where: Record<string, unknown> = {};

        if (search) {
            where.pincode = { contains: search };
        }

        const [pincodes, total] = await Promise.all([
            prisma.serviceablePincode.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.serviceablePincode.count({ where }),
        ]);

        return NextResponse.json({
            pincodes,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin pincodes error:', error);
        return NextResponse.json({ error: 'Failed to fetch pincodes' }, { status: 500 });
    }
}

// POST — Add new pincode
async function addPincode(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { pincode, city, state } = body;

        if (!pincode || typeof pincode !== 'string' || !/^\d{6}$/.test(pincode.trim())) {
            return NextResponse.json(
                { error: 'Valid 6-digit pincode is required' },
                { status: 400 }
            );
        }

        // Check if pincode already exists
        const existing = await prisma.serviceablePincode.findUnique({
            where: { pincode: pincode.trim() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'This pincode already exists' },
                { status: 409 }
            );
        }

        const newPincode = await prisma.serviceablePincode.create({
            data: {
                pincode: pincode.trim(),
                city: city?.trim() || null,
                state: state?.trim() || null,
                isActive: true,
            },
        });

        return NextResponse.json(
            { message: 'Pincode added', pincode: newPincode },
            { status: 201 }
        );
    } catch (error) {
        console.error('Add pincode error:', error);
        return NextResponse.json({ error: 'Failed to add pincode' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getPincodes);
}

export async function POST(request: NextRequest) {
    return withAdmin(request, addPincode);
}
