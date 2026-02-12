'use client';

import { useState, useEffect } from 'react';
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
}

export default function SeedsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sortBy, setSortBy] = useState('featured');
    const [suitableFor, setSuitableFor] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);

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
        const matchesSuitable = !suitableFor || product.suitableFor === suitableFor;
        return matchesSuitable;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low': return a.price - b.price;
            case 'price-high': return b.price - a.price;
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
                            <span className={styles.resultCount}>{sortedProducts.length} seeds</span>
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
                                        tags={['Easy to Grow']}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
