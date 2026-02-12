'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    PlantIcon,
    PackageIcon,
    ClockIcon,
    CalendarIcon,
    FolderIcon,
    HomeIcon
} from '@/components/Icons';
import styles from './page.module.css';

interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    todayOrders: number;
    monthlyRevenue: number;
    totalRevenue: number;
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

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchDashboard();
        }
    }, [token]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setStats(data.stats);
                setRecentOrders(data.recentOrders || []);
                setLowStockProducts(data.lowStockProducts || []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <h1>Dashboard</h1>
                    <div className={styles.headerActions}>
                        <Link href="/admin/products/new" className="btn btn-primary">
                            + Add Product
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><PlantIcon size={24} /></span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats?.totalProducts || 0}</span>
                            <span className={styles.statLabel}>Total Products</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><PackageIcon size={24} /></span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats?.totalOrders || 0}</span>
                            <span className={styles.statLabel}>Total Orders</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><ClockIcon size={24} /></span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats?.pendingOrders || 0}</span>
                            <span className={styles.statLabel}>Pending Orders</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}><CalendarIcon size={24} /></span>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats?.todayOrders || 0}</span>
                            <span className={styles.statLabel}>Today&apos;s Orders</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Cards */}
                <div className={styles.revenueRow}>
                    <div className={styles.revenueCard}>
                        <h3>Monthly Revenue</h3>
                        <span className={styles.revenueAmount}>
                            ₹{(stats?.monthlyRevenue || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className={styles.revenueCard}>
                        <h3>Total Revenue</h3>
                        <span className={styles.revenueAmount}>
                            ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* Content Grid */}
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
                                        </div>
                                        <div className={styles.orderMeta}>
                                            <span className={`${styles.orderStatus} ${styles[order.orderStatus.toLowerCase()]}`}>
                                                {order.orderStatus}
                                            </span>
                                            <span className={styles.orderAmount}>
                                                ₹{order.totalAmount.toLocaleString('en-IN')}
                                            </span>
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
                    <Link href="/" className={styles.quickLink}>
                        <span><HomeIcon size={20} /></span> View Store
                    </Link>
                </div>
            </div>
        </div>
    );
}
