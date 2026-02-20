import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in production');
    }
    console.warn('[razorpay] Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. Payment features will not work.');
}

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID || '',
    key_secret: RAZORPAY_KEY_SECRET || '',
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
    // BUG-03/04 fix: guard against empty secret or invalid hex signature
    if (!RAZORPAY_KEY_SECRET || signature.length < 64) return false;

    const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    try {
        const sigBuf = Buffer.from(signature, 'hex');
        const genBuf = Buffer.from(generatedSignature, 'hex');
        if (sigBuf.length === 0 || sigBuf.length !== genBuf.length) return false;
        return crypto.timingSafeEqual(genBuf, sigBuf);
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
    // BUG-03/04 fix: guard against empty secret or invalid hex signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || signature.length < 64) return false;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    try {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedSignature, 'hex');
        if (sigBuf.length === 0 || sigBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(expBuf, sigBuf);
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
