import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

const SINGLETON_ID = 'default';

// GET delivery config (singleton)
async function getDeliveryConfig(_request: NextRequest, _user: JWTPayload) {
    try {
        const settings = await prisma.deliverySettings.findUnique({
            where: { id: SINGLETON_ID },
        });

        // Return defaults if no record exists yet
        return NextResponse.json({
            settings: settings || {
                id: SINGLETON_ID,
                panIndiaEnabled: false,
                freeDeliveryEnabled: true,
                freeDeliveryMinAmount: 999,
                flatDeliveryCharge: 99,
                deliveryChargeType: 'FLAT',
            },
        });
    } catch (error) {
        console.error('Get delivery config error:', error);
        return NextResponse.json({ error: 'Failed to fetch delivery config' }, { status: 500 });
    }
}

// PUT upsert delivery config (singleton)
async function updateDeliveryConfig(request: NextRequest, _user: JWTPayload) {
    try {
        const body = await request.json();

        const {
            panIndiaEnabled = false,
            freeDeliveryEnabled = true,
            freeDeliveryMinAmount = 999,
            flatDeliveryCharge = 99,
            deliveryChargeType = 'FLAT',
        } = body;

        if (typeof freeDeliveryMinAmount !== 'number' || freeDeliveryMinAmount < 0) {
            return NextResponse.json({ error: 'Invalid freeDeliveryMinAmount' }, { status: 400 });
        }

        if (typeof flatDeliveryCharge !== 'number' || flatDeliveryCharge < 0) {
            return NextResponse.json({ error: 'Invalid flatDeliveryCharge' }, { status: 400 });
        }

        if (!['FLAT', 'CONDITIONAL'].includes(deliveryChargeType)) {
            return NextResponse.json({ error: 'Invalid delivery charge type' }, { status: 400 });
        }

        const settings = await prisma.deliverySettings.upsert({
            where: { id: SINGLETON_ID },
            create: {
                id: SINGLETON_ID,
                panIndiaEnabled: Boolean(panIndiaEnabled),
                freeDeliveryEnabled: Boolean(freeDeliveryEnabled),
                freeDeliveryMinAmount: parseFloat(String(freeDeliveryMinAmount)),
                flatDeliveryCharge: parseFloat(String(flatDeliveryCharge)),
                deliveryChargeType,
            },
            update: {
                panIndiaEnabled: Boolean(panIndiaEnabled),
                freeDeliveryEnabled: Boolean(freeDeliveryEnabled),
                freeDeliveryMinAmount: parseFloat(String(freeDeliveryMinAmount)),
                flatDeliveryCharge: parseFloat(String(flatDeliveryCharge)),
                deliveryChargeType,
            },
        });

        return NextResponse.json({ settings, message: 'Delivery config updated successfully' });
    } catch (error) {
        console.error('Update delivery config error:', error);
        return NextResponse.json({ error: 'Failed to update delivery config' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getDeliveryConfig);
}

export async function PUT(request: NextRequest) {
    return withAdmin(request, updateDeliveryConfig);
}
