/**
 * Shared Payment Finalization Logic
 * Used by both /api/payments/verify AND /api/webhooks/razorpay
 * 
 * This ensures order creation is NEVER duplicated and follows
 * the same logic regardless of how payment is confirmed.
 */

import prisma from '@/lib/prisma';
import {
    CartSnapshotItem,
    calculateOrderTotals,
    generateOrderNumber,
    createOrderItems,
    decrementStock,
    validateStockAvailability
} from '@/lib/order-utils';

export interface FinalizePaymentResult {
    success: boolean;
    orderNumber?: string;
    error?: string;
    alreadyProcessed?: boolean;
}

/**
 * Finalize a payment and create an order.
 * 
 * IDEMPOTENCY: If payment is already SUCCESS, returns existing order info.
 * ATOMICITY: All operations happen in a single transaction.
 * 
 * @param razorpayOrderId - The Razorpay order ID
 * @param razorpayPaymentId - The Razorpay payment ID
 * @param razorpaySignature - The Razorpay signature (optional for webhooks)
 * @param source - 'verify' or 'webhook' for logging
 */
export async function finalizePayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string | null,
    source: 'verify' | 'webhook'
): Promise<FinalizePaymentResult> {
    try {
        // 1. Find pending payment
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { razorpayOrderId },
        });

        if (!pendingPayment) {
            console.log(`[${source}] PendingPayment not found: ${razorpayOrderId}`);
            return { success: false, error: 'Payment record not found' };
        }

        // 2. IDEMPOTENCY: Check if already processed
        if (pendingPayment.status === 'SUCCESS') {
            // Find the order that was already created
            const existingPayment = await prisma.payment.findUnique({
                where: { razorpayOrderId },
                include: { order: true },
            });

            console.log(`[${source}] Payment already processed: ${razorpayOrderId}`);
            return {
                success: true,
                orderNumber: existingPayment?.order?.orderNumber,
                alreadyProcessed: true,
            };
        }

        if (pendingPayment.status === 'FAILED') {
            console.log(`[${source}] Payment already failed: ${razorpayOrderId}`);
            return { success: false, error: 'Payment has already failed' };
        }

        // 3. Parse cart snapshot
        const cartSnapshot: CartSnapshotItem[] = JSON.parse(pendingPayment.cartSnapshot);

        if (!cartSnapshot || cartSnapshot.length === 0) {
            return { success: false, error: 'Invalid cart data' };
        }

        // 4. Re-validate pincode (may have been deactivated since payment was initiated)
        const serviceablePincode = await prisma.serviceablePincode.findFirst({
            where: { pincode: pendingPayment.pincode, isActive: true },
        });

        if (!serviceablePincode) {
            console.log(`[${source}] Pincode ${pendingPayment.pincode} no longer serviceable`);
            return { success: false, error: 'Delivery not available in this area.' };
        }

        // 5. Calculate totals
        const { subtotal, shippingCost, totalAmount } = calculateOrderTotals(cartSnapshot);

        // 6. Generate order number
        const orderNumber = generateOrderNumber();

        // 7. ATOMIC TRANSACTION: Validate stock, create order, payment, decrement stock, clear cart
        const order = await prisma.$transaction(async (tx) => {
            // Re-validate stock INSIDE transaction to prevent TOCTOU race conditions
            await validateStockAvailability(cartSnapshot, tx);

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId: pendingPayment.userId,
                    customerName: pendingPayment.customerName,
                    mobile: pendingPayment.mobile,
                    email: pendingPayment.email,
                    address: pendingPayment.address,
                    city: pendingPayment.city,
                    state: pendingPayment.state,
                    pincode: pendingPayment.pincode,
                    subtotal,
                    shippingCost,
                    totalAmount,
                    paymentMethod: pendingPayment.paymentMethod,
                    orderStatus: 'PAID',
                    notes: pendingPayment.notes,
                },
            });

            // Create order items
            await createOrderItems(tx, newOrder.id, cartSnapshot);

            // Decrement stock using shared logic
            await decrementStock(tx, cartSnapshot);

            // Create successful payment record
            await tx.payment.create({
                data: {
                    orderId: newOrder.id,
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature: razorpaySignature || `webhook_${source}`,
                    amount: pendingPayment.amount,
                    currency: pendingPayment.currency,
                    status: 'SUCCESS',
                },
            });

            // Mark pending payment as SUCCESS
            await tx.pendingPayment.update({
                where: { id: pendingPayment.id },
                data: { status: 'SUCCESS' },
            });

            // Clear user's cart
            await tx.cart.deleteMany({ where: { userId: pendingPayment.userId } });

            return newOrder;
        });

        console.log(`[${source}] Payment finalized successfully: ${razorpayOrderId} -> ${order.orderNumber}`);

        return {
            success: true,
            orderNumber: order.orderNumber,
        };

    } catch (error) {
        console.error(`[${source}] Error finalizing payment:`, error);
        return { success: false, error: 'Failed to finalize payment' };
    }
}

/**
 * Mark a pending payment as failed
 */
export async function markPendingPaymentFailed(
    razorpayOrderId: string,
    source: 'verify' | 'webhook'
): Promise<void> {
    try {
        await prisma.pendingPayment.updateMany({
            where: { razorpayOrderId, status: 'PENDING' },
            data: { status: 'FAILED' },
        });
        console.log(`[${source}] Marked payment as FAILED: ${razorpayOrderId}`);
    } catch (e) {
        console.error(`[${source}] Failed to mark payment as failed:`, e);
    }
}
