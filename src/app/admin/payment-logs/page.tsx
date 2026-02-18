'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import { ActivityIcon, SearchIcon } from '@/components/Icons';

type PaymentEventType =
    | 'INITIATED'
    | 'VERIFICATION_STARTED'
    | 'VERIFIED_SUCCESS'
    | 'SIGNATURE_FAILED'
    | 'DUPLICATE_ATTEMPT'
    | 'ORDER_CREATED'
    | 'FAILED'
    | 'WEBHOOK_RECEIVED'
    | 'WEBHOOK_CONFIRMED'
    | 'CANCELED';

type PaymentLogStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'INFO';

interface PaymentLog {
    id: string;
    correlationId: string | null;
    orderId: string | null;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    eventType: PaymentEventType;
    status: PaymentLogStatus;
    amount: number | null;
    message: string | null;
    ipAddress: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const QUICK_FILTERS: { label: string; params: Record<string, string> }[] = [
    { label: '🔴 Only Failed', params: { status: 'FAILED' } },
    { label: '🔐 Signature Errors', params: { eventType: 'SIGNATURE_FAILED' } },
    { label: '🔔 Webhook Events', params: { eventType: 'WEBHOOK_RECEIVED' } },
    {
        label: '📅 Today',
        params: {
            from: new Date().toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
        },
    },
];

const EVENT_COLORS: Record<PaymentEventType, string> = {
    INITIATED: 'eventInitiated',
    VERIFICATION_STARTED: 'eventVerification',
    VERIFIED_SUCCESS: 'eventSuccess',
    SIGNATURE_FAILED: 'eventDanger',
    DUPLICATE_ATTEMPT: 'eventWarning',
    ORDER_CREATED: 'eventSuccess',
    FAILED: 'eventDanger',
    WEBHOOK_RECEIVED: 'eventInfo',
    WEBHOOK_CONFIRMED: 'eventSuccess',
    CANCELED: 'eventWarning',
};

const STATUS_COLORS: Record<PaymentLogStatus, string> = {
    PENDING: 'statusPending',
    SUCCESS: 'statusSuccess',
    FAILED: 'statusFailed',
    INFO: 'statusInfo',
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function shortId(id: string | null) {
    if (!id) return '—';
    return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

export default function PaymentLogsPage() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<PaymentLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [eventType, setEventType] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [activeChip, setActiveChip] = useState<number | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (search) params.set('razorpayOrderId', search);
            if (eventType) params.set('eventType', eventType);
            if (status) params.set('status', status);
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            params.set('page', String(page));
            params.set('limit', '50');

            const res = await fetch(`/api/admin/payment-logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch logs');
            const data = await res.json();
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch {
            setError('Failed to load payment logs.');
        } finally {
            setLoading(false);
        }
    }, [search, eventType, status, from, to, page, token]);

    useEffect(() => {
        if (token) fetchLogs();
    }, [fetchLogs, token]);

    function applyQuickFilter(idx: number) {
        const chip = QUICK_FILTERS[idx];
        if (activeChip === idx) {
            setActiveChip(null);
            setStatus('');
            setEventType('');
            setFrom('');
            setTo('');
        } else {
            setActiveChip(idx);
            setStatus(chip.params.status ?? '');
            setEventType(chip.params.eventType ?? '');
            setFrom(chip.params.from ?? '');
            setTo(chip.params.to ?? '');
        }
        setPage(1);
    }

    function clearFilters() {
        setSearch('');
        setEventType('');
        setStatus('');
        setFrom('');
        setTo('');
        setActiveChip(null);
        setPage(1);
    }

    const hasFilters = !!(search || eventType || status || from || to);

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.headerIcon}>
                        <ActivityIcon size={24} />
                    </span>
                    <div>
                        <h1 className={styles.title}>Payment Logs</h1>
                        <p className={styles.subtitle}>
                            Append-only audit trail — {pagination?.total ?? '…'} events recorded
                        </p>
                    </div>
                </div>
                <button className={styles.refreshBtn} onClick={fetchLogs} disabled={loading}>
                    {loading ? '…' : '↻'} Refresh
                </button>
            </div>

            {/* Quick Filter Chips */}
            <div className={styles.chips}>
                {QUICK_FILTERS.map((chip, idx) => (
                    <button
                        key={chip.label}
                        className={`${styles.chip} ${activeChip === idx ? styles.chipActive : ''}`}
                        onClick={() => applyQuickFilter(idx)}
                    >
                        {chip.label}
                    </button>
                ))}
                {hasFilters && (
                    <button className={styles.chipClear} onClick={clearFilters}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <SearchIcon size={15} />
                    <input
                        type="text"
                        placeholder="Search Razorpay Order ID…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); setActiveChip(null); }}
                        className={styles.searchInput}
                    />
                </div>

                <select
                    value={eventType}
                    onChange={e => { setEventType(e.target.value); setPage(1); setActiveChip(null); }}
                    className={styles.select}
                >
                    <option value="">All Events</option>
                    <option value="INITIATED">INITIATED</option>
                    <option value="VERIFICATION_STARTED">VERIFICATION_STARTED</option>
                    <option value="VERIFIED_SUCCESS">VERIFIED_SUCCESS</option>
                    <option value="SIGNATURE_FAILED">SIGNATURE_FAILED</option>
                    <option value="DUPLICATE_ATTEMPT">DUPLICATE_ATTEMPT</option>
                    <option value="ORDER_CREATED">ORDER_CREATED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="WEBHOOK_RECEIVED">WEBHOOK_RECEIVED</option>
                    <option value="WEBHOOK_CONFIRMED">WEBHOOK_CONFIRMED</option>
                    <option value="CANCELED">CANCELED</option>
                </select>

                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); setActiveChip(null); }}
                    className={styles.select}
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                    <option value="INFO">INFO</option>
                </select>

                <div className={styles.dateRange}>
                    <input
                        type="date"
                        value={from}
                        onChange={e => { setFrom(e.target.value); setPage(1); setActiveChip(null); }}
                        className={styles.dateInput}
                        title="From date"
                    />
                    <span className={styles.dateSep}>→</span>
                    <input
                        type="date"
                        value={to}
                        onChange={e => { setTo(e.target.value); setPage(1); setActiveChip(null); }}
                        className={styles.dateInput}
                        title="To date"
                    />
                </div>
            </div>

            {/* Error */}
            {error && <div className={styles.error}>{error}</div>}

            {/* ===== DESKTOP TABLE ===== */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Correlation ID</th>
                            <th>Razorpay Order</th>
                            <th>Event</th>
                            <th title="Status recorded at the time this event was logged">Status at Time</th>
                            <th>Amount</th>
                            <th>Message</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={8}>
                                    <div className={styles.loadingContent}>
                                        <div className={styles.spinner} />
                                        Loading logs…
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && logs.length === 0 && (
                            <tr>
                                <td colSpan={8}>
                                    <div className={styles.emptyContent}>
                                        <ActivityIcon size={40} color="var(--neutral-300)" />
                                        <p>No payment logs found.</p>
                                        <span>Logs will appear here as payments are processed.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {!loading && (() => {
                            let lastCorrelationId: string | null = null;
                            return logs.map((log, idx) => {
                                const isNewGroup = idx > 0 && log.correlationId !== lastCorrelationId;
                                lastCorrelationId = log.correlationId;
                                return (
                                    <tr key={log.id}>
                                        <td className={`${styles.dateCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`}>{formatDate(log.createdAt)}</td>
                                        <td className={`${styles.idCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`} title={log.correlationId ?? ''}>
                                            {shortId(log.correlationId)}
                                        </td>
                                        <td className={`${styles.idCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`} title={log.razorpayOrderId ?? ''}>
                                            {shortId(log.razorpayOrderId)}
                                        </td>
                                        <td className={isNewGroup ? styles.groupBorder : ''}>
                                            <span className={`${styles.badge} ${styles[EVENT_COLORS[log.eventType]]}`}>
                                                {log.eventType.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className={isNewGroup ? styles.groupBorder : ''}>
                                            <span className={`${styles.statusBadge} ${styles[STATUS_COLORS[log.status]]}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className={`${styles.amountCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`}>
                                            {log.amount != null ? `₹${log.amount.toFixed(2)}` : '—'}
                                        </td>
                                        <td className={`${styles.messageCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`} title={log.message ?? ''}>
                                            {log.message ?? '—'}
                                        </td>
                                        <td className={`${styles.ipCell}${isNewGroup ? ' ' + styles.groupBorder : ''}`}>{log.ipAddress ?? '—'}</td>
                                    </tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            {/* ===== MOBILE CARDS ===== */}
            <div className={styles.cardList}>
                {loading && (
                    <div className={styles.card}>
                        <div className={styles.loadingContent}>
                            <div className={styles.spinner} />
                            Loading logs…
                        </div>
                    </div>
                )}
                {!loading && logs.length === 0 && (
                    <div className={styles.card}>
                        <div className={styles.emptyContent}>
                            <ActivityIcon size={36} color="var(--neutral-300)" />
                            <p>No payment logs found.</p>
                            <span>Logs will appear as payments are processed.</span>
                        </div>
                    </div>
                )}
                {!loading && logs.map(log => (
                    <div key={log.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardBadges}>
                                <span className={`${styles.badge} ${styles[EVENT_COLORS[log.eventType]]}`}>
                                    {log.eventType.replace(/_/g, ' ')}
                                </span>
                                <span className={`${styles.statusBadge} ${styles[STATUS_COLORS[log.status]]}`}>
                                    {log.status}
                                </span>
                            </div>
                            <span className={styles.cardDate}>{formatDate(log.createdAt)}</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.cardField}>
                                <span className={styles.cardLabel}>Correlation ID</span>
                                <span className={`${styles.cardValue} ${styles.cardValueMono}`} title={log.correlationId ?? ''}>
                                    {shortId(log.correlationId)}
                                </span>
                            </div>
                            <div className={styles.cardField}>
                                <span className={styles.cardLabel}>Razorpay Order</span>
                                <span className={`${styles.cardValue} ${styles.cardValueMono}`} title={log.razorpayOrderId ?? ''}>
                                    {shortId(log.razorpayOrderId)}
                                </span>
                            </div>
                            <div className={styles.cardField}>
                                <span className={styles.cardLabel}>Amount</span>
                                <span className={`${styles.cardValue} ${styles.cardValueAmount}`}>
                                    {log.amount != null ? `₹${log.amount.toFixed(2)}` : '—'}
                                </span>
                            </div>
                            <div className={styles.cardField}>
                                <span className={styles.cardLabel}>IP Address</span>
                                <span className={`${styles.cardValue} ${styles.cardValueMono}`}>
                                    {log.ipAddress ?? '—'}
                                </span>
                            </div>
                        </div>
                        {log.message && (
                            <div className={styles.cardMessage} title={log.message}>
                                {log.message}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        ← Prev
                    </button>
                    <span className={styles.pageInfo}>
                        Page {pagination.page} of {pagination.totalPages}
                        <span className={styles.pageTotal}> ({pagination.total} total)</span>
                    </span>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages || loading}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Read-only notice */}
            <div className={styles.notice}>
                🔒 Payment logs are append-only and cannot be edited or deleted.
            </div>
        </div>
    );
}
