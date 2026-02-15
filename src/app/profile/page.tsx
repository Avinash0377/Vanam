'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PackageIcon, MapPinIcon, UsersIcon } from '@/components/Icons';
import styles from './page.module.css';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    orderStatus: string;
    paymentMethod: string;
    items: OrderItem[];
}

const TRACKING_STEPS = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
];

function getStepState(orderStatus: string, stepKey: string) {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(orderStatus.toUpperCase());
    const stepIdx = statusOrder.indexOf(stepKey);

    if (stepIdx < 0 || currentIdx < 0) return 'upcoming';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
}

function ProfileContent() {
    const { user, token, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');
    const isOrdersView = tab === 'orders';

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedTracking, setExpandedTracking] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && isOrdersView) {
            fetchOrders();
        }
    }, [isAuthenticated, isOrdersView]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTracking = (orderId: string) => {
        setExpandedTracking(prev => prev === orderId ? null : orderId);
    };

    if (!user) return null;

    // ========== ORDERS VIEW (clean, no profile header) ==========
    if (isOrdersView) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <h1 className={styles.ordersPageTitle}>My Orders</h1>

                    {loading ? (
                        <div className={styles.loading}>Loading orders...</div>
                    ) : orders.length > 0 ? (
                        <div className={styles.ordersList}>
                            {orders.map((order) => (
                                <div key={order.id} className={styles.orderCard}>
                                    <div className={styles.orderHeader}>
                                        <div>
                                            <span className={styles.orderNumber}>#{order.orderNumber}</span>
                                            <span className={styles.orderDate}>
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[order.orderStatus.toLowerCase()]}`}>
                                            {order.orderStatus}
                                        </span>
                                    </div>
                                    <div className={styles.orderItems}>
                                        {order.items.map((item) => (
                                            <div key={item.id} className={styles.orderItem}>
                                                <div className={styles.itemImage}>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} />
                                                    ) : (
                                                        <div className={styles.placeholderImage} />
                                                    )}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <p className={styles.itemName}>{item.name}</p>
                                                    <p className={styles.itemMeta}>Qty: {item.quantity}</p>
                                                </div>
                                                <p className={styles.itemPrice}>₹{item.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.orderFooter}>
                                        <div className={styles.totalInfo}>
                                            <span>Total Amount</span>
                                            <span className={styles.totalAmount}>₹{order.totalAmount}</span>
                                        </div>
                                        {order.orderStatus.toUpperCase() !== 'CANCELLED' && (
                                            <button
                                                className={styles.trackBtn}
                                                onClick={() => toggleTracking(order.id)}
                                            >
                                                {expandedTracking === order.id ? 'Hide Tracking' : 'Track Order'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Tracking Timeline */}
                                    {expandedTracking === order.id && order.orderStatus.toUpperCase() !== 'CANCELLED' && (
                                        <div className={styles.trackingSection}>
                                            <div className={styles.trackingTimeline}>
                                                {TRACKING_STEPS.map((step) => {
                                                    const state = getStepState(order.orderStatus, step.key);
                                                    return (
                                                        <div
                                                            key={step.key}
                                                            className={`${styles.trackingStep} ${state === 'completed' ? styles.completed : ''} ${state === 'active' ? styles.active : ''}`}
                                                        >
                                                            <div className={styles.stepDot}>
                                                                {state === 'completed' ? '✓' : state === 'active' ? '●' : '○'}
                                                            </div>
                                                            <div className={styles.stepInfo}>
                                                                <span className={styles.stepLabel}>{step.label}</span>
                                                                {(state === 'completed' || state === 'active') && (
                                                                    <span className={styles.stepDate}>
                                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                            day: 'numeric', month: 'short'
                                                                        })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <PackageIcon size={48} color="#cbd5e1" />
                            </div>
                            <h3>No orders yet</h3>
                            <p>Your order history will appear here once you make a purchase.</p>
                            <button
                                onClick={() => router.push('/plants')}
                                className={styles.shopBtn}
                            >
                                Start Shopping
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ========== ACCOUNT VIEW (useful profile features) ==========
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.profileTop}>
                        <div className={styles.avatar}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={styles.userInfo}>
                            <h1 className={styles.userName}>{user.name}</h1>
                            <p className={styles.userEmail}>{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.actionsGrid}>
                    <Link href="/profile?tab=orders" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📦</span>
                        <span className={styles.actionLabel}>My Orders</span>
                        <span className={styles.actionArrow}>›</span>
                    </Link>

                    <a
                        href="https://wa.me/919876543210"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionCard}
                    >
                        <span className={styles.actionIcon}>💬</span>
                        <span className={styles.actionLabel}>WhatsApp Support</span>
                        <span className={styles.actionArrow}>›</span>
                    </a>

                    <Link href="/about" className={styles.actionCard}>
                        <span className={styles.actionIcon}>🌿</span>
                        <span className={styles.actionLabel}>About Vanam</span>
                        <span className={styles.actionArrow}>›</span>
                    </Link>

                    <Link href="/contact" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📧</span>
                        <span className={styles.actionLabel}>Contact Us</span>
                        <span className={styles.actionArrow}>›</span>
                    </Link>
                </div>

                {/* Account Details */}
                <div className={styles.detailsCard}>
                    <h2 className={styles.detailsTitle}>Account Details</h2>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Full Name</span>
                        <span className={styles.detailValue}>{user.name}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>{user.email}</span>
                    </div>
                </div>

                {/* Logout */}
                <button onClick={logout} className={styles.logoutBtn}>
                    Logout
                </button>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
