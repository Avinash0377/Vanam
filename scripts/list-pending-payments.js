const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const records = await prisma.pendingPayment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            razorpayOrderId: true,
            customerName: true,
            mobile: true,
            amount: true,
            status: true,
            createdAt: true,
        },
    });

    if (records.length === 0) {
        console.log('No pending payments found.');
    } else {
        console.log('\nRecent PendingPayments:\n');
        records.forEach(p => {
            console.log(`${p.status.padEnd(8)} | ₹${p.amount} | ${p.customerName} | ${p.mobile} | ${p.razorpayOrderId} | ${new Date(p.createdAt).toLocaleString('en-IN')}`);
        });
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
