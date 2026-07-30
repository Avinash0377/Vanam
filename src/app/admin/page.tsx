'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    PlantIcon,
    PackageIcon,
    ClockIcon,
    CalendarIcon,
    FolderIcon,
    HomeIcon,
    RefreshIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ActivityIcon,
    AlertIcon,
    StarIcon,
    CheckIcon,
    ArrowRightIcon,
} from '@/components/Icons';
import styles from './page.module.css';

interface DashboardStats {
    totalProducts: number;
    outOfStockCount: number;
    totalOrders: number;
    pendingOrders: number;
    todayOrders: number;
    monthlyRevenue: number;
    totalRevenue: number;
}

interface Trends {
    ordersTodayPct: number | null;
    monthlyRevenuePct: number | null;
    yesterdayOrders: number;
    lastMonthRevenue: number;
}

interface PaymentHealth {
    failedToday: number;
    signatureErrorsToday: number;
}

interface RevenuePoint {
    date: string;
    revenue: number;
    orders: number;
}

interface TopProduct {
    id: string;
    name: string;
    image: string | null;
    quantity: number;
    revenue: number;
}

interface Order {
    id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
    user?: { name: string; mobile: string };
}

interface Product {
    id: string;
    name: string;
    stock: number;
}

const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ---- Small trend pill ---- */
function TrendPill({ pct }: { pct: number | null }) {
    if (pct === null) {
        return <span className={`${styles.trendPill} ${styles.trendNew}`}>New</span>;
    }
    if (pct === 0) {
        return <span className={`${styles.trendPill} ${styles.trendFlat}`}>0%</span>;
    }
    const up = pct > 0;
    return (
        <span className={`${styles.trendPill} ${up ? styles.trendUp : styles.trendDown}`}>
            {up ? <TrendingUpIcon size={12} /> : <TrendingDownIcon size={12} />}
            {Math.abs(pct)}%
        </span>
    );
}

