'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
    RefreshIcon,
    CheckIcon,
    MessageIcon,
    PhoneIcon,
    MailIcon,
    PlantIcon,
    CopyIcon,
    ExternalLinkIcon,
} from '@/components/Icons';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { formatDateLong } from '@/lib/date';
import { getCourierTrackingUrl, COMMON_COURIERS } from '@/lib/courier';
import styles from './page.module.css';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
    selectedSize?: string;
    selectedColor?: string;
    selectedPlanter?: string;
    colorImage?: string;
    productId?: string;
    comboId?: string;
    hamperId?: string;
    product?: { name: string; slug: string; images: string[] };
    combo?: { name: string; slug: string; images: string[] };
    hamper?: { name: string; slug: string; images: string[] };
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    mobile: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    totalAmount: number;
    subtotal: number;
    shippingCost: number;
    discountAmount: number;
    couponCode?: string;
    orderStatus: string;
    paymentMethod: string;
    notes?: string;
    trackingNumber?: string;
    courierName?: string;
    shippedAt?: string;
    deliveredAt?: string;
    createdAt: string;
    updatedAt?: string;
    items: OrderItem[];
    user?: { name: string; mobile: string; email?: string };
    payment?: {
        status: string;
        razorpayPaymentId?: string;
        razorpayOrderId?: string;
        amount?: number;
    };
}

interface CustomerHistory {
    totalOrders: number;
    paidOrders: number;
    lifetimeValue: number;
    previousOrders: number;
    previousValue: number;
    lastOrder?: { id: string; orderNumber: string; createdAt: string; orderStatus: string; totalAmount: number } | null;
}

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const DESTRUCTIVE_STATUSES = new Set(['CANCELLED', 'REFUNDED']);

