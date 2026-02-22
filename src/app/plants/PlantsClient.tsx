'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterBottomSheet, { FilterButton, MobileFilterButton } from '@/components/FilterBottomSheet';
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
    size?: string;
    suitableFor?: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
    sizeVariants?: SizeVariant[];
    tags?: string[];
}

interface PlantsClientProps {
    initialProducts: Product[];
}

export default function PlantsClient({ initialProducts }: PlantsClientProps) {
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [size, setSize] = useState('');

    // Mobile filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSort, setMobileSort] = useState('');
    const [mobileSuitableFor, setMobileSuitableFor] = useState('');
    const [mobileSize, setMobileSize] = useState('');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const filteredProducts = initialProducts.filter(product => {
        const effectiveSuitable = mobileSuitableFor || suitableFor;
        const effectiveSize = mobileSize || size;
        const matchesSuitable = !effectiveSuitable || product.suitableFor === effectiveSuitable;
        const matchesSize = !effectiveSize || product.size === effectiveSize;
        return matchesSuitable && matchesSize;
    });

    // Apply mobile sort if set
    const effectiveSort = mobileSort || sortBy;

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (effectiveSort) {
            case 'price-low':
            case 'price-asc': return a.price - b.price;
            case 'price-high':
            case 'price-desc': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            default: return 0;
        }
    });

    const mobileFilterCount = (mobileSuitableFor ? 1 : 0) + (mobileSize ? 1 : 0);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Plants Collection</h1>
                        <p className={styles.subtitle}>Discover our handpicked selection of beautiful plants</p>
                    </div>
                </div>

                <div className={styles.layout}>
                    {/* Filters Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterCard}>
                            <h3 className={styles.filterTitle}>Filters</h3>

                            <div className={styles.filterGroup}>
                                <label>Suitable For</label>
                                <select value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="INDOOR">Indoor</option>
                                    <option value="OUTDOOR">Outdoor</option>
                                    <option value="BOTH">Both</option>
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label>Size</label>
                                <select value={size} onChange={(e) => setSize(e.target.value)}>
                                    <option value="">All Sizes</option>
                                    <option value="SMALL">Small</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="BIG">Big</option>
                                </select>
                            </div>

                            <button
                                className={styles.clearBtn}
                                onClick={() => { setSuitableFor(''); setSize(''); }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className={styles.main}>
                        {/* Top Bar */}
                        <div className={styles.topBar}>
                            {/* Mobile Filter Button (left) */}
                            <MobileFilterButton onClick={() => setMobileFilterOpen(true)} activeCount={mobileFilterCount} />

                            <span className={styles.resultCount}>{sortedProducts.length} plants</span>

                            {/* Mobile Sort Button (right) */}
                            <FilterButton onClick={() => setFilterOpen(true)} activeCount={mobileSort ? 1 : 0} />

                            {/* Desktop Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={styles.sortSelect}
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name">Name: A-Z</option>
                            </select>
                        </div>

                        {/* Products */}
                        {sortedProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <p style={{ fontSize: '1.25rem', color: '#64748b' }}>🌱 No plants found matching your filters.</p>
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
                                        size={product.size}
                                        suitableFor={product.suitableFor}
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

            {/* Mobile Sort Bottom Sheet */}
            <FilterBottomSheet
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                sortValue={mobileSort}
                onSortChange={setMobileSort}
                onApply={() => setFilterOpen(false)}
            />

            {/* Mobile Filter Bottom Sheet */}
            {mobileFilterOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            zIndex: 200, animation: 'fadeIn 0.2s ease'
                        }}
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        background: '#fff', borderRadius: '20px 20px 0 0',
                        zIndex: 201, padding: '20px 16px',
                        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: 0 }}>Filter</h3>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 8 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suitable For</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {['', 'INDOOR', 'OUTDOOR', 'BOTH'].map(val => (
                                    <button key={val} onClick={() => setMobileSuitableFor(val)} style={{
                                        padding: '10px 18px', fontSize: 13, fontWeight: 500, borderRadius: 50,
                                        border: mobileSuitableFor === val ? '1.5px solid #1a4d2e' : '1px solid #d1d5db',
                                        background: mobileSuitableFor === val ? '#1a4d2e' : '#f9fafb',
                                        color: mobileSuitableFor === val ? '#fff' : '#374151',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>{val || 'All'}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {['', 'SMALL', 'MEDIUM', 'BIG'].map(val => (
                                    <button key={val} onClick={() => setMobileSize(val)} style={{
                                        padding: '10px 18px', fontSize: 13, fontWeight: 500, borderRadius: 50,
                                        border: mobileSize === val ? '1.5px solid #1a4d2e' : '1px solid #d1d5db',
                                        background: mobileSize === val ? '#1a4d2e' : '#f9fafb',
                                        color: mobileSize === val ? '#fff' : '#374151',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>{val || 'All'}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => { setMobileSuitableFor(''); setMobileSize(''); }} style={{
                                flex: 1, padding: '14px', fontSize: 14, fontWeight: 600,
                                color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer'
                            }}>Clear</button>
                            <button onClick={() => setMobileFilterOpen(false)} style={{
                                flex: 2, padding: '14px', fontSize: 14, fontWeight: 600,
                                color: '#fff', background: '#1a4d2e', border: 'none', borderRadius: 12, cursor: 'pointer'
                            }}>Apply</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
