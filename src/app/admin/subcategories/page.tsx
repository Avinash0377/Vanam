'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface Subcategory {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    productType: string;
    matchTags: string[];
    matchField?: string | null;
    displayOrder: number;
    isActive: boolean;
}

const AVAILABLE_TAGS = [
    'Bestseller', 'New Arrival', 'Low Maintenance', 'Air Purifying',
    'Pet Friendly', 'Beginner Friendly', 'Rare Find', 'Fast Growing',
    'Flowering', 'Fragrant', 'Drought Tolerant', 'Sun Loving',
    'Shade Loving', 'Ceramic', 'Handcrafted', 'Premium', 'Gift Ready',
    'Easy Care', 'Hanging', 'Durable', 'Self Watering', 'Decorative',
    'Perfect Gift',
];

const defaultFormData = {
    name: '',
    image: '',
    productType: 'PLANT',
    matchTags: [] as string[],
    matchField: '',
    displayOrder: '0',
    isActive: true,
};

export default function AdminSubcategoriesPage() {
    const { token } = useAuth();
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PLANT' | 'POT'>('PLANT');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [formData, setFormData] = useState(defaultFormData);
    const [saving, setSaving] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (token) fetchSubcategories();
    }, [token]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen]);

    const fetchSubcategories = async () => {
        try {
            const res = await fetch('/api/admin/subcategories', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setSubcategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch subcategories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (subcategory?: Subcategory) => {
        if (subcategory) {
            setEditingSubcategory(subcategory);
            setFormData({
                name: subcategory.name,
                image: subcategory.image || '',
                productType: subcategory.productType,
                matchTags: subcategory.matchTags || [],
                matchField: subcategory.matchField || '',
                displayOrder: String(subcategory.displayOrder),
                isActive: subcategory.isActive,
            });
        } else {
            setEditingSubcategory(null);
            setFormData({ ...defaultFormData, productType: activeTab });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSubcategory(null);
        setFormData(defaultFormData);
        setCustomTagInput('');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'vanam-store/subcategories');

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formDataUpload,
            });

            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(prev => ({ ...prev, image: data.url }));
            } else {
                alert(data.error || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a subcategory name');
            return;
        }
        setSaving(true);

        try {
            const url = editingSubcategory
                ? `/api/admin/subcategories/${editingSubcategory.id}`
                : '/api/admin/subcategories';

            const res = await fetch(url, {
                method: editingSubcategory ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    displayOrder: parseInt(formData.displayOrder) || 0,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                // Refresh list
                await fetchSubcategories();
                handleCloseModal();
            } else {
                alert(data.error || 'Failed to save subcategory');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save subcategory');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/subcategories/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setSubcategories(subcategories.filter(s => s.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete subcategory');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete subcategory');
        }
    };

    const handleToggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            matchTags: prev.matchTags.includes(tag)
                ? prev.matchTags.filter(t => t !== tag)
                : [...prev.matchTags, tag],
        }));
    };

    const handleAddCustomTag = () => {
        const tag = customTagInput.trim();
        if (tag && !formData.matchTags.includes(tag)) {
            setFormData(prev => ({ ...prev, matchTags: [...prev.matchTags, tag] }));
        }
        setCustomTagInput('');
    };

    const filteredSubcategories = subcategories.filter(s => s.productType === activeTab);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Loading subcategories...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Subcategories</h1>
                    <p className={styles.headerDesc}>
                        Manage the bubble filter rows on Plants & Pots pages
                    </p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    + Add Subcategory
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'PLANT' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('PLANT')}
                >
                    🌱 Plants ({subcategories.filter(s => s.productType === 'PLANT').length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'POT' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('POT')}
                >
                    🪴 Pots ({subcategories.filter(s => s.productType === 'POT').length})
                </button>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {filteredSubcategories.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No {activeTab === 'PLANT' ? 'plant' : 'pot'} subcategories yet</p>
                        <button onClick={() => handleOpenModal()} className="btn btn-primary">
                            Create Your First Subcategory
                        </button>
                    </div>
                ) : (
                    filteredSubcategories.map((sub) => (
                        <div key={sub.id} className={`${styles.card} ${!sub.isActive ? styles.cardInactive : ''}`}>
                            <div className={`${styles.cardImage} ${sub.productType === 'PLANT' ? styles.imagePlant : styles.imagePot}`}>
                                {sub.image ? (
                                    <img src={sub.image} alt={sub.name} />
                                ) : (
                                    <span className={styles.cardImagePlaceholder}>
                                        {sub.productType === 'PLANT' ? '🌱' : '🪴'}
                                    </span>
                                )}
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>
                                    {sub.name}
                                    <span className={`${styles.cardType} ${sub.productType === 'PLANT' ? styles.typePlant : styles.typePot}`}>
                                        {sub.productType}
                                    </span>
                                </h3>
                                <div className={styles.cardMeta}>
                                    <span className={styles.orderBadge}>Order: {sub.displayOrder}</span>
                                    {!sub.isActive && <span className={styles.inactiveBadge}>Inactive</span>}
                                    {sub.matchField && <span className={styles.matchFieldBadge}>{sub.matchField}</span>}
                                </div>
                                {sub.matchTags.length > 0 && (
                                    <div className={styles.tagList}>
                                        {sub.matchTags.map(tag => (
                                            <span key={tag} className={styles.tagPill}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.cardActions}>
                                    <button className={styles.editBtn} onClick={() => handleOpenModal(sub)}>
                                        Edit
                                    </button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(sub.id, sub.name)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && typeof document !== 'undefined' && createPortal(
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingSubcategory ? 'Edit Subcategory' : 'New Subcategory'}</h2>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            {/* Name */}
                            <div className={styles.formGroup}>
                                <label>Subcategory Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Air Purifying, Ceramic Pots"
                                    required
                                />
                            </div>

                            {/* Product Type + Display Order */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Product Type *</label>
                                    <select
                                        value={formData.productType}
                                        onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                    >
                                        <option value="PLANT">🌱 Plant</option>
                                        <option value="POT">🪴 Pot</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                        min="0"
                                    />
                                    <p className={styles.formHint}>Lower numbers appear first</p>
                                </div>
                            </div>

                            {/* Image */}
                            <div className={styles.formGroup}>
                                <label>Bubble Image</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="Image URL or upload below"
                                />
                                <div className={styles.imagePreview}>
                                    {formData.image && (
                                        <div className={styles.imagePreviewThumb}>
                                            <img src={formData.image} alt="Preview" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                        id="subcategory-image-upload"
                                    />
                                    <label htmlFor="subcategory-image-upload" className={styles.imageUploadBtn}>
                                        {uploading ? 'Uploading...' : '📷 Upload Image'}
                                    </label>
                                </div>
                            </div>

                            {/* Match Tags */}
                            <div className={styles.formGroup}>
                                <label>Match Tags</label>
                                <p className={styles.formHint}>
                                    Products with any of these tags will appear in this subcategory
                                </p>
                                <div className={styles.tagChips}>
                                    {Array.from(new Set([...AVAILABLE_TAGS, ...formData.matchTags])).map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`${styles.tagChip} ${formData.matchTags.includes(tag) ? styles.tagChipActive : ''}`}
                                            onClick={() => handleToggleTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className={styles.customTagRow}>
                                    <input
                                        type="text"
                                        className={styles.customTagInput}
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        placeholder="Add custom tag..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCustomTag();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.addTagBtn}
                                        disabled={!customTagInput.trim()}
                                        onClick={handleAddCustomTag}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Match Field */}
                            <div className={styles.formGroup}>
                                <label>Match Field (Optional)</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {[
                                        { label: 'Indoor', value: 'suitableFor:INDOOR' },
                                        { label: 'Outdoor', value: 'suitableFor:OUTDOOR' },
                                        { label: 'Both', value: 'suitableFor:BOTH' },
                                        { label: 'Size: Small', value: 'size:SMALL' },
                                        { label: 'Size: Medium', value: 'size:MEDIUM' },
                                        { label: 'Size: Big', value: 'size:BIG' },
                                        { label: 'Ceramic', value: 'material:Ceramic' },
                                        { label: 'Terracotta', value: 'material:Terracotta' },
                                        { label: 'Plastic', value: 'material:Plastic' },
                                        { label: 'Metal', value: 'material:Metal' },
                                        { label: 'Cement', value: 'material:Cement' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, matchField: opt.value })}
                                            className={`${styles.tagChip} ${formData.matchField === opt.value ? styles.tagChipActive : ''}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                    {formData.matchField && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, matchField: '' })}
                                            className={styles.tagChip}
                                            style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={formData.matchField}
                                    onChange={(e) => setFormData({ ...formData, matchField: e.target.value })}
                                    placeholder="e.g., suitableFor:INDOOR or material:ceramic"
                                />
                                <p className={styles.formHint}>
                                    Click a quick option above, or write custom fieldName:value
                                </p>
                            </div>

                            {/* Active toggle */}
                            <div className={styles.formCheckbox}>
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive">Active (visible on storefront)</label>
                            </div>

                            {/* Actions */}
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    {saving ? 'Saving...' : editingSubcategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
