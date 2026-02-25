'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

interface VariantColor {
    name: string;
    hex: string;
    images: string[];
}

interface SizeVariant {
    size: string;
    price: number;
    stock: number;
    colors: VariantColor[];
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    productType: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
    sizeVariants?: SizeVariant[];
    tags?: string[];
}

interface AccessoriesClientProps {
    initialProducts: Product[];
}

export default function AccessoriesClient({ initialProducts }: AccessoriesClientProps) {
    const [sortBy, setSortBy] = useState('featured');
    const [sortOpen, setSortOpen] = useState(false);
    const [tempSort, setTempSort] = useState('featured');

    const sortedProducts = [...initialProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
    });

    const sortActive = sortBy !== 'featured';

    const openSort = () => { setTempSort(sortBy); setSortOpen(true); };
    const applySort = () => { setSortBy(tempSort); setSortOpen(false); };

    return (
        <>
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Garden Accessories</h1>
                            <p className={styles.subtitle}>Essential tools and accessories to nurture your garden</p>
                        </div>
                    </div>

                    <div className={styles.layout}>
                        <main className={styles.main}>
                            <div className={styles.topBar}>
                                <span className={styles.resultCount}>{sortedProducts.length} accessories</span>

                                {/* Mobile Sort Button */}
                                <button
                                    className={styles.mobileActionBtn}
                                    onClick={openSort}
                                    aria-label="Open sort options"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M6 12h12M9 18h6" />
                                    </svg>
                                    Sort
                                    {sortActive && <span className={styles.activeBadge}>1</span>}
                                </button>

                                {/* Desktop Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={styles.sortSelect}
                                >
                                    <option value="featured">Featured</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name">Name: A-Z</option>
                                </select>
                            </div>

                            {sortedProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                    <p style={{ fontSize: '1.25rem', color: '#64748b' }}>🔧 No accessories found.</p>
                                </div>
                            ) : (
                                <div className={styles.grid}>
                                    {sortedProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            id={product.id}
                                            name={product.name}
                                            slug={product.slug}
                                            price={product.price}
                                            comparePrice={product.comparePrice}
                                            image={product.images[0]}
                                            stock={product.stock}
                                            type="product"
                                            featured={product.featured}
                                            sizeVariants={product.sizeVariants || []}
                                            productType={product.productType}
                                            tags={product.tags || []}
                                        />
                                    ))}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>

            {/* ── Mobile Sort Bottom Sheet ─────────────────────────────────── */}
            {sortOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, animation: 'fadeIn 0.2s ease' }}
                        onClick={() => setSortOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="dialog" aria-modal="true" aria-label="Sort options"
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 401,
                            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
                        }}
                    >
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sort By</h3>
                            <button onClick={() => setSortOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { value: 'featured', label: 'Default (Featured)' },
                                { value: 'price-asc', label: 'Price: Low → High' },
                                { value: 'price-desc', label: 'Price: High → Low' },
                                { value: 'name', label: 'Name: A → Z' },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => setTempSort(opt.value)} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', fontSize: 15, fontWeight: 500,
                                    color: tempSort === opt.value ? '#1a4d2e' : '#374151',
                                    background: tempSort === opt.value ? '#f0f9f4' : '#f9fafb',
                                    border: `1.5px solid ${tempSort === opt.value ? '#1a4d2e' : '#e5e7eb'}`,
                                    borderRadius: 12, cursor: 'pointer', minHeight: 52, textAlign: 'left',
                                }}>
                                    <span>{opt.label}</span>
                                    {tempSort === opt.value && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a4d2e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={() => setTempSort('featured')} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Clear</button>
                            <button onClick={applySort} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#1a4d2e', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Apply</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
