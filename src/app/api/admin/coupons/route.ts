import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { normalizeCouponCode } from '@/lib/coupon-utils';

// GET all coupons (with filtering, search, pagination)
async function getCoupons(request: NextRequest, _user: JWTPayload) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const search = searchParams.get('search')?.trim().toUpperCase() || '';
        const filterActive = searchParams.get('active'); // 'true', 'false', or null

        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (search) {
            where.code = { contains: search, mode: 'insensitive' };
        }

        if (filterActive === 'true') {
            where.isActive = true;
        } else if (filterActive === 'false') {
            where.isActive = false;
        }

        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.coupon.count({ where }),
        ]);

        return NextResponse.json({
            coupons,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
    }
}

// POST create coupon
async function createCoupon(request: NextRequest, _user: JWTPayload) {
    try {
        const body = await request.json();

        const code = normalizeCouponCode(body.code);
        if (!code) {
            return NextResponse.json({ error: 'Invalid coupon code. Use only letters, numbers, dashes, underscores.' }, { status: 400 });
        }

        // Validation
        const { discountType, discountValue, minOrderValue = 0, maxDiscountAmount, usageLimit, usagePerUser = 1, applicableTo = 'ALL', applicableIds = [], isActive = true, description, startDate, expiryDate } = body;

        if (!discountType || !['PERCENTAGE', 'FIXED'].includes(discountType)) {
            return NextResponse.json({ error: 'discountType must be PERCENTAGE or FIXED' }, { status: 400 });
        }

        if (!discountValue || discountValue <= 0) {
            return NextResponse.json({ error: 'discountValue must be greater than 0' }, { status: 400 });
        }

        if (discountType === 'PERCENTAGE' && discountValue > 100) {
            return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
        }

        if (!startDate || !expiryDate) {
            return NextResponse.json({ error: 'startDate and expiryDate are required' }, { status: 400 });
        }

        const start = new Date(startDate);
        const expiry = new Date(expiryDate);

        if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        if (expiry <= start) {
            return NextResponse.json({ error: 'Expiry date must be after start date' }, { status: 400 });
        }

        // Check uniqueness
        const existing = await prisma.coupon.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code,
                description: description || null,
                discountType,
                discountValue: parseFloat(discountValue),
                minOrderValue: parseFloat(minOrderValue) || 0,
                maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                usagePerUser: parseInt(usagePerUser) || 1,
                applicableTo,
                applicableIds: Array.isArray(applicableIds) ? applicableIds : [],
                isActive: Boolean(isActive),
                startDate: start,
                expiryDate: expiry,
            },
        });

        return NextResponse.json({ coupon, message: 'Coupon created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Create coupon error:', error);
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCoupons);
}

export async function POST(request: NextRequest) {
    return withAdmin(request, createCoupon);
}
