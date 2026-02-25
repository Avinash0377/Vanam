'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardIcon, PackageIcon, FolderIcon, PlantIcon, RefreshIcon } from '@/components/Icons';
import styles from './page.module.css';

interface CategoryStat {
    id: string;
    name: string;
    slug: string;
    description?: string;
    productCount: number;
    totalSales: number;
    totalOrders: number;
    totalQuantitySold: number;
    stockValue: number;
    averageOrderValue: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
}

interface Totals {
    totalCategories: number;
    totalProducts: number;
    totalRevenue: number;
    totalOrders: number;
}

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<CategoryStat[]>([]);
    const [totals, setTotals] = useState<Totals | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        if (!token) return;
        setError(null);
        try {
            const res = await fetch('/api/admin/category-analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setCategories(data.categories || []);
            setTotals(data.totals || null);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
            setError('Failed to load analytics. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.loading}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
                <button onClick={() => { setLoading(true); fetchAnalytics(); }} style={{
                    padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                    color: 'white', background: 'var(--primary-600)', border: 'none',
                    borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                }}>
                    <RefreshIcon size={16} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Category Analytics</h1>
                    <p className={styles.subtitle}>Sales performance by category</p>
                </div>
            </div>

            {/* Summary Cards */}
            {totals && (
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: '#dcfce7' }}>
                            <DashboardIcon size={24} color="#16a34a" />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Total Revenue</span>
                            <span className={styles.summaryValue}>{formatCurrency(totals.totalRevenue)}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: '#dbeafe' }}>
                            <PackageIcon size={24} color="#2563eb" />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Total Orders</span>
                            <span className={styles.summaryValue}>{totals.totalOrders}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: '#fef3c7' }}>
                            <FolderIcon size={24} color="#d97706" />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Categories</span>
                            <span className={styles.summaryValue}>{totals.totalCategories}</span>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: '#fce7f3' }}>
                            <PlantIcon size={24} color="#db2777" />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>Products</span>
                            <span className={styles.summaryValue}>{totals.totalProducts}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Performance Table */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Performance by Category</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Products</th>
                                <th>Sales</th>
                                <th>Orders</th>
                                <th>Items Sold</th>
                                <th>Avg Order</th>
                                <th>Stock Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat, index) => (
                                <tr key={cat.id}>
                                    <td>
                                        <div className={styles.categoryCell}>
                                            <span className={styles.rank}>#{index + 1}</span>
                                            <div>
                                                <span className={styles.categoryName}>{cat.name}</span>
                                                <span className={styles.categorySlug}>/{cat.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{cat.productCount}</td>
                                    <td className={styles.salesCell}>{formatCurrency(cat.totalSales)}</td>
                                    <td>{cat.totalOrders}</td>
                                    <td>{cat.totalQuantitySold}</td>
                                    <td>{formatCurrency(cat.averageOrderValue)}</td>
                                    <td className={styles.stockCell}>{formatCurrency(cat.stockValue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Products per Category */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Top Products by Category</h2>
                <div className={styles.categoryGrid}>
                    {categories.filter(cat => cat.topProducts.length > 0).map((cat) => (
                        <div key={cat.id} className={styles.categoryCard}>
                            <h3 className={styles.categoryCardTitle}>{cat.name}</h3>
                            <div className={styles.productList}>
                                {cat.topProducts.map((product, idx) => (
                                    <div key={idx} className={styles.productItem}>
                                        <span className={styles.productRank}>{idx + 1}</span>
                                        <div className={styles.productInfo}>
                                            <span className={styles.productName}>{product.name}</span>
                                            <span className={styles.productStats}>
                                                {product.quantity} sold • {formatCurrency(product.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Revenue Chart (Visual Bar) */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Revenue Distribution</h2>
                <div className={styles.chartContainer}>
                    {(() => {
                        const maxSales = Math.max(...categories.map(c => c.totalSales), 0);
                        return categories.map((cat) => {
                            const percentage = maxSales > 0 ? (cat.totalSales / maxSales) * 100 : 0;
                            return (
                                <div key={cat.id} className={styles.barRow}>
                                    <span className={styles.barLabel}>{cat.name}</span>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={styles.bar}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className={styles.barValue}>{formatCurrency(cat.totalSales)}</span>
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
}
