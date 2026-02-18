/**
 * recover-pending-order.js
 * 
 * Use this script to check and recover a pending payment that was paid
 * but whose order was not created (e.g., customer closed browser after UPI payment).
 * 
 * Usage:
 *   node scripts/recover-pending-order.js <razorpay_order_id>
 * 
 * Example:
 *   node scripts/recover-pending-order.js order_XXXXXXXXXX
 * 
 * To find the Razorpay Order ID:
 *   - Go to Razorpay Dashboard > Orders
 *   - Search by amount or date
 *   - The order ID starts with "order_"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recoverPendingOrder() {
    const razorpayOrderId = process.argv[2];

    if (!razorpayOrderId) {
        console.log('\n❌ Usage: node scripts/recover-pending-order.js <razorpay_order_id>');
        console.log('   Example: node scripts/recover-pending-order.js order_XXXXXXXXXX\n');
        console.log('📋 To find the Razorpay Order ID:');
        console.log('   1. Go to https://dashboard.razorpay.com/app/orders');
        console.log('   2. Search by amount (₹348) or date (18 Feb 2026)');
        console.log('   3. The order ID starts with "order_"\n');
        process.exit(1);
    }

    console.log(`\n🔍 Looking up PendingPayment for: ${razorpayOrderId}\n`);

    try {
        // 1. Find the PendingPayment
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { razorpayOrderId },
        });

        if (!pendingPayment) {
            console.log('❌ No PendingPayment found for this Razorpay Order ID.');
            console.log('   This could mean:');
            console.log('   - The order ID is wrong');
            console.log('   - The PendingPayment was already cleaned up');
            console.log('\n📋 Listing recent PendingPayments (last 10):\n');

            const recent = await prisma.pendingPayment.findMany({
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

            if (recent.length === 0) {
                console.log('   No PendingPayments found in database.');
            } else {
                recent.forEach(p => {
                    console.log(`   ${p.status} | ₹${p.amount} | ${p.customerName} | ${p.mobile} | ${p.razorpayOrderId} | ${p.createdAt.toLocaleString('en-IN')}`);
                });
            }
            return;
        }

        // 2. Show the PendingPayment details
        console.log('✅ Found PendingPayment:');
        console.log(`   Customer: ${pendingPayment.customerName}`);
        console.log(`   Mobile:   ${pendingPayment.mobile}`);
        console.log(`   Email:    ${pendingPayment.email || 'N/A'}`);
        console.log(`   Amount:   ₹${pendingPayment.amount}`);
        console.log(`   Status:   ${pendingPayment.status}`);
        console.log(`   Created:  ${pendingPayment.createdAt.toLocaleString('en-IN')}`);
        console.log(`   Expires:  ${pendingPayment.expiresAt?.toLocaleString('en-IN') || 'N/A'}`);

        // 3. Check if order already exists
        const existingPayment = await prisma.payment.findUnique({
            where: { razorpayOrderId },
            include: { order: true },
        });

        if (existingPayment) {
            console.log(`\n✅ Order already exists: ${existingPayment.order?.orderNumber}`);
            console.log(`   Order Status: ${existingPayment.order?.orderStatus}`);
            console.log('   No recovery needed.\n');
            return;
        }

        if (pendingPayment.status === 'SUCCESS') {
            console.log('\n⚠️  PendingPayment is marked SUCCESS but no Order found!');
            console.log('   This is a data inconsistency. Contact developer.\n');
            return;
        }

        if (pendingPayment.status === 'FAILED') {
            console.log('\n❌ PendingPayment is marked FAILED.');
            console.log('   The payment may have been rejected or expired.\n');
            return;
        }

        // 4. Status is PENDING — show recovery instructions
        console.log('\n⚠️  PendingPayment status is PENDING — order was NOT created.');
        console.log('\n📋 RECOVERY OPTIONS:\n');
        console.log('Option 1 (Recommended): Trigger via Razorpay Dashboard');
        console.log('   1. Go to https://dashboard.razorpay.com/app/orders');
        console.log(`   2. Find order: ${razorpayOrderId}`);
        console.log('   3. Click "Retry Webhook" to re-send the payment.captured event');
        console.log('   4. Your webhook at /api/webhooks/razorpay will create the order\n');
        console.log('Option 2: Manual order creation via admin panel');
        console.log('   - Go to /admin/orders and create a manual order for this customer\n');
        console.log('Customer details for manual order:');
        console.log(`   Name:    ${pendingPayment.customerName}`);
        console.log(`   Mobile:  ${pendingPayment.mobile}`);
        console.log(`   Address: ${pendingPayment.address}, ${pendingPayment.city}, ${pendingPayment.state} - ${pendingPayment.pincode}`);
        console.log(`   Amount:  ₹${pendingPayment.amount}`);
        const cart = JSON.parse(pendingPayment.cartSnapshot);
        console.log('   Items:');
        cart.forEach(item => {
            console.log(`     - ${item.name} x${item.quantity} @ ₹${item.price}${item.size ? ` (${item.size})` : ''}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recoverPendingOrder();
