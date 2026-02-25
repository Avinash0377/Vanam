'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon, UploadIcon } from '@/components/Icons';
import styles from '../page.module.css';

export default function EditComboPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { token } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        includes: '',
        price: '',
        comparePrice: '',
        stock: '0',
        featured: false,
        showOnHome: false,
        displayOrder: '0',
    });
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCombo();
    }, [id]);

    const fetchCombo = async () => {
        try {
            const res = await fetch(`/api/combos/${id}`);
            const data = await res.json();

            if (data.combo) {
                const combo = data.combo;
                // Convert includes array from DB back to plain comma-separated string
                const includesStr = Array.isArray(combo.includes)
                    ? combo.includes.map((item: { name?: string } | string) =>
                        typeof item === 'string' ? item : item?.name || ''
                    ).filter(Boolean).join(', ')
                    : (combo.includes || '');
                setFormData({
                    name: combo.name || '',
                    description: combo.description || '',
                    includes: includesStr,
                    price: combo.price?.toString() || '',
                    comparePrice: combo.comparePrice?.toString() || '',
                    stock: combo.stock?.toString() || '0',
                    featured: combo.featured || false,
                    showOnHome: combo.showOnHome || false,
                    displayOrder: (combo.displayOrder || 0).toString(),
                });
                setImageUrl(combo.images?.[0] || '');
            }
        } catch (err) {
            setError('Failed to load combo');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.url) {
                setImageUrl(data.url);
            } else {
                setError('Failed to upload image');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.includes || !formData.price) {
            setError('Name, Includes, and Price are required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/combos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
                    stock: parseInt(formData.stock) || 0,
                    images: imageUrl ? [imageUrl] : [],
                }),
            });

            if (res.ok) {
                router.push('/admin/combos');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update combo');
            }
        } catch (err) {
            setError('Failed to update combo');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.formPage}>
                <div className={styles.formCard}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.formPage}>
            <Link href="/admin/combos" className={styles.backLink}>
                <ArrowLeftIcon size={18} /> Back to Combos
            </Link>

            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Edit Combo</h2>

                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Combo Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={styles.formInput}
                            placeholder="e.g., Indoor Starter Combo"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className={styles.formTextarea}
                            placeholder="Describe this combo..."
                        />
                    </div>

                    {/* What's Included */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>What&apos;s Included *</label>
                        <textarea
                            name="includes"
                            value={formData.includes}
                            onChange={handleChange}
                            className={styles.formTextarea}
                            placeholder="e.g., Money Plant x2, Ceramic Pot x1, Fertilizer"
                            required
                        />
                    </div>

                    {/* Cover Image */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Cover Image</label>
                        <div className={styles.imageUpload}>
                            <div className={`${styles.imagePreview} ${imageUrl ? styles.hasImage : ''}`}>
                                {imageUrl ? (
                                    <Image src={imageUrl} alt="Preview" width={120} height={120} style={{ objectFit: 'contain' }} />
                                ) : (
                                    <UploadIcon size={32} color="#a3a3a3" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className={styles.uploadInput}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={styles.uploadBtn}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Change Image'}
                            </button>
                        </div>
                    </div>

                    {/* Price Row */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Price (₹) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className={styles.formInput}
                                placeholder="499"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Compare Price (₹)</label>
                            <input
                                type="number"
                                name="comparePrice"
                                value={formData.comparePrice}
                                onChange={handleChange}
                                className={styles.formInput}
                                placeholder="699"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Stock</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            className={styles.formInput}
                            placeholder="10"
                            min="0"
                        />
                    </div>

                    {/* Featured & Homepage */}
                    <div className={styles.formGroup}>
                        <label className={styles.formCheck}>
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleChange}
                            />
                            <span>⭐ Best Seller</span>
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formCheck}>
                            <input
                                type="checkbox"
                                name="showOnHome"
                                checked={formData.showOnHome}
                                onChange={handleChange}
                            />
                            <span>🏠 Show on Homepage</span>
                        </label>
                    </div>
                    {formData.showOnHome && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Display Order</label>
                            <input
                                type="number"
                                name="displayOrder"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                className={styles.formInput}
                                min="0"
                                style={{ width: '100px' }}
                            />
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}

                    {/* Actions */}
                    <div className={styles.formActions}>
                        <button type="submit" className={styles.submitBtn} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link href="/admin/combos" className={styles.cancelBtn}>
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
