import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/profile — fetch admin profile with stats
async function getProfile(request: NextRequest, user: JWTPayload) {
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
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch quick stats
        const [totalOrders, totalProducts, totalCustomers, totalRevenue] = await Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { orderStatus: { notIn: ['CANCELLED', 'REFUNDED'] } },
            }),
        ]);

        return NextResponse.json({
            user: dbUser,
            stats: {
                totalOrders,
                totalProducts,
                totalCustomers,
                totalRevenue: totalRevenue?._sum?.totalAmount || 0,
            },
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
}

// PUT /api/admin/profile — update admin profile
async function updateProfile(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { name, email, mobile, currentPassword, newPassword } = body;

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (name && name.trim()) {
            updateData.name = name.trim();
        }

        if (email !== undefined) {
            if (email && email.trim()) {
                // Check uniqueness
                const existing = await prisma.user.findFirst({
                    where: { email: email.trim(), id: { not: user.userId } },
                });
                if (existing) {
                    return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
                }
                updateData.email = email.trim();
            } else {
                updateData.email = null;
            }
        }

        if (mobile && mobile.trim()) {
            const cleanMobile = mobile.trim().replace(/\D/g, '');
            if (cleanMobile.length !== 10) {
                return NextResponse.json({ error: 'Mobile number must be 10 digits' }, { status: 400 });
            }
            // Check uniqueness
            const existing = await prisma.user.findFirst({
                where: { mobile: cleanMobile, id: { not: user.userId } },
            });
            if (existing) {
                return NextResponse.json({ error: 'Mobile number already in use' }, { status: 400 });
            }
            updateData.mobile = cleanMobile;
        }

        // Password change
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
            }
            const isValid = await bcrypt.compare(currentPassword, dbUser.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(newPassword, 12);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No changes to save' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updated,
        });
    } catch (error) {
        console.error('Update admin profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getProfile);
}

export async function PUT(request: NextRequest) {
    return withAdmin(request, updateProfile);
}
