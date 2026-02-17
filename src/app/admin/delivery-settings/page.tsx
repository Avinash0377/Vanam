'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SearchIcon, TrashIcon, TruckIcon } from '@/components/Icons';
import styles from './page.module.css';

interface Pincode {
    id: string;
    pincode: string;
    city: string | null;
    state: string | null;
    isActive: boolean;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface DeliveryConfig {
    freeDeliveryEnabled: boolean;
    freeDeliveryMinAmount: number;
    flatDeliveryCharge: number;
    deliveryChargeType: string;
}

export default function DeliverySettingsPage() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'pincodes' | 'config'>('pincodes');

    // ---- Pincode State ----
    const [pincodes, setPincodes] = useState<Pincode[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0, page: 1, limit: 20, totalPages: 0,
    });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newPincode, setNewPincode] = useState('');
    const [newCity, setNewCity] = useState('');
    const [newState, setNewState] = useState('');
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    // ---- Delivery Config State ----
    const [config, setConfig] = useState<DeliveryConfig>({
        freeDeliveryEnabled: true,
        freeDeliveryMinAmount: 999,
        flatDeliveryCharge: 99,
        deliveryChargeType: 'FLAT',
    });
    const [configLoading, setConfigLoading] = useState(false);
    const [configSaving, setConfigSaving] = useState(false);
    const [configMsg, setConfigMsg] = useState('');
    const [configError, setConfigError] = useState('');

    // ==================== PINCODES ====================

    const fetchPincodes = useCallback(async (page = 1, searchQuery = '') => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/pincodes?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setPincodes(data.pincodes);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Fetch pincodes error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPincodes();
    }, [fetchPincodes]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPincodes(1, search);
    };

    const handleAddPincode = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError('');
        setAddSuccess('');

        if (!newPincode || !/^\d{6}$/.test(newPincode.trim())) {
            setAddError('Enter a valid 6-digit pincode');
            return;
        }

        try {
            const res = await fetch('/api/admin/pincodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    pincode: newPincode.trim(),
                    city: newCity.trim() || undefined,
                    state: newState.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAddSuccess(`Pincode ${newPincode} added!`);
                setNewPincode('');
                setNewCity('');
                setNewState('');
                fetchPincodes(1, search);
            } else {
                setAddError(data.error || 'Failed to add');
            }
        } catch {
            setAddError('Network error');
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/pincodes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentActive }),
            });
            if (res.ok) {
                setPincodes(prev =>
                    prev.map(p => p.id === id ? { ...p, isActive: !currentActive } : p)
                );
            }
        } catch (err) {
            console.error('Toggle error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string, pincode: string) => {
        if (!confirm(`Delete pincode ${pincode}? This cannot be undone.`)) return;
        setActionLoading(id);
        try {
            const res = await fetch(`/api/admin/pincodes/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchPincodes(pagination.page, search);
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // ==================== DELIVERY CONFIG ====================

    const fetchConfig = useCallback(async () => {
        if (!token) return;
        setConfigLoading(true);
        try {
            const res = await fetch('/api/admin/delivery-config', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.settings) {
                setConfig({
                    freeDeliveryEnabled: data.settings.freeDeliveryEnabled,
                    freeDeliveryMinAmount: data.settings.freeDeliveryMinAmount,
                    flatDeliveryCharge: data.settings.flatDeliveryCharge,
                    deliveryChargeType: data.settings.deliveryChargeType,
                });
            }
        } catch (err) {
            console.error('Fetch config error:', err);
        } finally {
            setConfigLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (activeTab === 'config') {
            fetchConfig();
        }
    }, [activeTab, fetchConfig]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setConfigSaving(true);
        setConfigMsg('');
        setConfigError('');

        try {
            const res = await fetch('/api/admin/delivery-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (res.ok) {
                setConfigMsg(data.message || 'Settings saved!');
            } else {
                setConfigError(data.error || 'Failed to save');
            }
        } catch {
            setConfigError('Network error');
        } finally {
            setConfigSaving(false);
        }
    };

    // ==================== RENDER ====================

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <TruckIcon size={28} />
                    <div>
                        <h1 className={styles.title}>Delivery Settings</h1>
                        <p className={styles.subtitle}>
                            Manage delivery areas and charges
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'pincodes' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('pincodes')}
                >
                    Serviceable Pincodes
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'config' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    Delivery Charges
                </button>
            </div>

            {/* Tab: Pincodes */}
            {activeTab === 'pincodes' && (
                <>
                    {/* Add Pincode Form */}
                    <div className={styles.addSection}>
                        <h2 className={styles.sectionTitle}>Add New Pincode</h2>
                        <form onSubmit={handleAddPincode} className={styles.addForm}>
                            <input
                                type="text"
                                value={newPincode}
                                onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6-digit pincode"
                                className={styles.input}
                                maxLength={6}
                                required
                            />
                            <input
                                type="text"
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                placeholder="City (optional)"
                                className={styles.input}
                            />
                            <input
                                type="text"
                                value={newState}
                                onChange={(e) => setNewState(e.target.value)}
                                placeholder="State (optional)"
                                className={styles.input}
                            />
                            <button type="submit" className={styles.addBtn}>
                                Add Pincode
                            </button>
                        </form>
                        {addError && <p className={styles.formError}>{addError}</p>}
                        {addSuccess && <p className={styles.formSuccess}>{addSuccess}</p>}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className={styles.searchBar}>
                        <SearchIcon size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by pincode..."
                            className={styles.searchInput}
                        />
                        <button type="submit" className={styles.searchBtn}>Search</button>
                        {search && (
                            <button
                                type="button"
                                className={styles.clearBtn}
                                onClick={() => { setSearch(''); fetchPincodes(1, ''); }}
                            >
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Pincodes Table */}
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading pincodes...</p>
                        </div>
                    ) : pincodes.length === 0 ? (
                        <div className={styles.emptyState}>
                            <TruckIcon size={48} color="#94a3b8" />
                            <h3>No pincodes found</h3>
                            <p>Add your first serviceable pincode above.</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Pincode</th>
                                            <th>City</th>
                                            <th>State</th>
                                            <th>Status</th>
                                            <th>Added</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pincodes.map((p) => (
                                            <tr key={p.id} className={!p.isActive ? styles.inactive : ''}>
                                                <td className={styles.pincodeCell}>
                                                    <code>{p.pincode}</code>
                                                </td>
                                                <td>{p.city || '—'}</td>
                                                <td>{p.state || '—'}</td>
                                                <td>
                                                    <span className={`${styles.badge} ${p.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                                                        {p.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className={styles.dateCell}>
                                                    {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                    })}
                                                </td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <button
                                                            className={`${styles.actionBtn} ${p.isActive ? styles.deactivateBtn : styles.activateBtn}`}
                                                            onClick={() => handleToggleActive(p.id, p.isActive)}
                                                            disabled={actionLoading === p.id}
                                                        >
                                                            {actionLoading === p.id ? '...' : p.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                            onClick={() => handleDelete(p.id, p.pincode)}
                                                            disabled={actionLoading === p.id}
                                                        >
                                                            <TrashIcon size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={pagination.page <= 1}
                                        onClick={() => fetchPincodes(pagination.page - 1, search)}
                                    >
                                        ← Prev
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => fetchPincodes(pagination.page + 1, search)}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Tab: Delivery Config */}
            {activeTab === 'config' && (
                <div className={styles.configSection}>
                    {configLoading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading config...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveConfig} className={styles.configForm}>
                            <div className={styles.configCard}>
                                <h3>Free Delivery</h3>
                                <div className={styles.configRow}>
                                    <label className={styles.toggleLabel}>
                                        <input
                                            type="checkbox"
                                            checked={config.freeDeliveryEnabled}
                                            onChange={(e) => setConfig({ ...config, freeDeliveryEnabled: e.target.checked })}
                                        />
                                        <span className={styles.toggleText}>
                                            Enable free delivery above minimum order
                                        </span>
                                    </label>
                                </div>
                                {config.freeDeliveryEnabled && (
                                    <div className={styles.configRow}>
                                        <label className={styles.configLabel}>
                                            Minimum order for free delivery (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={config.freeDeliveryMinAmount}
                                            onChange={(e) => setConfig({ ...config, freeDeliveryMinAmount: Number(e.target.value) })}
                                            className={styles.configInput}
                                            min="0"
                                        />
                                        <p className={styles.configHint}>
                                            Orders with subtotal ≥ ₹{config.freeDeliveryMinAmount} get free delivery.
                                            Free delivery is based on <strong>original subtotal</strong> (before coupon discounts).
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.configCard}>
                                <h3>Delivery Charge</h3>
                                <div className={styles.configRow}>
                                    <label className={styles.configLabel}>
                                        Flat delivery charge (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.flatDeliveryCharge}
                                        onChange={(e) => setConfig({ ...config, flatDeliveryCharge: Number(e.target.value) })}
                                        className={styles.configInput}
                                        min="0"
                                    />
                                    <p className={styles.configHint}>
                                        Applied when order doesn&apos;t qualify for free delivery.
                                    </p>
                                </div>
                            </div>

                            {configMsg && <div className={styles.formSuccess}>{configMsg}</div>}
                            {configError && <div className={styles.formError}>{configError}</div>}

                            <button type="submit" className={styles.addBtn} disabled={configSaving}>
                                {configSaving ? 'Saving...' : 'Save Delivery Settings'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
