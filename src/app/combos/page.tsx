'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { GiftIcon, TruckIcon, CheckIcon, PackageIcon, ArrowRightIcon } from '@/components/Icons';
import styles from './page.module.css';

interface Combo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    includes?: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
}

export default function CombosPage() {
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCombos = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/combos');
                if (res.ok) {
                    const data = await res.json();
                    if (data.combos?.length > 0) {
                        setCombos(data.combos);
                    }
                }
            } catch {
                // Use sample data
            } finally {
                setLoading(false);
            }
        };
        fetchCombos();
    }, []);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.badge}>Special Bundles</span>
                    <h1 className={styles.title}>Plant Combos</h1>
                    <p className={styles.subtitle}>
                        Curated plant bundles at special prices. Save more when you buy together!
                    </p>
                </div>

                {/* Benefits Bar */}
                <div className={styles.benefits}>
                    <div className={styles.benefitItem}>
                        <span className={styles.benefitIcon}><PackageIcon size={22} color="#16a34a" /></span>
                        <span>Save up to 30%</span>
                    </div>
                    <div className={styles.benefitItem}>
                        <span className={styles.benefitIcon}><GiftIcon size={22} color="#16a34a" /></span>
                        <span>Gift-Ready Packaging</span>
                    </div>
                    <div className={styles.benefitItem}>
                        <span className={styles.benefitIcon}><TruckIcon size={22} color="#16a34a" /></span>
                        <span>Free Delivery Above ₹999</span>
                    </div>
                </div>

                {/* Combos Grid */}
                {loading ? (
                    <div className={styles.loading}>Loading combos...</div>
                ) : combos.length === 0 ? (
                    <div className={styles.loading} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <GiftIcon size={64} color="#94a3b8" />
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>No combos available yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {combos.map((combo) => (
                            <ProductCard
                                key={combo.id}
                                id={combo.id}
                                name={combo.name}
                                slug={combo.slug}
                                price={combo.price}
                                comparePrice={combo.comparePrice}
                                image={combo.images?.[0] || undefined}
                                stock={combo.stock}
                                type="combo"
                                featured={combo.featured}
                                tags={combo.featured ? ['Best Value'] : []}
                                suitableFor="BOTH"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
