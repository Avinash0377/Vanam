'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayInstance {
    open: () => void;
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface ValidationIssue {
    itemId: string;
    itemName: string;
    type: 'product' | 'combo' | 'hamper';
    issue: 'NOT_FOUND' | 'INACTIVE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';
    message: string;
    availableStock?: number;
    requestedQuantity?: number;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { token, isAuthenticated } = useAuth();
    const { items, summary, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Cart validation state
    const [validating, setValidating] = useState(false);
    const [cartValid, setCartValid] = useState<boolean | null>(null);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

    const [formData, setFormData] = useState({
        customerName: '',
        mobile: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // Validate cart contents against database before allowing payment
    const validateCartContents = useCallback(async () => {
        if (!token || !isAuthenticated) return;

        setValidating(true);
        setCartValid(null);
        setValidationIssues([]);

        try {
            const res = await fetch('/api/cart/validate', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok) {
                setCartValid(data.valid);
                setValidationIssues(data.issues || []);
            } else {
                setCartValid(false);
                setValidationIssues([]);
                setError(data.error || 'Failed to verify cart');
            }
        } catch {
            setCartValid(false);
            setError('Could not verify cart. Please try again.');
        } finally {
            setValidating(false);
        }
    }, [token, isAuthenticated]);

    // Run validation when authenticated user loads checkout
    useEffect(() => {
        if (isAuthenticated && items.length > 0) {
            validateCartContents();
        }
    }, [isAuthenticated, items.length, validateCartContents]);

    const loadRazorpay = () => {
        return new Promise<boolean>((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isAuthenticated) {
            router.push('/login?redirect=/checkout');
            return;
        }

        // Validate form
        if (!formData.customerName || !formData.mobile || !formData.address ||
            !formData.city || !formData.state || !formData.pincode) {
            setError('Please fill in all required fields');
            return;
        }

        if (items.length === 0) {
            setError('Your cart is empty');
            return;
        }

        // Block payment if cart hasn't been validated or has issues
        if (cartValid !== true) {
            setError('Please wait — verifying your cart items...');
            await validateCartContents();
            return;
        }

        setLoading(true);

        try {
            // SECURE FLOW: Send shipping info only - backend fetches cart and calculates total
            // Frontend does NOT send price - backend is source of truth
            const paymentRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    paymentMethod: 'RAZORPAY',
                }),
            });

            const paymentData = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(paymentData.error);

            // Load Razorpay SDK
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Failed to load payment gateway');

            // Open Razorpay checkout
            const rzp = new window.Razorpay({
                key: paymentData.keyId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                name: 'Vanam Store',
                description: `Order #${paymentData.receiptId}`,
                order_id: paymentData.razorpayOrderId,
                handler: async (response: RazorpayResponse) => {
                    // Verify payment - this is where order is created
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.success) {
                            clearCart();
                            router.replace(`/order-confirmation?orderNumber=${verifyData.orderNumber}`);
                        } else {
                            setError(
                                `${verifyData.error || 'Payment verification failed.'} ` +
                                `Reference: ${paymentData.razorpayOrderId}. Please contact support with this reference.`
                            );
                        }
                    } catch (verifyErr) {
                        setLoading(false);
                        setError(
                            `Payment verification failed. Reference: ${paymentData.razorpayOrderId}. ` +
                            `Please contact support with this reference.`
                        );
                    }
                },
                prefill: paymentData.prefill,
                theme: { color: '#16a34a' },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError('Payment cancelled. You can try again.');
                    }
                }
            });

            rzp.open();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className={styles.empty}>
                <span className={styles.emptyIcon}>🛒</span>
                <h2>Your cart is empty</h2>
                <p>Add some plants before checkout</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <h1 className={styles.title}>Checkout</h1>

                {/* Login Required Section for Unauthenticated Users */}
                {!isAuthenticated && (
                    <div className={styles.loginRequired}>
                        <div className={styles.loginCard}>
                            <div className={styles.loginIcon}>🔐</div>
                            <h2>Login Required</h2>
                            <p>Please login or create an account to proceed with checkout.</p>

                            <div className={styles.loginBenefits}>
                                <div className={styles.benefit}>✓ Track your orders</div>
                                <div className={styles.benefit}>✓ Save delivery addresses</div>
                                <div className={styles.benefit}>✓ Get exclusive offers</div>
                                <div className={styles.benefit}>✓ Faster checkout next time</div>
                            </div>

                            <div className={styles.loginButtons}>
                                <button
                                    onClick={() => router.push('/login?redirect=/checkout')}
                                    className="btn btn-primary"
                                >
                                    Login to Continue
                                </button>
                                <button
                                    onClick={() => router.push('/login?mode=register&redirect=/checkout')}
                                    className="btn btn-secondary"
                                >
                                    Create Account
                                </button>
                            </div>

                            <p className={styles.guestNote}>
                                Already have items in cart? They'll be waiting for you after login.
                            </p>
                        </div>

                        {/* Show cart summary even for unauthenticated users */}
                        <div className={styles.summaryPreview}>
                            <h3>Your Cart ({items.length} items)</h3>
                            <div className={styles.summaryItems}>
                                {items.map((item) => (
                                    <div key={`${item.type}-${item.id}`} className={styles.summaryItem}>
                                        <span className={styles.summaryItemName}>
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summaryTotal}>
                                <span>Total</span>
                                <span>₹{summary.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show checkout form only for authenticated users */}
                {isAuthenticated && (
                    <>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        {/* Cart Validation Status */}
                        {validating && (
                            <div className={styles.validatingText}>
                                ⏳ Checking your cart items...
                            </div>
                        )}

                        {cartValid === true && !validating && (
                            <div className={styles.validationSuccess}>
                                ✅ All items verified and in stock
                            </div>
                        )}

                        {cartValid === false && validationIssues.length > 0 && !validating && (
                            <div className={styles.validationBanner}>
                                <h3>⚠️ Cart Issues Found</h3>
                                <div className={styles.validationIssues}>
                                    {validationIssues.map((issue) => (
                                        <div
                                            key={issue.itemId}
                                            className={`${styles.validationIssue} ${issue.issue === 'OUT_OF_STOCK' || issue.issue === 'NOT_FOUND' || issue.issue === 'INACTIVE'
                                                ? styles.critical
                                                : ''
                                                }`}
                                        >
                                            {issue.issue === 'OUT_OF_STOCK' || issue.issue === 'NOT_FOUND' || issue.issue === 'INACTIVE'
                                                ? '❌'
                                                : '⚠️'}{' '}
                                            {issue.message}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#92400e' }}>
                                    Please update your cart to fix these issues before proceeding to payment.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.layout}>
                            {/* Delivery Details */}
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>Delivery Details</h2>

                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="customerName" className={styles.label}>Full Name *</label>
                                        <input
                                            id="customerName"
                                            type="text"
                                            name="customerName"
                                            autoComplete="name"
                                            value={formData.customerName}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="mobile" className={styles.label}>Mobile Number *</label>
                                        <input
                                            id="mobile"
                                            type="tel"
                                            name="mobile"
                                            autoComplete="tel"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="10-digit mobile number"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="email" className={styles.label}>Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    <div className={styles.formGroupFull}>
                                        <label htmlFor="address" className={styles.label}>Address *</label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className={styles.textarea}
                                            placeholder="House/Flat No, Building, Street, Area"
                                            rows={3}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="city" className={styles.label}>City *</label>
                                        <input
                                            id="city"
                                            type="text"
                                            name="city"
                                            autoComplete="address-level2"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="City"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="state" className={styles.label}>State *</label>
                                        <input
                                            id="state"
                                            type="text"
                                            name="state"
                                            autoComplete="address-level1"
                                            value={formData.state}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="State"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="pincode" className={styles.label}>Pincode *</label>
                                        <input
                                            id="pincode"
                                            type="text"
                                            name="pincode"
                                            autoComplete="postal-code"
                                            inputMode="numeric"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            className={styles.input}
                                            placeholder="6-digit pincode"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroupFull}>
                                        <label htmlFor="notes" className={styles.label}>Order Notes (Optional)</label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className={styles.textarea}
                                            placeholder="Any special instructions..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className={styles.summary}>
                                <h2 className={styles.sectionTitle}>Order Summary</h2>

                                <div className={styles.summaryItems}>
                                    {items.map((item) => (
                                        <div key={`${item.type}-${item.id}`} className={styles.summaryItem}>
                                            <span className={styles.summaryItemName}>
                                                {item.name} × {item.quantity}
                                            </span>
                                            <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>₹{summary.subtotal.toLocaleString('en-IN')}</span>
                                </div>

                                <div className={styles.summaryRow}>
                                    <span>Shipping</span>
                                    <span>{summary.shipping === 0 ? 'FREE' : `₹${summary.shipping}`}</span>
                                </div>

                                <div className={styles.summaryTotal}>
                                    <span>Total</span>
                                    <span>₹{summary.total.toLocaleString('en-IN')}</span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%' }}
                                    disabled={loading || validating || cartValid !== true}
                                >
                                    {validating
                                        ? 'Verifying Cart...'
                                        : cartValid !== true
                                            ? 'Cart Not Verified'
                                            : loading
                                                ? 'Processing...'
                                                : `Pay ₹${summary.total.toLocaleString('en-IN')}`}
                                </button>

                                <p className={styles.paymentNote}>
                                    🔒 Secure payment via Razorpay (GPay, PhonePe, Paytm, Cards)
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