export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { token } = useAuth();
    const toast = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [savingTracking, setSavingTracking] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [trackingSaved, setTrackingSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<CustomerHistory | null>(null);
    const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(`/api/admin/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setOrder(data);
                setTrackingNumber(data.trackingNumber || '');
                setCourierName(data.courierName || '');
            } else {
                setError(data.error || 'Failed to load order');
            }
        } catch (err) {
            console.error('Failed to fetch order:', err);
            setError('Failed to load order. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    const fetchHistory = useCallback(async (mobile: string) => {
        try {
            const params = new URLSearchParams({ mobile, excludeOrderId: id });
            const res = await fetch(`/api/admin/customers/history?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch customer history:', err);
        }
    }, [id, token]);

    useEffect(() => {
        if (token && id) fetchOrder();
    }, [token, id, fetchOrder]);

    useEffect(() => {
        if (order?.mobile) fetchHistory(order.mobile);
    }, [order?.mobile, fetchHistory]);

    const doStatusUpdate = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);
        const previousStatus = order.orderStatus;
        setOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null); // optimistic
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
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
            setOrder(prev => prev ? { ...prev, orderStatus: previousStatus } : null); // rollback
            toast.error(err instanceof Error ? err.message : 'Failed to update order');
        } finally {
            setUpdating(false);
        }
    };

    const handleStatusChange = (newStatus: string) => {
        if (!order || newStatus === order.orderStatus) return;
        if (DESTRUCTIVE_STATUSES.has(newStatus)) {
            setConfirmStatus(newStatus);
            return;
        }
        doStatusUpdate(newStatus);
    };

    const saveTracking = async () => {
        setSavingTracking(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    trackingNumber: trackingNumber.trim() || null,
                    courierName: courierName.trim() || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Save failed');
            }
            setOrder(prev => prev ? {
                ...prev,
                trackingNumber: trackingNumber.trim() || undefined,
                courierName: courierName.trim() || undefined,
            } : null);
            setTrackingSaved(true);
            toast.success('Tracking details saved');
            setTimeout(() => setTrackingSaved(false), 2500);
        } catch (err) {
            console.error('Tracking update error:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to save tracking');
        } finally {
            setSavingTracking(false);
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error('Copy failed — please copy manually');
        }
    };

    const getItemImage = (item: OrderItem) => {
        if (item.image) return item.image;
        if (item.product?.images?.[0]) return item.product.images[0];
        if (item.combo?.images?.[0]) return item.combo.images[0];
        if (item.hamper?.images?.[0]) return item.hamper.images[0];
        return null;
    };

    const getItemLink = (item: OrderItem) => {
        if (item.product) return `/product/${item.product.slug}`;
        if (item.combo) return `/combos`;
        if (item.hamper) return `/gift-hampers`;
        return null;
    };

    const trackingUrl = useMemo(
        () => order ? getCourierTrackingUrl(order.courierName, order.trackingNumber) : null,
        [order],
    );

    const timeline = useMemo(() => {
        if (!order) return [];
        const events: { label: string; date?: string | null; done: boolean }[] = [
            { label: 'Order placed', date: order.createdAt, done: true },
            {
                label: 'Payment received',
                date: order.payment?.status === 'SUCCESS' ? order.updatedAt : undefined,
                done: order.payment?.status === 'SUCCESS' || ['PAID', 'PACKING', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus),
            },
            {
                label: 'Packing',
                date: undefined,
                done: ['PACKING', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus),
            },
            {
                label: 'Shipped',
                date: order.shippedAt,
                done: ['SHIPPED', 'DELIVERED'].includes(order.orderStatus),
            },
            {
                label: 'Delivered',
                date: order.deliveredAt,
                done: order.orderStatus === 'DELIVERED',
            },
        ];
        if (order.orderStatus === 'CANCELLED') {
            events.push({ label: 'Cancelled', date: order.updatedAt, done: true });
        }
        if (order.orderStatus === 'REFUNDED') {
            events.push({ label: 'Refunded', date: order.updatedAt, done: true });
        }
        return events;
    }, [order]);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.loading}>Loading order...</div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.notFound}>
                        {error ? (
                            <>
                                <h2>Something went wrong</h2>
                                <p>{error}</p>
                                <button
                                    onClick={() => { setLoading(true); fetchOrder(); }}
                                    className={styles.retryBtn}
                                >
                                    <RefreshIcon size={16} /> Try Again
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>Order not found</h2>
                                <Link href="/admin/orders">← Back to Orders</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const fullAddress = `${order.customerName}\n${order.address}\n${order.city}, ${order.state} ${order.pincode}\nPhone: ${order.mobile}`;

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin">Admin</Link>
                        <span>/</span>
                        <Link href="/admin/orders">Orders</Link>
                        <span>/</span>
                        <span>{order.orderNumber}</span>
                    </div>
                    <div className={styles.headerContent}>
                        <div>
                            <h1>
                                Order {order.orderNumber}
                                <button
                                    type="button"
                                    className={styles.inlineCopy}
                                    onClick={() => copyToClipboard(order.orderNumber, 'Order number')}
                                    aria-label="Copy order number"
                                    title="Copy order number"
                                >
                                    <CopyIcon size={14} />
                                </button>
                            </h1>
                            <p className={styles.orderDate}>{formatDateLong(order.createdAt)}</p>
                        </div>
                        <div className={styles.headerActions}>
                            <a
                                href={`https://wa.me/91${order.mobile}?text=Hi%20${encodeURIComponent(order.customerName)},%20your%20order%20${order.orderNumber}%20update:`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappBtn}
                            >
                                <MessageIcon size={16} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Order Info */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Order Info</h2>

                        <div className={styles.statusSection}>
                            <label>Status</label>
                            <select
                                value={order.orderStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updating}
                                className={`${styles.statusSelect} ${styles[order.orderStatus.toLowerCase()]}`}
                            >
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.infoRow}>
                            <span>Payment Method</span>
                            <span>{order.paymentMethod}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Payment Status</span>
                            <span className={`${styles.badge} ${styles[`pay_${(order.payment?.status || 'PENDING').toLowerCase()}`] || styles.pending}`}>
                                {order.payment?.status || 'PENDING'}
                            </span>
                        </div>
                        {order.payment?.razorpayPaymentId && (
                            <div className={styles.infoRow}>
                                <span>Razorpay ID</span>
                                <span className={styles.razorpayCell}>
                                    <a
                                        href={`https://dashboard.razorpay.com/app/payments/${order.payment.razorpayPaymentId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.razorpayLink}
                                        title="View in Razorpay Dashboard"
                                    >
                                        {order.payment.razorpayPaymentId.slice(0, 18)}… <ExternalLinkIcon size={11} />
                                    </a>
                                    <button
                                        type="button"
                                        className={styles.inlineCopy}
                                        onClick={() => copyToClipboard(order.payment!.razorpayPaymentId!, 'Payment ID')}
                                        title="Copy payment ID"
                                        aria-label="Copy payment ID"
                                    >
                                        <CopyIcon size={12} />
                                    </button>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Customer</h2>
                        <div className={styles.customerInfo}>
                            <div className={styles.customerAvatar}>
                                {order.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.customerBody}>
                                <h3>{order.customerName}</h3>
                                <a href={`tel:${order.mobile}`} className={styles.customerContact}>
                                    <PhoneIcon size={13} /> {order.mobile}
                                </a>
                                {order.email && (
                                    <a href={`mailto:${order.email}`} className={styles.customerContact}>
                                        <MailIcon size={13} /> {order.email}
                                    </a>
                                )}
                            </div>
                        </div>
                        {history && (
                            <div className={styles.historyStrip}>
                                <div className={styles.historyItem}>
                                    <span className={styles.historyLabel}>Total orders</span>
                                    <span className={styles.historyValue}>{history.totalOrders}</span>
                                </div>
                                <div className={styles.historyItem}>
                                    <span className={styles.historyLabel}>Lifetime</span>
                                    <span className={styles.historyValue}>₹{history.lifetimeValue.toLocaleString('en-IN')}</span>
                                </div>
                                {history.previousOrders > 0 && (
                                    <span className={styles.repeatBadge} title={`Previously spent ₹${history.previousValue.toLocaleString('en-IN')}`}>
                                        Repeat · {history.previousOrders} prior
                                    </span>
                                )}
                                {history.totalOrders <= 1 && (
                                    <span className={styles.firstBadge}>First-time buyer</span>
                                )}
                                {history.lastOrder && (
                                    <Link href={`/admin/orders/${history.lastOrder.id}`} className={styles.historyLink} title="View last order">
                                        Last: {history.lastOrder.orderNumber}
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Shipping Address */}
                    <div className={styles.card}>
                        <div className={styles.cardHeaderRow}>
                            <h2 className={styles.cardTitle}>Shipping Address</h2>
                            <button
                                type="button"
                                className={styles.textBtn}
                                onClick={() => copyToClipboard(fullAddress, 'Address')}
                                title="Copy full address"
                            >
                                <CopyIcon size={13} /> Copy
                            </button>
                        </div>
                        <address className={styles.address}>
                            {order.address}<br />
                            {order.city}, {order.state}<br />
                            PIN: {order.pincode}
                        </address>
                    </div>
                </div>

                {/* Timeline */}
                <div className={styles.timelineCard}>
                    <h2 className={styles.cardTitle}>Timeline</h2>
                    <ol className={styles.timeline}>
                        {timeline.map((ev, i) => (
                            <li key={i} className={`${styles.timelineItem} ${ev.done ? styles.timelineDone : ''}`}>
                                <span className={styles.timelineDot} aria-hidden="true">
                                    {ev.done ? <CheckIcon size={12} /> : <span className={styles.timelineDotEmpty} />}
                                </span>
                                <div className={styles.timelineBody}>
                                    <span className={styles.timelineLabel}>{ev.label}</span>
                                    {ev.date && <span className={styles.timelineDate}>{formatDateLong(ev.date)}</span>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Tracking Card */}
                <div className={styles.trackingCard}>
                    <h2 className={styles.cardTitle}>Shipping &amp; Tracking</h2>
                    <div className={styles.trackingGrid}>
                        <div className={styles.trackingField}>
                            <label htmlFor="courier-name">Courier Name</label>
                            <input
                                id="courier-name"
                                type="text"
                                list="courier-list"
                                placeholder="e.g. Delhivery, DTDC, Blue Dart"
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                className={styles.trackingInput}
                            />
                            <datalist id="courier-list">
                                {COMMON_COURIERS.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div className={styles.trackingField}>
                            <label htmlFor="tracking-number">Tracking Number</label>
                            <input
                                id="tracking-number"
                                type="text"
                                placeholder="Enter tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className={styles.trackingInput}
                            />
                        </div>
                    </div>
                    <div className={styles.trackingActions}>
                        <button
                            onClick={saveTracking}
                            disabled={savingTracking}
                            className={styles.saveTrackingBtn}
                        >
                            {savingTracking ? 'Saving...' : trackingSaved ? <><CheckIcon size={16} /> Saved!</> : 'Save Tracking'}
                        </button>
                        {(order.trackingNumber || order.courierName) && (
                            <div className={styles.trackingSummary}>
                                <span className={styles.trackingNote}>
                                    Saved:
                                    {order.courierName ? ` ${order.courierName}` : ''}
                                    {order.courierName && order.trackingNumber ? ' — ' : ''}
                                    {order.trackingNumber || ''}
                                </span>
                                {trackingUrl && (
                                    <a
                                        href={trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.trackingLink}
                                    >
                                        Track shipment <ExternalLinkIcon size={12} />
                                    </a>
                                )}
                                {order.trackingNumber && (
                                    <button
                                        type="button"
                                        className={styles.inlineCopy}
                                        onClick={() => copyToClipboard(order.trackingNumber!, 'Tracking number')}
                                        title="Copy tracking number"
                                        aria-label="Copy tracking number"
                                    >
                                        <CopyIcon size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Items */}
                <div className={styles.itemsCard}>
                    <h2 className={styles.cardTitle}>Order Items</h2>
                    <div className={styles.itemsList}>
                        {order.items.map((item) => {
                            const image = getItemImage(item);
                            const link = getItemLink(item);

                            return (
                                <div key={item.id} className={styles.orderItem}>
                                    <div className={styles.itemImage}>
                                        {image ? (
                                            <Image src={image} alt={item.name} width={56} height={56} className={styles.itemImg} />
                                        ) : (
                                            <PlantIcon size={22} color="var(--primary-600, #2d6a4f)" />
                                        )}
                                    </div>
                                    <div className={styles.itemDetails}>
                                        {link ? (
                                            <Link href={link} className={styles.itemName}>
                                                {item.name}
                                            </Link>
                                        ) : (
                                            <span className={styles.itemName}>{item.name}</span>
                                        )}
                                        <div className={styles.itemMeta}>
                                            <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                                            {item.selectedSize && item.selectedSize.toUpperCase() !== 'DEFAULT' && (
                                                <span className={styles.itemVariant}>Size: {item.selectedSize}</span>
                                            )}
                                            {item.selectedPlanter && (
                                                <span className={styles.itemVariant}>Planter: {item.selectedPlanter}</span>
                                            )}
                                            {item.selectedColor && (
                                                <span className={styles.itemVariant}>
                                                    {item.colorImage ? (
                                                        <Image src={item.colorImage} alt={item.selectedColor} width={16} height={16} className={styles.colorSwatch} />
                                                    ) : null}
                                                    {item.selectedColor}
                                                </span>
                                            )}
                                            {item.comboId && <span className={styles.typeBadge}>Combo</span>}
                                            {item.hamperId && <span className={styles.typeBadge}>Hamper</span>}
                                        </div>
                                    </div>
                                    <div className={styles.itemPrice}>
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Totals */}
                    <div className={styles.totals}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>₹{(order.subtotal ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className={`${styles.totalRow} ${styles.discountRow}`}>
                                <span>
                                    Discount
                                    {order.couponCode && (
                                        <span className={styles.couponBadge}>{order.couponCode}</span>
                                    )}
                                </span>
                                <span>− ₹{order.discountAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className={styles.totalRow}>
                            <span>Shipping</span>
                            <span>{order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost}`}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>Total</span>
                            <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className={styles.notesCard}>
                        <h2 className={styles.cardTitle}>Order Notes</h2>
                        <p>{order.notes}</p>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!confirmStatus}
                title={confirmStatus ? `Mark order as ${confirmStatus}?` : ''}
                message={confirmStatus
                    ? `This will restore stock${confirmStatus === 'REFUNDED' ? ' and mark the order as refunded' : ''}. This action can't be undone.`
                    : ''}
                confirmLabel={`Yes, ${confirmStatus ?? ''}`}
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={() => {
                    if (confirmStatus) doStatusUpdate(confirmStatus);
                    setConfirmStatus(null);
                }}
                onCancel={() => setConfirmStatus(null)}
            />
        </div>
    );
}
