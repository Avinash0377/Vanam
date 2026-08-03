'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { PlanterIcon } from '@/components/PlanterIcons';
import ProductOffers from '@/components/ProductOffers';
import styles from './ProductDetails.module.css';

interface VariantColor {
    name: string;
    hex: string;
    images?: string[];
}

interface PlanterVariant {
    name: string;
    price: number;
    comparePrice?: number;
    stock: number;
    icon?: string;
    colors: VariantColor[];
}

interface SizeVariant {
    size: string;
    price: number;
    comparePrice?: number;
    stock: number;
    colors: VariantColor[];
    planters?: PlanterVariant[];
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
    const [zoomOpen, setZoomOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [tx, setTx] = useState(0);
    const [ty, setTy] = useState(0);

    // Touch swipe for mobile gallery
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleGalleryTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleGalleryTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;
        // Only trigger if predominantly horizontal and >50px
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        setActiveImage(prev => {
            const len = displayImages.length;
            if (len <= 1) return prev;
            return dx < 0 ? (prev + 1) % len : (prev - 1 + len) % len;
        });
    };

    // Fullscreen image viewer with pinch-to-zoom
    const gesture = useRef({ mode: 'none' as 'none' | 'pinch' | 'pan' | 'swipe', startDist: 0, startScale: 1, startX: 0, startY: 0, startTx: 0, startTy: 0 });

    const openZoom = () => { setScale(1); setTx(0); setTy(0); setZoomOpen(true); };
    const closeZoom = () => { setZoomOpen(false); setScale(1); setTx(0); setTy(0); };

    const changeImage = (dir: number) => {
        setScale(1); setTx(0); setTy(0);
        setActiveImage(prev => {
            const len = displayImages.length;
            if (len <= 1) return prev;
            return (prev + dir + len) % len;
        });
    };

    const touchDist = (t: React.TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const handleZoomTouchStart = (e: React.TouchEvent) => {
        const g = gesture.current;
        if (e.touches.length === 2) {
            g.mode = 'pinch';
            g.startDist = touchDist(e.touches);
            g.startScale = scale;
            g.startTx = tx;
            g.startTy = ty;
        } else if (e.touches.length === 1) {
            g.startX = e.touches[0].clientX;
            g.startY = e.touches[0].clientY;
            g.startTx = tx;
            g.startTy = ty;
            g.mode = scale > 1 ? 'pan' : 'swipe';
        }
    };

    const handleZoomTouchMove = (e: React.TouchEvent) => {
        const g = gesture.current;
        if (g.mode === 'pinch' && e.touches.length === 2) {
            const next = Math.min(4, Math.max(1, g.startScale * (touchDist(e.touches) / g.startDist)));
            setScale(next);
            if (next <= 1) { setTx(0); setTy(0); }
        } else if (g.mode === 'pan' && e.touches.length === 1) {
            setTx(g.startTx + (e.touches[0].clientX - g.startX));
            setTy(g.startTy + (e.touches[0].clientY - g.startY));
        }
    };

    const handleZoomTouchEnd = (e: React.TouchEvent) => {
        const g = gesture.current;
        if (g.mode === 'swipe' && scale <= 1 && e.changedTouches.length) {
            const dx = e.changedTouches[0].clientX - g.startX;
            const dy = e.changedTouches[0].clientY - g.startY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) changeImage(dx < 0 ? 1 : -1);
        }
        if (scale <= 1) { setTx(0); setTy(0); }
        if (e.touches.length === 0) g.mode = 'none';
    };

