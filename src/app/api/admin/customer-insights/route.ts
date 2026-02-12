import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

interface OrderWithItems {
    id: string;
    orderStatus: string;
    totalAmount: number;
    items: { quantity: number }[];
    createdAt: Date;
}

interface UserWithOrders {
    id: string;
    name: string;
    email: string | null;
    mobile: string;
    createdAt: Date;
    orders: OrderWithItems[];
}

async function getCustomerInsights(request: NextRequest) {

    try {
        // Get all customers (non-admin users)
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            include: {
                orders: {
                    include: {
                        items: true
                    }
                }
            }
        }) as UserWithOrders[];

        // Calculate customer stats
        const customerStats = customers.map(customer => {
            const completedOrders = customer.orders.filter((o: OrderWithItems) => o.orderStatus !== 'CANCELLED');
            const totalSpent = completedOrders.reduce((sum: number, order: OrderWithItems) => sum + order.totalAmount, 0);
            const orderCount = completedOrders.length;
            const itemCount = completedOrders.reduce((sum: number, order: OrderWithItems) =>
                sum + order.items.reduce((s: number, item: { quantity: number }) => s + item.quantity, 0), 0
            );

            return {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                mobile: customer.mobile,
                createdAt: customer.createdAt,
                totalSpent,
                orderCount,
                itemCount,
                averageOrderValue: orderCount > 0 ? Math.round(totalSpent / orderCount) : 0,
                lastOrderDate: completedOrders.length > 0
                    ? completedOrders.sort((a: OrderWithItems, b: OrderWithItems) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
                    : null
            };
        });

        // Sort by total spent (top customers)
        const topCustomers = [...customerStats]
            .filter(c => c.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        // Get popular products
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: { orderStatus: { not: 'CANCELLED' } }
            },
            include: {
                product: {
                    select: { id: true, name: true, slug: true, images: true, price: true }
                }
            }
        });

        const productSales: Record<string, {
            id: string;
            name: string;
            slug: string;
            image: string;
            price: number;
            quantity: number;
            revenue: number;
            orders: number;
        }> = {};

        const orderProductMap: Record<string, Set<string>> = {};

        orderItems.forEach(item => {
            if (item.product) {
                if (!productSales[item.product.id]) {
                    productSales[item.product.id] = {
                        id: item.product.id,
                        name: item.product.name,
                        slug: item.product.slug,
                        image: item.product.images?.[0] || '/placeholder-plant.jpg',
                        price: item.product.price,
                        quantity: 0,
                        revenue: 0,
                        orders: 0
                    };
                    orderProductMap[item.product.id] = new Set();
                }
                productSales[item.product.id].quantity += item.quantity;
                productSales[item.product.id].revenue += item.price * item.quantity;
                orderProductMap[item.product.id].add(item.orderId);
            }
        });

        // Add order count
        Object.keys(productSales).forEach(productId => {
            productSales[productId].orders = orderProductMap[productId]?.size || 0;
        });

        const popularProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Recent orders for activity feed
        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                items: {
                    take: 2,
                    include: {
                        product: { select: { name: true } }
                    }
                }
            }
        });

        const activityFeed = recentOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.user.name,
            customerEmail: order.user.email,
            total: order.totalAmount,
            status: order.orderStatus,
            itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
            firstProduct: order.items[0]?.product?.name || order.items[0]?.name || 'Unknown',
            createdAt: order.createdAt
        }));

        // Summary stats
        const totals = {
            totalCustomers: customers.length,
            customersWithOrders: customerStats.filter(c => c.orderCount > 0).length,
            totalRevenue: customerStats.reduce((sum, c) => sum + c.totalSpent, 0),
            averageCustomerValue: customerStats.filter(c => c.totalSpent > 0).length > 0
                ? Math.round(customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / customerStats.filter(c => c.totalSpent > 0).length)
                : 0,
            newCustomersThisMonth: customers.filter(c => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return c.createdAt > monthAgo;
            }).length
        };

        return NextResponse.json({
            topCustomers,
            popularProducts,
            activityFeed,
            totals
        });

    } catch (error) {
        console.error('Customer insights error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer insights' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCustomerInsights);
}
