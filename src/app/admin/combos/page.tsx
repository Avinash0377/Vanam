'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    StarIcon,
    EditIcon,
    TrashIcon,
    PackageIcon,
} from '@/components/Icons';
import styles from './page.module.css';

interface Combo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    includes: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured: boolean;
    showOnHome?: boolean;
}

export default function AdminCombosPage() {
    const { token } = useAuth();
    const [combos, setCombos] = useState<Combo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchCombos();
        }
    }, [token]);

    const fetchCombos = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/combos?all=true', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.combos) {
                setCombos(data.combos);
            }
        } catch (error) {
            console.error('Failed to fetch combos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/combos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setCombos(combos.filter(c => c.id !== id));
            } else {
                alert('Failed to delete combo');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete combo');
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock <= 0) return { label: 'Out of Stock', class: styles.stockOut };
        if (stock <= 5) return { label: `Low (${stock})`, class: styles.stockLow };
        return { label: `${stock} in stock`, class: styles.stockIn };
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Combos</h1>
                    <p className={styles.headerDesc}>Manage plant combo bundles</p>
                </div>
                <Link href="/admin/combos/new" className={styles.addBtn}>
                    <PackageIcon size={18} /> Add Combo
                </Link>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Loading combos...</div>
                ) : combos.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No combos found</p>
                        <Link href="/admin/combos/new" className={styles.addBtn}>
                            Create Your First Combo
                        </Link>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Combo</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {combos.map((combo) => {
                                const stockStatus = getStockStatus(combo.stock);
                                return (
                                    <tr key={combo.id}>
                                        <td>
                                            <div className={styles.itemCell}>
                                                <div className={styles.itemImage}>
                                                    {combo.images?.[0] ? (
                                                        <img src={combo.images[0]} alt={combo.name} />
                                                    ) : (
                                                        '📦'
                                                    )}
                                                </div>
                                                <div className={styles.itemName}>
                                                    <span>
                                                        {combo.name}
                                                        {combo.featured && (
                                                            <span className={styles.featuredBadge}>
                                                                <StarIcon size={14} color="#f59e0b" />
                                                            </span>
                                                        )}
                                                        {combo.showOnHome && (
                                                            <span className={styles.featuredBadge} title="Shown on Homepage">🏠</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.priceCell}>
                                                <span className={styles.price}>₹{combo.price}</span>
                                                {combo.comparePrice && (
                                                    <span className={styles.comparePrice}>₹{combo.comparePrice}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.stockBadge} ${stockStatus.class}`}>
                                                {stockStatus.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <Link
                                                    href={`/admin/combos/${combo.id}`}
                                                    className={styles.actionBtn}
                                                    title="Edit"
                                                >
                                                    <EditIcon size={16} />
                                                </Link>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(combo.id, combo.name)}
                                                    title="Delete"
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
