import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
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

        // Only line items from non-cancelled orders count as sales. Filter at the DB
        // level and select just the scalar fields we need instead of loading every
        // related product/category/order object into memory.
        const orderItems = await prisma.orderItem.findMany({
            where: {
                productId: { not: null },
                order: { orderStatus: { not: OrderStatus.CANCELLED } },
            },
            select: {
                orderId: true,
                price: true,
                quantity: true,
                product: { select: { id: true, name: true, categoryId: true } },
            },
        });

        // Aggregate sales data by category
        const categoryStats = categories.map(category => {
            const categoryOrderItems = orderItems.filter(
                item => item.product?.categoryId === category.id
            );

            const totalSales = categoryOrderItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );

            const totalOrders = new Set(
                categoryOrderItems.map(item => item.orderId)
            ).size;

            const totalQuantitySold = categoryOrderItems.reduce(
                (sum, item) => sum + item.quantity,
                0
            );

            // Calculate stock value
            const stockValue = category.products.reduce((sum, product) => {
                return sum + (product.price * product.stock);
            }, 0);

            // Top selling product in category
            const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
            categoryOrderItems.forEach(item => {
                if (item.product) {
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
            totalOrders: new Set(orderItems.map(i => i.orderId)).size,
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
