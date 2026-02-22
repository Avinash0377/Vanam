'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';
import { trackViewItem, trackAddToCart, trackWhatsAppClick } from '@/lib/analytics';

// ── Types ──────────────────────────────────────────────

interface VariantColor {
    name: string;
    hex: string;
    images?: string[];
}

interface SizeVariant {
    size: string;
    price: number;
    stock: number;
    colors: VariantColor[];
}

export interface ProductData {
    id: string;
    name: string;
    slug: string;
    description?: string;
    careInstructions?: string;
    productType: string;
    size?: string;
    suitableFor?: string;
    price: number;
    comparePrice?: number;
    images: string[];
    stock: number;
    category?: { name: string; slug: string };
    sizeVariants?: SizeVariant[];
}

// ── Client Component ───────────────────────────────────

export default function ProductClient({ product }: { product: ProductData }) {
    const { addItem } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [showToast, setShowToast] = useState(false);

    // Variant selection state
    const [selectedSize, setSelectedSize] = useState<string | null>(
        product.sizeVariants?.[0]?.size ?? null
    );
    const [selectedColor, setSelectedColor] = useState<VariantColor | null>(
        product.sizeVariants?.[0]?.colors?.[0] ?? null
    );

    // Track product view on mount
    useEffect(() => {
        trackViewItem({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category?.name,
        });
    }, [product.id, product.name, product.price, product.category?.name]);

    // Get current variant based on selection
    const currentVariant = useMemo(() => {
        if (!product.sizeVariants || !selectedSize) return null;
        return product.sizeVariants.find(v => v.size === selectedSize);
    }, [product, selectedSize]);

    // Get current price based on variant selection
    const currentPrice = useMemo(() => {
        if (currentVariant) return currentVariant.price;
        return product.price;
    }, [currentVariant, product.price]);

    // Get current stock based on variant selection
    const currentStock = useMemo(() => {
        if (currentVariant) return currentVariant.stock;
        return product.stock;
    }, [currentVariant, product.stock]);

    // Get available colors for selected size
    const availableColors = useMemo(() => {
        if (currentVariant) return currentVariant.colors || [];
        return [];
    }, [currentVariant]);

    // Get images to display (color-specific or default product images)
    const displayImages = useMemo(() => {
        if (selectedColor?.images?.length) return selectedColor.images;
        return product.images;
    }, [selectedColor, product.images]);

    // Handle size selection
    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
        const variant = product.sizeVariants?.find(v => v.size === size);
        if (variant?.colors?.length) {
            setSelectedColor(variant.colors[0]);
        } else {
            setSelectedColor(null);
        }
        setActiveImage(0);
        setQuantity(1);
    };

    // Handle color selection
    const handleColorSelect = (color: VariantColor) => {
        setSelectedColor(color);
        setActiveImage(0);
    };

    const handleAddToCart = () => {
        if (currentStock <= 0) return;

        addItem({
            productId: String(product.id),
            name: product.name,
            slug: product.slug,
            price: currentPrice,
            image: displayImages[0] || '/placeholder-plant.jpg',
            type: 'product',
            size: selectedSize || product.size,
            color: selectedColor?.name,
            colorHex: selectedColor?.hex,
            category: product.category?.name || 'Plant',
        }, quantity);

        trackAddToCart({
            id: product.id,
            name: product.name,
            price: currentPrice,
            quantity,
            category: product.category?.name,
        });

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleWhatsApp = () => {
        trackWhatsAppClick('product_page', product.id);
        let message = `Hi! I'm interested in:\n\n🌿 *${product.name}*`;
        if (selectedSize) message += `\n📏 Size: ${selectedSize}`;
        if (selectedColor) message += `\n🎨 Color: ${selectedColor.name}`;
        message += `\n💰 Price: ₹${currentPrice.toLocaleString('en-IN')}`;
        message += `\n\nPlease share more details.`;
        window.open(`https://wa.me/918897249374?text=${encodeURIComponent(message)}`, '_blank');
    };

    const discount = product.comparePrice
        ? Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100)
        : 0;

    // Only show size selector if there are non-DEFAULT variants
    const hasVariants = product.sizeVariants && product.sizeVariants.some(v => v.size !== 'DEFAULT');

    return (
        <>
            <div className={styles.layout}>
                {/* ── Image Gallery ── */}
                <div className={styles.gallery}>
                    <div className={styles.mainImage}>
                        {displayImages[activeImage] ? (
                            <Image
                                src={displayImages[activeImage]}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className={styles.image}
                                priority
                            />
                        ) : (
                            <div className={styles.placeholder}>🌱</div>
                        )}
                        {discount > 0 && (
                            <span className={styles.discountBadge}>{discount}% OFF</span>
                        )}
                    </div>
                    {displayImages.length > 1 && (
                        <div className={styles.thumbnails}>
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.thumbnail} ${idx === activeImage ? styles.active : ''}`}
                                    onClick={() => setActiveImage(idx)}
                                >
                                    <Image src={img} alt="" fill sizes="80px" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Product Details ── */}
                <div className={styles.details}>
                    {product.category && (
                        <span className={styles.category}>{product.category.name}</span>
                    )}
                    <h1 className={styles.name}>{product.name}</h1>

                    <div className={styles.meta}>
                        {product.productType && <span className={styles.tag}>{product.productType}</span>}
                        {product.suitableFor && <span className={styles.tag}>{product.suitableFor}</span>}
                    </div>

                    <div className={styles.priceRow}>
                        <span className={styles.price}>₹{currentPrice.toLocaleString('en-IN')}</span>
                        {product.comparePrice && product.comparePrice > currentPrice && (
                            <>
                                <span className={styles.comparePrice}>
                                    ₹{product.comparePrice.toLocaleString('en-IN')}
                                </span>
                                <span className={styles.discountText}>Save {discount}%</span>
                            </>
                        )}
                    </div>

                    {/* Size Variant Selector */}
                    {hasVariants && (
                        <div className={styles.variantSection}>
                            <h3 className={styles.variantLabel}>
                                Select Size
                                {selectedSize && <span className={styles.selectedValue}>{selectedSize}</span>}
                            </h3>
                            <div className={styles.sizeOptions}>
                                {product.sizeVariants!.map((variant) => (
                                    <button
                                        key={variant.size}
                                        className={`${styles.sizeBtn} ${selectedSize === variant.size ? styles.selected : ''} ${variant.stock === 0 ? styles.outOfStock : ''}`}
                                        onClick={() => handleSizeSelect(variant.size)}
                                        disabled={variant.stock === 0}
                                        title={variant.stock === 0 ? 'Out of stock' : `₹${variant.price}`}
                                    >
                                        {variant.size}
                                        {variant.stock === 0 && <span className={styles.soldOut}>Sold Out</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selector for selected size */}
                    {availableColors.length > 0 && (
                        <div className={styles.variantSection}>
                            <h3 className={styles.variantLabel}>
                                Select Color
                                {selectedColor && <span className={styles.selectedValue}>{selectedColor.name}</span>}
                            </h3>
                            <div className={styles.colorOptions}>
                                {availableColors.map((color, idx) => (
                                    <button
                                        key={idx}
                                        className={`${styles.colorBtn} ${selectedColor?.hex === color.hex ? styles.selected : ''}`}
                                        onClick={() => handleColorSelect(color)}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    >
                                        {selectedColor?.hex === color.hex && (
                                            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.stockStatus}>
                        {currentStock > 5 ? (
                            <span className={styles.inStock}>✓ In Stock</span>
                        ) : currentStock > 0 ? (
                            <span className={styles.lowStock}>⚠ Only {currentStock} left!</span>
                        ) : (
                            <span className={styles.outOfStock}>✗ Out of Stock</span>
                        )}
                    </div>

                    {product.description && (
                        <div className={styles.section}>
                            <h3>Description</h3>
                            <p>{product.description}</p>
                        </div>
                    )}

                    {product.careInstructions && (
                        <div className={styles.section}>
                            <h3>Care Instructions</h3>
                            <p>{product.careInstructions}</p>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <div className={styles.quantity}>
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                −
                            </button>
                            <span>{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                                disabled={quantity >= currentStock}
                            >
                                +
                            </button>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleAddToCart}
                            disabled={currentStock <= 0}
                        >
                            {currentStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        <button className="btn btn-whatsapp btn-lg" onClick={handleWhatsApp}>
                            💬 Order on WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {showToast && (
                <div className={styles.toast}>
                    <div className={styles.toastIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span>Product added to cart</span>
                </div>
            )}
        </>
    );
}