/* ---- Sparkline (SVG area) ---- */
function Sparkline({ data }: { data: number[] }) {
    if (data.length < 2) return null;
    const max = Math.max(1, ...data);
    const w = 100;
    const h = 28;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`);
    const line = pts.join(' ');
    const area = `0,${h} ${line} ${w},${h}`;
    return (
        <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
            <polygon points={area} className={styles.sparkArea} />
            <polyline points={line} className={styles.sparkLine} />
        </svg>
    );
}

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [trends, setTrends] = useState<Trends | null>(null);
    const [paymentHealth, setPaymentHealth] = useState<PaymentHealth | null>(null);
    const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchDashboard = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            setError(null);
            const res = await fetch('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setStats(data.stats);
            setTrends(data.trends ?? null);
            setPaymentHealth(data.paymentHealth ?? null);
            setRevenueSeries(data.revenueSeries || []);
            setTopProducts(data.topProducts || []);
            setRecentOrders(data.recentOrders || []);
            setLowStockProducts(data.lowStockProducts || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch dashboard:', err);
            if (!silent) setError('Failed to load dashboard data. Please check your connection and try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchDashboard();
    }, [token, fetchDashboard]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => fetchDashboard(true), 60000);
        return () => clearInterval(interval);
    }, [token, fetchDashboard]);

    const sparkData = useMemo(
        () => revenueSeries.slice(-14).map(d => d.revenue),
        [revenueSeries]
    );

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.errorState}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h3>Something went wrong</h3>
                        <p>{error}</p>
                        <button className={styles.retryBtn} onClick={() => fetchDashboard()}>
                            <RefreshIcon size={16} /> <span style={{ marginLeft: '4px' }}>Try Again</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            key: 'products',
            label: 'Total Products',
            value: stats?.totalProducts ?? 0,
            icon: <PlantIcon size={22} />,
            tint: styles.tintGreen,
            href: '/admin/products',
            sub: (stats?.outOfStockCount ?? 0) > 0
                ? { text: `${stats?.outOfStockCount} out of stock`, danger: true }
                : null,
        },
        {
            key: 'orders',
            label: 'Total Orders',
            value: stats?.totalOrders ?? 0,
            icon: <PackageIcon size={22} />,
            tint: styles.tintBlue,
            href: '/admin/orders',
            sub: null,
        },
        {
            key: 'pending',
            label: 'Pending Orders',
            value: stats?.pendingOrders ?? 0,
            icon: <ClockIcon size={22} />,
            tint: styles.tintAmber,
            href: '/admin/orders?status=PENDING',
            sub: (stats?.pendingOrders ?? 0) > 0
                ? { text: 'Needs attention', danger: false }
                : { text: 'All clear', danger: false },
        },
        {
            key: 'today',
            label: "Today's Orders",
            value: stats?.todayOrders ?? 0,
            icon: <CalendarIcon size={22} />,
            tint: styles.tintPurple,
            href: '/admin/orders',
            trend: trends?.ordersTodayPct ?? null,
        },
    ];

    const healthOk = (paymentHealth?.failedToday ?? 0) === 0 && (paymentHealth?.signatureErrorsToday ?? 0) === 0;

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <div>
                        <h1>Dashboard</h1>
                        {lastUpdated && (
                            <span className={styles.lastUpdated}>
                                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`}
                            onClick={() => fetchDashboard()}
                            title="Refresh dashboard"
                            aria-label="Refresh dashboard"
                        >
                            <RefreshIcon size={20} />
                        </button>
                        <Link href="/admin/products/new" className="btn btn-primary">
                            + Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    {statCards.map((c) => (
                        <Link key={c.key} href={c.href} className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span className={`${styles.statIcon} ${c.tint}`}>{c.icon}</span>
                                {'trend' in c && <TrendPill pct={c.trend as number | null} />}
                            </div>
                            <span className={styles.statValue}>{c.value}</span>
                            <span className={styles.statLabel}>{c.label}</span>
                            {c.sub && (
                                <span className={`${styles.statSub} ${c.sub.danger ? styles.statSubDanger : ''}`}>
                                    {c.sub.text}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Revenue Cards */}
                <div className={styles.revenueRow}>
                    <div className={styles.revenueCard}>
                        <div className={styles.revenueTop}>
                            <h3>Monthly Revenue</h3>
                            {trends && <TrendPill pct={trends.monthlyRevenuePct} />}
                        </div>
                        <span className={styles.revenueAmount}>{inr(stats?.monthlyRevenue ?? 0)}</span>
                        <Sparkline data={sparkData} />
                    </div>
                    <div className={styles.revenueCard}>
                        <div className={styles.revenueTop}>
                            <h3>Total Revenue</h3>
                        </div>
                        <span className={styles.revenueAmount}>{inr(stats?.totalRevenue ?? 0)}</span>
                        <span className={styles.revenueCaption}>All-time realised revenue</span>
                    </div>
                </div>

                {/* Content Grid: Recent Orders + Low Stock */}
                <div className={styles.contentGrid}>
                    {/* Recent Orders */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Recent Orders</h2>
                            <Link href="/admin/orders" className={styles.viewAll}>View All →</Link>
                        </div>
                        <div className={styles.orderList}>
                            {recentOrders.length === 0 ? (
                                <p className={styles.empty}>No orders yet</p>
                            ) : (
                                recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className={styles.orderItem}
                                    >
                                        <div className={styles.orderInfo}>
                                            <span className={styles.orderNumber}>{order.orderNumber}</span>
                                            <span className={styles.orderCustomer}>
                                                {order.user?.name || 'Guest'} • {order.user?.mobile}
                                            </span>
                                            <span className={styles.orderTime}>{relativeTime(order.createdAt)}</span>
                                        </div>
                                        <div className={styles.orderMeta}>
                                            <span className={`${styles.orderStatus} ${styles[order.orderStatus.toLowerCase()]}`}>
                                                {order.orderStatus}
                                            </span>
                                            <span className={styles.orderAmount}>{inr(order.totalAmount)}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Low Stock Alert</h2>
                            <Link href="/admin/products" className={styles.viewAll}>View All →</Link>
                        </div>
                        <div className={styles.stockList}>
                            {lowStockProducts.length === 0 ? (
                                <p className={styles.empty}>All products are well stocked!</p>
                            ) : (
                                lowStockProducts.map((product) => (
                                    <div key={product.id} className={styles.stockItem}>
                                        <span className={styles.stockName}>{product.name}</span>
                                        <span className={`${styles.stockCount} ${product.stock === 0 ? styles.outOfStock : ''}`}>
                                            {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Best Sellers + Payment Health */}
                <div className={styles.contentGrid2}>
                    {/* Best Sellers */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Best Sellers</h2>
                            <Link href="/admin/products" className={styles.viewAll}>View All →</Link>
                        </div>
                        <div className={styles.topList}>
                            {topProducts.length === 0 ? (
                                <p className={styles.empty}>No sales data yet</p>
                            ) : (
                                topProducts.map((p, i) => (
                                    <div key={p.id} className={styles.topItem}>
                                        <span className={`${styles.topRank} ${i === 0 ? styles.topRankGold : ''}`}>
                                            {i === 0 ? <StarIcon size={14} filled /> : i + 1}
                                        </span>
                                        <div className={styles.topInfo}>
                                            <span className={styles.topName}>{p.name}</span>
                                            <span className={styles.topUnits}>{p.quantity} sold</span>
                                        </div>
                                        <span className={styles.topRevenue}>{inr(p.revenue)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payment Health */}
                    <Link href="/admin/payment-logs" className={`${styles.section} ${styles.healthCard} ${healthOk ? styles.healthOk : styles.healthBad}`}>
                        <div className={styles.sectionHeader}>
                            <h2>Payment Health</h2>
                            <span className={styles.viewAll}>Logs →</span>
                        </div>
                        <div className={styles.healthIconWrap}>
                            <span className={styles.healthIcon}>
                                {healthOk ? <CheckIcon size={26} /> : <AlertIcon size={26} />}
                            </span>
                            <span className={styles.healthHeadline}>
                                {healthOk ? 'All payments healthy' : 'Issues detected today'}
                            </span>
                        </div>
                        <div className={styles.healthStats}>
                            <div className={styles.healthStat}>
                                <span className={styles.healthValue}>{paymentHealth?.failedToday ?? 0}</span>
                                <span className={styles.healthLabel}>Failed today</span>
                            </div>
                            <div className={styles.healthStat}>
                                <span className={styles.healthValue}>{paymentHealth?.signatureErrorsToday ?? 0}</span>
                                <span className={styles.healthLabel}>Signature errors</span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className={styles.quickLinks}>
                    <Link href="/admin/products" className={styles.quickLink}>
                        <span><PlantIcon size={20} /></span> Manage Products
                    </Link>
                    <Link href="/admin/orders" className={styles.quickLink}>
                        <span><PackageIcon size={20} /></span> View Orders
                    </Link>
                    <Link href="/admin/categories" className={styles.quickLink}>
                        <span><FolderIcon size={20} /></span> Categories
                    </Link>
                    <Link href="/admin/payment-logs" className={styles.quickLink}>
                        <span><ActivityIcon size={20} /></span> Payment Logs
                    </Link>
                    <Link href="/admin/customers" className={styles.quickLink}>
                        <span><ArrowRightIcon size={20} /></span> Customers
                    </Link>
                    <Link href="/" className={styles.quickLink}>
                        <span><HomeIcon size={20} /></span> View Store
                    </Link>
                </div>
            </div>
        </div>
    );
}
