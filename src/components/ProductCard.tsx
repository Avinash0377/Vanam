'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { TagIcon, getTagColors } from './TagIcons';
import styles from './ProductCard.module.css';

interface VariantColor {
    name: string;
    hex: string;
    images: string[];  // Array of images for this color
}

interface SizeVariant {
    size: string;
    price: number;
    stock: number;
    colors: VariantColor[];
}

interface ProductCardProps {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    image?: string;
    size?: string;
    suitableFor?: string;
    stock: number;
    type?: 'product' | 'combo' | 'hamper' | 'pot';
    featured?: boolean;
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    giftCount?: number;
    sizeVariants?: SizeVariant[];

    productType?: string;
}

export default function ProductCard({
    id,
    name,
    slug,
    price,
    comparePrice,
    image,
    size = 'MEDIUM',
    suitableFor,
    stock,
    type = 'product',
    featured = false,
    rating = 4.5,
    reviewCount = 0,
    tags = [],
    giftCount = 0,
    sizeVariants = [],

    productType,
}: ProductCardProps) {
    const { addItem } = useCart();
    const [showToast, setShowToast] = useState(false);

    // Seeds don't have size variants
    const isSeed = productType === 'SEED';

    // Get available sizes from variants - NO FALLBACKS, only from DB
    // Filter out DEFAULT so single-size products don't show a size selector
    const availableSizes = isSeed ? [] : sizeVariants.map(v => v.size).filter(s => s !== 'DEFAULT');

    // Get initial size - first available variant or default
    const getInitialSize = () => {
        if (sizeVariants.length > 0) {
            // Find first variant with stock > 0
            const inStock = sizeVariants.find(v => v.stock > 0);
            return inStock ? inStock.size : sizeVariants[0].size;
        }
        if (size === 'SMALL') return 'S';
        if (size === 'MEDIUM') return 'M';
        if (size === 'BIG') return 'L';
        return 'M';
    };

    const [selectedSize, setSelectedSize] = useState(getInitialSize());

    // Get current variant for selected size
    const getCurrentVariant = (): SizeVariant | undefined => {
        return sizeVariants.find(v => v.size === selectedSize);
    };

    // Get colors for selected size - defined before using it
    const getColorsForSize = (sizeToCheck: string): VariantColor[] => {
        const variant = sizeVariants.find(v => v.size === sizeToCheck);
        return variant?.colors || [];
    };

    // Initialize selectedColor with first color of selected size
    const getInitialColor = (): VariantColor | null => {
        const colors = getColorsForSize(getInitialSize());
        return colors.length > 0 ? colors[0] : null;
    };

    const [selectedColor, setSelectedColor] = useState<VariantColor | null>(getInitialColor());

    // Get price for selected size
    const getCurrentPrice = (): number => {
        const variant = getCurrentVariant();
        return variant ? variant.price : price;
    };

    // Get stock for selected size
    const getCurrentStock = (): number => {
        const variant = getCurrentVariant();
        return variant ? variant.stock : stock;
    };

    // Get colors for selected size (uses the function defined above)
    const getCurrentColors = (): VariantColor[] => {
        return getColorsForSize(selectedSize);
    };

    const currentPrice = getCurrentPrice();
    const currentStock = getCurrentStock();
    const currentColors = getCurrentColors();

    // Check if a size is out of stock
    const isSizeOutOfStock = (sizeToCheck: string): boolean => {
        const variant = sizeVariants.find(v => v.size === sizeToCheck);
        return variant ? variant.stock <= 0 : false;
    };

    const discount = comparePrice
        ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
        : 0;

    // Generate tags based on product type and suitableFor
    const getProductTags = (): string[] => {
        const productTags = [...tags];

        // For pots - show pot-related tags
        if (type === 'pot') {
            if (!productTags.includes('Ceramic')) productTags.push('Ceramic');
            if (!productTags.includes('Durable')) productTags.push('Durable');
        }
        // For plants - show plant-related tags based on suitableFor
        else if (type === 'product') {
            if (suitableFor === 'INDOOR') {
                if (!productTags.includes('Air Purifying')) productTags.push('Air Purifying');
                if (!productTags.includes('Low Maintenance')) productTags.push('Low Maintenance');
            } else if (suitableFor === 'OUTDOOR') {
                if (!productTags.includes('Sun Loving')) productTags.push('Sun Loving');
                if (!productTags.includes('Hardy')) productTags.push('Hardy');
            } else if (suitableFor === 'BOTH') {
                if (!productTags.includes('Versatile')) productTags.push('Versatile');
                if (!productTags.includes('Easy Care')) productTags.push('Easy Care');
            }
        }
        // For combos and hampers
        else if (type === 'combo') {
            if (!productTags.includes('Value Pack')) productTags.push('Value Pack');
        } else if (type === 'hamper') {
            if (!productTags.includes('Gift Ready')) productTags.push('Gift Ready');
        }

        return productTags.slice(0, 3);
    };

    const productTags = getProductTags();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (currentStock <= 0) return;

        // Get the best available image: color image > product image > placeholder
        const colorImage = selectedColor?.images?.[0];
        const displayImage = colorImage || image || '/placeholder-plant.jpg';

        const cartItem = {
            name,
            slug,
            price: currentPrice,
            image: displayImage,
            type: (type === 'pot' ? 'product' : type) as 'product' | 'combo' | 'hamper',
            size: selectedSize,
            color: selectedColor?.name,
            colorHex: selectedColor?.hex,
            productId: undefined as string | undefined,
            comboId: undefined as string | undefined,
            hamperId: undefined as string | undefined,
        };

        if (type === 'combo') {
            cartItem.comboId = id;
        } else if (type === 'hamper') {
            cartItem.hamperId = id;
        } else {
            cartItem.productId = id;
        }

        addItem(cartItem);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleSizeSelect = (e: React.MouseEvent, sizeOption: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSizeOutOfStock(sizeOption)) return;
        setSelectedSize(sizeOption);
        // Auto-select first color of the new size
        const newColors = getColorsForSize(sizeOption);
        setSelectedColor(newColors.length > 0 ? newColors[0] : null);
    };

    const handleColorSelect = (e: React.MouseEvent, color: VariantColor) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedColor(color);
    };

    const productUrl = type === 'product'
        ? `/plants/${slug}`
        : type === 'pot'
            ? `/pots/${slug}`
            : type === 'combo'
                ? `/combos/${slug}`
                : `/gift-hampers/${slug}`;

    return (
        <div className={styles.card}>
            <Link href={productUrl} className={styles.linkWrapper}>
                <div className={styles.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={selectedColor?.images?.[0] || (image && image !== '' ? image : '/placeholder-plant.jpg')}
                        alt={name}
                        className={styles.image}
                        loading="lazy"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-plant.jpg';
                        }}
                    />

                    {featured && (
                        <span className={styles.bestSellerBadge}>
                            <span className={styles.heartIcon}>❤️</span> Best Seller
                        </span>
                    )}

                    <div className={styles.suitableForBadge}>
                        {suitableFor === 'INDOOR' && (
                            <div className={styles.iconWrapper} title="Indoor Plant">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/indoor.png" alt="Indoor" className={styles.typeIcon} />
                            </div>
                        )}
                        {suitableFor === 'OUTDOOR' && (
                            <div className={styles.iconWrapper} title="Outdoor Plant">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/icons/outdoor.png" alt="Outdoor" className={styles.typeIcon} />
                            </div>
                        )}
                        {suitableFor === 'BOTH' && (
                            <>
                                <div className={styles.iconWrapper} title="Indoor & Outdoor">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/icons/indoor.png" alt="Indoor" className={styles.typeIcon} />
                                </div>
                                <div className={styles.iconWrapper} title="Indoor & Outdoor">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/icons/outdoor.png" alt="Outdoor" className={styles.typeIcon} />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.body}>
                    <h3 className={styles.name}>{name}</h3>

                    <div className={styles.priceRow}>
                        <span className={styles.price}>₹{currentPrice.toLocaleString('en-IN')}</span>
                        {comparePrice && (
                            <span className={styles.comparePrice}>
                                ₹{comparePrice.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    {productTags.length > 0 && (
                        <div className={styles.tagsRow}>
                            {productTags.map((tag, index) => {
                                const colors = getTagColors(tag);
                                return (
                                    <span
                                        key={index}
                                        className={styles.tag}
                                        style={{
                                            background: colors.bg,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }}
                                    >
                                        <span className={styles.tagIcon}><TagIcon tag={tag} size={12} /></span>
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Link>

            <div className={styles.actions}>
                {/* Size Selector */}
                {availableSizes.length > 0 && (
                    <div className={styles.sizeSection}>
                        <span className={styles.sizeLabel}>Select Size</span>
                        <div className={styles.sizeOptions}>
                            {availableSizes.map((sizeOpt) => (
                                <button
                                    key={sizeOpt}
                                    className={`${styles.sizeBtn} ${selectedSize === sizeOpt ? styles.sizeSelected : ''} ${isSizeOutOfStock(sizeOpt) ? styles.sizeDisabled : ''}`}
                                    onClick={(e) => handleSizeSelect(e, sizeOpt)}
                                    disabled={isSizeOutOfStock(sizeOpt)}
                                    title={isSizeOutOfStock(sizeOpt) ? 'Out of stock' : ''}
                                >
                                    {sizeOpt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Color Selector - Shows only for selected size */}
                {currentColors.length > 0 && (
                    <div className={styles.colorSection}>
                        <span className={styles.colorLabel}>Select Color</span>
                        <div className={styles.colorOptions}>
                            {currentColors.map((color, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.colorBtn} ${selectedColor?.hex === color.hex ? styles.colorSelected : ''}`}
                                    onClick={(e) => handleColorSelect(e, color)}
                                    title={color.name}
                                    style={{ backgroundColor: color.hex }}
                                >
                                    {selectedColor?.hex === color.hex && (
                                        <span className={styles.colorCheck}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add to Basket Button */}
                <button
                    className={styles.addToCart}
                    onClick={handleAddToCart}
                    disabled={currentStock <= 0}
                >
                    {currentStock <= 0 ? 'Out of Stock' : 'Add to Basket'}
                </button>
            </div>

            {/* Success Toast */}
            {showToast && typeof document !== 'undefined' && createPortal(
                <div className={styles.toast}>
                    <div className={styles.toastIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span>Added to cart</span>
                </div>,
                document.body
            )}
        </div>
    );
}
