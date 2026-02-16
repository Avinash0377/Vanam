'use client';

import { useState, useEffect } from 'react';
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

export default function AccessoriesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sortBy, setSortBy] = useState('featured');
    const [loading, setLoading] = useState(true);

    // Mobile filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [mobileSort, setMobileSort] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/products?productType=ACCESSORY&limit=50');
                if (res.ok) {
                    const data = await res.json();
                    if (data.products && data.products.length > 0) {
                        setProducts(data.products);
                    }
                }
            } catch (error) {
                console.log('Failed to fetch accessories');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products;

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
                                <p style={{ fontSize: '1.25rem', color: '#64748b' }}>🔧 No accessories found. Add products via the admin panel!</p>
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
