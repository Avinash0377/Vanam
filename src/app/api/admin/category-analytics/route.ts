import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';

async function getCategoryAnalytics(request: NextRequest) {

    try {
        // Get all categories with product counts
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                },
                products: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock: true,
                    }
                }
            }
        });

        // Get order items to calculate sales per category
        const orderItems = await prisma.orderItem.findMany({
            include: {
                product: {
                    include: {
                        category: true
                    }
                },
                order: {
                    select: {
                        orderStatus: true,
                        createdAt: true
                    }
                }
            }
        });

        // Aggregate sales data by category
        const categoryStats = categories.map(category => {
            const categoryOrderItems = orderItems.filter(
                item => item.product?.category?.id === category.id
            );

            const totalSales = categoryOrderItems.reduce((sum, item) => {
                if (item.order.orderStatus !== 'CANCELLED') {
                    return sum + (item.price * item.quantity);
                }
                return sum;
            }, 0);

            const totalOrders = new Set(
                categoryOrderItems
                    .filter(item => item.order.orderStatus !== 'CANCELLED')
                    .map(item => item.orderId)
            ).size;

            const totalQuantitySold = categoryOrderItems.reduce((sum, item) => {
                if (item.order.orderStatus !== 'CANCELLED') {
                    return sum + item.quantity;
                }
                return sum;
            }, 0);

            // Calculate stock value
            const stockValue = category.products.reduce((sum, product) => {
                return sum + (product.price * product.stock);
            }, 0);

            // Top selling product in category
            const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
            categoryOrderItems.forEach(item => {
                if (item.product && item.order.orderStatus !== 'CANCELLED') {
                    if (!productSales[item.product.id]) {
                        productSales[item.product.id] = {
                            name: item.product.name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[item.product.id].quantity += item.quantity;
                    productSales[item.product.id].revenue += item.price * item.quantity;
                }
            });

            const topProducts = Object.values(productSales)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3);

            return {
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                productCount: category._count.products,
                totalSales,
                totalOrders,
                totalQuantitySold,
                stockValue,
                topProducts,
                averageOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
            };
        });

        // Sort by total sales descending
        categoryStats.sort((a, b) => b.totalSales - a.totalSales);

        // Calculate totals
        const totals = {
            totalCategories: categories.length,
            totalProducts: categories.reduce((sum, cat) => sum + cat._count.products, 0),
            totalRevenue: categoryStats.reduce((sum, cat) => sum + cat.totalSales, 0),
            totalOrders: new Set(orderItems.filter(i => i.order.orderStatus !== 'CANCELLED').map(i => i.orderId)).size,
        };

        return NextResponse.json({
            categories: categoryStats,
            totals
        });

    } catch (error) {
        console.error('Category analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch category analytics' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, getCategoryAnalytics);
}
