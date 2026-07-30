'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SearchIcon, MessageIcon, RefreshIcon, CalendarIcon, XIcon, SortIcon, EyeIcon } from '@/components/Icons';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { formatDate, toDateInput } from '@/lib/date';
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

type SortOption = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';
type DatePreset = '' | 'today' | 'week' | 'month' | 'custom';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_METHODS = ['RAZORPAY', 'COD', 'WHATSAPP'];
const DESTRUCTIVE_STATUSES = new Set(['CANCELLED', 'REFUNDED']);

export default function AdminOrdersPage() {
    const { token } = useAuth();
    const toast = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [sort, setSort] = useState<SortOption>('newest');
    const [datePreset, setDatePreset] = useState<DatePreset>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [confirmState, setConfirmState] = useState<{ orderId: string; newStatus: string; orderNumber: string } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Read ?status= from the URL on mount (deep-links from the dashboard)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlStatus = params.get('status');
        if (urlStatus && STATUS_OPTIONS.includes(urlStatus)) {
            setStatusFilter(urlStatus);
        }
    }, []);

    const applyDatePreset = useCallback((preset: DatePreset) => {        setDatePreset(preset);
        if (preset === '') {
            setStartDate('');
            setEndDate('');
            return;
        }
        if (preset === 'custom') return;
        const now = new Date();
        const end = toDateInput(now);
        const start = new Date(now);
        if (preset === 'week') start.setDate(start.getDate() - 6);
        else if (preset === 'month') start.setDate(start.getDate() - 29);
        // 'today' → start = today
        setStartDate(toDateInput(start));
        setEndDate(end);
    }, []);

    const fetchOrders = useCallback(async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                sort,
            });
            if (statusFilter) params.set('status', statusFilter);
            if (paymentFilter) params.set('paymentMethod', paymentFilter);
            if (search) params.set('search', search);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

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
    }, [token, statusFilter, paymentFilter, sort, search, startDate, endDate]);

    useEffect(() => {
        if (token) fetchOrders();
    }, [token, statusFilter, paymentFilter, sort, startDate, endDate, fetchOrders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders(1);
    };

    const doStatusUpdate = async (orderId: string, newStatus: string) => {
        const previous = orders;
        // Optimistic
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
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
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Update failed');
            }
            toast.success(`Order marked as ${newStatus}`);
        } catch (err) {
            console.error('Update error:', err);
            setOrders(previous); // rollback
            toast.error(err instanceof Error ? err.message : 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const requestStatusUpdate = (orderId: string, orderNumber: string, newStatus: string, current: string) => {
        if (newStatus === current) return;
        if (DESTRUCTIVE_STATUSES.has(newStatus)) {
            setConfirmState({ orderId, orderNumber, newStatus });
            return;
        }
        doStatusUpdate(orderId, newStatus);
    };

    const getStatusStyle = (status: string) => {
        const map: Record<string, string> = {
            PENDING: styles.statusPending,
            PAID: styles.statusPaid,
            PACKING: styles.statusPacking,
            SHIPPED: styles.statusShipped,
            DELIVERED: styles.statusDelivered,
            CANCELLED: styles.statusCancelled,
            REFUNDED: styles.statusRefunded,
        };
        return map[status] || '';
    };

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (paymentFilter) n++;
        if (startDate || endDate) n++;
        if (sort !== 'newest') n++;
        return n;
    }, [paymentFilter, startDate, endDate, sort]);

    const clearAllFilters = () => {
        setStatusFilter('');
        setPaymentFilter('');
        setSort('newest');
        setDatePreset('');
        setStartDate('');
        setEndDate('');
        setSearch('');
    };

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
                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => fetchOrders(pagination?.page || 1)}
                            disabled={loading}
                            aria-label="Refresh orders"
                            title="Refresh"
                        >
                            <RefreshIcon size={16} />
                            <span>Refresh</span>
                        </button>
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
                            <span className={styles.statValue}>{statusCounts[status] ?? 0}</span>
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
                        <button type="submit" className={styles.searchBtn} aria-label="Search">
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
                        {STATUS_OPTIONS.map(status => (
                            <button
                                key={status}
                                className={`${styles.filterTab} ${statusFilter === status ? styles.active : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className={styles.advancedRow}>
                        <button
                            type="button"
                            className={styles.advancedToggle}
                            onClick={() => setShowAdvanced(v => !v)}
                            aria-expanded={showAdvanced}
                        >
                            <CalendarIcon size={14} />
                            <span>More filters</span>
                            {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
                        </button>
                        {(activeFilterCount > 0 || statusFilter || search) && (
                            <button
                                type="button"
                                className={styles.clearBtn}
                                onClick={clearAllFilters}
                                title="Clear all filters"
                            >
                                <XIcon size={14} /> Clear
                            </button>
                        )}
                    </div>

                    {showAdvanced && (
                        <div className={styles.advancedPanel}>
                            <div className={styles.advancedGroup}>
                                <label className={styles.advancedLabel}>Payment method</label>
                                <div className={styles.chipRow}>
                                    <button
                                        type="button"
                                        className={`${styles.chip} ${paymentFilter === '' ? styles.chipActive : ''}`}
                                        onClick={() => setPaymentFilter('')}
                                    >All</button>
                                    {PAYMENT_METHODS.map(pm => (
                                        <button
                                            key={pm}
                                            type="button"
                                            className={`${styles.chip} ${paymentFilter === pm ? styles.chipActive : ''}`}
                                            onClick={() => setPaymentFilter(paymentFilter === pm ? '' : pm)}
                                        >{pm}</button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.advancedGroup}>
                                <label className={styles.advancedLabel}>Date range</label>
                                <div className={styles.chipRow}>
                                    {([
                                        { key: '', label: 'Any' },
                                        { key: 'today', label: 'Today' },
                                        { key: 'week', label: 'Last 7 days' },
                                        { key: 'month', label: 'Last 30 days' },
                                        { key: 'custom', label: 'Custom' },
                                    ] as { key: DatePreset; label: string }[]).map(({ key, label }) => (
                                        <button
                                            key={key || 'any'}
                                            type="button"
                                            className={`${styles.chip} ${datePreset === key ? styles.chipActive : ''}`}
                                            onClick={() => applyDatePreset(key)}
                                        >{label}</button>
                                    ))}
                                </div>
                                {datePreset === 'custom' && (
                                    <div className={styles.dateInputs}>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className={styles.dateInput}
                                            aria-label="Start date"
                                        />
                                        <span className={styles.dateSep}>to</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className={styles.dateInput}
                                            aria-label="End date"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.advancedGroup}>
                                <label className={styles.advancedLabel}>
                                    <SortIcon size={12} /> Sort by
                                </label>
                                <div className={styles.chipRow}>
                                    {([
                                        { key: 'newest', label: 'Newest' },
                                        { key: 'oldest', label: 'Oldest' },
                                        { key: 'amount_desc', label: 'Highest ₹' },
                                        { key: 'amount_asc', label: 'Lowest ₹' },
                                    ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`${styles.chip} ${sort === key ? styles.chipActive : ''}`}
                                            onClick={() => setSort(key)}
                                        >{label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
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
                                <RefreshIcon size={16} /> <span>Try Again</span>
                            </button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No orders found</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className={styles.mobileCards}>
                                {orders.map((order) => (
                                    <div key={order.id} className={styles.mCard}>
                                        <div className={styles.mCardTop}>
                                            <div className={`${styles.mCardAvatar} ${getStatusStyle(order.orderStatus)}`} aria-hidden="true">
                                                {order.customerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.mCardInfo}>
                                                <div className={styles.mCardNameRow}>
                                                    <Link href={`/admin/orders/${order.id}`} className={styles.mCardOrderNo}>
                                                        {order.orderNumber}
                                                    </Link>
                                                    <span className={styles.mCardAmount}>
                                                        ₹{order.totalAmount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <p className={styles.mCardCustomer}>
                                                    <span className={styles.mCardCustName}>{order.customerName}</span>
                                                    <span className={styles.mCardDot}>·</span>
                                                    <a href={`tel:${order.mobile}`} className={styles.mCardCustMobile}>{order.mobile}</a>
                                                </p>
                                                <p className={styles.mCardSubline}>
                                                    {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                                                    <span className={styles.mCardDot}>·</span>
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.mCardBottom}>
                                            <select
                                                value={order.orderStatus}
                                                onChange={(e) => requestStatusUpdate(order.id, order.orderNumber, e.target.value, order.orderStatus)}
                                                className={`${styles.statusSelect} ${getStatusStyle(order.orderStatus)} ${updatingOrderId === order.id ? styles.updating : ''}`}
                                                disabled={updatingOrderId === order.id}
                                                aria-label="Order status"
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className={styles.mCardIconBtn}
                                                aria-label="View order"
                                                title="View order"
                                            >
                                                <EyeIcon size={16} />
                                            </Link>
                                            <a
                                                href={`https://wa.me/91${order.mobile}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`${styles.mCardIconBtn} ${styles.mCardWhatsApp}`}
                                                aria-label="Message on WhatsApp"
                                                title="WhatsApp"
                                            >
                                                <MessageIcon size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
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
                                            <td>{order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}</td>
                                            <td className={styles.amountCell}>
                                                ₹{order.totalAmount.toLocaleString('en-IN')}
                                            </td>
                                            <td>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={order.orderStatus}
                                                        onChange={(e) => requestStatusUpdate(order.id, order.orderNumber, e.target.value, order.orderStatus)}
                                                        className={`${styles.statusSelect} ${getStatusStyle(order.orderStatus)} ${updatingOrderId === order.id ? styles.updating : ''}`}
                                                        disabled={updatingOrderId === order.id}
                                                    >
                                                        {STATUS_OPTIONS.map(status => (
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
                                                        aria-label="WhatsApp"
                                                    >
                                                        <MessageIcon size={16} />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
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

            <ConfirmDialog
                open={!!confirmState}
                title={confirmState ? `Mark order ${confirmState.orderNumber} as ${confirmState.newStatus}?` : ''}
                message={confirmState
                    ? `This will restore stock${confirmState.newStatus === 'REFUNDED' ? ' and mark the order as refunded' : ''}. This action can't be undone.`
                    : ''}
                confirmLabel={`Yes, ${confirmState?.newStatus ?? ''}`}
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={() => {
                    if (confirmState) doStatusUpdate(confirmState.orderId, confirmState.newStatus);
                    setConfirmState(null);
                }}
                onCancel={() => setConfirmState(null)}
            />
        </div>
    );
}
