'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SearchIcon, MessageIcon, RefreshIcon } from '@/components/Icons';
import styles from './page.module.css';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    mobile: string;
    totalAmount: number;
    orderStatus: string;
    paymentMethod: string;
    createdAt: string;
    items: { id: string; name: string; quantity: number }[];
    user?: { name: string; mobile: string };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminOrdersPage() {
    const { token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    const fetchOrders = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);

            const res = await fetch(`/api/admin/orders?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setOrders(data.orders);
            setPagination(data.pagination);
            if (data.statusCounts) setStatusCounts(data.statusCounts);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to load orders. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter, search]);

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token, statusFilter, fetchOrders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders(1);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderStatus: newStatus }),
            });

            if (res.ok) {
                setOrders(orders.map(o =>
                    o.id === orderId ? { ...o, orderStatus: newStatus } : o
                ));
            } else {
                throw new Error('Update failed');
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update order status. Please try again.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getStatusStyle = (status: string) => {
        const statusStyles: Record<string, string> = {
            PENDING: styles.statusPending,
            PAID: styles.statusPaid,
            PACKING: styles.statusPacking,
            SHIPPED: styles.statusShipped,
            DELIVERED: styles.statusDelivered,
            CANCELLED: styles.statusCancelled,
        };
        return statusStyles[status] || '';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusOptions = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>Orders</h1>
                        <p className={styles.headerDesc}>
                            {pagination?.total || 0} orders total
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsRow}>
                    {['PENDING', 'PACKING', 'SHIPPED', 'DELIVERED'].map(status => (
                        <button
                            key={status}
                            className={`${styles.statCard} ${statusFilter === status ? styles.active : ''}`}
                            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                        >
                            <span className={styles.statValue}>
                                {statusCounts[status] ?? 0}
                            </span>
                            <span className={styles.statLabel}>{status}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search by order #, name, or mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>
                            <SearchIcon size={18} />
                        </button>
                    </form>

                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${statusFilter === '' ? styles.active : ''}`}
                            onClick={() => setStatusFilter('')}
                        >
                            All
                        </button>
                        {statusOptions.map(status => (
                            <button
                                key={status}
                                className={`${styles.filterTab} ${statusFilter === status ? styles.active : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders Table */}
                <div className={styles.tableWrapper}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : error ? (
                        <div className={styles.errorState}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>{error}</p>
                            <button className={styles.retryBtn} onClick={() => fetchOrders()}>
                                <RefreshIcon size={16} /> <span style={{ marginLeft: '4px' }}>Try Again</span>
                            </button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No orders found</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <Link href={`/admin/orders/${order.id}`} className={styles.orderNumber}>
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td>
                                            <div className={styles.customerCell}>
                                                <span className={styles.customerName}>{order.customerName}</span>
                                                <span className={styles.customerMobile}>{order.mobile}</span>
                                            </div>
                                        </td>
                                        <td>{order.items?.length || 0} items</td>
                                        <td className={styles.amountCell}>
                                            ₹{order.totalAmount.toLocaleString('en-IN')}
                                        </td>
                                        <td>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={order.orderStatus}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className={`${styles.statusSelect} ${getStatusStyle(order.orderStatus)}`}
                                                    disabled={updatingOrderId === order.id}
                                                    style={updatingOrderId === order.id ? { opacity: 0.5 } : {}}
                                                >
                                                    {statusOptions.map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className={styles.dateCell}>
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <Link href={`/admin/orders/${order.id}`} className={styles.actionBtn}>
                                                    View
                                                </Link>
                                                <a
                                                    href={`https://wa.me/91${order.mobile}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.whatsappBtn}
                                                >
                                                    <MessageIcon size={16} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => fetchOrders(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className={styles.pageBtn}
                        >
                            ← Previous
                        </button>
                        <span className={styles.pageInfo}>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => fetchOrders(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className={styles.pageBtn}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
