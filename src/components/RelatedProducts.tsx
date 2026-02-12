'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import FadeIn from './FadeIn';
import styles from './RelatedProducts.module.css';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    stock: number;
    size?: string;
    suitableFor?: string;
    productType?: string;
}

interface RelatedProductsProps {
    categorySlug?: string;
    currentId: string;
}

export default function RelatedProducts({ categorySlug, currentId }: RelatedProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                // If no specific category, just fetch popular/featured items
                const url = categorySlug
                    ? `/api/products?category=${categorySlug}&limit=4`
                    : '/api/products?featured=true&limit=4';

                const res = await fetch(url);
                const data = await res.json();

                if (data.products) {
                    // Filter out current product
                    const filtered = data.products
                        .filter((p: Product) => p.id !== currentId)
                        .slice(0, 4);
                    setProducts(filtered);
                }
            } catch (err) {
                console.error('Failed to fetch related products');
            } finally {
                setLoading(false);
            }
        };

        if (currentId) {
            fetchRelated();
        }
    }, [categorySlug, currentId]);

    if (loading || products.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <FadeIn direction="up">
                    <div className={styles.header}>
                        <h2 className={styles.title}>You May Also Like</h2>
                        <p className={styles.subtitle}>Perfect companions for your green space</p>
                    </div>
                </FadeIn>

                <div className={styles.grid}>
                    {products.map((product, idx) => (
                        <FadeIn key={product.id} direction="up" delay={idx * 0.1}>
                            <ProductCard
                                id={product.id}
                                name={product.name}
                                slug={product.slug}
                                price={product.price}
                                comparePrice={product.comparePrice}
                                image={product.images?.[0]}
                                size={product.size}
                                suitableFor={product.suitableFor}
                                stock={product.stock}
                                type="product"
                                productType={product.productType}
                            />
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
