/**
 * HTML Email Templates for Vanam Store
 *
 * Premium, professional templates with:
 * - No emojis
 * - Mobile-first responsive design
 * - Inline styles for maximum email client compatibility
 * - Clean typographic hierarchy
 */

// ==================== BRAND TOKENS ====================

const BRAND_GREEN = '#2d6a4f';
const BRAND_LIGHT = '#52b788';
const BRAND_DARK = '#1b4332';
const TEXT_PRIMARY = '#1a1a2e';
const TEXT_SECONDARY = '#4a5568';
const TEXT_MUTED = '#718096';
const BG_PAGE = '#f4f6f4';
const BG_CARD = '#ffffff';
const BORDER_COLOR = '#e2e8f0';

// ==================== SHARED LAYOUT ====================

function emailLayout(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <style>
        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 12px 8px !important; }
            .email-card { border-radius: 8px !important; }
            .email-header { padding: 28px 20px !important; }
            .email-body { padding: 28px 20px !important; }
            .email-footer { padding: 20px !important; }
            .order-table td, .order-table th { font-size: 13px !important; padding: 8px 4px !important; }
            .total-row td { font-size: 16px !important; }
            .order-number { font-size: 20px !important; }
            .section-title { font-size: 13px !important; }
            .item-name { font-size: 13px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:${BG_PAGE};font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_PAGE};">
        <tr>
            <td class="email-wrapper" align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

                    <!-- Header -->
                    <tr>
                        <td class="email-header" style="background-color:${BRAND_DARK};padding:36px 40px;text-align:center;border-radius:12px 12px 0 0;">
                            <p style="margin:0 0 6px;color:${BRAND_LIGHT};font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Rooted in Nature</p>
                            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:normal;letter-spacing:2px;font-family:Georgia,'Times New Roman',serif;">VANAM STORE</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="email-card" style="background-color:${BG_CARD};border-left:1px solid ${BORDER_COLOR};border-right:1px solid ${BORDER_COLOR};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td class="email-body" style="padding:40px;">
                                        ${content}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="email-footer" style="background-color:#f8faf8;padding:28px 40px;text-align:center;border:1px solid ${BORDER_COLOR};border-top:none;border-radius:0 0 12px 12px;">
                            <p style="margin:0 0 6px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.5px;">Questions? We are here to help.</p>
                            <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;">
                                <a href="mailto:vanamstore@gmail.com" style="color:${BRAND_GREEN};text-decoration:none;">vanamstore@gmail.com</a>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <a href="tel:+918897249374" style="color:${BRAND_GREEN};text-decoration:none;">+91 88972 49374</a>
                            </p>
                            <p style="margin:8px 0 0;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;">
                                <a href="https://wa.me/918897249374" style="color:${BRAND_GREEN};text-decoration:none;">Chat on WhatsApp</a>
                            </p>
                            <p style="margin:16px 0 0;color:#a0aec0;font-size:11px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.5px;">
                                &copy; ${new Date().getFullYear()} Vanam Store. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ==================== ORDER CONFIRMATION ====================

