'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon, MailIcon, RefreshIcon, CheckIcon } from '@/components/Icons';
import styles from './page.module.css';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
    selectedSize?: string;
    selectedColor?: string;
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
    items: OrderItem[];
    user?: { name: string; mobile: string; email?: string };
    payment?: {
        status: string;
        razorpayPaymentId?: string;
        razorpayOrderId?: string;
        amount?: number;
    };
}

export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { token } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [savingTracking, setSavingTracking] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [trackingSaved, setTrackingSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token && id) {
            fetchOrder();
        }
    }, [token, id]);

    const fetchOrder = async () => {
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
    };

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderStatus: newStatus }),
            });

            if (res.ok) {
                // Preserve all existing order fields, only update status
                setOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
            }
        } catch (error) {
            console.error('Update error:', error);
        } finally {
            setUpdating(false);
        }
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
                    // Don't send orderStatus — avoids triggering email/stock logic
                    trackingNumber: trackingNumber.trim() || null,
                    courierName: courierName.trim() || null,
                }),
            });

            if (res.ok) {
                setOrder(prev => prev ? {
                    ...prev,
                    trackingNumber: trackingNumber.trim() || undefined,
                    courierName: courierName.trim() || undefined,
                } : null);
                setTrackingSaved(true);
                setTimeout(() => setTrackingSaved(false), 2500);
            }
        } catch (error) {
            console.error('Tracking update error:', error);
        } finally {
            setSavingTracking(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getItemImage = (item: OrderItem) => {
        // Use product/combo/hamper image as the main thumbnail
        // colorImage is used only for the swatch, not the main image
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

    const statusOptions = ['PENDING', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

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
                                <button onClick={() => { setLoading(true); fetchOrder(); }} style={{
                                    padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                                    color: 'white', background: 'var(--primary-600)', border: 'none',
                                    borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                }}>
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
                            <h1>Order {order.orderNumber}</h1>
                            <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                        </div>
                        <div className={styles.headerActions}>
                            <a
                                href={`https://wa.me/91${order.mobile}?text=Hi%20${encodeURIComponent(order.customerName)},%20your%20order%20${order.orderNumber}%20update:`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappBtn}
                            >
                                💬 WhatsApp
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
                                onChange={(e) => updateStatus(e.target.value)}
                                disabled={updating}
                                className={`${styles.statusSelect} ${styles[order.orderStatus.toLowerCase()]}`}
                            >
                                {statusOptions.map(status => (
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
                            <span className={`${styles.badge} ${order.payment?.status === 'SUCCESS' ? styles.success : styles.pending}`}>
                                {order.payment?.status || 'PENDING'}
                            </span>
                        </div>
                        {order.payment?.razorpayPaymentId && (
                            <div className={styles.infoRow}>
                                <span>Razorpay ID</span>
                                <a
                                    href={`https://dashboard.razorpay.com/app/payments/${order.payment.razorpayPaymentId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.razorpayLink}
                                    title="View in Razorpay Dashboard"
                                >
                                    {order.payment.razorpayPaymentId.slice(0, 18)}…↗
                                </a>
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
                            <div>
                                <h3>{order.customerName}</h3>
                                <a href={`tel:${order.mobile}`} className={styles.customerContact}>
                                    📞 {order.mobile}
                                </a>
                                {order.email && (
                                    <a href={`mailto:${order.email}`} className={styles.customerContact}>
                                        ✉️ {order.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Shipping Address</h2>
                        <address className={styles.address}>
                            {order.address}<br />
                            {order.city}, {order.state}<br />
                            PIN: {order.pincode}
                        </address>
                    </div>
                </div>

                {/* Tracking Card */}
                <div className={styles.trackingCard}>
                    <h2 className={styles.cardTitle}>Shipping & Tracking</h2>
                    <div className={styles.trackingGrid}>
                        <div className={styles.trackingField}>
                            <label>Courier Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Delhivery, DTDC, Blue Dart"
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                                className={styles.trackingInput}
                            />
                        </div>
                        <div className={styles.trackingField}>
                            <label>Tracking Number</label>
                            <input
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
                            <span className={styles.trackingNote}>
                                Last saved:
                                {order.courierName ? ` ${order.courierName}` : ''}
                                {order.courierName && order.trackingNumber ? ' — ' : ''}
                                {order.trackingNumber || ''}
                            </span>
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
                                            <span>🌱</span>
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
                                            {item.selectedSize && (
                                                <span className={styles.itemVariant}>Size: {item.selectedSize}</span>
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
        </div>
    );
}
