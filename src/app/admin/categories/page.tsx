'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    featured: boolean;
    _count?: { products: number };
}

export default function AdminCategoriesPage() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', image: '', featured: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token) {
            fetchCategories();
        }
    }, [token]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                image: category.image || '',
                featured: category.featured || false,
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', image: '', featured: false });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', image: '', featured: false });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : '/api/admin/categories';

            const res = await fetch(url, {
                method: editingCategory ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                if (editingCategory) {
                    setCategories(categories.map(c =>
                        c.id === editingCategory.id ? { ...c, ...formData } : c
                    ));
                } else {
                    setCategories([...categories, data.category]);
                }
                handleCloseModal();
            } else {
                alert(data.error || 'Failed to save category');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string, productCount: number) => {
        if (productCount > 0) {
            alert(`Cannot delete "${name}" because it has ${productCount} products. Remove the products first.`);
            return;
        }

        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setCategories(categories.filter(c => c.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete category');
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.loading}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>Categories</h1>
                        <p className={styles.headerDesc}>{categories.length} categories</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        + Add Category
                    </button>
                </div>

                {/* Categories Grid */}
                <div className={styles.grid}>
                    {categories.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No categories yet</p>
                            <button onClick={() => handleOpenModal()} className="btn btn-primary">
                                Create Your First Category
                            </button>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <div key={category.id} className={styles.card}>
                                <div className={styles.cardIcon}>
                                    {category.image ? (
                                        <Image src={category.image} alt={category.name} width={48} height={48} className={styles.categoryImage} />
                                    ) : (
                                        <span>📁</span>
                                    )}
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>
                                        {category.name}
                                        {category.featured && <span className={styles.featuredBadge}>⭐</span>}
                                    </h3>
                                    <p className={styles.cardDesc}>{category.description || 'No description'}</p>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.productCount}>
                                            {category._count?.products || 0} products
                                        </span>
                                        <span className={styles.slug}>/{category.slug}</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleOpenModal(category)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(category.id, category.name, category._count?.products || 0)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className={styles.modalOverlay} onClick={handleCloseModal}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                                <button className={styles.closeBtn} onClick={handleCloseModal}>×</button>
                            </div>
                            <form onSubmit={handleSubmit} className={styles.modalForm}>
                                <div className={styles.formGroup}>
                                    <label>Category Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Indoor Plants"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description..."
                                        rows={2}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <div className={styles.formCheckbox}>
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    />
                                    <label htmlFor="featured">Featured Category</label>
                                </div>
                                <div className={styles.modalActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className={styles.saveBtn} disabled={saving}>
                                        {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
