'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { PotIcon } from '@/components/Icons';
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

interface Pot {
    id: string;
    name: string;
    slug: string;
    type?: string;
    size?: string;
    color?: string;
    material?: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
    sizeVariants?: SizeVariant[];
    tags?: string[];
}

const materials = ['All', 'Ceramic', 'Terracotta', 'Cement', 'Plastic', 'Metal'];
const sizes = ['All', 'Small', 'Medium', 'Large'];

// Normalise any size string to the pots filter values (Small / Medium / Large)
function normSize(s: string): string {
    const v = s.toLowerCase().trim();
    if (v === 's' || v === 'sm' || v === 'small') return 'Small';
    if (v === 'm' || v === 'med' || v === 'medium') return 'Medium';
    if (v === 'l' || v === 'lg' || v === 'large' || v === 'big' || v === 'xl') return 'Large';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface PotsClientProps {
    initialProducts: Pot[];
}

const btnStyle = (active: boolean) => ({
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 500 as const,
    borderRadius: 50,
    border: active ? '1.5px solid #f59e0b' : '1px solid #d1d5db',
    background: active ? '#f59e0b' : '#f9fafb',
    color: active ? '#fff' : '#374151',
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    minHeight: 40,
});

export default function PotsClient({ initialProducts }: PotsClientProps) {
    // Unified state
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedSize, setSelectedSize] = useState('All');
    const [sortBy, setSortBy] = useState('featured');
    const [filteredPots, setFilteredPots] = useState<Pot[]>(initialProducts);

    // Mobile sheet open state
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Temp state for the sheets
    const [tempSort, setTempSort] = useState('featured');
    const [tempMaterial, setTempMaterial] = useState('All');
    const [tempSize, setTempSize] = useState('All');

    useEffect(() => {
        let filtered = initialProducts;
        if (selectedMaterial !== 'All') {
            filtered = filtered.filter(p => p.material?.toLowerCase() === selectedMaterial.toLowerCase());
        }
        if (selectedSize !== 'All') {
            filtered = filtered.filter(p =>
                p.sizeVariants && p.sizeVariants.length > 0
                    ? p.sizeVariants.some(v => normSize(v.size) === selectedSize)
                    : normSize(p.size || '') === selectedSize
            );
        }
        setFilteredPots(filtered);
    }, [selectedMaterial, selectedSize, initialProducts]);

    const sortedPots = [...filteredPots].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
    });

    const filterCount = (selectedMaterial !== 'All' ? 1 : 0) + (selectedSize !== 'All' ? 1 : 0);
    const sortActive = sortBy !== 'featured';

    const openSort = () => { setTempSort(sortBy); setSortOpen(true); };
    const applySort = () => { setSortBy(tempSort); setSortOpen(false); };
    const clearTempSort = () => setTempSort('featured');

    const openFilter = () => { setTempMaterial(selectedMaterial); setTempSize(selectedSize); setFilterOpen(true); };
    const applyFilter = () => { setSelectedMaterial(tempMaterial); setSelectedSize(tempSize); setFilterOpen(false); };
    const clearTempFilter = () => { setTempMaterial('All'); setTempSize('All'); };

    const tempFilterCount = (tempMaterial !== 'All' ? 1 : 0) + (tempSize !== 'All' ? 1 : 0);

    return (
        <>
            <div className={styles.page}>
                <div className="container">
                    {/* Header */}
                    <div className={styles.header}>
                        <span className={styles.badge}>Shop Collection</span>
                        <h1 className={styles.title}>Pots &amp; Planters</h1>
                        <p className={styles.subtitle}>
                            Beautiful handcrafted pots to complement your plants.
                            From classic terracotta to modern ceramic designs.
                        </p>
                    </div>

                    <div className={styles.layout}>
                        {/* Filters Sidebar — desktop only */}
                        <aside className={styles.sidebar}>
                            <div className={styles.filterCard}>
                                <h3 className={styles.filterTitle}>Filters</h3>

                                <div className={styles.filterGroup}>
                                    <label>Material</label>
                                    <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                                        {materials.map(mat => (
                                            <option key={mat} value={mat}>{mat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.filterGroup}>
                                    <label>Size</label>
                                    <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                                        {sizes.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    className={styles.clearBtn}
                                    onClick={() => { setSelectedMaterial('All'); setSelectedSize('All'); }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </aside>

                        {/* Main Content */}
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

                                <span className={styles.resultCount}>{sortedPots.length} pots</span>

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
                            </div>

                            {/* Pots Grid */}
                            {sortedPots.length === 0 ? (
                                <div className={styles.noResults}>
                                    <PotIcon size={64} color="#94a3b8" />
                                    <p>No pots match your filters. Try adjusting your selection.</p>
                                    <button
                                        onClick={() => { setSelectedMaterial('All'); setSelectedSize('All'); }}
                                        style={{ marginTop: 16, padding: '10px 24px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.grid}>
                                    {sortedPots.map((pot) => (
                                        <ProductCard
                                            key={pot.id}
                                            id={pot.id}
                                            name={pot.name}
                                            slug={pot.slug}
                                            price={pot.price}
                                            comparePrice={pot.comparePrice}
                                            image={pot.images?.[0] || undefined}
                                            stock={pot.stock}
                                            type="pot"
                                            featured={pot.featured}
                                            sizeVariants={pot.sizeVariants || []}
                                            productType="POT"
                                            tags={pot.tags && pot.tags.length > 0 ? pot.tags : [pot.material, pot.color].filter(Boolean) as string[]}
                                            suitableFor="BOTH"
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
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sort By</h3>
                            <button onClick={() => setSortOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
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
                                <button
                                    key={opt.value}
                                    onClick={() => setTempSort(opt.value)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px', fontSize: 15, fontWeight: 500,
                                        color: tempSort === opt.value ? '#b45309' : '#374151',
                                        background: tempSort === opt.value ? '#fffbeb' : '#f9fafb',
                                        border: `1.5px solid ${tempSort === opt.value ? '#f59e0b' : '#e5e7eb'}`,
                                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                                        minHeight: 52, textAlign: 'left',
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {tempSort === opt.value && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={clearTempSort} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Clear</button>
                            <button onClick={applySort} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#f59e0b', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Apply</button>
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
                        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 16px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                Filter
                                {tempFilterCount > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#b45309', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 50, padding: '2px 8px', marginLeft: 8 }}>
                                        {tempFilterCount} active
                                    </span>
                                )}
                            </h3>
                            <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 6, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Material</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {materials.map(val => (
                                        <button key={val} onClick={() => setTempMaterial(val)} style={btnStyle(tempMaterial === val)}>{val}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Size</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {sizes.map(val => (
                                        <button key={val} onClick={() => setTempSize(val)} style={btnStyle(tempSize === val)}>{val}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
                            <button onClick={clearTempFilter} style={{ flex: 1, padding: '14px', fontSize: 14, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Clear All</button>
                            <button onClick={applyFilter} style={{ flex: 2, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#f59e0b', border: 'none', borderRadius: 12, cursor: 'pointer', minHeight: 50 }}>Apply Filters</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
