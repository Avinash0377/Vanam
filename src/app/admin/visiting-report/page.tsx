'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

import { CartIcon, PackageIcon, UsersIcon, TrendingUpIcon, HeartIcon, CheckIcon, RefreshIcon } from '@/components/Icons';

interface CartUser {
    userName: string;
    userMobile: string;
    items: { name: string; price: number; quantity: number }[];
    lastActivity: string;
}

interface PendingOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    mobile: string;
    total: number;
    status: string;
    createdAt: string;
}

interface Signup {
    id: string;
    name: string;
    mobile: string;
    createdAt: string;
}

interface WishlistItem {
    userName: string;
    itemName: string;
    itemPrice: number;
    addedAt: string;
}

interface PulseData {
    activeCarts: { count: number; users: CartUser[] };
    actionNeeded: { count: number; orders: PendingOrder[] };
    todaySignups: { count: number; users: Signup[] };
    wishlistActivity: { count: number; items: WishlistItem[] };
    todaySnapshot: { orders: number; revenue: number };
}

export default function StorePulsePage() {
    const { token } = useAuth();
    const [pulse, setPulse] = useState<PulseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchPulse = useCallback(async () => {
        if (!token) return;
        setError(null);
        try {
            const res = await fetch('/api/admin/store-pulse', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setPulse(data.pulse);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch store pulse:', err);
            setError('Failed to load store pulse. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPulse();
    }, [fetchPulse]);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => fetchPulse(), 120000);
        return () => clearInterval(interval);
    }, [token, fetchPulse]);

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

    const getStatusClass = (status: string) => {
        if (status === 'PENDING') return styles.statusPending;
        if (status === 'PAID') return styles.statusPaid;
        if (status === 'PACKING') return styles.statusPacking;
        return '';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading store pulse...</p>
            </div>
        );
    }

    if (error && !pulse) {
        return (
            <div className={styles.loading}>
                <p>{error}</p>
                <button onClick={() => { setLoading(true); fetchPulse(); }} className={styles.refreshBtn}>
                    <RefreshIcon size={16} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div>
                        <h1 className={styles.title}>Store Pulse</h1>
                        <p className={styles.subtitle}>Live activity from your store — auto-refreshes every 2 min</p>
                    </div>
                </div>
                <div>
                    <button
                        className={styles.refreshBtn}
                        onClick={() => fetchPulse()}
                        disabled={loading}
                    >
                        Refresh Now
                    </button>
                    {lastUpdated && (
                        <p className={styles.lastUpdated}>
                            Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                        </p>
                    )}
                </div>
            </div>

            {pulse && (
                <>
                    {/* Snapshot Cards */}
                    <div className={styles.snapshotRow}>
                        <div className={styles.snapshotCard}>
                            <div className={styles.snapshotIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                                <CartIcon size={24} />
                            </div>
                            <div className={styles.snapshotInfo}>
                                <span className={styles.snapshotValue}>{pulse.activeCarts.count}</span>
                                <span className={styles.snapshotLabel}>Active Carts (1h)</span>
                            </div>
                        </div>

                        <div className={styles.snapshotCard}>
                            <div className={styles.snapshotIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
                                <PackageIcon size={24} />
                            </div>
                            <div className={styles.snapshotInfo}>
                                <span className={styles.snapshotValue}>{pulse.actionNeeded.count}</span>
                                <span className={styles.snapshotLabel}>Need Action</span>
                            </div>
                        </div>

                        <div className={styles.snapshotCard}>
                            <div className={styles.snapshotIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <UsersIcon size={24} />
                            </div>
                            <div className={styles.snapshotInfo}>
                                <span className={styles.snapshotValue}>{pulse.todaySignups.count}</span>
                                <span className={styles.snapshotLabel}>Today&apos;s Signups</span>
                            </div>
                        </div>

                        <div className={styles.snapshotCard}>
                            <div className={styles.snapshotIcon} style={{ background: '#fce7f3', color: '#db2777' }}>
                                <TrendingUpIcon size={24} />
                            </div>
                            <div className={styles.snapshotInfo}>
                                <span className={styles.snapshotValue}>{formatCurrency(pulse.todaySnapshot.revenue)}</span>
                                <span className={styles.snapshotLabel}>Today&apos;s Revenue ({pulse.todaySnapshot.orders} orders)</span>
                            </div>
                        </div>
                    </div>

                    {/* Detail Panels */}
                    <div className={styles.panelsGrid}>
                        {/* Active Carts Panel */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>
                                    <CartIcon size={18} color="#f59e0b" /> Active Carts
                                    <span className={`${styles.panelBadge} ${styles.badgeOrange}`}>
                                        {pulse.activeCarts.count}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.panelBody}>
                                {pulse.activeCarts.users.length === 0 ? (
                                    <div className={styles.emptyPanel}>
                                        <span className={styles.emptyIcon}><CartIcon size={32} /></span>
                                        No active carts in the last hour
                                    </div>
                                ) : (
                                    pulse.activeCarts.users.map((user, idx) => (
                                        <div key={idx} className={styles.listItem}>
                                            <div className={`${styles.listAvatar} ${styles.avatarOrange}`}>
                                                {getInitial(user.userName)}
                                            </div>
                                            <div className={styles.listContent}>
                                                <div className={styles.listName}>{user.userName}</div>
                                                <div className={styles.listSub}>
                                                    {user.items.slice(0, 2).map(i => i.name).join(', ')}
                                                    {user.items.length > 2 && ` +${user.items.length - 2} more`}
                                                </div>
                                            </div>
                                            <div className={styles.listRight}>
                                                <span className={styles.listAmount}>
                                                    {formatCurrency(user.items.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                                                </span>
                                                <span className={styles.listTime}>{timeAgo(user.lastActivity)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Orders Needing Action */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>
                                    <PackageIcon size={18} color="#3b82f6" /> Orders Need Action
                                    <span className={`${styles.panelBadge} ${styles.badgeBlue}`}>
                                        {pulse.actionNeeded.count}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.panelBody}>
                                {pulse.actionNeeded.orders.length === 0 ? (
                                    <div className={styles.emptyPanel}>
                                        <span className={styles.emptyIcon}><CheckIcon size={32} /></span>
                                        All caught up! No pending orders
                                    </div>
                                ) : (
                                    pulse.actionNeeded.orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/admin/orders/${order.id}`}
                                            className={styles.listItem}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div className={`${styles.listAvatar} ${styles.avatarBlue}`}>
                                                {getInitial(order.customerName)}
                                            </div>
                                            <div className={styles.listContent}>
                                                <div className={styles.listName}>
                                                    #{order.orderNumber} — {order.customerName}
                                                </div>
                                                <div className={styles.listSub}>{order.mobile}</div>
                                            </div>
                                            <div className={styles.listRight}>
                                                <span className={styles.listAmount}>{formatCurrency(order.total)}</span>
                                                <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Today's Signups */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>
                                    <UsersIcon size={18} color="#10b981" /> Today&apos;s Signups
                                    <span className={`${styles.panelBadge} ${styles.badgeGreen}`}>
                                        {pulse.todaySignups.count}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.panelBody}>
                                {pulse.todaySignups.users.length === 0 ? (
                                    <div className={styles.emptyPanel}>
                                        <span className={styles.emptyIcon}><UsersIcon size={32} /></span>
                                        No signups today yet
                                    </div>
                                ) : (
                                    pulse.todaySignups.users.map((user) => (
                                        <Link
                                            key={user.id}
                                            href={`/admin/customers/${user.id}`}
                                            className={styles.listItem}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div className={`${styles.listAvatar} ${styles.avatarGreen}`}>
                                                {getInitial(user.name)}
                                            </div>
                                            <div className={styles.listContent}>
                                                <div className={styles.listName}>{user.name}</div>
                                                <div className={styles.listSub}>{user.mobile}</div>
                                            </div>
                                            <div className={styles.listRight}>
                                                <span className={styles.listTime}>{timeAgo(user.createdAt)}</span>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Wishlist Activity */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>
                                    <HeartIcon size={18} color="#ec4899" filled={true} /> Wishlist Activity (24h)
                                    <span className={`${styles.panelBadge} ${styles.badgePink}`}>
                                        {pulse.wishlistActivity.count}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.panelBody}>
                                {pulse.wishlistActivity.items.length === 0 ? (
                                    <div className={styles.emptyPanel}>
                                        <span className={styles.emptyIcon}><HeartIcon size={32} /></span>
                                        No wishlist activity in the last 24 hours
                                    </div>
                                ) : (
                                    pulse.wishlistActivity.items.map((item, idx) => (
                                        <div key={idx} className={styles.listItem}>
                                            <div className={`${styles.listAvatar} ${styles.avatarPink}`}>
                                                {getInitial(item.userName)}
                                            </div>
                                            <div className={styles.listContent}>
                                                <div className={styles.listName}>{item.userName}</div>
                                                <div className={styles.listSub}>wishlisted {item.itemName}</div>
                                            </div>
                                            <div className={styles.listRight}>
                                                <span className={styles.listAmount}>{formatCurrency(item.itemPrice)}</span>
                                                <span className={styles.listTime}>{timeAgo(item.addedAt)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
