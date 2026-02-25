'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from '../plants/page.module.css';

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
    tags?: string[];
}

interface SeedsClientProps {
    initialProducts: Product[];
}

const seedCategories = [
    { value: '', label: 'All Seeds' },
    { value: 'vegetables', label: 'Vegetable Seeds' },
    { value: 'flowers', label: 'Flower Seeds' },
    { value: 'herbs', label: 'Herb Seeds' },
];

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

export default function SeedsClient({ initialProducts }: SeedsClientProps) {
    // Unified state
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [category, setCategory] = useState('');

    // Sheet open state
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Temp state
    const [tempSort, setTempSort] = useState('featured');
    const [tempSuitableFor, setTempSuitableFor] = useState('');
    const [tempCategory, setTempCategory] = useState('');

    const filteredProducts = initialProducts.filter(product => {
        const matchesSuitable = !suitableFor || product.suitableFor === suitableFor || product.suitableFor === 'BOTH';
        const matchesCategory = !category || (product.tags || []).includes(category);
        return matchesSuitable && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
    });

    const filterCount = (suitableFor ? 1 : 0) + (category ? 1 : 0);
    const sortActive = sortBy !== 'featured';
    const tempFilterCount = (tempSuitableFor ? 1 : 0) + (tempCategory ? 1 : 0);

    const openSort = () => { setTempSort(sortBy); setSortOpen(true); };
    const applySort = () => { setSortBy(tempSort); setSortOpen(false); };

    const openFilter = () => { setTempSuitableFor(suitableFor); setTempCategory(category); setFilterOpen(true); };
    const applyFilter = () => { setSuitableFor(tempSuitableFor); setCategory(tempCategory); setFilterOpen(false); };
    const clearTempFilter = () => { setTempSuitableFor(''); setTempCategory(''); };

    return (
        <>
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Seeds Collection</h1>
                            <p className={styles.subtitle}>Start your garden with our premium quality seeds</p>
                        </div>
                    </div>

                    <div className={styles.layout}>
                        {/* Desktop Sidebar */}
                        <aside className={styles.sidebar}>
                            <div className={styles.filterCard}>
                                <h3 className={styles.filterTitle}>Filters</h3>

                                <div className={styles.filterGroup}>
                                    <label>Seed Type</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        {seedCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Suitable For</label>
                                    <select value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)}>
                                        <option value="">All</option>
                                        <option value="INDOOR">Indoor</option>
                                        <option value="OUTDOOR">Outdoor</option>
                                    </select>
                                </div>

                                <button
                                    className={styles.clearBtn}
                                    onClick={() => { setSuitableFor(''); setCategory(''); }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <main className={styles.main}>
                            <div className={styles.topBar}>
                                {/* Mobile Filter Button */}
                                <button className={styles.mobileActionBtn} onClick={openFilter} aria-label="Open filters">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                                    Filter
                                    {filterCount > 0 && <span className={styles.activeBadge}>{filterCount}</span>}
                                </button>

                                <span className={styles.resultCount}>{sortedProducts.length} seeds</span>

                                {/* Mobile Sort Button */}
                                <button className={styles.mobileActionBtn} onClick={openSort} aria-label="Open sort options">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M6 12h12M9 18h6" />
                                    </svg>
                                    Sort
                                    {sortActive && <span className={styles.activeBadge}>1</span>}
                                </button>

                                {/* Desktop Sort */}
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                                    <option value="featured">Featured</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name">Name: A-Z</option>
                                </select>
                            </div>

                            {sortedProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No seeds found matching your filters.</p>
                                    <button
                                        onClick={() => { setSuitableFor(''); setCategory(''); }}
                                        style={{ marginTop: 8, padding: '10px 24px', background: '#1a4d2e', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
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

            {/* ── Mobile Filter Bottom Sheet ───────────────────────────────── */}
            {filterOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, animation: 'fadeIn 0.2s ease' }}
                        onClick={() => setFilterOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="dialog" aria-modal="true" aria-label="Filter options"
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 401,
                            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
                            maxHeight: '80vh', overflowY: 'auto',
                        }}
                    >
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Filter
                                {tempFilterCount > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#1a4d2e', background: '#f0f9f4', border: '1px solid #1a4d2e', borderRadius: 50, padding: '2px 8px', marginLeft: 8 }}>{tempFilterCount} active</span>}
                            </h3>
                            <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Seed Type</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {seedCategories.map(opt => (
                                        <button key={opt.value} onClick={() => setTempCategory(opt.value)} style={btnStyle(tempCategory === opt.value)}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Suitable For</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {[{ value: '', label: 'All' }, { value: 'INDOOR', label: 'Indoor' }, { value: 'OUTDOOR', label: 'Outdoor' }].map(opt => (
                                        <button key={opt.value} onClick={() => setTempSuitableFor(opt.value)} style={btnStyle(tempSuitableFor === opt.value)}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={clearTempFilter} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Clear All</button>
                            <button onClick={applyFilter} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#1a4d2e', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Apply Filters</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
