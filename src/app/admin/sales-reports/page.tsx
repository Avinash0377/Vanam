'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrendingUpIcon, PackageIcon } from '@/components/Icons';
import styles from './page.module.css';

interface SalesTrend {
    date: string;
    sales: number;
    orders: number;
}

interface StatItem {
    name: string;
    value: number;
}

interface AnalyticsData {
    salesTrend: SalesTrend[];
    statusStats: StatItem[];
    paymentStats: StatItem[];
    totalSales30Days: number;
    totalOrders30Days: number;
}

export default function ReportsPage() {
    const { token } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [token]);

    const fetchAnalytics = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/sales-analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch sales analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading reports...</p>
            </div>
        );
    }

    if (!data) {
        return <div className={styles.loading}><p>No data available</p></div>;
    }

    const maxSales = Math.max(...data.salesTrend.map(d => d.sales), 1);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Sales Reports</h1>
                    <p className={styles.subtitle}>Sales analytics for the last 30 days</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#dcfce7' }}>
                        <TrendingUpIcon size={24} color="#16a34a" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>30 Day Sales</span>
                        <span className={styles.summaryValue}>{formatCurrency(data.totalSales30Days)}</span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ background: '#dbeafe' }}>
                        <PackageIcon size={24} color="#2563eb" />
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>30 Day Orders</span>
                        <span className={styles.summaryValue}>{data.totalOrders30Days}</span>
                    </div>
                </div>
            </div>

            {/* Sales Trend Bar Chart */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Daily Sales Trend</h2>
                <div className={styles.chartContainer}>
                    <div className={styles.barChart}>
                        {data.salesTrend.map((day, idx) => {
                            const height = (day.sales / maxSales) * 100;
                            return (
                                <div key={idx} className={styles.barColumn} title={`${day.date}: ${formatCurrency(day.sales)} (${day.orders} orders)`}>
                                    <div className={styles.barValue} style={{ height: `${height}%` }}></div>
                                    <span className={styles.barLabel}>{idx % 5 === 0 ? day.date : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Order Status Distribution */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Order Status</h2>
                    <div className={styles.statList}>
                        {data.statusStats.map((stat) => (
                            <div key={stat.name} className={styles.statRow}>
                                <span className={styles.statLabel}>{stat.name}</span>
                                <div className={styles.statBarWrapper}>
                                    <div
                                        className={styles.statBar}
                                        style={{ width: `${(stat.value / data.totalOrders30Days) * 100}%`, background: stat.name === 'DELIVERED' ? '#10b981' : '#f59e0b' }}
                                    />
                                </div>
                                <span className={styles.statValue}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Payment Methods</h2>
                    <div className={styles.statList}>
                        {data.paymentStats.map((stat) => (
                            <div key={stat.name} className={styles.statRow}>
                                <span className={styles.statLabel}>{stat.name}</span>
                                <div className={styles.statBarWrapper}>
                                    <div
                                        className={styles.statBar}
                                        style={{ width: `${(stat.value / data.totalOrders30Days) * 100}%`, background: '#8b5cf6' }}
                                    />
                                </div>
                                <span className={styles.statValue}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