interface OrderConfirmationData {
    orderNumber: string;
    customerName: string;
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
        size?: string | null;
        selectedColor?: string | null;
    }[];
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
    const itemRows = data.items.map(item => `
        <tr>
            <td class="order-table" style="padding:14px 0;border-bottom:1px solid ${BORDER_COLOR};vertical-align:top;">
                <p class="item-name" style="margin:0 0 3px;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;font-weight:600;">${item.name}</p>
                ${item.size ? `<p style="margin:0;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;">Size: ${item.size}</p>` : ''}
                ${item.selectedColor ? `<p style="margin:0;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;">Colour: ${item.selectedColor}</p>` : ''}
            </td>
            <td class="order-table" style="padding:14px 8px;border-bottom:1px solid ${BORDER_COLOR};text-align:center;vertical-align:top;color:${TEXT_SECONDARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">${item.quantity}</td>
            <td class="order-table" style="padding:14px 0;border-bottom:1px solid ${BORDER_COLOR};text-align:right;vertical-align:top;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;font-weight:600;white-space:nowrap;">Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const content = `
        <!-- Greeting -->
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">Order Confirmation</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Thank you, ${data.customerName}.</h2>
        <p style="margin:0 0 32px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Your order has been received and is being prepared. We will notify you once it is on its way.</p>

        <!-- Order Number Banner -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr>
                <td style="background-color:#f0f7f4;border-left:4px solid ${BRAND_GREEN};padding:16px 20px;border-radius:0 6px 6px 0;">
                    <p style="margin:0 0 2px;color:${TEXT_MUTED};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Order Reference</p>
                    <p class="order-number" style="margin:0;font-size:22px;font-weight:700;color:${BRAND_DARK};font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;">${data.orderNumber}</p>
                </td>
            </tr>
        </table>

        <!-- Order Items -->
        <p class="section-title" style="margin:0 0 12px;color:${TEXT_MUTED};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;border-bottom:1px solid ${BORDER_COLOR};padding-bottom:10px;">Items Ordered</p>
        <table class="order-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:0;">
            <thead>
                <tr>
                    <th style="padding:0 0 10px;text-align:left;color:${TEXT_MUTED};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;font-weight:normal;">Product</th>
                    <th style="padding:0 8px 10px;text-align:center;color:${TEXT_MUTED};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;font-weight:normal;">Qty</th>
                    <th style="padding:0 0 10px;text-align:right;color:${TEXT_MUTED};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;font-weight:normal;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>

        <!-- Totals -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
            <tr>
                <td style="padding:6px 0;color:${TEXT_SECONDARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Subtotal</td>
                <td style="padding:6px 0;text-align:right;color:${TEXT_PRIMARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Rs. ${data.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${data.discountAmount > 0 ? `
            <tr>
                <td style="padding:6px 0;color:${BRAND_GREEN};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Discount${data.couponCode ? ` (${data.couponCode})` : ''}</td>
                <td style="padding:6px 0;text-align:right;color:${BRAND_GREEN};font-size:13px;font-family:Arial,Helvetica,sans-serif;">- Rs. ${data.discountAmount.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
                <td style="padding:6px 0;color:${TEXT_SECONDARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Delivery</td>
                <td style="padding:6px 0;text-align:right;color:${data.shippingCost === 0 ? BRAND_GREEN : TEXT_PRIMARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">${data.shippingCost === 0 ? 'Free' : 'Rs. ' + data.shippingCost.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total-row">
                <td style="padding:14px 0 0;color:${TEXT_PRIMARY};font-size:18px;font-weight:700;border-top:2px solid ${TEXT_PRIMARY};font-family:Arial,Helvetica,sans-serif;">Total Paid</td>
                <td style="padding:14px 0 0;text-align:right;color:${BRAND_DARK};font-size:18px;font-weight:700;border-top:2px solid ${TEXT_PRIMARY};font-family:Arial,Helvetica,sans-serif;">Rs. ${data.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
        </table>

        <!-- Divider -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
            <tr><td style="border-top:1px solid ${BORDER_COLOR};"></td></tr>
        </table>

        <!-- Delivery Address -->
        <p class="section-title" style="margin:0 0 12px;color:${TEXT_MUTED};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Delivery Address</p>
        <p style="margin:0;color:${TEXT_SECONDARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;line-height:1.8;">
            <strong style="color:${TEXT_PRIMARY};">${data.customerName}</strong><br>
            ${data.address}<br>
            ${data.city}, ${data.state} &mdash; ${data.pincode}
        </p>

        <!-- Divider -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
            <tr><td style="border-top:1px solid ${BORDER_COLOR};"></td></tr>
        </table>

        <!-- Delivery Notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="background-color:#f8faf8;border:1px solid #d1e7d8;border-radius:6px;padding:16px 20px;text-align:center;">
                    <p style="margin:0;color:${BRAND_DARK};font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
                        Estimated delivery within <strong>3 to 7 business days</strong>.<br>
                        <span style="color:${TEXT_MUTED};font-size:12px;">You will receive a shipping notification once your order is dispatched.</span>
                    </p>
                </td>
            </tr>
        </table>
    `;

    return emailLayout('Order Confirmed — Vanam Store', content);
}

// ==================== ORDER STATUS UPDATE ====================

interface OrderStatusData {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    statusLabel: string;
    trackingNumber?: string | null;
    courierName?: string | null;
}

export function orderStatusUpdateTemplate(data: OrderStatusData): string {
    const statusColors: Record<string, string> = {
        'PACKING': '#b45309',
        'SHIPPED': '#1d4ed8',
        'DELIVERED': BRAND_GREEN,
        'CANCELLED': '#b91c1c',
        'REFUNDED': '#6d28d9',
    };

    const statusDescriptions: Record<string, string> = {
        'PACKING': 'Your order is being carefully packed and will be dispatched soon.',
        'SHIPPED': 'Your order is on its way. Please keep an eye out for delivery.',
        'DELIVERED': 'Your order has been delivered. We hope you love your plants.',
        'CANCELLED': 'Your order has been cancelled. If you have any questions, please contact us.',
        'REFUNDED': 'Your refund has been processed. It may take 5 to 7 business days to reflect.',
    };

    const color = statusColors[data.status] || BRAND_GREEN;
    const description = statusDescriptions[data.status] || 'Your order status has been updated.';

    const trackingInfo = data.status === 'SHIPPED' && data.trackingNumber ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
            <tr>
                <td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px 20px;">
                    <p style="margin:0 0 8px;color:#1e40af;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Tracking Information</p>
                    ${data.courierName ? `<p style="margin:0 0 4px;color:${TEXT_SECONDARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Courier: <strong>${data.courierName}</strong></p>` : ''}
                    <p style="margin:0;color:${TEXT_SECONDARY};font-size:13px;font-family:Arial,Helvetica,sans-serif;">Tracking Number: <strong style="color:${TEXT_PRIMARY};letter-spacing:1px;">${data.trackingNumber}</strong></p>
                </td>
            </tr>
        </table>
    ` : '';

    const content = `
        <!-- Greeting -->
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">Order Update</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Hello, ${data.customerName}.</h2>
        <p style="margin:0 0 32px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">${description}</p>

        <!-- Status Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
                <td style="background-color:#f8faf8;border:1px solid ${BORDER_COLOR};border-radius:8px;padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;padding-bottom:10px;">Order Reference</td>
                            <td style="text-align:right;font-weight:700;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;padding-bottom:10px;">${data.orderNumber}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;padding-bottom:10px;border-top:1px solid ${BORDER_COLOR};padding-top:10px;">Order Total</td>
                            <td style="text-align:right;font-weight:700;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid ${BORDER_COLOR};padding-top:10px;">Rs. ${data.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid ${BORDER_COLOR};padding-top:10px;">Status</td>
                            <td style="text-align:right;border-top:1px solid ${BORDER_COLOR};padding-top:10px;">
                                <span style="display:inline-block;padding:4px 14px;background-color:${color};color:#ffffff;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">${data.statusLabel}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        ${trackingInfo}
    `;

    return emailLayout(`Order Update — ${data.statusLabel}`, content);
}

// ==================== PASSWORD RESET ====================

interface PasswordResetData {
    userName: string;
    resetLink: string;
}

export function passwordResetTemplate(data: PasswordResetData): string {
    const content = `
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">Account Security</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Reset Your Password</h2>
        <p style="margin:0 0 32px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Hello ${data.userName}, we received a request to reset the password for your Vanam Store account. Click the button below to proceed.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
            <tr>
                <td align="center">
                    <a href="${data.resetLink}" style="display:inline-block;padding:14px 36px;background-color:${BRAND_DARK};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Reset Password</a>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
                <td style="background-color:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;">
                    <p style="margin:0;color:#78350f;font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">This link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please disregard this email. Your account remains secure.</p>
                </td>
            </tr>
        </table>

        <p style="margin:0;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;text-align:center;">If the button above does not work, copy and paste the following link into your browser:<br>
            <a href="${data.resetLink}" style="color:${BRAND_GREEN};word-break:break-all;font-size:11px;">${data.resetLink}</a>
        </p>
    `;

    return emailLayout('Reset Your Password — Vanam Store', content);
}

// ==================== ADMIN: NEW ORDER ALERT ====================

interface AdminNewOrderData {
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    city: string;
    state: string;
    paymentMethod: string;
    adminUrl: string;
}

export function adminNewOrderTemplate(data: AdminNewOrderData): string {
    const content = `
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">Admin Notification</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">New Order Received</h2>
        <p style="margin:0 0 28px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;">A new order has been placed and is awaiting processing.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
                <td style="background-color:#f0f7f4;border:1px solid #c6e6d4;border-radius:8px;padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;padding-bottom:10px;">Order Reference</td>
                            <td style="text-align:right;font-weight:700;color:${BRAND_DARK};font-size:16px;font-family:Arial,Helvetica,sans-serif;padding-bottom:10px;">${data.orderNumber}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">Customer</td>
                            <td style="text-align:right;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">${data.customerName}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">Location</td>
                            <td style="text-align:right;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">${data.city}, ${data.state}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">Payment Method</td>
                            <td style="text-align:right;color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #c6e6d4;padding-top:10px;padding-bottom:10px;">${data.paymentMethod}</td>
                        </tr>
                        <tr>
                            <td style="color:${TEXT_PRIMARY};font-size:16px;font-weight:700;font-family:Arial,Helvetica,sans-serif;border-top:2px solid ${BRAND_GREEN};padding-top:12px;">Order Total</td>
                            <td style="text-align:right;color:${BRAND_DARK};font-size:20px;font-weight:700;font-family:Arial,Helvetica,sans-serif;border-top:2px solid ${BRAND_GREEN};padding-top:12px;">Rs. ${data.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center">
                    <a href="${data.adminUrl}/admin/orders" style="display:inline-block;padding:12px 28px;background-color:${BRAND_DARK};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">View in Admin Panel</a>
                </td>
            </tr>
        </table>
    `;

    return emailLayout('New Order Alert — Vanam Store', content);
}

// ==================== ADMIN: LOW STOCK ALERT ====================

interface LowStockData {
    products: { name: string; currentStock: number; size?: string }[];
    adminUrl: string;
}

export function adminLowStockTemplate(data: LowStockData): string {
    const rows = data.products.map(p => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid ${BORDER_COLOR};color:${TEXT_PRIMARY};font-size:14px;font-family:Arial,Helvetica,sans-serif;">
                ${p.name}${p.size ? ` <span style="color:${TEXT_MUTED};font-size:12px;">(${p.size})</span>` : ''}
            </td>
            <td style="padding:12px 0;border-bottom:1px solid ${BORDER_COLOR};text-align:right;">
                <span style="display:inline-block;padding:3px 12px;background-color:${p.currentStock === 0 ? '#fef2f2' : '#fefce8'};color:${p.currentStock === 0 ? '#b91c1c' : '#78350f'};border-radius:4px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.5px;">${p.currentStock === 0 ? 'Out of Stock' : `${p.currentStock} remaining`}</span>
            </td>
        </tr>
    `).join('');

    const content = `
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">Inventory Alert</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Low Stock Warning</h2>
        <p style="margin:0 0 28px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;">${data.products.length} product${data.products.length > 1 ? 's' : ''} require${data.products.length === 1 ? 's' : ''} restocking.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <thead>
                <tr>
                    <th style="padding:0 0 10px;text-align:left;color:${TEXT_MUTED};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;font-weight:normal;border-bottom:1px solid ${BORDER_COLOR};">Product</th>
                    <th style="padding:0 0 10px;text-align:right;color:${TEXT_MUTED};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;font-weight:normal;border-bottom:1px solid ${BORDER_COLOR};">Stock Level</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td align="center">
                    <a href="${data.adminUrl}/admin/products" style="display:inline-block;padding:12px 28px;background-color:${BRAND_DARK};color:#ffffff;text-decoration:none;border-radius:4px;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Manage Inventory</a>
                </td>
            </tr>
        </table>
    `;

    return emailLayout('Low Stock Alert — Vanam Store', content);
}

// ==================== TEST EMAIL ====================

export function testEmailTemplate(): string {
    const content = `
        <p style="margin:0 0 4px;color:${TEXT_MUTED};font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;">System Check</p>
        <h2 style="margin:0 0 8px;color:${TEXT_PRIMARY};font-size:26px;font-weight:normal;font-family:Georgia,'Times New Roman',serif;">Email Configuration Verified</h2>
        <p style="margin:0 0 28px;color:${TEXT_SECONDARY};font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">Your Vanam Store email notifications are configured correctly. This is a test message sent from the admin notification settings panel.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
                <td style="background-color:#f0f7f4;border:1px solid #c6e6d4;border-radius:6px;padding:16px 20px;text-align:center;">
                    <p style="margin:0;color:${BRAND_DARK};font-size:14px;font-family:Arial,Helvetica,sans-serif;">All systems operational. No further action required.</p>
                </td>
            </tr>
        </table>
    `;

    return emailLayout('Email Configuration Test — Vanam Store', content);
}
