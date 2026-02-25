'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
    StarIcon,
    EditIcon,
    TrashIcon,
    GiftIcon,
    GiftPlantIcon,
    RefreshIcon
} from '@/components/Icons';
import styles from '../combos/page.module.css';

interface Hamper {
    id: string;
    name: string;
    slug: string;
    description?: string;
    includes: string;
    giftWrap: boolean;
    messageCard: boolean;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured: boolean;
    showOnHome?: boolean;
}

export default function AdminGiftHampersPage() {
    const { token } = useAuth();
    const [hampers, setHampers] = useState<Hamper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchHampers();
        }
    }, [token]);

    const fetchHampers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/hampers?all=true', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data.hampers) {
                setHampers(data.hampers);
            }
        } catch (err) {
            console.error('Failed to fetch hampers:', err);
            setError('Failed to load gift hampers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/hampers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setHampers(hampers.filter(h => h.id !== id));
            } else {
                alert('Failed to delete gift hamper');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete gift hamper');
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
                    <h1>Gift Hampers</h1>
                    <p className={styles.headerDesc}>Manage gift hamper offerings</p>
                </div>
                <Link href="/admin/gift-hampers/new" className={styles.addBtn}>
                    <GiftIcon size={18} /> Add Gift Hamper
                </Link>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loading}>Loading gift hampers...</div>
                ) : error ? (
                    <div className={styles.loading}>
                        <p>{error}</p>
                        <button onClick={fetchHampers} style={{
                            padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
                            color: 'white', background: 'var(--primary-600)', border: 'none',
                            borderRadius: '10px', cursor: 'pointer', marginTop: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                        }}>
                            <RefreshIcon size={16} /> Try Again
                        </button>
                    </div>
                ) : hampers.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No gift hampers found</p>
                        <Link href="/admin/gift-hampers/new" className={styles.addBtn}>
                            Create Your First Gift Hamper
                        </Link>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Gift Hamper</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hampers.map((hamper) => {
                                const stockStatus = getStockStatus(hamper.stock);
                                return (
                                    <tr key={hamper.id}>
                                        <td>
                                            <div className={styles.itemCell}>
                                                <div className={styles.itemImage}>
                                                    {hamper.images?.[0] ? (
                                                        <Image src={hamper.images[0]} alt={hamper.name} width={48} height={48} className={styles.itemImg} />
                                                    ) : (
                                                        <GiftPlantIcon size={24} color="#9ca3af" />
                                                    )}
                                                </div>
                                                <div className={styles.itemName}>
                                                    <span>
                                                        {hamper.name}
                                                        {hamper.featured && (
                                                            <span className={styles.featuredBadge}>
                                                                <StarIcon size={14} color="#f59e0b" />
                                                            </span>
                                                        )}
                                                        {hamper.showOnHome && (
                                                            <span className={styles.featuredBadge} title="Shown on Homepage">🏠</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.priceCell}>
                                                <span className={styles.price}>₹{hamper.price}</span>
                                                {hamper.comparePrice && (
                                                    <span className={styles.comparePrice}>₹{hamper.comparePrice}</span>
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
                                                    href={`/admin/gift-hampers/${hamper.id}`}
                                                    className={styles.actionBtn}
                                                    title="Edit"
                                                >
                                                    <EditIcon size={16} />
                                                </Link>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(hamper.id, hamper.name)}
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
