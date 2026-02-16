const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    console.log('--- Cleaning test data (schema untouched) ---\n');

    const oi = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${oi.count} order items`);

    const p = await prisma.payment.deleteMany({});
    console.log(`Deleted ${p.count} payments`);

    const o = await prisma.order.deleteMany({});
    console.log(`Deleted ${o.count} orders`);

    const pp = await prisma.pendingPayment.deleteMany({});
    console.log(`Deleted ${pp.count} pending payments`);

    const c = await prisma.cart.deleteMany({});
    console.log(`Deleted ${c.count} cart items`);

    const u = await prisma.user.deleteMany({});
    console.log(`Deleted ${u.count} users`);

    console.log('\n--- Done! All test data cleared. Schema is unchanged. ---');
    await prisma.$disconnect();
}

clean().catch(e => {
    console.error(e);
    process.exit(1);
});
