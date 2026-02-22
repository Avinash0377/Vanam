'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import FilterBottomSheet, { FilterButton } from '@/components/FilterBottomSheet';
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

    // Mobile filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSort, setMobileSort] = useState('');

    const filteredProducts = initialProducts;

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

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Garden Accessories</h1>
                        <p className={styles.subtitle}>Essential tools and accessories to nurture your garden</p>
                    </div>
                </div>

                <div className={styles.layout}>
                    {/* Main Content */}
                    <main className={styles.main}>
                        {/* Top Bar */}
                        <div className={styles.topBar}>
                            <span className={styles.resultCount}>{sortedProducts.length} accessories</span>

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