    // Lock body scroll while the viewer is open
    useEffect(() => {
        if (!zoomOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [zoomOpen]);

    // Variant selection state
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedPlanter, setSelectedPlanter] = useState<PlanterVariant | null>(null);
    const [selectedColor, setSelectedColor] = useState<VariantColor | null>(null);

    // Auto-select first variant when initialData is provided (SSR)
    useEffect(() => {
        if (initialData?.sizeVariants?.length) {
            const firstVariant = initialData.sizeVariants[0];
            setSelectedSize(firstVariant.size);
            if (firstVariant.planters?.length) {
                const firstPlanter = firstVariant.planters[0];
                setSelectedPlanter(firstPlanter);
                if (firstPlanter.colors?.length > 0) {
                    setSelectedColor(firstPlanter.colors[0]);
                }
            } else if (firstVariant.colors?.length > 0) {
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
                    if (firstVariant.planters?.length) {
                        const firstPlanter = firstVariant.planters[0];
                        setSelectedPlanter(firstPlanter);
                        if (firstPlanter.colors?.length > 0) {
                            setSelectedColor(firstPlanter.colors[0]);
                        }
                    } else if (firstVariant.colors?.length > 0) {
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

    // Whether the current size offers selectable planters
    const availablePlanters = useMemo(() => {
        return currentVariant?.planters || [];
    }, [currentVariant]);

    const isPlanterMode = availablePlanters.length > 0;

    // Get current price based on variant/planter selection
    const currentPrice = useMemo(() => {
        if (isPlanterMode && selectedPlanter) {
            return selectedPlanter.price;
        }
        if (currentVariant) {
            return currentVariant.price;
        }
        return product?.price || 0;
    }, [isPlanterMode, selectedPlanter, currentVariant, product]);

    // Get current compare price based on selection (fallback to global)
    const currentComparePrice = useMemo(() => {
        if (isPlanterMode && selectedPlanter?.comparePrice) {
            return selectedPlanter.comparePrice;
        }
        if (!isPlanterMode && currentVariant?.comparePrice) {
            return currentVariant.comparePrice;
        }
        return product?.comparePrice || 0;
    }, [isPlanterMode, selectedPlanter, currentVariant, product]);

    // Get current stock based on selection
    const currentStock = useMemo(() => {
        if (isPlanterMode && selectedPlanter) {
            return selectedPlanter.stock;
        }
        if (currentVariant) {
            return currentVariant.stock;
        }
        return product?.stock || 0;
    }, [isPlanterMode, selectedPlanter, currentVariant, product]);

    // Get available colors for selected planter (planter mode) or size
    const availableColors = useMemo(() => {
        if (isPlanterMode) {
            return selectedPlanter?.colors || [];
        }
        if (currentVariant) {
            return currentVariant.colors || [];
        }
        return [];
    }, [isPlanterMode, selectedPlanter, currentVariant]);

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
        if (variant?.planters?.length) {
            // Planter mode: pick first planter, then its first color
            const firstPlanter = variant.planters[0];
            setSelectedPlanter(firstPlanter);
            setSelectedColor(firstPlanter.colors?.length ? firstPlanter.colors[0] : null);
        } else {
            setSelectedPlanter(null);
            if (variant?.colors?.length) {
                setSelectedColor(variant.colors[0]);
            } else {
                setSelectedColor(null);
            }
        }
        setActiveImage(0);
        setQuantity(1);
    };

    // Handle planter selection
    const handlePlanterSelect = (planter: PlanterVariant) => {
        setSelectedPlanter(planter);
        setSelectedColor(planter.colors?.length ? planter.colors[0] : null);
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
            planter: selectedPlanter?.name,
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

    const discount = currentComparePrice
        ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
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

    const visibleSizes = product.sizeVariants?.filter(v => v.size !== 'DEFAULT') || [];
    const hasVisibleSizes = visibleSizes.length > 0 && product.productType !== 'SEED';

    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.layout}>
                    {/* Images */}
                    <div className={styles.gallery}>
                        <div
                            className={styles.mainImage}
                            onClick={openZoom}
                            onTouchStart={handleGalleryTouchStart}
                            onTouchEnd={handleGalleryTouchEnd}
                        >
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
                            {!hasVisibleSizes && product.size && product.size.toUpperCase() !== 'DEFAULT' && <span className={styles.tag}>{product.size}</span>}
                            {product.suitableFor && <span className={styles.tag}>{product.suitableFor}</span>}
                            {type === 'combo' && <span className={styles.tag}>Combo Pack</span>}
                            {type === 'hamper' && <span className={styles.tag}>Gift Hamper</span>}
                        </div>

                        <div className={styles.priceRow}>
                            <span className={styles.price}>₹{currentPrice.toLocaleString('en-IN')}</span>
                            {currentComparePrice && currentComparePrice > currentPrice && (
                                <span className={styles.comparePrice}>₹{currentComparePrice.toLocaleString('en-IN')}</span>
                            )}
                            {discount > 0 && (
                                <span className={styles.discountLabel}>Save {discount}%</span>
                            )}
                        </div>

                        {/* Size Variant Selector */}
                        {hasVisibleSizes && (
                            <div className={styles.variantSection}>
                                <h3 className={styles.variantLabel}>
                                    Select Size
                                    {selectedSize && <span className={styles.selectedValue}>{selectedSize}</span>}
                                </h3>
                                <div className={styles.sizeOptions}>
                                    {visibleSizes.map((variant) => (
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

                        {/* Planter Selector — shown when the selected size offers planters */}
                        {isPlanterMode && (
                            <div className={styles.variantSection}>
                                <h3 className={styles.variantLabel}>
                                    Select Planter
                                    {selectedPlanter && <span className={styles.selectedValue}>{selectedPlanter.name}</span>}
                                </h3>
                                <div className={styles.planterOptions}>
                                    {availablePlanters.map((planter) => (
                                        <button
                                            key={planter.name}
                                            className={`${styles.planterCard} ${selectedPlanter?.name === planter.name ? styles.selected : ''} ${planter.stock === 0 ? styles.outOfStockBtn : ''}`}
                                            onClick={() => handlePlanterSelect(planter)}
                                            disabled={planter.stock === 0}
                                            title={planter.stock === 0 ? 'Out of stock' : `₹${planter.price}`}
                                        >
                                            {planter.icon ? (
                                                <span className={styles.planterThumbPlaceholder}>
                                                    <PlanterIcon name={planter.icon} size={44} />
                                                </span>
                                            ) : planter.colors?.[0]?.images?.[0] ? (
                                                <span className={styles.planterThumb}>
                                                    <Image src={planter.colors[0].images[0]} alt={planter.name} fill sizes="64px" unoptimized />
                                                </span>
                                            ) : (
                                                <span className={styles.planterThumbPlaceholder}>
                                                    <PlanterIcon name={undefined} size={44} />
                                                </span>
                                            )}
                                            <span className={styles.planterName}>{planter.name}</span>
                                            <span className={styles.planterPrice}>₹{planter.price.toLocaleString('en-IN')}</span>
                                            {planter.stock === 0 && <span className={styles.soldOut}>Sold Out</span>}
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
                                className={styles.addToBasketBtn}
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
                                <span className={styles.wishlistText}>
                                    {product && isInWishlist(
                                        type === 'product' || type === 'pot' ? product.id : undefined,
                                        type === 'combo' ? product.id : undefined,
                                        type === 'hamper' ? product.id : undefined
                                    ) ? 'Wishlisted' : 'Wishlist'}
                                </span>
                            </button>

                        </div>

                        {/* Offers for you */}
                        {product && <ProductOffers productId={product.id} />}
                    </div>
                </div>
            </div>

            {zoomOpen && displayImages[activeImage] && (
                <div className={styles.lightbox} onClick={closeZoom} role="dialog" aria-modal="true">
                    <button className={styles.lightboxClose} onClick={closeZoom} aria-label="Close image viewer">&times;</button>
                    <div
                        className={styles.lightboxStage}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleZoomTouchStart}
                        onTouchMove={handleZoomTouchMove}
                        onTouchEnd={handleZoomTouchEnd}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={displayImages[activeImage]}
                            alt={product.name}
                            className={styles.lightboxImg}
                            style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
                            draggable={false}
                        />
                    </div>
                    {displayImages.length > 1 && scale <= 1 && (
                        <div className={styles.lightboxNav} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => changeImage(-1)} aria-label="Previous image">&#8249;</button>
                            <span>{activeImage + 1} / {displayImages.length}</span>
                            <button onClick={() => changeImage(1)} aria-label="Next image">&#8250;</button>
                        </div>
                    )}
                    <p className={styles.lightboxHint}>Pinch to zoom{displayImages.length > 1 ? ' · swipe to browse' : ''}</p>
                </div>
            )}
        </div>
    );
}
