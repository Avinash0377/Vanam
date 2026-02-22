'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterBottomSheet, { FilterButton, MobileFilterButton } from '@/components/FilterBottomSheet';
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

interface PotsClientProps {
    initialProducts: Pot[];
}

export default function PotsClient({ initialProducts }: PotsClientProps) {
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedSize, setSelectedSize] = useState('All');
    const [filteredPots, setFilteredPots] = useState<Pot[]>(initialProducts);

    // Mobile state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSort, setMobileSort] = useState('');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [mobileMaterial, setMobileMaterial] = useState('All');
    const [mobileSize, setMobileSize] = useState('All');

    useEffect(() => {
        let filtered = initialProducts;
        const effectiveMaterial = mobileMaterial !== 'All' ? mobileMaterial : selectedMaterial;
        const effectiveSize = mobileSize !== 'All' ? mobileSize : selectedSize;
        if (effectiveMaterial !== 'All') {
            filtered = filtered.filter(p => p.material?.toLowerCase() === effectiveMaterial.toLowerCase());
        }
        if (effectiveSize !== 'All') {
            filtered = filtered.filter(p => p.size?.toLowerCase() === effectiveSize.toLowerCase());
        }
        setFilteredPots(filtered);
    }, [selectedMaterial, selectedSize, mobileMaterial, mobileSize, initialProducts]);

    // Sort
    const sortedPots = [...filteredPots].sort((a, b) => {
        switch (mobileSort) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            default: return 0;
        }
    });

    const mobileFilterCount = (mobileMaterial !== 'All' ? 1 : 0) + (mobileSize !== 'All' ? 1 : 0);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.badge}>Shop Collection</span>
                    <h1 className={styles.title}>Pots & Planters</h1>
                    <p className={styles.subtitle}>
                        Beautiful handcrafted pots to complement your plants.
                        From classic terracotta to modern ceramic designs.
                    </p>
                </div>

                <div className={styles.layout}>
                    {/* Filters Sidebar */}
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
                            {/* Mobile Filter Button (left) */}
                            <MobileFilterButton onClick={() => setMobileFilterOpen(true)} activeCount={mobileFilterCount} />

                            <span className={styles.resultCount}>{sortedPots.length} pots</span>

                            {/* Mobile Sort Button (right) */}
                            <FilterButton onClick={() => setFilterOpen(true)} activeCount={mobileSort ? 1 : 0} />
                        </div>

                        {/* Pots Grid */}
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

                        {sortedPots.length === 0 && (
                            <div className={styles.noResults}>
                                <PotIcon size={64} color="#94a3b8" />
                                <p>No pots match your filters. Try adjusting your selection.</p>
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
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {materials.map(val => (
                                    <button key={val} onClick={() => setMobileMaterial(val)} style={{
                                        padding: '10px 18px', fontSize: 13, fontWeight: 500, borderRadius: 50,
                                        border: mobileMaterial === val ? '1.5px solid #1a4d2e' : '1px solid #d1d5db',
                                        background: mobileMaterial === val ? '#1a4d2e' : '#f9fafb',
                                        color: mobileMaterial === val ? '#fff' : '#374151',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>{val}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {sizes.map(val => (
                                    <button key={val} onClick={() => setMobileSize(val)} style={{
                                        padding: '10px 18px', fontSize: 13, fontWeight: 500, borderRadius: 50,
                                        border: mobileSize === val ? '1.5px solid #1a4d2e' : '1px solid #d1d5db',
                                        background: mobileSize === val ? '#1a4d2e' : '#f9fafb',
                                        color: mobileSize === val ? '#fff' : '#374151',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>{val}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => { setMobileMaterial('All'); setMobileSize('All'); }} style={{
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
