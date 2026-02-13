'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterBottomSheet, { FilterButton, MobileSearchInput } from '@/components/FilterBottomSheet';
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

}

export default function PlantsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [size, setSize] = useState('');
    const [loading, setLoading] = useState(true);

    // Mobile filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSearch, setMobileSearch] = useState('');
    const [mobileSort, setMobileSort] = useState('');

    // Try to fetch from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/products?productType=PLANT');
                if (res.ok) {
                    const data = await res.json();
                    if (data.products && data.products.length > 0) {
                        setProducts(data.products);
                    }
                }
            } catch (error) {
                console.log('Using sample products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesSuitable = !suitableFor || product.suitableFor === suitableFor;
        const matchesSize = !size || product.size === size;
        // Mobile search filter
        const matchesSearch = !mobileSearch || product.name.toLowerCase().includes(mobileSearch.toLowerCase());
        return matchesSuitable && matchesSize && matchesSearch;
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

    const activeFilterCount = (mobileSearch ? 1 : 0) + (mobileSort ? 1 : 0);

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
                            {/* Mobile Search (left) */}
                            <MobileSearchInput
                                value={mobileSearch}
                                onChange={setMobileSearch}
                                placeholder="Search..."
                            />

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
                            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <p style={{ fontSize: '1.25rem', color: '#64748b' }}>🌱 No plants found. Add products via the admin panel!</p>
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
                                        tags={product.suitableFor === 'INDOOR' ? ['Low Maintenance'] : []}
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
        </div>
    );
}
