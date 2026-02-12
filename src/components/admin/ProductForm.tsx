'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ProductForm.module.css';

interface Category {
    id: string;
    name: string;
}

interface VariantColor {
    name: string;
    hex: string;
    images: string[];  // Array of images for this color
}

interface SizeVariant {
    size: string;
    price: string;
    stock: string;
    colors: VariantColor[];
}

export interface ProductFormData {
    name: string;
    description: string;
    careInstructions: string;
    productType: string;
    suitableFor: string;
    categoryId: string;
    featured: boolean;
    status: string;
    images: string[];
    sizeVariants: SizeVariant[];
    preferredLocations: string[];
    // Legacy fields (for backward compatibility)
    price: string;
    comparePrice: string;
    stock: string;
    size: string;
}

interface ProductFormProps {
    initialData?: ProductFormData;
    categories: Category[];
    onSubmit: (data: ProductFormData) => Promise<void>;
    loading: boolean;
    isEdit?: boolean;
    token?: string | null;
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL'];
const PREDEFINED_LOCATIONS = [
    'Hyderabad',
    'Bangalore',
    'Chennai',
    'Mumbai',
    'Delhi',
    'Pune',
    'Kolkata',
];

const defaultFormData: ProductFormData = {
    name: '',
    description: '',
    careInstructions: '',
    productType: 'PLANT',
    suitableFor: 'INDOOR',
    categoryId: '',
    featured: false,
    status: 'ACTIVE',
    images: [],
    sizeVariants: [],
    preferredLocations: [],
    price: '',
    comparePrice: '',
    stock: '',
    size: 'MEDIUM',
};

export default function ProductForm({ initialData, categories, onSubmit, loading, isEdit = false, token }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [newLocation, setNewLocation] = useState('');
    const [colorInputs, setColorInputs] = useState<{ [size: string]: { name: string; hex: string; file?: File | null } }>({});
    const [colorImageUploading, setColorImageUploading] = useState<{ [key: string]: boolean }>({});
    const [addingColor, setAddingColor] = useState<{ [size: string]: boolean }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultFormData,
                ...initialData,
                sizeVariants: initialData.sizeVariants || [],
                preferredLocations: initialData.preferredLocations || [],
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    // SIZE VARIANTS HANDLERS
    const handleSizeToggle = (size: string) => {
        setFormData(prev => {
            const exists = prev.sizeVariants.find(v => v.size === size);
            if (exists) {
                return {
                    ...prev,
                    sizeVariants: prev.sizeVariants.filter(v => v.size !== size)
                };
            } else {
                return {
                    ...prev,
                    sizeVariants: [...prev.sizeVariants, { size, price: '', stock: '', colors: [] }]
                };
            }
        });
    };

    const handleVariantChange = (size: string, field: 'price' | 'stock', value: string) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size ? { ...v, [field]: value } : v
            )
        }));
    };

    // PER-SIZE COLOR HANDLERS
    const handleColorInputChange = (size: string, field: 'name' | 'hex', value: string) => {
        setColorInputs(prev => {
            const current = prev[size] || { name: '', hex: '#4CAF50', file: null };
            return {
                ...prev,
                [size]: { ...current, [field]: value }
            };
        });
    };

    const handleColorFileChange = (size: string, file: File | null) => {
        setColorInputs(prev => {
            const current = prev[size] || { name: '', hex: '#4CAF50', file: null };
            return {
                ...prev,
                [size]: { ...current, file }
            };
        });
    };

    const handleAddColorToSize = async (size: string) => {
        const colorInput = colorInputs[size];

        if (!colorInput?.name?.trim()) {
            setUploadError(`Please enter a color name for size ${size}`);
            return;
        }
        if (!colorInput?.hex?.trim()) {
            setUploadError(`Please select a color for size ${size}`);
            return;
        }

        setAddingColor(prev => ({ ...prev, [size]: true }));
        setUploadError(null);

        let imageUrl: string | undefined;

        // Upload image if file is selected
        if (colorInput.file) {
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', colorInput.file);
                formDataUpload.append('folder', 'vanam-store/products/colors');

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataUpload,
                });

                const data = await res.json();
                if (res.ok && data.url) {
                    imageUrl = data.url;
                } else {
                    setUploadError(data.error || 'Failed to upload color image');
                    setAddingColor(prev => ({ ...prev, [size]: false }));
                    return;
                }
            } catch (error) {
                console.error('Color image upload error:', error);
                setUploadError('Failed to upload image.');
                setAddingColor(prev => ({ ...prev, [size]: false }));
                return;
            }
        }

        const newColor: VariantColor = {
            name: colorInput.name.trim(),
            hex: colorInput.hex.startsWith('#') ? colorInput.hex : `#${colorInput.hex}`,
            images: imageUrl ? [imageUrl] : []
        };

        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? { ...v, colors: [...v.colors, newColor] }
                    : v
            )
        }));

        // Clear input
        setColorInputs(prev => ({
            ...prev,
            [size]: { name: '', hex: '#4CAF50', file: null }
        }));
        setAddingColor(prev => ({ ...prev, [size]: false }));
    };

    const handleRemoveColorFromSize = (size: string, colorIndex: number) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? { ...v, colors: v.colors.filter((_, i) => i !== colorIndex) }
                    : v
            )
        }));
    };

    // UPLOAD IMAGE FOR A SPECIFIC COLOR
    const handleColorImageUpload = async (size: string, colorIndex: number, file: File) => {
        const key = `${size}-${colorIndex}`;
        setColorImageUploading(prev => ({ ...prev, [key]: true }));

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'vanam-store/products/colors');

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataUpload,
            });

            const data = await res.json();

            if (res.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    sizeVariants: prev.sizeVariants.map(v =>
                        v.size === size
                            ? {
                                ...v,
                                colors: v.colors.map((c, i) =>
                                    i === colorIndex ? { ...c, image: data.url } : c
                                )
                            }
                            : v
                    )
                }));
            } else {
                setUploadError(data.error || 'Failed to upload color image');
            }
        } catch (error) {
            console.error('Color image upload error:', error);
            setUploadError('Failed to upload color image. Please try again.');
        }

        setColorImageUploading(prev => ({ ...prev, [key]: false }));
    };

    // LOCATIONS HANDLERS
    const handleAddLocation = (location: string) => {
        if (location && !formData.preferredLocations.includes(location)) {
            setFormData(prev => ({
                ...prev,
                preferredLocations: [...prev.preferredLocations, location]
            }));
        }
        setNewLocation('');
    };

    const handleRemoveLocation = (location: string) => {
        setFormData(prev => ({
            ...prev,
            preferredLocations: prev.preferredLocations.filter(l => l !== location)
        }));
    };

    // FILE UPLOAD
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadError(null);

        for (const file of Array.from(files)) {
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                formDataUpload.append('folder', 'vanam-store/products');

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataUpload,
                });

                const data = await res.json();

                if (res.ok && data.url) {
                    setFormData(prev => ({
                        ...prev,
                        images: [...prev.images, data.url]
                    }));
                } else {
                    setUploadError(data.error || 'Failed to upload image');
                }
            } catch (error) {
                console.error('Upload error:', error);
                setUploadError('Failed to upload image. Please try again.');
            }
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate base price and stock from variants if they exist
        const dataToSubmit = { ...formData };
        if (formData.sizeVariants.length > 0) {
            const prices = formData.sizeVariants.map(v => parseFloat(v.price) || 0);
            const stocks = formData.sizeVariants.map(v => parseInt(v.stock) || 0);
            dataToSubmit.price = Math.min(...prices).toString();
            dataToSubmit.stock = stocks.reduce((a, b) => a + b, 0).toString();
        }

        onSubmit(dataToSubmit);
    };

    const selectedSizes = formData.sizeVariants.map(v => v.size);

    // Get dynamic heading text based on product type
    const getProductTypeLabel = () => {
        switch (formData.productType) {
            case 'PLANT': return 'Plant';
            case 'POT': return 'Pot';
            case 'PLANTER': return 'Planter';
            case 'ACCESSORY': return 'Accessory';
            case 'SEED': return 'Seed';
            default: return 'Product';
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Product Type Selection - At the TOP */}
            <div className={styles.typeSelector}>
                <div className={styles.typeSelectorCard}>
                    <h2 className={styles.cardTitle}>What are you adding?</h2>
                    <div className={styles.typeButtonsRow}>
                        <button
                            type="button"
                            className={`${styles.typeButton} ${formData.productType === 'PLANT' ? styles.typeButtonActive : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, productType: 'PLANT' }))}
                        >
                            <svg className={styles.typeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M7 20l4-16m2 16l4-16" strokeLinecap="round" />
                                <path d="M12 4c-2 0-6 2-6 8s4 8 6 8c2 0 6-2 6-8s-4-8-6-8z" />
                                <path d="M12 4v16" />
                            </svg>
                            <span className={styles.typeLabel}>Plant</span>
                            <span className={styles.typeDesc}>Indoor/Outdoor plants</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeButton} ${formData.productType === 'POT' ? styles.typeButtonActive : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, productType: 'POT' }))}
                        >
                            <svg className={styles.typeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 10h16l-2 10H6L4 10z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2" />
                            </svg>
                            <span className={styles.typeLabel}>Pot</span>
                            <span className={styles.typeDesc}>Pots & Planters</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeButton} ${formData.productType === 'PLANTER' ? styles.typeButtonActive : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, productType: 'PLANTER' }))}
                        >
                            <svg className={styles.typeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <ellipse cx="12" cy="6" rx="8" ry="3" />
                                <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                                <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
                                <path d="M4 14v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" />
                            </svg>
                            <span className={styles.typeLabel}>Planter</span>
                            <span className={styles.typeDesc}>Decorative planters</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeButton} ${formData.productType === 'ACCESSORY' ? styles.typeButtonActive : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, productType: 'ACCESSORY' }))}
                        >
                            <svg className={styles.typeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                            </svg>
                            <span className={styles.typeLabel}>Accessory</span>
                            <span className={styles.typeDesc}>Tools & supplies</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.typeButton} ${formData.productType === 'SEED' ? styles.typeButtonActive : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, productType: 'SEED' }))}
                        >
                            <svg className={styles.typeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <ellipse cx="12" cy="10" rx="4" ry="6" />
                                <path d="M12 16v4" />
                                <path d="M12 4c0-2 2-3 4-2" />
                            </svg>
                            <span className={styles.typeLabel}>Seed</span>
                            <span className={styles.typeDesc}>Plant seeds</span>
                        </button>
                    </div>

                    {/* Status & Featured Row */}
                    <div className={styles.statusRow}>
                        <div className={styles.statusGroup}>
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={styles.statusSelect}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="DRAFT">Draft</option>
                                <option value="OUT_OF_STOCK">Out of Stock</option>
                            </select>
                        </div>
                        <div className={styles.statusGroup}>
                            <label className={styles.featuredLabel}>
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                />
                                <span>Featured Product</span>
                            </label>
                        </div>
                        <div className={styles.statusGroup}>
                            <label>Category</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className={styles.statusSelect}
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.formGrid}>
                {/* Main Content */}
                <div className={styles.mainContent}>
                    {/* Basic Info */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>{getProductTypeLabel()} Information</h2>

                        <div className={styles.formGroup}>
                            <label htmlFor="name">Product Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Money Plant Golden"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the product..."
                                rows={4}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="careInstructions">Care Instructions</label>
                            <textarea
                                id="careInstructions"
                                name="careInstructions"
                                value={formData.careInstructions}
                                onChange={handleChange}
                                placeholder="How to care for this plant..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Images - Hidden for Pots (they use per-color images) */}
                    {formData.productType !== 'POT' && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Images</h2>

                            <div className={styles.uploadZone}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileUpload}
                                    className={styles.fileInput}
                                    id="image-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="image-upload" className={styles.uploadLabel}>
                                    {uploading ? (
                                        <>
                                            <span className={styles.uploadSpinner}></span>
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <span>Click to upload images</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

                            <div className={styles.imageGrid}>
                                {formData.images.map((img, index) => (
                                    <div key={index} className={styles.imageCard}>
                                        <img src={img} alt={`Product ${index + 1}`} className={styles.previewImage} />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className={styles.removeImageBtn}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SIZE VARIANTS WITH PER-SIZE COLORS — Hidden for SEED type */}
                    {formData.productType !== 'SEED' && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Size Variants</h2>
                        <p className={styles.helpText}>Select sizes and configure price, stock, and colors for each</p>

                        <div className={styles.sizeCheckboxes}>
                            {AVAILABLE_SIZES.map(size => (
                                <label key={size} className={styles.sizeCheckbox}>
                                    <input
                                        type="checkbox"
                                        checked={selectedSizes.includes(size)}
                                        onChange={() => handleSizeToggle(size)}
                                    />
                                    <span className={styles.sizeLabel}>{size}</span>
                                </label>
                            ))}
                        </div>

                        {formData.sizeVariants.length > 0 && (
                            <div className={styles.variantBlocks}>
                                {formData.sizeVariants.map(variant => (
                                    <div key={variant.size} className={styles.variantBlock}>
                                        <div className={styles.variantHeader}>
                                            <span className={styles.variantSize}>Size: {variant.size}</span>
                                        </div>

                                        <div className={styles.variantRow}>
                                            <div className={styles.variantField}>
                                                <label>Price (₹)</label>
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={(e) => handleVariantChange(variant.size, 'price', e.target.value)}
                                                    placeholder="299"
                                                    min="0"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.variantField}>
                                                <label>Stock</label>
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) => handleVariantChange(variant.size, 'stock', e.target.value)}
                                                    placeholder="10"
                                                    min="0"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Colors for this size - Only for POTs */}
                                        {formData.productType === 'POT' && (
                                            <div className={styles.colorSection}>
                                                <label>Colors for {variant.size}</label>
                                                <div className={styles.colorInputCard}>
                                                    <div className={styles.colorInputRow}>
                                                        <input
                                                            type="text"
                                                            placeholder="Color name (e.g., Red)"
                                                            value={colorInputs[variant.size]?.name || ''}
                                                            onChange={(e) => handleColorInputChange(variant.size, 'name', e.target.value)}
                                                        />
                                                        <input
                                                            type="color"
                                                            value={colorInputs[variant.size]?.hex || '#4CAF50'}
                                                            onChange={(e) => handleColorInputChange(variant.size, 'hex', e.target.value)}
                                                            className={styles.colorPicker}
                                                        />
                                                    </div>
                                                    <div className={styles.colorImageRow}>
                                                        <label className={styles.colorFileLabel}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                key={`file-${variant.size}-${variant.colors.length}`}
                                                                onChange={(e) => handleColorFileChange(variant.size, e.target.files?.[0] || null)}
                                                                className={styles.colorFileInput}
                                                            />
                                                            {colorInputs[variant.size]?.file ? (
                                                                <span className={styles.fileSelected}>
                                                                    ✓ {colorInputs[variant.size]?.file?.name?.substring(0, 20)}...
                                                                </span>
                                                            ) : (
                                                                <span>📷 Choose Image</span>
                                                            )}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddColorToSize(variant.size)}
                                                            className={styles.addColorBtn}
                                                            disabled={addingColor[variant.size]}
                                                        >
                                                            {addingColor[variant.size] ? 'Adding...' : 'Add Color'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={styles.colorDots}>
                                                    {variant.colors.map((color, idx) => (
                                                        <div key={idx} className={styles.colorDotCard}>
                                                            <div className={styles.colorDotHeader}>
                                                                <span
                                                                    className={styles.dotPreview}
                                                                    style={{ backgroundColor: color.hex }}
                                                                    title={color.name}
                                                                ></span>
                                                                <span className={styles.colorName}>{color.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveColorFromSize(variant.size, idx)}
                                                                    className={styles.removeColorBtn}
                                                                >×</button>
                                                            </div>
                                                            {/* Image upload for this color */}
                                                            <div className={styles.colorImageUpload}>
                                                                {color.images && color.images.length > 0 ? (
                                                                    <div className={styles.colorImagePreview}>
                                                                        <img src={color.images[0]} alt={color.name} />
                                                                    </div>
                                                                ) : (
                                                                    <label className={styles.colorImageLabel}>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className={styles.colorImageInput}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleColorImageUpload(variant.size, idx, file);
                                                                            }}
                                                                            disabled={colorImageUploading[`${variant.size}-${idx}`]}
                                                                        />
                                                                        {colorImageUploading[`${variant.size}-${idx}`] ? (
                                                                            <span>Uploading...</span>
                                                                        ) : (
                                                                            <span>📷 Add Image</span>
                                                                        )}
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {variant.colors.length === 0 && (
                                                        <span className={styles.noColors}>No colors added</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.sizeVariants.length === 0 && (
                            <p className={styles.emptyState}>Select sizes above to add variants</p>
                        )}
                    </div>
                    )}

                    {/* PREFERRED LOCATIONS */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Preferred Locations</h2>

                        <div className={styles.tagInputRow}>
                            <select
                                value={newLocation}
                                onChange={(e) => {
                                    if (e.target.value) handleAddLocation(e.target.value);
                                }}
                            >
                                <option value="">Select location</option>
                                {PREDEFINED_LOCATIONS.filter(l => !formData.preferredLocations.includes(l)).map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.tagList}>
                            {formData.preferredLocations.map(location => (
                                <span key={location} className={styles.tag}>
                                    📍 {location}
                                    <button type="button" onClick={() => handleRemoveLocation(location)}>×</button>
                                </span>
                            ))}
                            {formData.preferredLocations.length === 0 && (
                                <p className={styles.emptyState}>No locations added (available everywhere)</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
                <Link href="/admin/products" className={styles.cancelBtn}>
                    Cancel
                </Link>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                    {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
                </button>
            </div>
        </form>
    );
}
