import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import { orderSchema } from '@/lib/validators';
import { ProductWithVariants, getVariantPrice, getVariantStock } from '@/lib/variants';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// POST create Razorpay order for payment
// SECURITY: Backend fetches cart and calculates total - frontend is UNTRUSTED
async function createPaymentOrder(request: NextRequest, user: JWTPayload) {
    try {
        // Rate limit: 10 payment attempts per 15 minutes per user
        const rateLimitKey = `payment-create:${user.userId}`;
        const rateCheck = checkRateLimit(rateLimitKey, { maxRequests: 10, windowSeconds: 15 * 60 });
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many payment attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // Validate shipping info
        const validation = orderSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const {
            customerName,
            mobile,
            email,
            address,
            city,
            state,
            pincode,
            notes,
            paymentMethod,
        } = validation.data;

        // Validate pincode is serviceable
        const serviceablePincode = await prisma.serviceablePincode.findFirst({
            where: { pincode, isActive: true },
        });

        if (!serviceablePincode) {
            return NextResponse.json(
                { error: 'Delivery not available in this area.' },
                { status: 400 }
            );
        }

        // SECURITY: Fetch cart items from MongoDB (NOT from frontend)
        const cartItems = await prisma.cart.findMany({
            where: { userId: user.userId },
            include: {
                product: true,
                combo: true,
                hamper: true,
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json(
                { error: 'Cart is empty' },
                { status: 400 }
            );
        }

        // SECURITY: Calculate total from DB prices (variant-aware)
        let subtotal = 0;
        const cartSnapshot: Array<{
            productId?: string;
            comboId?: string;
            hamperId?: string;
            name: string;
            price: number;
            quantity: number;
            image: string | null;
            size?: string;
            selectedColor?: string;
            colorImage?: string;
            customMessage?: string;
        }> = [];

        for (const item of cartItems) {
            let stock = 0;
            let price = 0;
            let name = '';
            let image: string | null = null;

            if (item.product) {
                const productWithVariants = item.product as unknown as ProductWithVariants;

                // Validate product is active
                if (productWithVariants.status !== 'ACTIVE') {
                    return NextResponse.json(
                        { error: `${item.product.name} is no longer available` },
                        { status: 400 }
                    );
                }

                stock = getVariantStock(productWithVariants, item.size);
                price = getVariantPrice(productWithVariants, item.size);
                name = item.product.name;
                image = item.colorImage || item.product.images[0] || null;
            } else if (item.combo) {
                if (item.combo.status !== 'ACTIVE') {
                    return NextResponse.json(
                        { error: `${item.combo.name} is no longer available` },
                        { status: 400 }
                    );
                }
                stock = item.combo.stock;
                price = item.combo.price;
                name = item.combo.name;
                image = item.combo.images[0] || null;
            } else if (item.hamper) {
                if (item.hamper.status !== 'ACTIVE') {
                    return NextResponse.json(
                        { error: `${item.hamper.name} is no longer available` },
                        { status: 400 }
                    );
                }
                stock = item.hamper.stock;
                price = item.hamper.price;
                name = item.hamper.name;
                image = item.hamper.images[0] || null;
            }

            // Validate stock
            if (stock < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${name}${item.size ? ` (${item.size})` : ''}` },
                    { status: 400 }
                );
            }

            subtotal += price * item.quantity;

            // Store cart snapshot for order creation after payment
            cartSnapshot.push({
                productId: item.productId || undefined,
                comboId: item.comboId || undefined,
                hamperId: item.hamperId || undefined,
                name,
                price,
                quantity: item.quantity,
                image,
                size: item.size || undefined,
                selectedColor: item.selectedColor || undefined,
                colorImage: item.colorImage || undefined,
                customMessage: item.customMessage || undefined,
            });
        }

        const shippingCost = subtotal >= 999 ? 0 : 99;
        const totalAmount = subtotal + shippingCost;

        // Generate unique receipt ID
        const receiptId = `VAN${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: totalAmount,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                userId: user.userId,
                customerName,
                mobile,
            },
        });

        // Save PendingPayment record with shipping info and cart snapshot
        await prisma.pendingPayment.create({
            data: {
                userId: user.userId,
                razorpayOrderId: razorpayOrder.id,
                amount: totalAmount,
                currency: 'INR',
                status: 'PENDING',
                customerName,
                mobile,
                email: email || null,
                address,
                city,
                state,
                pincode,
                notes: notes || null,
                paymentMethod: paymentMethod || 'RAZORPAY',
                cartSnapshot: JSON.stringify(cartSnapshot),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            },
        });

        // SECURITY: Return only necessary data
        // Frontend receives razorpayOrderId and keyId - NOT the secret
        return NextResponse.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount, // In paise
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            receiptId,
            prefill: {
                name: customerName,
                email: email || '',
                contact: mobile,
            },
        });

    } catch (error) {
        console.error('Create payment order error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment order' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, createPaymentOrder);
}
