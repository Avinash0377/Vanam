'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function WishlistPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { items, isLoading, removeItem, refreshWishlist } = useWishlist();
    const { addItem } = useCart();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/wishlist');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshWishlist();
        }
    }, [isAuthenticated]);

    const handleMoveToCart = (item: typeof items[0]) => {
        const product = item.product;
        const combo = item.combo;
        const hamper = item.hamper;

        if (product) {
            addItem({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.images?.[0] || '/placeholder-plant.jpg',
                type: 'product',
            });
        } else if (combo) {
            addItem({
                comboId: combo.id,
                name: combo.name,
                slug: combo.slug,
                price: combo.price,
                image: combo.images?.[0] || '/placeholder-plant.jpg',
                type: 'combo',
            });
        } else if (hamper) {
            addItem({
                hamperId: hamper.id,
                name: hamper.name,
                slug: hamper.slug,
                price: hamper.price,
                image: hamper.images?.[0] || '/placeholder-plant.jpg',
                type: 'hamper',
            });
        }

        // Remove from wishlist after moving to cart
        removeItem(item.id);
    };

    const getItemUrl = (item: typeof items[0]) => {
        if (item.product) return `/plants/${item.product.slug}`;
        if (item.combo) return `/combos/${item.combo.slug}`;
        if (item.hamper) return `/gift-hampers/${item.hamper.slug}`;
        return '#';
    };

    const getItemData = (item: typeof items[0]) => {
        if (item.product) return {
            name: item.product.name,
            price: item.product.price,
            comparePrice: item.product.comparePrice,
            image: item.product.images?.[0],
            stock: item.product.stock,
            status: item.product.status,
        };
        if (item.combo) return {
            name: item.combo.name,
            price: item.combo.price,
            comparePrice: item.combo.comparePrice,
            image: item.combo.images?.[0],
            stock: item.combo.stock,
            status: item.combo.status,
        };
        if (item.hamper) return {
            name: item.hamper.name,
            price: item.hamper.price,
            comparePrice: item.hamper.comparePrice,
            image: item.hamper.images?.[0],
            stock: item.hamper.stock,
            status: item.hamper.status,
        };
        return { name: '', price: 0, image: undefined, stock: 0, status: 'ACTIVE' };
    };

    if (authLoading || (!isAuthenticated && !authLoading)) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.header}>
                    <h1>My Wishlist</h1>
                    {items.length > 0 && (
                        <span className={styles.count}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                    )}
                </div>

                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading wishlist...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <h2>Your wishlist is empty</h2>
                        <p>Save your favorite plants and products to buy later.</p>
                        <Link href="/plants" className={styles.browseBtnLink}>
                            Browse Plants
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {items.map((item) => {
                            const data = getItemData(item);
                            const isOutOfStock = data.stock <= 0 || data.status !== 'ACTIVE';
                            const discount = data.comparePrice
                                ? Math.round(((data.comparePrice - data.price) / data.comparePrice) * 100)
                                : 0;

                            return (
                                <div key={item.id} className={styles.card}>
                                    <Link href={getItemUrl(item)} className={styles.cardLink}>
                                        <div className={styles.imageWrapper}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={data.image || '/placeholder-plant.jpg'}
                                                alt={data.name}
                                                className={styles.image}
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/placeholder-plant.jpg';
                                                }}
                                            />
                                            {isOutOfStock && (
                                                <span className={styles.outOfStockBadge}>Out of Stock</span>
                                            )}
                                            {discount > 0 && !isOutOfStock && (
                                                <span className={styles.discountBadge}>{discount}% OFF</span>
                                            )}
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h3 className={styles.cardName}>{data.name}</h3>
                                            <div className={styles.priceRow}>
                                                <span className={styles.price}>₹{data.price.toLocaleString('en-IN')}</span>
                                                {data.comparePrice && data.comparePrice > data.price && (
                                                    <span className={styles.comparePrice}>₹{data.comparePrice.toLocaleString('en-IN')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.moveToCartBtn}
                                            onClick={() => handleMoveToCart(item)}
                                            disabled={isOutOfStock}
                                        >
                                            {isOutOfStock ? 'Unavailable' : 'Move to Cart'}
                                        </button>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.id)}
                                            aria-label="Remove from wishlist"
                                            title="Remove"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
