'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterBottomSheet, { FilterButton, MobileFilterButton } from '@/components/FilterBottomSheet';
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

export default function SeedsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);

    // Mobile state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSort, setMobileSort] = useState('');
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [mobileSuitableFor, setMobileSuitableFor] = useState('');
    const [mobileCategory, setMobileCategory] = useState('');

    // Seed categories
    const seedCategories = [
        { value: '', label: 'All Seeds' },
        { value: 'vegetables', label: 'Vegetable Seeds' },
        { value: 'flowers', label: 'Flower Seeds' },
        { value: 'herbs', label: 'Herb Seeds' },
    ];

    // Fetch from API only
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/products?productType=SEED');
                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.products || []);
                }
            } catch (error) {
                console.error('Error fetching seeds:', error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product => {
        const effectiveSuitable = mobileSuitableFor || suitableFor;
        const effectiveCategory = mobileCategory || category;
        const matchesSuitable = !effectiveSuitable || product.suitableFor === effectiveSuitable;
        const matchesCategory = !effectiveCategory || (product.tags || []).includes(effectiveCategory);
        return matchesSuitable && matchesCategory;
    });

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

    const mobileFilterCount = (mobileSuitableFor ? 1 : 0) + (mobileCategory ? 1 : 0);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Seeds Collection</h1>
                        <p className={styles.subtitle}>Start your garden with our premium quality seeds</p>
                    </div>
                </div>

                <div className={styles.layout}>
                    {/* Filters Sidebar */}
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
                                    <option value="BOTH">Both</option>
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
                        {/* Top Bar */}
                        <div className={styles.topBar}>
                            {/* Mobile Filter Button (left) */}
                            <MobileFilterButton onClick={() => setMobileFilterOpen(true)} activeCount={mobileFilterCount} />

                            <span className={styles.resultCount}>{sortedProducts.length} seeds</span>

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
                        {loading ? (
                            <div className={styles.grid}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={styles.skeletonCard} style={{
                                        height: '400px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '16px'
                                    }} />
                                ))}
                            </div>
                        ) : sortedProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                                <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No seeds available yet.</p>
                                <p>Check back soon for our seed collection!</p>
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
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => { setMobileSuitableFor(''); setMobileCategory(''); }} style={{
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
