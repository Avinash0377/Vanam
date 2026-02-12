import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

// GET /api/admin/users - Paginated user list with order stats
async function getUsers(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
        const search = searchParams.get('search') || '';
        const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'mobile', 'email', 'role', 'lastLoginAt'];
        const rawSortBy = searchParams.get('sortBy') || 'createdAt';
        const sortBy = ALLOWED_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : 'createdAt';
        const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

        const skip = (page - 1) * limit;

        // Build search filter
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { mobile: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        // Fetch users with order aggregation
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    mobile: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    lastLoginAt: true,
                    orders: {
                        select: {
                            totalAmount: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        // Transform users to include computed stats
        const usersWithStats = users.map(user => {
            const orderCount = user.orders.length;
            const totalSpent = user.orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const lastOrderDate = user.orders.length > 0
                ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
                : null;

            return {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                orderCount,
                totalSpent,
                lastOrderDate,
            };
        });

        return NextResponse.json({
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getUsers);
}
