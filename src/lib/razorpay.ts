import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface CreateOrderOptions {
    amount: number; // Amount in rupees
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
    options: CreateOrderOptions
): Promise<RazorpayOrder> {
    const order = await razorpay.orders.create({
        amount: Math.round(options.amount * 100), // Convert to paise
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes || {},
    });

    return order as RazorpayOrder;
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): boolean {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(generatedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );
    } catch {
        return false;
    }
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
    body: string,
    signature: string
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(body)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );
    } catch {
        return false;
    }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPayment(paymentId: string) {
    return razorpay.payments.fetch(paymentId);
}

export default razorpay;
