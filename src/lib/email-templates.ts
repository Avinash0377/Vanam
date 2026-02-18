/**
 * HTML Email Templates for Vanam Store
 * 
 * All templates are mobile-responsive, branded, and inline-styled
 * for maximum email client compatibility.
 */

// ==================== SHARED LAYOUT ====================

const BRAND_COLOR = '#16a34a';
const BRAND_DARK = '#1a4d2e';
const BG_COLOR = '#f8faf9';

function emailLayout(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
        <tr>
            <td align="center" style="padding:24px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,${BRAND_DARK},${BRAND_COLOR});padding:28px 32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">🌿 Vanam Store</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding:32px 28px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f1f5f9;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;">
                            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Need help? Contact us</p>
                            <p style="margin:0 0 4px;color:#64748b;font-size:13px;">
                                📧 vanamstore@gmail.com &nbsp;|&nbsp; 📞 8897249374
                            </p>
                            <p style="margin:8px 0 0;color:#64748b;font-size:13px;">
                                <a href="https://wa.me/918897249374" style="color:${BRAND_COLOR};text-decoration:none;">💬 Chat on WhatsApp</a>
                            </p>
                            <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} Vanam Store. All rights reserved.</p>
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
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                <strong style="color:#1e293b;font-size:14px;">${item.name}</strong>
                ${item.size ? `<br/><span style="color:#64748b;font-size:12px;">Size: ${item.size}</span>` : ''}
                ${item.selectedColor ? `<br/><span style="color:#64748b;font-size:12px;">Color: ${item.selectedColor}</span>` : ''}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b;font-size:14px;">x${item.quantity}</td>
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#1e293b;font-size:14px;font-weight:600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const content = `
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">✅</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">Order Confirmed!</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Thank you for shopping with Vanam Store</p>
        </div>

        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
            <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Number</span>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:${BRAND_DARK};">${data.orderNumber}</p>
        </div>

        <h3 style="margin:0 0 12px;color:#1e293b;font-size:16px;border-bottom:2px solid ${BRAND_COLOR};padding-bottom:8px;">Order Summary</h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr style="background-color:#f8fafc;">
                <th style="padding:8px 0;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Item</th>
                <th style="padding:8px 0;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
                <th style="padding:8px 0;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Amount</th>
            </tr>
            ${itemRows}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
                <td style="padding:6px 0;color:#64748b;font-size:14px;">Subtotal</td>
                <td style="padding:6px 0;text-align:right;color:#1e293b;font-size:14px;">₹${data.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${data.discountAmount > 0 ? `
            <tr>
                <td style="padding:6px 0;color:${BRAND_COLOR};font-size:14px;">Discount${data.couponCode ? ` (${data.couponCode})` : ''}</td>
                <td style="padding:6px 0;text-align:right;color:${BRAND_COLOR};font-size:14px;">-₹${data.discountAmount.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
                <td style="padding:6px 0;color:#64748b;font-size:14px;">Delivery</td>
                <td style="padding:6px 0;text-align:right;color:#1e293b;font-size:14px;">${data.shippingCost === 0 ? '<span style="color:' + BRAND_COLOR + ';">FREE</span>' : '₹' + data.shippingCost.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
                <td style="padding:12px 0 0;color:#1e293b;font-size:18px;font-weight:700;border-top:2px solid #e2e8f0;">Total</td>
                <td style="padding:12px 0 0;text-align:right;color:${BRAND_DARK};font-size:18px;font-weight:700;border-top:2px solid #e2e8f0;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
        </table>

        <h3 style="margin:24px 0 12px;color:#1e293b;font-size:16px;border-bottom:2px solid ${BRAND_COLOR};padding-bottom:8px;">Delivery Address</h3>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
            ${data.customerName}<br/>
            ${data.address}<br/>
            ${data.city}, ${data.state} — ${data.pincode}
        </p>

        <div style="margin-top:24px;padding:16px;background-color:#eff6ff;border-radius:8px;text-align:center;">
            <p style="margin:0;color:#1e40af;font-size:14px;">📦 Expected delivery within 3–7 business days</p>
        </div>
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
        'PACKING': '#f59e0b',
        'SHIPPED': '#3b82f6',
        'DELIVERED': '#16a34a',
        'CANCELLED': '#ef4444',
        'REFUNDED': '#8b5cf6',
    };

    const statusEmoji: Record<string, string> = {
        'PACKING': '📦',
        'SHIPPED': '🚚',
        'DELIVERED': '✅',
        'CANCELLED': '❌',
        'REFUNDED': '💰',
    };

    const color = statusColors[data.status] || BRAND_COLOR;
    const emoji = statusEmoji[data.status] || '📋';

    const trackingInfo = data.status === 'SHIPPED' && data.trackingNumber ? `
        <div style="margin-top:16px;padding:16px;background-color:#eff6ff;border-radius:8px;">
            <p style="margin:0 0 4px;color:#1e40af;font-size:14px;font-weight:600;">Tracking Details</p>
            ${data.courierName ? `<p style="margin:0 0 4px;color:#475569;font-size:14px;">Courier: ${data.courierName}</p>` : ''}
            <p style="margin:0;color:#475569;font-size:14px;">Tracking Number: <strong>${data.trackingNumber}</strong></p>
        </div>
    ` : '';

    const content = `
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">${emoji}</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">${data.statusLabel}</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Hi ${data.customerName}, here's an update on your order</p>
        </div>

        <div style="background-color:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="color:#64748b;font-size:13px;">Order Number</td>
                    <td style="text-align:right;font-weight:700;color:#1e293b;font-size:14px;">${data.orderNumber}</td>
                </tr>
                <tr>
                    <td style="padding-top:8px;color:#64748b;font-size:13px;">Order Total</td>
                    <td style="padding-top:8px;text-align:right;font-weight:700;color:#1e293b;font-size:14px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding-top:8px;color:#64748b;font-size:13px;">Status</td>
                    <td style="padding-top:8px;text-align:right;">
                        <span style="display:inline-block;padding:4px 12px;background-color:${color};color:white;border-radius:12px;font-size:12px;font-weight:600;">${data.status}</span>
                    </td>
                </tr>
            </table>
        </div>

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
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">🔑</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">Reset Your Password</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Hi ${data.userName}, we received a request to reset your password</p>
        </div>

        <div style="text-align:center;margin:24px 0;">
            <a href="${data.resetLink}" style="display:inline-block;padding:14px 32px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">Reset Password</a>
        </div>

        <div style="padding:16px;background-color:#fef3c7;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#92400e;font-size:13px;">⏰ This link will expire in <strong>30 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>

        <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;text-align:center;">If the button doesn't work, copy and paste this link:<br/>
            <a href="${data.resetLink}" style="color:${BRAND_COLOR};word-break:break-all;font-size:11px;">${data.resetLink}</a>
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
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">🛒</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">New Order Received!</h2>
        </div>

        <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="color:#64748b;font-size:13px;">Order Number</td>
                    <td style="text-align:right;font-weight:700;color:${BRAND_DARK};font-size:16px;">${data.orderNumber}</td>
                </tr>
                <tr>
                    <td style="padding-top:8px;color:#64748b;font-size:13px;">Customer</td>
                    <td style="padding-top:8px;text-align:right;color:#1e293b;font-size:14px;">${data.customerName}</td>
                </tr>
                <tr>
                    <td style="padding-top:8px;color:#64748b;font-size:13px;">Location</td>
                    <td style="padding-top:8px;text-align:right;color:#1e293b;font-size:14px;">${data.city}, ${data.state}</td>
                </tr>
                <tr>
                    <td style="padding-top:8px;color:#64748b;font-size:13px;">Payment</td>
                    <td style="padding-top:8px;text-align:right;color:#1e293b;font-size:14px;">${data.paymentMethod}</td>
                </tr>
                <tr>
                    <td style="padding-top:12px;color:#1e293b;font-size:16px;font-weight:700;border-top:1px solid #bbf7d0;">Total</td>
                    <td style="padding-top:12px;text-align:right;color:${BRAND_DARK};font-size:18px;font-weight:700;border-top:1px solid #bbf7d0;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
            </table>
        </div>

        <div style="text-align:center;margin-top:20px;">
            <a href="${data.adminUrl}/admin/orders" style="display:inline-block;padding:12px 24px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View in Admin Panel</a>
        </div>
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
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;">
                ${p.name}${p.size ? ` <span style="color:#64748b;">(${p.size})</span>` : ''}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
                <span style="display:inline-block;padding:3px 10px;background-color:${p.currentStock === 0 ? '#fef2f2' : '#fef3c7'};color:${p.currentStock === 0 ? '#dc2626' : '#d97706'};border-radius:12px;font-size:13px;font-weight:600;">${p.currentStock} left</span>
            </td>
        </tr>
    `).join('');

    const content = `
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">⚠️</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">Low Stock Alert</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">${data.products.length} product(s) need restocking</p>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr style="background-color:#f8fafc;">
                <th style="padding:8px 0;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Product</th>
                <th style="padding:8px 0;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Stock</th>
            </tr>
            ${rows}
        </table>

        <div style="text-align:center;margin-top:20px;">
            <a href="${data.adminUrl}/admin/products" style="display:inline-block;padding:12px 24px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Manage Products</a>
        </div>
    `;

    return emailLayout('Low Stock Alert — Vanam Store', content);
}

// ==================== TEST EMAIL ====================

export function testEmailTemplate(): string {
    const content = `
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:48px;">✅</span>
            <h2 style="margin:12px 0 4px;color:#1e293b;font-size:22px;">Email Configuration Working!</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Your Vanam Store email notifications are set up correctly.</p>
        </div>

        <div style="padding:16px;background-color:#f0fdf4;border-radius:8px;text-align:center;">
            <p style="margin:0;color:${BRAND_DARK};font-size:14px;">This is a test email sent from the admin notification settings panel.</p>
        </div>
    `;

    return emailLayout('Test Email — Vanam Store', content);
}
