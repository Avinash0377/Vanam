/**
 * Centralized Email Utility
 * 
 * Uses Resend API for transactional emails.
 * All email sends are fire-and-forget — failures are logged but never break calling flow.
 */

import { Resend } from 'resend';
import prisma from '@/lib/prisma';
import {
    orderConfirmationTemplate,
    orderStatusUpdateTemplate,
    passwordResetTemplate,
    adminNewOrderTemplate,
    adminLowStockTemplate,
    testEmailTemplate,
} from '@/lib/email-templates';

// ==================== RESEND CLIENT ====================

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Vanam Store <onboarding@resend.dev>';

// ==================== BASE SEND FUNCTION ====================

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.log('[email] RESEND_API_KEY not configured, skipping email:', subject);
        return false;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error(`[email] Resend error for "${subject}" to ${to}:`, error);
            return false;
        }

        console.log(`[email] Sent: "${subject}" to ${to} (${data?.id})`);
        return true;
    } catch (error) {
        console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
        return false;
    }
}

// ==================== NOTIFICATION SETTINGS HELPER ====================

interface NotificationSettingsData {
    adminEmail: string;
    orderAlertsEnabled: boolean;
    lowStockAlertsEnabled: boolean;
    customerEmailsEnabled: boolean;
    lowStockThreshold: number;
}

async function getNotificationSettings(): Promise<NotificationSettingsData> {
    try {
        const settings = await prisma.notificationSettings.findFirst();
        if (settings) return settings;
    } catch {
        // Model might not exist yet
    }
    return {
        adminEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || '',
        orderAlertsEnabled: true,
        lowStockAlertsEnabled: true,
        customerEmailsEnabled: true,
        lowStockThreshold: 5,
    };
}

// ==================== CUSTOMER EMAILS ====================

interface OrderEmailData {
    orderNumber: string;
    customerName: string;
    email?: string | null;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    totalAmount: number;
    couponCode?: string | null;
    items: {
        name: string;
        quantity: number;
        price: number;
        image?: string | null;
        size?: string | null;
        selectedColor?: string | null;
    }[];
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<void> {
    const settings = await getNotificationSettings();
    if (!settings.customerEmailsEnabled) return;
    if (!orderData.email) {
        console.log('[email] No customer email, skipping order confirmation');
        return;
    }

    const html = orderConfirmationTemplate(orderData);
    await sendEmail({
        to: orderData.email,
        subject: `Order Confirmed! #${orderData.orderNumber} — Vanam Store`,
        html,
    });
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusEmail(
    orderData: {
        orderNumber: string;
        customerName: string;
        email?: string | null;
        totalAmount: number;
        trackingNumber?: string | null;
        courierName?: string | null;
    },
    newStatus: string
): Promise<void> {
    const settings = await getNotificationSettings();
    if (!settings.customerEmailsEnabled) return;
    if (!orderData.email) return;

    const statusLabels: Record<string, string> = {
        'PACKING': 'Your order is being packed',
        'SHIPPED': 'Your order has been shipped',
        'DELIVERED': 'Your order has been delivered',
        'CANCELLED': 'Your order has been cancelled',
        'REFUNDED': 'Your order has been refunded',
    };

    const statusLabel = statusLabels[newStatus];
    if (!statusLabel) return; // Don't email for PENDING/PAID status changes

    const html = orderStatusUpdateTemplate({
        ...orderData,
        status: newStatus,
        statusLabel,
    });

    await sendEmail({
        to: orderData.email,
        subject: `${statusLabel} — Order #${orderData.orderNumber}`,
        html,
    });
}

// ==================== FORGOT PASSWORD ====================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string
): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    const html = passwordResetTemplate({ userName, resetLink });
    await sendEmail({
        to: email,
        subject: 'Reset Your Password — Vanam Store',
        html,
    });
}

// ==================== ADMIN ALERTS ====================

/**
 * Send new order alert to admin
 */
export async function sendAdminNewOrderAlert(orderData: {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    city: string;
    state: string;
    paymentMethod: string;
}): Promise<void> {
    const settings = await getNotificationSettings();
    if (!settings.orderAlertsEnabled || !settings.adminEmail) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const html = adminNewOrderTemplate({ ...orderData, adminUrl: appUrl });

    await sendEmail({
        to: settings.adminEmail,
        subject: `New Order #${orderData.orderNumber} — Rs.${orderData.totalAmount}`,
        html,
    });
}

/**
 * Check stock levels after order and alert admin if any products are low
 */
export async function checkAndSendLowStockAlerts(
    items: { productId?: string; name: string; quantity: number }[]
): Promise<void> {
    const settings = await getNotificationSettings();
    if (!settings.lowStockAlertsEnabled || !settings.adminEmail) return;

    const lowStockProducts: { name: string; currentStock: number; size?: string }[] = [];

    for (const item of items) {
        if (!item.productId) continue;

        try {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, stock: true, sizeVariants: true },
            });

            if (product) {
                // Check main stock
                if (product.stock <= settings.lowStockThreshold) {
                    lowStockProducts.push({
                        name: product.name,
                        currentStock: product.stock,
                    });
                }

                // Check variant stocks
                if (product.sizeVariants && Array.isArray(product.sizeVariants)) {
                    for (const variant of product.sizeVariants as { size?: string; stock?: number }[]) {
                        if (variant.stock !== undefined && variant.stock <= settings.lowStockThreshold) {
                            lowStockProducts.push({
                                name: product.name,
                                currentStock: variant.stock,
                                size: variant.size,
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[email] Error checking stock for ${item.name}:`, error);
        }
    }

    if (lowStockProducts.length === 0) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const html = adminLowStockTemplate({ products: lowStockProducts, adminUrl: appUrl });

    await sendEmail({
        to: settings.adminEmail,
        subject: `Low Stock Alert — ${lowStockProducts.length} product(s) need attention`,
        html,
    });
}

/**
 * Send test email to verify Resend configuration
 */
export async function sendTestEmail(to: string): Promise<boolean> {
    const html = testEmailTemplate();
    return sendEmail({
        to,
        subject: 'Test Email — Vanam Store Notifications',
        html,
    });
}
