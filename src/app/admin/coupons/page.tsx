'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

// ── Types ──────────────────────────────────────────────

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    usagePerUser: number;
    usedCount: number;
    applicableTo: 'ALL' | 'CATEGORY' | 'PRODUCT';
    applicableIds: string[];
    isActive: boolean;
    startDate: string;
    expiryDate: string;
    createdAt: string;
    // PDP Offer fields
    offerType?: string;
    showOnProductPage?: boolean;
    autoApply?: boolean;
    displayTitle?: string | null;
    displaySubtext?: string | null;
    sortOrder?: number;
    applicabilityScope?: string;
    includedProductIds?: string[];
    excludedProductIds?: string[];
    includedCategoryIds?: string[];
    includedTags?: string[];
    stackable?: boolean;
    perUserLimit?: number | null;
}

interface CouponForm {
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: string;
    usageLimit: string;
    usagePerUser: number;
    applicableTo: 'ALL' | 'CATEGORY' | 'PRODUCT';
    isActive: boolean;
    startDate: string;
    expiryDate: string;
    // PDP Offer fields
    offerType: string;
    showOnProductPage: boolean;
    autoApply: boolean;
    displayTitle: string;
    displaySubtext: string;
    sortOrder: number;
    applicabilityScope: string;
    includedProductIds: string[];
    excludedProductIds: string[];
    includedCategoryIds: string[];
    includedTags: string[];
    stackable: boolean;
    perUserLimit: string;
}

interface ProductSearchResult {
    id: string;
    name: string;
    thumbnail: string | null;
    price: number;
    productType: string;
    category: string | null;
}

interface CategoryItem {
    id: string;
    name: string;
    _count?: { products: number };
}

const emptyCoupon: CouponForm = {
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscountAmount: '',
    usageLimit: '',
    usagePerUser: 1,
    applicableTo: 'ALL',
    isActive: true,
    startDate: new Date().toISOString().slice(0, 16),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    // PDP Offer defaults
    offerType: 'PERCENTAGE',
    showOnProductPage: false,
    autoApply: false,
    displayTitle: '',
    displaySubtext: '',
    sortOrder: 0,
    applicabilityScope: 'ALL_PRODUCTS',
    includedProductIds: [],
    excludedProductIds: [],
    includedCategoryIds: [],
    includedTags: [],
    stackable: false,
    perUserLimit: '',
};

