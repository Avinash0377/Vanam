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

const btnStyle = (active: boolean) => ({
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 500 as const,
    borderRadius: 50,
    border: active ? '1.5px solid #1a4d2e' : '1px solid #d1d5db',
    background: active ? '#1a4d2e' : '#f9fafb',
    color: active ? '#fff' : '#374151',
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    minHeight: 40,
});

export default function PlantsClient({ initialProducts }: PlantsClientProps) {
    // Unified state — mobile and desktop share the same values
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [size, setSize] = useState('');

    // Mobile sheet open state
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Temporary state — only applied when "Apply" is hit
    const [tempSort, setTempSort] = useState('');
    const [tempSuitableFor, setTempSuitableFor] = useState('');
    const [tempSize, setTempSize] = useState('');

    // Normalise any size string to the filter's enum values (SMALL / MEDIUM / BIG)
    const normSize = (s: string): string => {
        const v = s.toLowerCase().trim();
        if (v === 's' || v === 'sm' || v === 'small') return 'SMALL';
        if (v === 'm' || v === 'med' || v === 'medium') return 'MEDIUM';
        if (v === 'l' || v === 'lg' || v === 'large' || v === 'big' || v === 'xl') return 'BIG';
        return s.toUpperCase();
    };

    const filteredProducts = initialProducts.filter(product => {
        // Indoor → show INDOOR + BOTH; Outdoor → show OUTDOOR + BOTH; All → show everything
        const matchesSuitable = !suitableFor ||
            product.suitableFor === suitableFor ||
            product.suitableFor === 'BOTH';

        // Check top-level size OR any sizeVariant that maps to the selected size
        const matchesSize = !size || (
            product.sizeVariants && product.sizeVariants.length > 0
                ? product.sizeVariants.some(v => normSize(v.size) === size)
                : normSize(product.size || '') === size
        );

        return matchesSuitable && matchesSize;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
            default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
    });

    const filterCount = (suitableFor ? 1 : 0) + (size ? 1 : 0);
    const sortActive = sortBy && sortBy !== 'featured';

    // Open sort sheet — initialise temp from current
    const openSort = () => {
        setTempSort(sortBy === 'featured' ? '' : sortBy);
        setSortOpen(true);
    };
    const applySort = () => {
        setSortBy(tempSort || 'featured');
        setSortOpen(false);
    };
    const clearSort = () => setTempSort('');

    // Open filter sheet — initialise temp from current
    const openFilter = () => {
        setTempSuitableFor(suitableFor);
        setTempSize(size);
        setFilterOpen(true);
    };
    const applyFilter = () => {
        setSuitableFor(tempSuitableFor);
        setSize(tempSize);
        setFilterOpen(false);
    };
    const clearFilter = () => {
        setTempSuitableFor('');
        setTempSize('');
    };

    return (
        <>
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
                        {/* Filters Sidebar — desktop only */}
                        <aside className={styles.sidebar}>
                            <div className={styles.filterCard}>
                                <h3 className={styles.filterTitle}>Filters</h3>

                                <div className={styles.filterGroup}>
                                    <label>Suitable For</label>
                                    <select value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)}>
                                        <option value="">All</option>
                                        <option value="INDOOR">Indoor</option>
                                        <option value="OUTDOOR">Outdoor</option>
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
                                {/* Mobile Filter Button */}
                                <button
                                    className={styles.mobileActionBtn}
                                    onClick={openFilter}
                                    aria-label="Open filters"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                                    Filter
                                    {filterCount > 0 && <span className={styles.activeBadge}>{filterCount}</span>}
                                </button>

                                <span className={styles.resultCount}>{sortedProducts.length} plants</span>

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

                            {/* Products */}
                            {sortedProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                    <p style={{ fontSize: '1.25rem', color: '#64748b' }}>🌱 No plants found matching your filters.</p>
                                    <button
                                        onClick={() => { setSuitableFor(''); setSize(''); }}
                                        style={{ marginTop: 16, padding: '10px 24px', background: '#1a4d2e', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                                    >
                                        Clear Filters
                                    </button>
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
                        role="dialog"
                        aria-modal="true"
                        aria-label="Sort options"
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: '#fff', borderRadius: '20px 20px 0 0',
                            zIndex: 401,
                            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
                        }}
                    >
                        {/* Drag handle */}
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sort By</h3>
                            <button onClick={() => setSortOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Options */}
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                { value: '', label: 'Default (Featured)' },
                                { value: 'price-asc', label: 'Price: Low → High' },
                                { value: 'price-desc', label: 'Price: High → Low' },
                                { value: 'name', label: 'Name: A → Z' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTempSort(opt.value)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px', fontSize: 15, fontWeight: 500,
                                        color: tempSort === opt.value ? '#1a4d2e' : '#374151',
                                        background: tempSort === opt.value ? '#f0f9f4' : '#f9fafb',
                                        border: `1.5px solid ${tempSort === opt.value ? '#1a4d2e' : '#e5e7eb'}`,
                                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                                        minHeight: 52, textAlign: 'left',
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {tempSort === opt.value && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a4d2e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={clearSort} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>
                                Clear
                            </button>
                            <button onClick={applySort} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#1a4d2e', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>
                                Apply
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── Mobile Filter Bottom Sheet ───────────────────────────────── */}
            {filterOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, animation: 'fadeIn 0.2s ease' }}
                        onClick={() => setFilterOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter options"
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: '#fff', borderRadius: '20px 20px 0 0',
                            zIndex: 401,
                            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Drag handle */}
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Filter
                                {(tempSuitableFor || tempSize) && (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1a4d2e', background: '#f0f9f4', border: '1px solid #1a4d2e', borderRadius: 50, padding: '2px 8px', marginLeft: 8 }}>
                                        {(tempSuitableFor ? 1 : 0) + (tempSize ? 1 : 0)} active
                                    </span>
                                )}
                            </h3>
                            <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Filter options */}
                        <div style={{ padding: '20px 20px 0' }}>
                            {/* Suitable For */}
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Suitable For</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {[{ value: '', label: 'All' }, { value: 'INDOOR', label: 'Indoor' }, { value: 'OUTDOOR', label: 'Outdoor' }].map(opt => (
                                        <button key={opt.value} onClick={() => setTempSuitableFor(opt.value)} style={btnStyle(tempSuitableFor === opt.value)}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size */}
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Size</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {[{ value: '', label: 'All' }, { value: 'SMALL', label: 'Small' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'BIG', label: 'Big' }].map(opt => (
                                        <button key={opt.value} onClick={() => setTempSize(opt.value)} style={btnStyle(tempSize === opt.value)}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={clearFilter} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>
                                Clear All
                            </button>
                            <button onClick={applyFilter} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#1a4d2e', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
