'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

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

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyCoupon);
        setError('');
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
        };
        setForm(formData);
        setError('');
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

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isExpired = (d: string) => new Date(d) < new Date();

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
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Min Order</th>
                                    <th>Usage</th>
                                    <th>Validity</th>
                                    <th>Status</th>
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