export default function CouponsPage() {
    const { token } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyCoupon);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showPdpSection, setShowPdpSection] = useState(false);

    // Product search state — separate for include vs exclude
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [excludeProductSearch, setExcludeProductSearch] = useState('');
    const [excludeProductResults, setExcludeProductResults] = useState<ProductSearchResult[]>([]);
    const [searchingExcludeProducts, setSearchingExcludeProducts] = useState(false);
    const excludeSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Product name map for display
    const [productNameMap, setProductNameMap] = useState<Record<string, string>>({});

    // Tag input state
    const [tagInput, setTagInput] = useState('');

    // Category state
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20' });
            if (search) params.set('search', search);
            if (filterActive) params.set('active', filterActive);

            const res = await fetch(`/api/admin/coupons?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setCoupons(data.coupons || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch {
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    }, [page, search, filterActive, token]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await fetch('/api/admin/categories', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(Array.isArray(data) ? data : []);
                }
            } catch {
                console.error('Failed to load categories');
            } finally {
                setLoadingCategories(false);
            }
        };
        if (token) fetchCategories();
    }, [token]);

    // Debounced product search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (productSearch.length < 2) {
            setProductResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setSearchingProducts(true);
            try {
                const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(productSearch)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setProductResults(data.products || []);
            } catch {
                setProductResults([]);
            } finally {
                setSearchingProducts(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [productSearch, token]);

    // Debounced exclude product search
    useEffect(() => {
        if (excludeSearchTimeoutRef.current) clearTimeout(excludeSearchTimeoutRef.current);

        if (excludeProductSearch.length < 2) {
            setExcludeProductResults([]);
            return;
        }

        excludeSearchTimeoutRef.current = setTimeout(async () => {
            setSearchingExcludeProducts(true);
            try {
                const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(excludeProductSearch)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setExcludeProductResults(data.products || []);
            } catch {
                setExcludeProductResults([]);
            } finally {
                setSearchingExcludeProducts(false);
            }
        }, 300);

        return () => {
            if (excludeSearchTimeoutRef.current) clearTimeout(excludeSearchTimeoutRef.current);
        };
    }, [excludeProductSearch, token]);

    // Auto-clear success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyCoupon);
        setError('');
        setShowPdpSection(false);
        setProductSearch('');
        setProductResults([]);
        setExcludeProductSearch('');
        setExcludeProductResults([]);
        setTagInput('');
        setShowModal(true);
    };

    const openEdit = (c: Coupon) => {
        setEditingId(c.id);
        const formData: CouponForm = {
            code: c.code,
            description: c.description || '',
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderValue: c.minOrderValue,
            maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
            usageLimit: c.usageLimit ? String(c.usageLimit) : '',
            usagePerUser: c.usagePerUser,
            applicableTo: c.applicableTo,
            isActive: c.isActive,
            startDate: new Date(c.startDate).toISOString().slice(0, 16),
            expiryDate: new Date(c.expiryDate).toISOString().slice(0, 16),
            // PDP Offer fields
            offerType: c.offerType || 'PERCENTAGE',
            showOnProductPage: c.showOnProductPage || false,
            autoApply: c.autoApply || false,
            displayTitle: c.displayTitle || '',
            displaySubtext: c.displaySubtext || '',
            sortOrder: c.sortOrder || 0,
            applicabilityScope: c.applicabilityScope || 'ALL_PRODUCTS',
            includedProductIds: c.includedProductIds || [],
            excludedProductIds: c.excludedProductIds || [],
            includedCategoryIds: c.includedCategoryIds || [],
            includedTags: c.includedTags || [],
            stackable: c.stackable || false,
            perUserLimit: c.perUserLimit ? String(c.perUserLimit) : '',
        };
        setForm(formData);
        setError('');
        setShowPdpSection(formData.showOnProductPage);
        setProductSearch('');
        setProductResults([]);
        setExcludeProductSearch('');
        setExcludeProductResults([]);
        setTagInput('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
            const method = editingId ? 'PUT' : 'POST';

            const body = {
                ...form,
                discountValue: Number(form.discountValue),
                minOrderValue: Number(form.minOrderValue),
                maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                usagePerUser: Number(form.usagePerUser),
                sortOrder: Number(form.sortOrder) || 0,
                perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to save coupon');
                return;
            }

            setSuccess(data.message);
            setShowModal(false);
            fetchCoupons();
        } catch {
            setError('Failed to save coupon');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (c: Coupon) => {
        try {
            await fetch(`/api/admin/coupons/${c.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !c.isActive }),
            });
            fetchCoupons();
        } catch {
            setError('Failed to toggle coupon');
        }
    };

    const togglePdpVisibility = async (c: Coupon) => {
        const newValue = !c.showOnProductPage;
        // Optimistic update
        setCoupons(prev => prev.map(item =>
            item.id === c.id ? { ...item, showOnProductPage: newValue } : item
        ));

        try {
            const res = await fetch(`/api/admin/coupons/${c.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ showOnProductPage: newValue }),
            });

            if (!res.ok) throw new Error('Failed');
            setSuccess(`Coupon ${newValue ? 'shown' : 'hidden'} on product pages`);
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            // Revert on failure
            setCoupons(prev => prev.map(item =>
                item.id === c.id ? { ...item, showOnProductPage: !newValue } : item
            ));
            setError('Failed to toggle PDP visibility');
        }
    };

    const handleDelete = async (c: Coupon) => {
        if (!confirm(`Delete coupon "${c.code}"?`)) return;
        try {
            await fetch(`/api/admin/coupons/${c.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchCoupons();
        } catch {
            setError('Failed to delete coupon');
        }
    };

    const addProductToList = (product: ProductSearchResult, field: 'includedProductIds' | 'excludedProductIds') => {
        if (!form[field].includes(product.id)) {
            setForm({ ...form, [field]: [...form[field], product.id] });
            setProductNameMap(prev => ({ ...prev, [product.id]: product.name }));
        }
        if (field === 'excludedProductIds') {
            setExcludeProductSearch('');
            setExcludeProductResults([]);
        } else {
            setProductSearch('');
            setProductResults([]);
        }
    };

    const removeProductFromList = (productId: string, field: 'includedProductIds' | 'excludedProductIds') => {
        setForm({ ...form, [field]: form[field].filter(id => id !== productId) });
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.includedTags.includes(tag)) {
            setForm({ ...form, includedTags: [...form.includedTags, tag] });
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setForm({ ...form, includedTags: form.includedTags.filter(t => t !== tag) });
    };

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isExpired = (d: string) => new Date(d) < new Date();

    const getScopeLabel = (c: Coupon) => {
        const scope = c.applicabilityScope || 'ALL_PRODUCTS';
        switch (scope) {
            case 'PRODUCT': {
                const count = c.includedProductIds?.length || 0;
                return count > 0 ? `${count} Product${count > 1 ? 's' : ''}` : 'All Products';
            }
            case 'CATEGORY': {
                const count = c.includedCategoryIds?.length || 0;
                return count > 0 ? `${count} Categor${count > 1 ? 'ies' : 'y'}` : 'All Products';
            }
            case 'COLLECTION_TAG': {
                const count = c.includedTags?.length || 0;
                return count > 0 ? `${count} Tag${count > 1 ? 's' : ''}` : 'All Products';
            }
            default:
                return 'All Products';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Coupons</h1>
                    <p className={styles.subtitle}>Manage discount coupons for your store</p>
                </div>
                <button className={styles.createBtn} onClick={openCreate}>
                    + Create Coupon
                </button>
            </div>

            {success && <div className={styles.successMsg}>{success}</div>}
            {error && !showModal && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Search by code..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className={styles.searchInput}
                />
                <select
                    value={filterActive}
                    onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
                    className={styles.filterSelect}
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading coupons...</div>
            ) : coupons.length === 0 ? (
                <div className={styles.empty}>
                    <p>No coupons found</p>
                    <button className={styles.createBtn} onClick={openCreate}>Create your first coupon</button>
                </div>
            ) : (
                <>
                    {/* Desktop table view */}
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Min Order</th>
                                    <th>Applies To</th>
                                    <th>Usage</th>
                                    <th>Validity</th>
                                    <th>Status</th>
                                    <th>On PDP</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((c) => (
                                    <tr key={c.id} className={isExpired(c.expiryDate) ? styles.expired : ''}>
                                        <td>
                                            <span className={styles.code}>{c.code}</span>
                                            {c.description && <span className={styles.desc}>{c.description}</span>}
                                        </td>
                                        <td>
                                            {c.discountType === 'PERCENTAGE'
                                                ? `${c.discountValue}%`
                                                : `₹${c.discountValue}`}
                                            {c.maxDiscountAmount && (
                                                <span className={styles.maxDiscount}>
                                                    max ₹{c.maxDiscountAmount}
                                                </span>
                                            )}
                                        </td>
                                        <td>₹{c.minOrderValue}</td>
                                        <td>
                                            <span className={styles.scopeChip}>{getScopeLabel(c)}</span>
                                        </td>
                                        <td>
                                            {c.usedCount}
                                            {c.usageLimit ? `/${c.usageLimit}` : ' / ∞'}
                                        </td>
                                        <td className={styles.dateCell}>
                                            <span>{formatDate(c.startDate)}</span>
                                            <span>→ {formatDate(c.expiryDate)}</span>
                                        </td>
                                        <td>
                                            <button
                                                className={`${styles.statusBadge} ${c.isActive ? styles.active : styles.inactive}`}
                                                onClick={() => toggleActive(c)}
                                                title="Click to toggle"
                                            >
                                                {c.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className={`${styles.pdpToggle} ${c.showOnProductPage ? styles.pdpOn : styles.pdpOff}`}
                                                onClick={() => togglePdpVisibility(c)}
                                                title={c.showOnProductPage ? 'Shown on product pages — click to hide' : 'Hidden from product pages — click to show'}
                                                aria-label={`Toggle PDP visibility for ${c.code}`}
                                            >
                                                <span className={styles.pdpToggleTrack}>
                                                    <span className={styles.pdpToggleThumb} />
                                                </span>
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                                                <button className={styles.deleteBtn} onClick={() => handleDelete(c)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card view */}
                    <div className={styles.cardList}>
                        {coupons.map((c) => (
                            <div key={c.id} className={`${styles.card} ${isExpired(c.expiryDate) ? styles.cardExpired : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardCodeRow}>
                                        <span className={styles.code}>{c.code}</span>
                                        <button
                                            className={`${styles.statusBadge} ${c.isActive ? styles.active : styles.inactive}`}
                                            onClick={() => toggleActive(c)}
                                        >
                                            {c.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                    {c.description && <span className={styles.cardDesc}>{c.description}</span>}
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Discount</span>
                                        <span className={styles.cardValue}>
                                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                            {c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ''}
                                        </span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Min Order</span>
                                        <span className={styles.cardValue}>₹{c.minOrderValue}</span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Applies To</span>
                                        <span className={styles.scopeChip}>{getScopeLabel(c)}</span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Usage</span>
                                        <span className={styles.cardValue}>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ' / ∞'}</span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Validity</span>
                                        <span className={styles.cardValue}>{formatDate(c.startDate)} → {formatDate(c.expiryDate)}</span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>On PDP</span>
                                        <button
                                            className={`${styles.pdpToggle} ${c.showOnProductPage ? styles.pdpOn : styles.pdpOff}`}
                                            onClick={() => togglePdpVisibility(c)}
                                            aria-label={`Toggle PDP visibility for ${c.code}`}
                                        >
                                            <span className={styles.pdpToggleTrack}>
                                                <span className={styles.pdpToggleThumb} />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <button className={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(c)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span>Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>

                        {error && <div className={styles.modalError}>{error}</div>}

                        <div className={styles.formGrid}>
                            {/* Code field — hidden when autoApply */}
                            {!form.autoApply && (
                                <div className={styles.formGroup}>
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. WELCOME20"
                                        className={styles.input}
                                    />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional description"
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Discount Type *</label>
                                <select
                                    value={form.discountType}
                                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                    className={styles.input}
                                >
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED">Fixed Amount (₹)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Discount Value *</label>
                                <input
                                    type="number"
                                    value={form.discountValue || ''}
                                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                                    placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 100'}
                                    className={styles.input}
                                    min="0"
                                    max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Minimum Order Value (₹)</label>
                                <input
                                    type="number"
                                    value={form.minOrderValue || ''}
                                    onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                                    placeholder="0"
                                    className={styles.input}
                                    min="0"
                                />
                            </div>

                            {form.discountType === 'PERCENTAGE' && (
                                <div className={styles.formGroup}>
                                    <label>Max Discount Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={form.maxDiscountAmount}
                                        onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                                        placeholder="No cap"
                                        className={styles.input}
                                        min="0"
                                    />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label>Total Usage Limit</label>
                                <input
                                    type="number"
                                    value={form.usageLimit}
                                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                    placeholder="Unlimited"
                                    className={styles.input}
                                    min="1"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Usage Per User</label>
                                <input
                                    type="number"
                                    value={form.usagePerUser}
                                    onChange={(e) => setForm({ ...form, usagePerUser: Number(e.target.value) })}
                                    className={styles.input}
                                    min="1"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Start Date *</label>
                                <input
                                    type="datetime-local"
                                    value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Expiry Date *</label>
                                <input
                                    type="datetime-local"
                                    value={form.expiryDate}
                                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>
                        </div>

                        {/* ---- Product Page Display & Targeting ---- */}
                        <div className={styles.pdpSectionHeader}>
                            <button
                                type="button"
                                className={styles.collapsibleBtn}
                                onClick={() => setShowPdpSection(!showPdpSection)}
                            >
                                <span className={`${styles.collapsibleArrow} ${showPdpSection ? styles.open : ''}`}>▶</span>
                                Product Page Display & Targeting
                            </button>
                        </div>

                        {showPdpSection && (
                            <div className={styles.pdpSection}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={form.showOnProductPage}
                                                onChange={(e) => setForm({ ...form, showOnProductPage: e.target.checked })}
                                            />
                                            Show this offer on product pages
                                        </label>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={form.autoApply}
                                                onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
                                            />
                                            Auto-apply (no code needed)
                                        </label>
                                        {form.autoApply && (
                                            <span className={styles.autoApplyBadge}>Offer applied at checkout</span>
                                        )}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Offer Type</label>
                                        <select
                                            value={form.offerType}
                                            onChange={(e) => setForm({ ...form, offerType: e.target.value })}
                                            className={styles.input}
                                        >
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FLAT">Flat Amount (₹)</option>
                                            <option value="FREE_SHIPPING">Free Shipping</option>
                                            <option value="BOGO">Buy 1 Get 1</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>
                                            Display Title
                                            <span className={styles.charCount}>{form.displayTitle.length}/90</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.displayTitle}
                                            onChange={(e) => setForm({ ...form, displayTitle: e.target.value.slice(0, 90) })}
                                            placeholder="Auto-generated if empty"
                                            className={styles.input}
                                            maxLength={90}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>
                                            Display Subtext
                                            <span className={styles.charCount}>{form.displaySubtext.length}/120</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.displaySubtext}
                                            onChange={(e) => setForm({ ...form, displaySubtext: e.target.value.slice(0, 120) })}
                                            placeholder="Optional secondary line"
                                            className={styles.input}
                                            maxLength={120}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Priority / Sort Order</label>
                                        <input
                                            type="number"
                                            value={form.sortOrder}
                                            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                                            placeholder="0 (higher = shown first)"
                                            className={styles.input}
                                            min="0"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Per-User Limit</label>
                                        <input
                                            type="number"
                                            value={form.perUserLimit}
                                            onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                                            placeholder="Unlimited"
                                            className={styles.input}
                                            min="1"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={form.stackable}
                                                onChange={(e) => setForm({ ...form, stackable: e.target.checked })}
                                            />
                                            Stackable (can combine with other offers)
                                        </label>
                                    </div>
                                </div>

                                {/* Applicability Scope */}
                                <div className={styles.scopeSection}>
                                    <label className={styles.scopeLabel}>Applies to:</label>
                                    <div className={styles.scopeRadios}>
                                        {[
                                            { value: 'ALL_PRODUCTS', label: 'All products' },
                                            { value: 'CATEGORY', label: 'Specific categories' },
                                            { value: 'PRODUCT', label: 'Specific products' },
                                            { value: 'COLLECTION_TAG', label: 'Tags' },
                                        ].map(opt => (
                                            <label key={opt.value} className={styles.radioLabel}>
                                                <input
                                                    type="radio"
                                                    name="applicabilityScope"
                                                    value={opt.value}
                                                    checked={form.applicabilityScope === opt.value}
                                                    onChange={(e) => setForm({ ...form, applicabilityScope: e.target.value })}
                                                />
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Product multi-select */}
                                    {form.applicabilityScope === 'PRODUCT' && (
                                        <div className={styles.multiSelect}>
                                            <input
                                                type="text"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                placeholder="Search products..."
                                                className={styles.input}
                                            />
                                            {searchingProducts && <span className={styles.searchHint}>Searching...</span>}
                                            {productResults.length > 0 && (
                                                <div className={styles.searchDropdown}>
                                                    {productResults.map(p => (
                                                        <button
                                                            key={p.id}
                                                            className={styles.searchItem}
                                                            onClick={() => addProductToList(p, 'includedProductIds')}
                                                            type="button"
                                                        >
                                                            <span className={styles.searchItemName}>{p.name}</span>
                                                            <span className={styles.searchItemMeta}>₹{p.price} · {p.category || p.productType}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {form.includedProductIds.length > 0 && (
                                                <div className={styles.chipList}>
                                                    {form.includedProductIds.map(id => (
                                                        <span key={id} className={styles.chip}>
                                                            {productNameMap[id] || id.slice(-6)}
                                                            <button type="button" onClick={() => removeProductFromList(id, 'includedProductIds')}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Category multi-select */}
                                    {form.applicabilityScope === 'CATEGORY' && (
                                        <div className={styles.multiSelect}>
                                            {loadingCategories ? (
                                                <span className={styles.searchHint}>Loading categories...</span>
                                            ) : categories.length === 0 ? (
                                                <span className={styles.searchHint}>No categories found</span>
                                            ) : (
                                                <div className={styles.categoryCheckboxes}>
                                                    {categories.map(cat => (
                                                        <label key={cat.id} className={styles.categoryCheckbox}>
                                                            <input
                                                                type="checkbox"
                                                                checked={form.includedCategoryIds.includes(cat.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setForm({ ...form, includedCategoryIds: [...form.includedCategoryIds, cat.id] });
                                                                    } else {
                                                                        setForm({ ...form, includedCategoryIds: form.includedCategoryIds.filter(id => id !== cat.id) });
                                                                    }
                                                                }}
                                                            />
                                                            <span className={styles.categoryName}>{cat.name}</span>
                                                            {cat._count?.products !== undefined && (
                                                                <span className={styles.categoryCount}>({cat._count.products})</span>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            {form.includedCategoryIds.length > 0 && (
                                                <div className={styles.chipList}>
                                                    {form.includedCategoryIds.map(id => {
                                                        const cat = categories.find(c => c.id === id);
                                                        return (
                                                            <span key={id} className={styles.chip}>
                                                                {cat?.name || id.slice(-6)}
                                                                <button type="button" onClick={() => setForm({ ...form, includedCategoryIds: form.includedCategoryIds.filter(cid => cid !== id) })}>×</button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tag input */}
                                    {form.applicabilityScope === 'COLLECTION_TAG' && (
                                        <div className={styles.multiSelect}>
                                            <div className={styles.tagInputRow}>
                                                <input
                                                    type="text"
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                                    placeholder="e.g. air-purifying"
                                                    className={styles.input}
                                                />
                                                <button type="button" className={styles.addTagBtn} onClick={addTag}>Add</button>
                                            </div>
                                            {form.includedTags.length > 0 && (
                                                <div className={styles.chipList}>
                                                    {form.includedTags.map(tag => (
                                                        <span key={tag} className={styles.chip}>
                                                            {tag}
                                                            <button type="button" onClick={() => removeTag(tag)}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Exclude products */}
                                    {form.applicabilityScope !== 'ALL_PRODUCTS' && (
                                        <div className={styles.excludeSection}>
                                            <label className={styles.excludeLabel}>Exclude products (optional):</label>
                                            <div className={styles.multiSelect}>
                                                <input
                                                    type="text"
                                                    value={excludeProductSearch}
                                                    onChange={(e) => setExcludeProductSearch(e.target.value)}
                                                    placeholder="Search to exclude..."
                                                    className={styles.input}
                                                />
                                                {searchingExcludeProducts && <span className={styles.searchHint}>Searching...</span>}
                                                {excludeProductResults.length > 0 && (
                                                    <div className={styles.searchDropdown}>
                                                        {excludeProductResults.map(p => (
                                                            <button
                                                                key={p.id}
                                                                className={styles.searchItem}
                                                                onClick={() => addProductToList(p, 'excludedProductIds')}
                                                                type="button"
                                                            >
                                                                <span className={styles.searchItemName}>{p.name}</span>
                                                                <span className={styles.searchItemMeta}>₹{p.price}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {form.excludedProductIds.length > 0 && (
                                                <div className={styles.chipList}>
                                                    {form.excludedProductIds.map(id => (
                                                        <span key={id} className={`${styles.chip} ${styles.chipExclude}`}>
                                                            {productNameMap[id] || id.slice(-6)}
                                                            <button type="button" onClick={() => removeProductFromList(id, 'excludedProductIds')}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
