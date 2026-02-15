'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css'; // Keep page layout styles
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

interface Category {
    id: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Get pre-filled values from URL params
    const typeParam = searchParams.get('type') || 'PLANT';
    const suitableParam = searchParams.get('suitable') || 'INDOOR';

    // Create initial data based on URL params
    const initialData: ProductFormData = {
        name: '',
        description: '',
        careInstructions: '',
        productType: typeParam,
        size: 'MEDIUM',
        suitableFor: suitableParam,
        price: '',
        comparePrice: '',
        stock: '',
        categoryId: '',
        featured: false,
        status: 'ACTIVE',
        images: [],
        sizeVariants: [],
        tags: [],
        showOnHome: false,
        displayOrder: '0',
    };

    // Get title based on product type
    const getPageTitle = () => {
        return 'Add New Product';
    };

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
        }
    };

    const handleSubmit = async (formData: ProductFormData) => {
        setLoading(true);

        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
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
                alert(data.error || 'Failed to create product');
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('Failed to create product');
        } finally {
            setLoading(false);
        }
    };

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
                        <span>New Product</span>
                    </div>
                    <h1>{getPageTitle()}</h1>
                </div>

                <ProductForm
                    initialData={initialData}
                    categories={categories}
                    onSubmit={handleSubmit}
                    loading={loading}
                    token={token}
                />
            </div>
        </div>
    );
}
