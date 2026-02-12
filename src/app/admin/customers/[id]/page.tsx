'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon, CartIcon, CalendarIcon } from '@/components/Icons';
import styles from './page.module.css';

interface User {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
}

interface Stats {
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
}

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    paymentMethod: string;
    createdAt: string;
    items: OrderItem[];
}

export default function CustomerDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const { token } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, id]);

    const fetchUserDetail = async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                router.push('/admin/customers');
                return;
            }
            const data = await res.json();
            setUser(data.user);
            setStats(data.stats);
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: '#f59e0b',
            PAID: '#3b82f6',
            PACKING: '#8b5cf6',
            SHIPPED: '#06b6d4',
            DELIVERED: '#10b981',
            CANCELLED: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading customer...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.page}>
                <p>Customer not found</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/admin/customers" className={styles.backBtn}>
                    <ArrowLeftIcon size={20} />
                    Back to Customers
                </Link>
            </div>

            {/* User Profile Card */}
            <div className={styles.profileCard}>
                <div className={styles.profileMain}>
                    <div className={styles.avatar}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.profileInfo}>
                        <h1 className={styles.profileName}>{user.name}</h1>
                        <p className={styles.profileMobile}>{user.mobile}</p>
                        {user.email && (
                            <p className={styles.profileEmail}>{user.email}</p>
                        )}
                    </div>
                </div>
                <div className={styles.profileMeta}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Joined</span>
                        <span className={styles.metaValue}>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Last Login</span>
                        <span className={styles.metaValue}>{formatDate(user.lastLoginAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Role</span>
                        <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.admin : ''}`}>
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <CartIcon size={24} />
                        <div>
                            <span className={styles.statValue}>{stats.orderCount}</span>
                            <span className={styles.statLabel}>Total Orders</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.currencyIcon}>₹</span>
                        <div>
                            <span className={styles.statValue}>{formatCurrency(stats.totalSpent)}</span>
                            <span className={styles.statLabel}>Total Spent</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.currencyIcon}>~</span>
                        <div>
                            <span className={styles.statValue}>{formatCurrency(stats.averageOrderValue)}</span>
                            <span className={styles.statLabel}>Avg Order Value</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <CalendarIcon size={24} />
                        <div>
                            <span className={styles.statValue}>{formatDate(stats.lastOrderDate)?.split(',')[0] || '-'}</span>
                            <span className={styles.statLabel}>Last Order</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Section */}
            <div className={styles.ordersSection}>
                <h2 className={styles.sectionTitle}>Order History</h2>

                {orders.length === 0 ? (
                    <p className={styles.empty}>No orders yet</p>
                ) : (
                    <div className={styles.ordersList}>
                        {orders.map(order => (
                            <Link
                                key={order.id}
                                href={`/admin/orders/${order.id}`}
                                className={styles.orderCard}
                            >
                                <div className={styles.orderMain}>
                                    <span className={styles.orderNumber}>#{order.orderNumber}</span>
                                    <span
                                        className={styles.orderStatus}
                                        style={{ color: getStatusColor(order.orderStatus) }}
                                    >
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <div className={styles.orderItems}>
                                    {order.items.slice(0, 3).map((item, idx) => (
                                        <span key={idx} className={styles.orderItem}>
                                            {item.name} × {item.quantity}
                                        </span>
                                    ))}
                                    {order.items.length > 3 && (
                                        <span className={styles.moreItems}>
                                            +{order.items.length - 3} more
                                        </span>
                                    )}
                                </div>
                                <div className={styles.orderMeta}>
                                    <span className={styles.orderAmount}>{formatCurrency(order.totalAmount)}</span>
                                    <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
