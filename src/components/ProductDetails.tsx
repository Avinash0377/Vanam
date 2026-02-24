'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './ProductDetails.module.css';

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

export interface ProductDetailsData {
    id: string;
    name: string;
    slug: string;
    description?: string;
    careInstructions?: string;
    includes?: string; // For combos/hampers
    productType?: string;
    size?: string;
    suitableFor?: string;
    price: number;
    comparePrice?: number;
    images: string[];
    stock: number;
    category?: { name: string; slug: string };
    sizeVariants?: SizeVariant[];
}

interface ProductDetailsProps {
    type: 'product' | 'combo' | 'hamper' | 'pot';
    initialData?: ProductDetailsData;
}

export default function ProductDetails({ type, initialData }: ProductDetailsProps) {
    const params = useParams();
    const { addItem } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [product, setProduct] = useState<ProductDetailsData | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);

    // Variant selection state
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<VariantColor | null>(null);

    // Auto-select first variant when initialData is provided (SSR)
    useEffect(() => {
        if (initialData?.sizeVariants?.length) {
            const firstVariant = initialData.sizeVariants[0];
            setSelectedSize(firstVariant.size);
            if (firstVariant.colors?.length > 0) {
                setSelectedColor(firstVariant.colors[0]);
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (!initialData) fetchProduct();
    }, [params.slug, initialData]);

    const fetchProduct = async () => {
        try {
            let endpoint = '';
            if (type === 'product' || type === 'pot') {
                endpoint = `/api/products/${params.slug}`;
            } else {
                endpoint = `/api/${type}s/${params.slug}`;
            }

            const res = await fetch(endpoint);

            if (res.ok) {
                const data = await res.json();
                const item = data.product || data.combo || data.hamper || data.pot;
                setProduct(item);

                // Auto-select first size if variants exist
                if (item?.sizeVariants?.length > 0) {
                    const firstVariant = item.sizeVariants[0];
                    setSelectedSize(firstVariant.size);
                    if (firstVariant.colors?.length > 0) {
                        setSelectedColor(firstVariant.colors[0]);
                    }
                }
            } else {
                console.error('Product not found');
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get current variant based on selection
    const currentVariant = useMemo(() => {
        if (!product?.sizeVariants || !selectedSize) return null;
        return product.sizeVariants.find(v => v.size === selectedSize);
    }, [product, selectedSize]);

    // Get current price based on variant selection
    const currentPrice = useMemo(() => {
        if (currentVariant) {
            return currentVariant.price;
        }
        return product?.price || 0;
    }, [currentVariant, product]);

    // Get current stock based on variant selection
    const currentStock = useMemo(() => {
        if (currentVariant) {
            return currentVariant.stock;
        }
        return product?.stock || 0;
    }, [currentVariant, product]);

    // Get available colors for selected size
    const availableColors = useMemo(() => {
        if (currentVariant) {
            return currentVariant.colors || [];
        }
        return [];
    }, [currentVariant]);

    // Get images to display (color-specific or default product images)
    const displayImages = useMemo(() => {
        if (selectedColor?.images?.length) {
            return selectedColor.images;
        }
        return product?.images || [];
    }, [selectedColor, product]);

    // Handle size selection
    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
        const variant = product?.sizeVariants?.find(v => v.size === size);
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
        if (!product || currentStock <= 0) return;

        const cartItem = {
            name: product.name,
            slug: product.slug,
            price: currentPrice,
            image: displayImages[0] || '/placeholder-plant.jpg',
            type: type === 'pot' ? 'product' : type,
            size: selectedSize || product.size,
            color: selectedColor?.name,
            colorHex: selectedColor?.hex,
        } as any;

        // IDs
        if (type === 'combo') cartItem.comboId = product.id;
        else if (type === 'hamper') cartItem.hamperId = product.id;
        else cartItem.productId = product.id;

        addItem(cartItem, quantity);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner"></div>
                <p>Loading details...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={styles.notFound}>
                <span>🌱</span>
                <h2>Item not found</h2>
                <p>The item you're looking for doesn't exist.</p>
            </div>
        );
    }

    const discount = product.comparePrice
        ? Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100)
        : 0;

    // Parse includes if it's a string (for combos/hampers)
    let parsedIncludes: string[] = [];
    if (product.includes) {
        try {
            parsedIncludes = JSON.parse(product.includes);
        } catch {
            parsedIncludes = [product.includes];
        }
    }

    const hasVariants = product.sizeVariants && product.sizeVariants.length > 0 && product.productType !== 'SEED';

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.layout}>
                    {/* Images */}
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
                                    unoptimized
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    {type === 'combo' ? '📦' : type === 'hamper' ? '🎁' : '🌱'}
                                </div>
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

                    {/* Details */}
                    <div className={styles.details}>
                        {product.category && (
                            <span className={styles.category}>{product.category.name}</span>
                        )}
                        <h1 className={styles.name}>{product.name}</h1>

                        <div className={styles.meta}>
                            {!hasVariants && product.size && <span className={styles.tag}>{product.size}</span>}
                            {product.suitableFor && <span className={styles.tag}>{product.suitableFor}</span>}
                            {type === 'combo' && <span className={styles.tag}>Combo Pack</span>}
                            {type === 'hamper' && <span className={styles.tag}>Gift Hamper</span>}
                        </div>

                        <div className={styles.priceRow}>
                            <span className={styles.price}>₹{currentPrice.toLocaleString('en-IN')}</span>
                            {product.comparePrice && product.comparePrice > currentPrice && (
                                <span className={styles.priceCompare}>
                                    <span className={styles.comparePrice}>
                                        ₹{product.comparePrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className={styles.discountText}>Save {discount}%</span>
                                </span>
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
                                            className={`${styles.sizeBtn} ${selectedSize === variant.size ? styles.selected : ''} ${variant.stock === 0 ? styles.outOfStockBtn : ''}`}
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
                                            title={color.name}
                                        >
                                            <span
                                                className={styles.colorSwatch}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className={styles.colorName}>{color.name}</span>
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

                        {/* Includes Section for Combos/Hampers */}
                        {parsedIncludes.length > 0 && (
                            <div className={styles.section}>
                                <h3>What's Included</h3>
                                <ul className={styles.includesList}>
                                    {parsedIncludes.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
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
                                {currentStock <= 0 ? 'Out of Stock' : 'Add to Basket'}
                            </button>

                            <button
                                className={`${styles.wishlistDetailBtn} ${product && isInWishlist(
                                    type === 'product' || type === 'pot' ? product.id : undefined,
                                    type === 'combo' ? product.id : undefined,
                                    type === 'hamper' ? product.id : undefined
                                ) ? styles.wishlistDetailBtnActive : ''}`}
                                onClick={() => {
                                    if (!product) return;
                                    toggleWishlist({
                                        productId: type === 'product' || type === 'pot' ? product.id : undefined,
                                        comboId: type === 'combo' ? product.id : undefined,
                                        hamperId: type === 'hamper' ? product.id : undefined,
                                        name: product.name,
                                        slug: product.slug,
                                        price: currentPrice,
                                        image: displayImages[0] || '/placeholder-plant.jpg',
                                        type: type === 'pot' ? 'product' : type,
                                    });
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={product && isInWishlist(
                                    type === 'product' || type === 'pot' ? product.id : undefined,
                                    type === 'combo' ? product.id : undefined,
                                    type === 'hamper' ? product.id : undefined
                                ) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {product && isInWishlist(
                                    type === 'product' || type === 'pot' ? product.id : undefined,
                                    type === 'combo' ? product.id : undefined,
                                    type === 'hamper' ? product.id : undefined
                                ) ? 'Wishlisted' : 'Add to Wishlist'}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
