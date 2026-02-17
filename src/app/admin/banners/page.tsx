'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    highlightText: string | null;
    accentBadge: string | null;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string | null;
    secondaryBtnLink: string | null;
    bgGradient: string;
    imageUrl: string | null;
    textColor: string;
    isActive: boolean;
    displayOrder: number;
}

const GRADIENT_PRESETS = [
    { label: 'Nature Green', value: 'linear-gradient(165deg, #0d3320 0%, #1a5035 50%, #22804a 100%)' },
    { label: 'Warm Amber', value: 'linear-gradient(165deg, #78350f 0%, #92400e 50%, #b45309 100%)' },
    { label: 'Soft Purple', value: 'linear-gradient(165deg, #312e81 0%, #4338ca 50%, #6366f1 100%)' },
    { label: 'Ocean Blue', value: 'linear-gradient(165deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)' },
    { label: 'Sunset Rose', value: 'linear-gradient(165deg, #831843 0%, #be185d 50%, #e11d48 100%)' },
    { label: 'Rich Black', value: 'linear-gradient(165deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)' },
];

const emptyForm = {
    title: '',
    subtitle: '',
    highlightText: '',
    accentBadge: '',
    primaryBtnText: '',
    primaryBtnLink: '',
    secondaryBtnText: '',
    secondaryBtnLink: '',
    bgGradient: GRADIENT_PRESETS[0].value,
    imageUrl: '',
    textColor: '#ffffff',
    isActive: true,
    displayOrder: 0,
};

