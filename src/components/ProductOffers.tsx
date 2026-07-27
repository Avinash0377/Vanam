'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ProductOffers.module.css';

// ── Types ──────────────────────────────────────────────

interface Offer {
    id: string;
    code: string | null;
    offerType: string;
    title: string;
    subtext: string | null;
    autoApply: boolean;
    showCode: boolean;
    minOrder: number;
    validTill: string | null;
}

interface ProductOffersProps {
    productId: string;
}

// ── Component ──────────────────────────────────────────

export default function ProductOffers({ productId }: ProductOffersProps) {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const liveRegionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchOffers = async () => {
            try {
                const res = await fetch(`/api/products/${productId}/offers`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (!cancelled) {
                    setOffers(data?.data?.offers || []);
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                    console.error('ProductOffers: Failed to fetch offers for product', productId);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchOffers();
        return () => { cancelled = true; };
    }, [productId]);

    const handleCopy = async (code: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                // Fallback for older/insecure contexts
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            setCopiedCode(code);
            // Announce to screen readers
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `Code ${code} copied to clipboard`;
            }

            // Analytics event
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'pdp_offer_code_copied', {
                    product_id: productId,
                    coupon_code: code,
                });
            }

            // Reset after 2 seconds
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            console.error('Failed to copy code:', code);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Don't render anything if loading resulted in error, empty, or feature is off
    if (error || (!loading && offers.length === 0)) {
        return null;
    }

    // Loading skeleton
    if (loading) {
        return (
            <section className={styles.offersSection} aria-label="Loading offers">
                <h3 className={styles.heading}>Offers for you:</h3>
                <div className={styles.offersContainer}>
                    <div className={styles.skeletonRow}>
                        <div className={styles.skeletonBar} style={{ width: '70%' }} />
                        <div className={styles.skeletonBar} style={{ width: '20%' }} />
                    </div>
                    <div className={styles.skeletonRow}>
                        <div className={styles.skeletonBar} style={{ width: '60%' }} />
                        <div className={styles.skeletonBar} style={{ width: '25%' }} />
                    </div>
                </div>
            </section>
        );
    }

    const visibleOffers = showAll ? offers : offers.slice(0, 3);
    const hasMore = offers.length > 3;

    return (
        <section className={styles.offersSection} aria-labelledby="offers-heading">
            <h3 id="offers-heading" className={styles.heading}>Offers for you:</h3>

            <div className={styles.offersContainer}>
                {visibleOffers.map((offer, index) => (
                    <div
                        key={offer.id}
                        className={`${styles.offerRow} ${index < visibleOffers.length - 1 ? styles.offerRowBorder : ''}`}
                    >
                        <div className={styles.offerLeft}>
                            <span className={styles.offerTitle}>{offer.title}</span>
                            {offer.subtext && (
                                <span className={styles.offerSubtext}>{offer.subtext}</span>
                            )}
                            {offer.validTill && (
                                <span className={styles.offerExpiry}>
                                    Valid till {formatDate(offer.validTill)}
                                </span>
                            )}
                        </div>

                        <div className={styles.offerRight}>
                            {offer.showCode && offer.code ? (
                                <button
                                    className={styles.copyBtn}
                                    onClick={() => handleCopy(offer.code!)}
                                    aria-label={`Copy coupon code ${offer.code}`}
                                    title={copiedCode === offer.code ? 'Copied!' : `Copy code ${offer.code}`}
                                >
                                    <span className={styles.codeText}>{offer.code}</span>
                                    {copiedCode === offer.code ? (
                                        <svg className={styles.copyIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg className={styles.copyIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    )}
                                </button>
                            ) : (
                                <span className={styles.autoApplyText}>Offer applied at checkout</span>
                            )}
                        </div>
                    </div>
                ))}

                {hasMore && !showAll && (
                    <button
                        className={styles.viewAllBtn}
                        onClick={() => setShowAll(true)}
                    >
                        View all {offers.length} offers
                    </button>
                )}
            </div>

            {/* Screen reader live region for copy announcements */}
            <div
                ref={liveRegionRef}
                aria-live="polite"
                aria-atomic="true"
                className={styles.srOnly}
            />
        </section>
    );
}
