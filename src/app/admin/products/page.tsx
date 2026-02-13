'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    PlantIcon,
    StarIcon,
    EyeIcon,
    EditIcon,
    TrashIcon,
    SearchIcon
} from '@/components/Icons';
import styles from './page.module.css';

interface VariantColor {
    name: string;
    hex: string;
    images: string[];
}

interface SizeVariant {
    size: string;
    price: string;
    stock: string;
    colors: VariantColor[];
}

interface Product {
    id: string;
    name: string;
    slug: string;
    productType: string;
    price: number;
    comparePrice?: number;
    stock: number;
    status: string;
    featured: boolean;
    images: string[];
    category?: { name: string };
    suitableFor?: string;
    sizeVariants?: SizeVariant[];
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [suitableFilter, setSuitableFilter] = useState('');
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token, statusFilter, typeFilter, suitableFilter]);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            if (typeFilter) params.set('type', typeFilter);
            if (suitableFilter) params.set('suitable', suitableFilter);

            const res = await fetch(`/api/admin/products?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(1);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete product');
        }
    };

    const toggleExpand = (productId: string) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: 'Out of Stock', class: styles.stockOut };
        if (stock <= 5) return { label: 'Low Stock', class: styles.stockLow };
        return { label: 'In Stock', class: styles.stockIn };
    };

    // Calculate price range from variants
    const getPriceRange = (product: Product) => {
        if (!product.sizeVariants || product.sizeVariants.length === 0) {
            return { min: product.price, max: product.price };
        }
        const prices = product.sizeVariants.map(v => parseFloat(v.price) || 0).filter(p => p > 0);
        if (prices.length === 0) return { min: product.price, max: product.price };
        return { min: Math.min(...prices), max: Math.max(...prices) };
    };

    // Calculate total stock from variants
    const getTotalStock = (product: Product) => {
        if (!product.sizeVariants || product.sizeVariants.length === 0) {
            return product.stock;
        }
        return product.sizeVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    };

    // Get total image count for a size variant
    const getImageCount = (variant: SizeVariant) => {
        return variant.colors.reduce((sum, color) => sum + (color.images?.length || 0), 0);
    };

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>Products</h1>
                        <p className={styles.headerDesc}>
                            {pagination?.total || 0} products total
                        </p>
                    </div>
                    <Link href="/admin/products/new" className="btn btn-primary">
                        + Add Product
                    </Link>
                </div>

                {/* Category Tabs */}
                <div className={styles.categoryTabs}>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === '' ? styles.active : ''}`}
                        onClick={() => setTypeFilter('')}
                    >
                        All Products
                    </button>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === 'PLANT' ? styles.active : ''}`}
                        onClick={() => setTypeFilter('PLANT')}
                    >
                        <PlantIcon size={16} /> Plants
                    </button>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === 'POT' ? styles.active : ''}`}
                        onClick={() => { setTypeFilter('POT'); setSuitableFilter(''); }}
                    >
                        Pots
                    </button>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === 'PLANTER' ? styles.active : ''}`}
                        onClick={() => { setTypeFilter('PLANTER'); setSuitableFilter(''); }}
                    >
                        Planters
                    </button>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === 'ACCESSORY' ? styles.active : ''}`}
                        onClick={() => { setTypeFilter('ACCESSORY'); setSuitableFilter(''); }}
                    >
                        Accessories
                    </button>
                    <button
                        className={`${styles.categoryTab} ${typeFilter === 'SEED' ? styles.active : ''}`}
                        onClick={() => { setTypeFilter('SEED'); setSuitableFilter(''); }}
                    >
                        Seeds
                    </button>
                </div>

                {/* Sub Sections for Plants */}
                {typeFilter === 'PLANT' && (
                    <div className={styles.subCategoryTabs}>
                        <button
                            className={`${styles.subCategoryTab} ${suitableFilter === '' ? styles.active : ''}`}
                            onClick={() => setSuitableFilter('')}
                        >
                            All Plants
                        </button>
                        <button
                            className={`${styles.subCategoryTab} ${suitableFilter === 'INDOOR' ? styles.active : ''}`}
                            onClick={() => setSuitableFilter('INDOOR')}
                        >
                            Indoor Plants
                        </button>
                        <button
                            className={`${styles.subCategoryTab} ${suitableFilter === 'OUTDOOR' ? styles.active : ''}`}
                            onClick={() => setSuitableFilter('OUTDOOR')}
                        >
                            Outdoor Plants
                        </button>
                    </div>
                )}

                {/* Quick Add Buttons */}
                <div className={styles.quickAddButtons}>
                    <Link href="/admin/products/new?type=PLANT&suitable=INDOOR" className={styles.quickAddBtn}>
                        + Add Indoor Plant
                    </Link>
                    <Link href="/admin/products/new?type=PLANT&suitable=OUTDOOR" className={styles.quickAddBtn}>
                        + Add Outdoor Plant
                    </Link>
                    <Link href="/admin/products/new?type=POT" className={styles.quickAddBtn}>
                        + Add Pot
                    </Link>
                    <Link href="/admin/products/new?type=PLANTER" className={styles.quickAddBtn}>
                        + Add Planter
                    </Link>
                    <Link href="/admin/products/new?type=SEED" className={styles.quickAddBtn}>
                        + Add Seed
                    </Link>
                    <Link href="/admin/products/new?type=ACCESSORY" className={styles.quickAddBtn}>
                        + Add Accessory
                    </Link>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>
                            <SearchIcon size={18} />
                        </button>
                    </form>

                    <div className={styles.filterGroup}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                    </div>
                </div>

                {/* Products Table */}
                <div className={styles.tableWrapper}>
                    {loading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : products.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No products found</p>
                            <Link href="/admin/products/new" className="btn btn-primary">
                                Add Your First Product
                            </Link>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Price Range</th>
                                    <th>Total Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const stockStatus = getStockStatus(getTotalStock(product));
                                    const priceRange = getPriceRange(product);
                                    const isExpanded = expandedProducts.has(product.id);
                                    const hasVariants = product.sizeVariants && product.sizeVariants.length > 0;

                                    return (
                                        <Fragment key={product.id}>
                                            {/* Main Product Row */}
                                            <tr className={isExpanded ? styles.expandedRow : ''}>
                                                <td>
                                                    {hasVariants && (
                                                        <button
                                                            className={styles.expandBtn}
                                                            onClick={() => toggleExpand(product.id)}
                                                            title={isExpanded ? 'Collapse' : 'Expand variants'}
                                                        >
                                                            {isExpanded ? '▼' : '▶'}
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className={styles.productCell}>
                                                        <div className={styles.productImage}>
                                                            {(() => {
                                                                const img = product.images?.[0] ||
                                                                    product.sizeVariants?.flatMap(v => v.colors?.flatMap(c => c.images || []) || [])?.[0];
                                                                return img ? (
                                                                    <img src={img} alt={product.name} />
                                                                ) : (
                                                                    <PlantIcon size={20} />
                                                                );
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <span className={styles.productName}>
                                                                {product.name}
                                                                {product.featured && <span className={styles.featuredBadge}><StarIcon size={14} filled color="#f59e0b" /></span>}
                                                            </span>
                                                            <span className={styles.productCategory}>
                                                                {product.category?.name || 'Uncategorized'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.typeBadge}>{product.productType}</span>
                                                </td>
                                                <td>
                                                    <div className={styles.priceCell}>
                                                        {priceRange.min === priceRange.max ? (
                                                            <span className={styles.price}>₹{priceRange.min}</span>
                                                        ) : (
                                                            <span className={styles.price}>₹{priceRange.min} – ₹{priceRange.max}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.stockBadge} ${stockStatus.class}`}>
                                                        {getTotalStock(product)} ({stockStatus.label})
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[product.status.toLowerCase()]}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <Link
                                                            href={`/product/${product.slug}`}
                                                            className={styles.actionBtn}
                                                            target="_blank"
                                                        >
                                                            <EyeIcon size={16} />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/products/${product.id}/edit`}
                                                            className={styles.actionBtn}
                                                        >
                                                            <EditIcon size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(product.id, product.name)}
                                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        >
                                                            <TrashIcon size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Variant Details (Level 2) */}
                                            {isExpanded && hasVariants && (
                                                <tr className={styles.variantRow}>
                                                    <td colSpan={7}>
                                                        <div className={styles.variantDetails}>
                                                            <div className={styles.variantContainer}>
                                                                <div className={styles.variantHeader}>
                                                                    <span className={styles.variantTitle}>
                                                                        📦 Size Variants
                                                                    </span>
                                                                    <span className={styles.variantCount}>
                                                                        {product.sizeVariants!.length} {product.sizeVariants!.length === 1 ? 'variant' : 'variants'}
                                                                    </span>
                                                                </div>
                                                                <table className={styles.variantTable}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Size</th>
                                                                            <th>Price</th>
                                                                            <th>Stock</th>
                                                                            <th>Colors</th>
                                                                            <th>Images</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {product.sizeVariants!.map((variant) => {
                                                                            const variantStock = parseInt(variant.stock) || 0;
                                                                            const imageCount = getImageCount(variant);

                                                                            return (
                                                                                <tr key={variant.size}>
                                                                                    <td>
                                                                                        <span className={styles.sizeLabel}>{variant.size}</span>
                                                                                    </td>
                                                                                    <td>
                                                                                        {variant.price ? (
                                                                                            <span className={styles.variantPrice}>₹{variant.price}</span>
                                                                                        ) : (
                                                                                            <span className={styles.warning}>⚠️ Missing</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className={variantStock === 0 ? styles.stockZero : ''}>
                                                                                            {variant.stock}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        {variant.colors && variant.colors.length > 0 ? (
                                                                                            <div className={styles.colorDots}>
                                                                                                {variant.colors.map((color, idx) => (
                                                                                                    <span
                                                                                                        key={idx}
                                                                                                        className={styles.colorDot}
                                                                                                        style={{ backgroundColor: color.hex }}
                                                                                                        title={`${color.name} (${color.hex})`}
                                                                                                    />
                                                                                                ))}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className={styles.muted}>—</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className={styles.imageCount}>
                                                                                            {imageCount > 0 ? imageCount : '—'}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={() => fetchProducts(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className={styles.pageBtn}
                        >
                            ← Previous
                        </button>
                        <span className={styles.pageInfo}>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => fetchProducts(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className={styles.pageBtn}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
