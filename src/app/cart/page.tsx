'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { TrashIcon, CartIcon, LeafIcon, ArrowRightIcon, TruckIcon, ShieldIcon } from '@/components/Icons';
import styles from './page.module.css';

export default function CartPage() {
    const { items, summary, updateQuantity, removeItem, isLoading } = useCart();

    // Pincode checker state
    const [pincode, setPincode] = useState('');
    const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const [pincodeMessage, setPincodeMessage] = useState('');
    const [validatedPincode, setValidatedPincode] = useState('');
    const [stockError, setStockError] = useState('');

    const handlePincodeCheck = async () => {
        const trimmed = pincode.trim();
        if (!/^\d{6}$/.test(trimmed)) {
            setPincodeStatus('invalid');
            setPincodeMessage('Please enter a valid 6-digit pincode');
            return;
        }

        setPincodeStatus('checking');
        setPincodeMessage('');

        try {
            const res = await fetch(`/api/pincode/check?pincode=${trimmed}`);
            const data = await res.json();

            if (data.available) {
                setPincodeStatus('valid');
                const location = [data.city, data.state].filter(Boolean).join(', ');
                setPincodeMessage(location ? `Delivery available to ${location}` : 'Delivery available in your area!');
                setValidatedPincode(trimmed);
            } else {
                setPincodeStatus('invalid');
                setPincodeMessage('Sorry, we don\'t deliver to this pincode yet');
                setValidatedPincode('');
            }
        } catch {
            setPincodeStatus('invalid');
            setPincodeMessage('Unable to check. Please try again.');
            setValidatedPincode('');
        }
    };

    const handlePincodeChange = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 6);
        setPincode(digits);
        // Reset validation if pincode changes after being validated
        if (validatedPincode && digits !== validatedPincode) {
            setPincodeStatus('idle');
            setPincodeMessage('');
            setValidatedPincode('');
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading your cart...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIconWrapper}>
                    <CartIcon size={64} color="#94a3b8" />
                </div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven&apos;t added any plants yet.</p>
                <Link href="/plants" className="btn btn-primary btn-lg">
                    Start Shopping
                </Link>
            </div>
        );
    }

    const canCheckout = pincodeStatus === 'valid' && validatedPincode.length === 6;

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <h1 className={styles.title}>Shopping Cart</h1>
                    <span className={styles.itemCount}>{items.length} items</span>
                </div>

                {stockError && (
                    <div className={styles.stockToast}>
                        ⚠️ {stockError}
                    </div>
                )}

                <div className={styles.layout}>
                    {/* Cart Items */}
                    <div className={styles.cartItems}>
                        {items.map((item) => (
                            <div key={`${item.type}-${item.id}`} className={styles.cartItem}>
                                <div className={styles.itemImage}>
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={100}
                                            height={100}
                                            className={styles.img}
                                        />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <LeafIcon size={32} color="#16a34a" />
                                        </div>
                                    )}
                                </div>

                                <div className={styles.itemDetails}>
                                    <div className={styles.itemHeader}>
                                        <h3 className={styles.itemName}>
                                            <Link href={`/${item.type === 'product' ? 'plants' : item.type === 'hamper' ? 'gift-hampers' : 'combos'}/${item.slug}`}>
                                                {item.name}
                                            </Link>
                                        </h3>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.id!, item.type)}
                                            aria-label="Remove item"
                                        >
                                            <TrashIcon size={18} />
                                        </button>
                                    </div>

                                    <span className={styles.itemType}>
                                        {item.type === 'combo' ? 'Combo' : item.type === 'hamper' ? 'Gift Hamper' : 'Plant'}
                                    </span>

                                    {/* Variant Details */}
                                    {(item.size || item.color) && (
                                        <div className={styles.variantInfo}>
                                            {item.size && (
                                                <span className={styles.variantTag}>
                                                    📏 Size: <strong>{item.size.toUpperCase()}</strong>
                                                </span>
                                            )}
                                            {item.color && (
                                                <span className={styles.variantTag}>
                                                    <span
                                                        className={styles.colorDot}
                                                        style={{ backgroundColor: item.colorHex || '#888' }}
                                                    />
                                                    Color: <strong>{item.color}</strong>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.itemControls}>
                                        <div className={styles.itemQuantity}>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQuantity(item.id!, item.type, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className={styles.qtyValue}>{item.quantity}</span>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={async () => {
                                                    const error = await updateQuantity(item.id!, item.type, item.quantity + 1);
                                                    if (error) {
                                                        setStockError(error);
                                                        setTimeout(() => setStockError(''), 3000);
                                                    }
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className={styles.itemPrice}>
                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className={styles.summary}>
                        <h2 className={styles.summaryTitle}>Order Summary</h2>

                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>₹{summary.subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        <div className={styles.summaryRow}>
                            <span>Shipping</span>
                            <span>
                                {summary.shipping === 0 ? (
                                    <span className={styles.freeShipping}>FREE</span>
                                ) : (
                                    `₹${summary.shipping}`
                                )}
                            </span>
                        </div>

                        {summary.subtotal < 999 && (
                            <div className={styles.shippingNote}>
                                <TruckIcon size={16} />
                                <span>Add <b>₹{(999 - summary.subtotal).toLocaleString('en-IN')}</b> for free shipping!</span>
                            </div>
                        )}

                        <div className={styles.summaryDivider}></div>

                        <div className={styles.summaryTotal}>
                            <span>Total</span>
                            <span>₹{summary.total.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Pincode Checker */}
                        <div className={styles.pincodeChecker}>
                            <div className={styles.pincodeLabel}>
                                <TruckIcon size={16} />
                                <span>Check Delivery Availability</span>
                            </div>
                            <div className={styles.pincodeInputRow}>
                                <input
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => handlePincodeChange(e.target.value)}
                                    placeholder="Enter pincode"
                                    className={styles.pincodeInput}
                                    maxLength={6}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePincodeCheck(); }}
                                />
                                <button
                                    onClick={handlePincodeCheck}
                                    className={styles.pincodeBtn}
                                    disabled={pincodeStatus === 'checking' || pincode.length < 6}
                                >
                                    {pincodeStatus === 'checking' ? '...' : 'Check'}
                                </button>
                            </div>
                            {pincodeMessage && (
                                <div className={`${styles.pincodeResult} ${pincodeStatus === 'valid' ? styles.pincodeSuccess : styles.pincodeError}`}>
                                    {pincodeStatus === 'valid' ? '✅' : '❌'} {pincodeMessage}
                                </div>
                            )}
                        </div>

                        {canCheckout ? (
                            <Link href="/checkout" className={styles.checkoutBtn}>
                                Proceed to Checkout
                                <ArrowRightIcon size={20} />
                            </Link>
                        ) : (
                            <button className={styles.checkoutBtnDisabled} disabled>
                                {pincodeStatus === 'idle' ? 'Enter pincode to proceed' : 'Delivery not available'}
                            </button>
                        )}

                        <div className={styles.secureBadge}>
                            <ShieldIcon size={16} color="#059669" />
                            <span>100% Secure Checkout</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