export default function AdminBannersPage() {
    const { token } = useAuth();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token) fetchBanners();
    }, [token]);

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/admin/banners', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setBanners(data.banners || []);
        } catch {
            console.error('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
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

            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({ ...prev, imageUrl: data.url }));
                setMessage('Image uploaded!');
            } else {
                setMessage('Failed to upload image');
            }
        } catch {
            setMessage('Upload error');
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.primaryBtnText || !form.primaryBtnLink) {
            setMessage('Title, button text, and link are required');
            return;
        }

        setSaving(true);
        try {
            const url = editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setMessage(editingId ? 'Banner updated!' : 'Banner created!');
                setForm(emptyForm);
                setEditingId(null);
                setShowForm(false);
                fetchBanners();
            } else {
                const data = await res.json();
                setMessage(data.error || 'Failed to save');
            }
        } catch {
            setMessage('Network error');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEdit = (banner: Banner) => {
        setForm({
            title: banner.title,
            subtitle: banner.subtitle || '',
            highlightText: banner.highlightText || '',
            accentBadge: banner.accentBadge || '',
            primaryBtnText: banner.primaryBtnText,
            primaryBtnLink: banner.primaryBtnLink,
            secondaryBtnText: banner.secondaryBtnText || '',
            secondaryBtnLink: banner.secondaryBtnLink || '',
            bgGradient: banner.bgGradient,
            imageUrl: banner.imageUrl || '',
            textColor: banner.textColor || '#ffffff',
            isActive: banner.isActive,
            displayOrder: banner.displayOrder,
        });
        setEditingId(banner.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this banner?')) return;
        try {
            await fetch(`/api/admin/banners/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchBanners();
            setMessage('Banner deleted');
            setTimeout(() => setMessage(''), 3000);
        } catch {
            setMessage('Failed to delete');
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            await fetch(`/api/admin/banners/${banner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: !banner.isActive }),
            });
            fetchBanners();
        } catch {
            setMessage('Failed to toggle');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading banners...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Homepage Banners</h1>
                    <p className={styles.subtitle}>Manage full-screen sliding banners on the mobile homepage.</p>
                </div>
                <button
                    className={styles.addBtn}
                    onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
                >
                    + Add Banner
                </button>
            </div>

            {message && <div className={styles.message}>{message}</div>}

            {/* Banner Form */}
            {showForm && (
                <div className={styles.formCard}>
                    <h2 className={styles.formTitle}>{editingId ? 'Edit Banner' : 'Create New Banner'}</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Flat 20% Off on All"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Highlight Text</label>
                                <input
                                    type="text"
                                    value={form.highlightText}
                                    onChange={e => setForm({ ...form, highlightText: e.target.value })}
                                    placeholder="e.g. Combos (colored differently)"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Subtitle</label>
                                <input
                                    type="text"
                                    value={form.subtitle}
                                    onChange={e => setForm({ ...form, subtitle: e.target.value })}
                                    placeholder="e.g. Premium plant combos at unbeatable prices"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Accent Badge</label>
                                <input
                                    type="text"
                                    value={form.accentBadge}
                                    onChange={e => setForm({ ...form, accentBadge: e.target.value })}
                                    placeholder="e.g. 🔥 LIMITED OFFER"
                                />
                            </div>
                        </div>

                        <div className={styles.formDivider}>CTA Buttons</div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Primary Button Text *</label>
                                <input
                                    type="text"
                                    value={form.primaryBtnText}
                                    onChange={e => setForm({ ...form, primaryBtnText: e.target.value })}
                                    placeholder="e.g. Shop Combos"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Primary Button Link *</label>
                                <input
                                    type="text"
                                    value={form.primaryBtnLink}
                                    onChange={e => setForm({ ...form, primaryBtnLink: e.target.value })}
                                    placeholder="e.g. /combos"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Secondary Button Text</label>
                                <input
                                    type="text"
                                    value={form.secondaryBtnText}
                                    onChange={e => setForm({ ...form, secondaryBtnText: e.target.value })}
                                    placeholder="e.g. View All Plants"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Secondary Button Link</label>
                                <input
                                    type="text"
                                    value={form.secondaryBtnLink}
                                    onChange={e => setForm({ ...form, secondaryBtnLink: e.target.value })}
                                    placeholder="e.g. /plants"
                                />
                            </div>
                        </div>

                        <div className={styles.formDivider}>Background</div>

                        {/* Image Upload */}
                        <div className={styles.formGroup}>
                            <label>Banner Image (optional — overrides gradient)</label>
                            <div className={styles.imageUploadArea}>
                                {form.imageUrl ? (
                                    <div className={styles.imagePreviewBox}>
                                        <img src={form.imageUrl} alt="Banner" className={styles.imagePreview} />
                                        <button
                                            type="button"
                                            className={styles.removeImageBtn}
                                            onClick={() => setForm({ ...form, imageUrl: '' })}
                                        >
                                            ✕ Remove
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.uploadBtn}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : '📷 Upload Image'}
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Gradient (used if no image) */}
                        <div className={styles.formGroup}>
                            <label>Background Color {form.imageUrl ? '(image is set — gradient hidden)' : ''}</label>
                            <div className={styles.gradientPicker}>
                                {GRADIENT_PRESETS.map(g => (
                                    <button
                                        type="button"
                                        key={g.label}
                                        className={`${styles.gradientSwatch} ${form.bgGradient === g.value ? styles.gradientSwatchActive : ''}`}
                                        style={{ background: g.value }}
                                        onClick={() => setForm({ ...form, bgGradient: g.value })}
                                        title={g.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Text Color */}
                        <div className={styles.formGroup}>
                            <label>Text Color</label>
                            <div className={styles.textColorRow}>
                                <button type="button" className={`${styles.colorOption} ${form.textColor === '#ffffff' ? styles.colorOptionActive : ''}`} style={{ background: '#ffffff', color: '#000' }} onClick={() => setForm({ ...form, textColor: '#ffffff' })}>White</button>
                                <button type="button" className={`${styles.colorOption} ${form.textColor === '#000000' ? styles.colorOptionActive : ''}`} style={{ background: '#000000', color: '#fff' }} onClick={() => setForm({ ...form, textColor: '#000000' })}>Black</button>
                                <button type="button" className={`${styles.colorOption} ${form.textColor === '#0f1f15' ? styles.colorOptionActive : ''}`} style={{ background: '#0f1f15', color: '#fff' }} onClick={() => setForm({ ...form, textColor: '#0f1f15' })}>Dark</button>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    value={form.displayOrder}
                                    onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                    />
                                    Active (visible on homepage)
                                </label>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className={styles.formDivider}>Preview</div>
                        <div
                            className={styles.previewBanner}
                            style={{
                                background: form.imageUrl ? '#111' : form.bgGradient,
                                backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className={styles.previewOverlay} />
                            <div className={styles.previewContent}>
                                {form.accentBadge && (
                                    <span className={styles.previewBadge}>{form.accentBadge}</span>
                                )}
                                <h3 className={styles.previewTitle} style={{ color: form.textColor }}>
                                    {form.title || 'Banner Title'}
                                    {form.highlightText && (
                                        <span className={styles.previewHighlight}> {form.highlightText}</span>
                                    )}
                                </h3>
                                {form.subtitle && (
                                    <p className={styles.previewSubtitle}>{form.subtitle}</p>
                                )}
                                <div className={styles.previewBtns}>
                                    <span className={styles.previewPrimaryBtn}>{form.primaryBtnText || 'Button'} →</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button type="submit" className={styles.saveBtn} disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
                            </button>
                            <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingId(null); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banner List */}
            <div className={styles.list}>
                {banners.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No banners yet. Create your first banner to start the homepage slider!</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className={`${styles.card} ${!banner.isActive ? styles.cardInactive : ''}`}>
                            <div
                                className={styles.cardPreview}
                                style={{
                                    background: banner.imageUrl ? '#111' : banner.bgGradient,
                                    backgroundImage: banner.imageUrl ? `url(${banner.imageUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.cardTitle}>
                                            {banner.title}
                                            {banner.highlightText && <span className={styles.cardHighlight}> {banner.highlightText}</span>}
                                        </h3>
                                        {banner.subtitle && <p className={styles.cardSubtitle}>{banner.subtitle}</p>}
                                    </div>
                                    <span className={`${styles.statusBadge} ${banner.isActive ? styles.statusActive : styles.statusInactive}`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span>🔗 {banner.primaryBtnLink}</span>
                                    <span>📊 Order: {banner.displayOrder}</span>
                                    {banner.imageUrl && <span>🖼️ Image</span>}
                                </div>
                                <div className={styles.cardActions}>
                                    <button className={styles.editBtn} onClick={() => handleEdit(banner)}>Edit</button>
                                    <button className={styles.toggleBtn} onClick={() => toggleActive(banner)}>
                                        {banner.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(banner.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
