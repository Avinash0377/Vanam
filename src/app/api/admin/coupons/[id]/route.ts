import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { normalizeCouponCode } from '@/lib/coupon-utils';
import { invalidateOffersCache } from '@/lib/coupon-eligibility';

// PUT update coupon
async function updateCoupon(request: NextRequest, _user: JWTPayload) {
    try {
        const id = new URL(request.url).pathname.split('/').filter(Boolean).pop();
        if (!id) {
            return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
        }

        const existing = await prisma.coupon.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }

        const body = await request.json();
        const updateData: Record<string, unknown> = {};

        // Code update (normalize)
        if (body.code !== undefined) {
            const code = normalizeCouponCode(body.code);
            if (!code) {
                return NextResponse.json({ error: 'Invalid coupon code format' }, { status: 400 });
            }
            // Check uniqueness if code changed
            if (code !== existing.code) {
                const duplicate = await prisma.coupon.findUnique({ where: { code } });
                if (duplicate) {
                    return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
                }
            }
            updateData.code = code;
        }

        if (body.description !== undefined) updateData.description = body.description || null;
        if (body.discountType !== undefined) {
            if (!['PERCENTAGE', 'FIXED'].includes(body.discountType)) {
                return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 });
            }
            updateData.discountType = body.discountType;
        }
        if (body.discountValue !== undefined) {
            const val = parseFloat(body.discountValue);
            if (val <= 0) return NextResponse.json({ error: 'discountValue must be > 0' }, { status: 400 });
            const type = (body.discountType || existing.discountType);
            if (type === 'PERCENTAGE' && val > 100) {
                return NextResponse.json({ error: 'Percentage cannot exceed 100%' }, { status: 400 });
            }
            updateData.discountValue = val;
        }
        if (body.minOrderValue !== undefined) updateData.minOrderValue = parseFloat(body.minOrderValue) || 0;
        if (body.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = body.maxDiscountAmount ? parseFloat(body.maxDiscountAmount) : null;
        if (body.usageLimit !== undefined) updateData.usageLimit = body.usageLimit ? parseInt(body.usageLimit) : null;
        if (body.usagePerUser !== undefined) updateData.usagePerUser = parseInt(body.usagePerUser) || 1;
        if (body.applicableTo !== undefined) updateData.applicableTo = body.applicableTo;
        if (body.applicableIds !== undefined) updateData.applicableIds = Array.isArray(body.applicableIds) ? body.applicableIds : [];
        if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

        if (body.startDate !== undefined) {
            const start = new Date(body.startDate);
            if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
            updateData.startDate = start;
        }
        if (body.expiryDate !== undefined) {
            const expiry = new Date(body.expiryDate);
            if (isNaN(expiry.getTime())) return NextResponse.json({ error: 'Invalid expiry date' }, { status: 400 });
            updateData.expiryDate = expiry;
        }

        // Validate dates if both are being set
        const finalStart = (updateData.startDate || existing.startDate) as Date;
        const finalExpiry = (updateData.expiryDate || existing.expiryDate) as Date;
        if (finalExpiry <= finalStart) {
            return NextResponse.json({ error: 'Expiry must be after start date' }, { status: 400 });
        }

        // ---- PDP Offer fields ----
        if (body.offerType !== undefined) {
            if (!['PERCENTAGE', 'FLAT', 'FREE_SHIPPING', 'BOGO'].includes(body.offerType)) {
                return NextResponse.json({ error: 'Invalid offer type' }, { status: 400 });
            }
            updateData.offerType = body.offerType;
        }

        if (body.showOnProductPage !== undefined) updateData.showOnProductPage = Boolean(body.showOnProductPage);
        if (body.autoApply !== undefined) updateData.autoApply = Boolean(body.autoApply);

        if (body.displayTitle !== undefined) {
            if (body.displayTitle && body.displayTitle.length > 90) {
                return NextResponse.json({ error: 'Display title must be 90 characters or less' }, { status: 400 });
            }
            updateData.displayTitle = body.displayTitle || null;
        }
        if (body.displaySubtext !== undefined) {
            if (body.displaySubtext && body.displaySubtext.length > 120) {
                return NextResponse.json({ error: 'Display subtext must be 120 characters or less' }, { status: 400 });
            }
            updateData.displaySubtext = body.displaySubtext || null;
        }

        if (body.sortOrder !== undefined) updateData.sortOrder = parseInt(body.sortOrder) || 0;
        if (body.stackable !== undefined) updateData.stackable = Boolean(body.stackable);
        if (body.perUserLimit !== undefined) updateData.perUserLimit = body.perUserLimit ? parseInt(body.perUserLimit) : null;

        if (body.applicabilityScope !== undefined) {
            if (!['ALL_PRODUCTS', 'CATEGORY', 'PRODUCT', 'COLLECTION_TAG'].includes(body.applicabilityScope)) {
                return NextResponse.json({ error: 'Invalid applicability scope' }, { status: 400 });
            }
            updateData.applicabilityScope = body.applicabilityScope;
        }

        if (body.includedProductIds !== undefined) updateData.includedProductIds = Array.isArray(body.includedProductIds) ? body.includedProductIds : [];
        if (body.excludedProductIds !== undefined) updateData.excludedProductIds = Array.isArray(body.excludedProductIds) ? body.excludedProductIds : [];
        if (body.includedCategoryIds !== undefined) updateData.includedCategoryIds = Array.isArray(body.includedCategoryIds) ? body.includedCategoryIds : [];
        if (body.includedTags !== undefined) updateData.includedTags = Array.isArray(body.includedTags) ? body.includedTags : [];

        const coupon = await prisma.coupon.update({
            where: { id },
            data: updateData,
        });

        // Invalidate PDP offers cache
        invalidateOffersCache();

        return NextResponse.json({ coupon, message: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Update coupon error:', error);
        return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
    }
}

// PATCH toggle showOnProductPage visibility
async function toggleVisibility(request: NextRequest, _user: JWTPayload) {
    try {
        const id = new URL(request.url).pathname.split('/').filter(Boolean).pop();
        if (!id) {
            return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
        }

        const existing = await prisma.coupon.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }

        const body = await request.json();
        const showOnProductPage = Boolean(body.showOnProductPage);

        const coupon = await prisma.coupon.update({
            where: { id },
            data: { showOnProductPage },
        });

        // Invalidate PDP offers cache
        invalidateOffersCache();

        return NextResponse.json({ coupon, message: `Coupon ${showOnProductPage ? 'shown' : 'hidden'} on product pages` });
    } catch (error) {
        console.error('Toggle visibility error:', error);
        return NextResponse.json({ error: 'Failed to toggle visibility' }, { status: 500 });
    }
}

// DELETE coupon
async function deleteCoupon(request: NextRequest, _user: JWTPayload) {
    try {
        const id = new URL(request.url).pathname.split('/').filter(Boolean).pop();
        if (!id) {
            return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
        }

        const existing = await prisma.coupon.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }

        await prisma.coupon.delete({ where: { id } });

        // Invalidate PDP offers cache
        invalidateOffersCache();

        return NextResponse.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    return withAdmin(request, updateCoupon);
}

export async function PATCH(request: NextRequest) {
    return withAdmin(request, toggleVisibility);
}

export async function DELETE(request: NextRequest) {
    return withAdmin(request, deleteCoupon);
}
