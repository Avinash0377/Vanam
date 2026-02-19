'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckIcon, PackageIcon, WhatsAppIcon } from '@/components/Icons';
import styles from './page.module.css';
import { trackPurchase, AnalyticsItem } from '@/lib/analytics';

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
    );
}

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get('orderNumber');
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Hide confetti after animation
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Fire purchase event ONCE — sessionStorage guard prevents duplicate on refresh
    useEffect(() => {
        if (!orderNumber) return;

        const flagKey = `vanam_purchase_tracked_${orderNumber}`;
        if (sessionStorage.getItem(flagKey)) return; // already fired

        // Fetch order value from backend — never trust frontend for price
        fetch(`/api/orders?orderNumber=${orderNumber}`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                const order = data?.orders?.[0];
                if (!order) return;

                const items: AnalyticsItem[] = (order.items || []).map(
                    (i: { productId?: string; name: string; price: number; quantity: number; category?: string }) => ({
                        item_id: i.productId || i.name,
                        item_name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        item_category: i.category,
                    })
                );

                trackPurchase(orderNumber, order.totalAmount, items);
                sessionStorage.setItem(flagKey, '1'); // mark as fired
            })
            .catch(() => null); // silent — never break the confirmation page
    }, [orderNumber]);

    if (!orderNumber) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.errorCard}>
                        <span className={styles.errorIcon}>❌</span>
                        <h1>Order Not Found</h1>
                        <p>We couldn't find your order. Please check your email for confirmation.</p>
                        <Link href="/" className="btn btn-primary">
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {showConfetti && (
                <div className={styles.confetti}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={styles.confettiPiece} style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            backgroundColor: ['#1a4d2e', '#4aab78', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)]
                        }} />
                    ))}
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>
                        <CheckIcon size={48} color="white" />
                    </div>

                    <h1 className={styles.title}>Order Confirmed! 🌿</h1>
                    <p className={styles.subtitle}>Thank you for shopping with Vanam Store</p>

                    <div className={styles.orderNumber}>
                        <span className={styles.label}>Order Number</span>
                        <span className={styles.number}>{orderNumber}</span>
                    </div>

                    <div className={styles.infoCards}>
                        <div className={styles.infoCard}>
                            <PackageIcon size={24} color="#16a34a" />
                            <div>
                                <h3>What's Next?</h3>
                                <p>Your order is being prepared with love. You&apos;ll receive a shipping notification soon!</p>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.emoji}>📧</span>
                            <div>
                                <h3>Order Confirmation</h3>
                                <p>We've sent the order details to your registered email and phone.</p>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <span className={styles.emoji}>🚚</span>
                            <div>
                                <h3>Delivery Timeline</h3>
                                <p>Expected delivery within 3-7 business days depending on your location.</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/profile" className="btn btn-primary">
                            View My Orders
                        </Link>
                        <Link href="/" className="btn btn-secondary">
                            Continue Shopping
                        </Link>
                    </div>

                    <div className={styles.whatsappBox}>
                        <p>Need help with your order?</p>
                        <a
                            href={`https://wa.me/918897249374?text=Hi!%20I%20just%20placed%20order%20${orderNumber}%20and%20have%20a%20question.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.whatsappBtn}
                        >
                            <WhatsAppIcon size={20} color="white" />
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>

                <div className={styles.tips}>
                    <h3>🌱 Care Tips</h3>
                    <ul>
                        <li>When your plants arrive, let them rest for 24 hours before repotting</li>
                        <li>For pots and planters, clean with a damp cloth before first use</li>
                        <li>Place plants in indirect light initially to help them adjust</li>
                        <li>Keep the care guide handy - it&apos;s included with your order!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
