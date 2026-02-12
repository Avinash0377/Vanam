'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../../new/page.module.css'; // Reusing styles
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    careInstructions?: string;
    productType: string;
    size?: string;
    suitableFor?: string;
    price: number;
    comparePrice?: number;
    stock: number;
    categoryId?: string;
    featured: boolean;
    status: string;
    images: string[];
    sizeVariants?: Array<{
        size: string;
        price: string;
        stock: string;
        colors: Array<{
            name: string;
            hex: string;
            images: string[];
        }>;
    }>;
    preferredLocations?: string[];
}

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [initialData, setInitialData] = useState<ProductFormData | undefined>(undefined);

    useEffect(() => {
        if (token && id) {
            fetchProduct();
            fetchCategories();
        }
    }, [token, id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const product: Product = await res.json();
            if (res.ok) {
                setInitialData({
                    name: product.name,
                    description: product.description || '',
                    careInstructions: product.careInstructions || '',
                    productType: product.productType,
                    size: product.size || 'MEDIUM',
                    suitableFor: product.suitableFor || 'INDOOR',
                    price: product.price.toString(),
                    comparePrice: product.comparePrice?.toString() || '',
                    stock: product.stock.toString(),
                    categoryId: product.categoryId || '',
                    featured: product.featured,
                    status: product.status,
                    images: product.images || [],
                    sizeVariants: product.sizeVariants || [],
                    preferredLocations: product.preferredLocations || [],
                });
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

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
        }
    };

    const handleSubmit = async (formData: ProductFormData) => {
        setSaving(true);

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                router.push('/admin/products');
            } else {
                alert(data.error || 'Failed to update product');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <div className={styles.loading}>Loading product...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <Link href="/admin">Admin</Link>
                        <span>/</span>
                        <Link href="/admin/products">Products</Link>
                        <span>/</span>
                        <span>Edit Product</span>
                    </div>
                    <h1>Edit Product</h1>
                </div>

                <ProductForm
                    initialData={initialData}
                    categories={categories}
                    onSubmit={handleSubmit}
                    loading={saving}
                    isEdit={true}
                    token={token}
                />
            </div>
        </div>
    );
}
