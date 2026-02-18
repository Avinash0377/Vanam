const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Search for the customer by name or mobile
    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { customerName: { contains: 'PRANATHI', mode: 'insensitive' } },
                { customerName: { contains: 'CHINNAPUREDDY', mode: 'insensitive' } },
                { mobile: '9' }, // partial - will show all
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
            orderNumber: true,
            customerName: true,
            mobile: true,
            totalAmount: true,
            orderStatus: true,
            paymentMethod: true,
            createdAt: true,
        },
    });

    console.log('\n=== Recent Orders ===\n');
    if (orders.length === 0) {
        console.log('No orders found.');
    } else {
        orders.forEach(o => {
            console.log(`${o.orderStatus.padEnd(10)} | ₹${o.totalAmount} | ${o.customerName} | ${o.mobile} | ${o.orderNumber} | ${new Date(o.createdAt).toLocaleString('en-IN')}`);
        });
    }

    // Also show all orders from Feb 18
    const feb18Start = new Date('2026-02-18T00:00:00.000Z');
    const feb18End = new Date('2026-02-18T23:59:59.999Z');

    const todayOrders = await prisma.order.findMany({
        where: {
            createdAt: { gte: feb18Start, lte: feb18End },
        },
        orderBy: { createdAt: 'desc' },
        select: {
            orderNumber: true,
            customerName: true,
            mobile: true,
            totalAmount: true,
            orderStatus: true,
            createdAt: true,
        },
    });

    console.log('\n=== Orders from Feb 18, 2026 ===\n');
    if (todayOrders.length === 0) {
        console.log('No orders found for Feb 18.');
    } else {
        todayOrders.forEach(o => {
            console.log(`${o.orderStatus.padEnd(10)} | ₹${o.totalAmount} | ${o.customerName} | ${o.mobile} | ${o.orderNumber} | ${new Date(o.createdAt).toLocaleString('en-IN')}`);
        });
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
