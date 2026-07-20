'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ProductForm.module.css';
import { PLANTER_ICON_OPTIONS, PlanterIcon, planterNameToIconKey } from '@/components/PlanterIcons';

interface Category {
    id: string;
    name: string;
}

interface VariantColor {
    name: string;
    hex: string;
    images: string[];  // Array of images for this color
}

// Inbuilt planter presets — admins can add these in one click, then tweak price / upload images.
// Colors come pre-filled (matching common Ugaoo-style planters); images are added per color afterwards.
const PRESET_PLANTER_COLORS: VariantColor[] = [
    { name: 'Ivory', hex: '#F5F0DC', images: [] },
    { name: 'Yellow', hex: '#F2E14C', images: [] },
    { name: 'Green', hex: '#7CC242', images: [] },
    { name: 'Brown', hex: '#4A3728', images: [] },
    { name: 'Red', hex: '#E23A2E', images: [] },
];

const PRESET_PLANTERS: { name: string; price: string; comparePrice: string; colors: VariantColor[] }[] = [
    { name: 'GroPot', price: '399', comparePrice: '499', colors: PRESET_PLANTER_COLORS.slice(0, 5) },
    { name: 'Krish', price: '499', comparePrice: '600', colors: PRESET_PLANTER_COLORS.slice(0, 3) },
    { name: 'Prism', price: '899', comparePrice: '1099', colors: PRESET_PLANTER_COLORS.slice(0, 4) },
    { name: 'Aurelius', price: '899', comparePrice: '1099', colors: PRESET_PLANTER_COLORS.slice(0, 4) },
];

interface PlanterVariant {
    name: string;
    price: string;
    comparePrice?: string;
    stock: string;
    icon?: string;             // Preset planter icon key (used instead of an image)
    colors: VariantColor[];  // Colors available for THIS planter
}

interface SizeVariant {
    size: string;
    price: string;
    comparePrice?: string;
    stock: string;
    colors: VariantColor[];
    planters?: PlanterVariant[];  // Planters for THIS size (planter-mode plants only)
}

export interface ProductFormData {
    name: string;
    description: string;
    careInstructions: string;
    productType: string;
    suitableFor: string;
    categoryId: string;
    featured: boolean;
    showOnHome: boolean;
    displayOrder: string;
    status: string;
    images: string[];
    sizeVariants: SizeVariant[];
    tags: string[];

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

const defaultFormData: ProductFormData = {
    name: '',
    description: '',
    careInstructions: '',
    productType: 'PLANT',
    suitableFor: 'INDOOR',
    categoryId: '',
    featured: false,
    showOnHome: false,
    displayOrder: '0',
    status: 'ACTIVE',
    images: [],
    sizeVariants: [],
    tags: [],

    price: '',
    comparePrice: '',
    stock: '',
    size: 'MEDIUM',
};

export default function ProductForm({ initialData, categories, onSubmit, loading, isEdit = false, token }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [colorInputs, setColorInputs] = useState<{ [size: string]: { name: string; hex: string; file?: File | null } }>({});
    const [colorImageUploading, setColorImageUploading] = useState<{ [key: string]: boolean }>({});
    const [addingColor, setAddingColor] = useState<{ [size: string]: boolean }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [customTagInput, setCustomTagInput] = useState('');

    // Single size mode: auto-detect from initialData
    const [isSingleSize, setIsSingleSize] = useState(false);
    // Multi-color mode: auto-detect from initialData (replaces hardcoded POT check)
    const [isMultiColor, setIsMultiColor] = useState(false);
    // Planter mode: plants can offer selectable planters (each with own price + colors)
    const [hasPlanters, setHasPlanters] = useState(false);
    // Planter input drafts, keyed by size
    const [planterInputs, setPlanterInputs] = useState<{ [size: string]: { name: string; price: string; comparePrice: string; stock: string } }>({});
    // Planter color input drafts, keyed by `${size}::${planterIndex}`
    const [planterColorInputs, setPlanterColorInputs] = useState<{ [key: string]: { name: string; hex: string; file?: File | null } }>({});
    const [planterColorUploading, setPlanterColorUploading] = useState<{ [key: string]: boolean }>({});
    // Toggle for showing the "create custom planter" form, keyed by size
    const [showCustomPlanter, setShowCustomPlanter] = useState<{ [size: string]: boolean }>({});

    useEffect(() => {
        if (initialData) {
            const variants = initialData.sizeVariants || [];
            // Auto-detect single size mode
            const isSingle = variants.length === 1 && variants[0].size === 'DEFAULT';
            setIsSingleSize(isSingle);
            // Auto-detect multi-color mode: if any variant has colors
            const hasColors = variants.some(v => v.colors && v.colors.length > 0);
            setIsMultiColor(hasColors);
            // Auto-detect planter mode: if any variant has planters
            const withPlanters = variants.some(v => v.planters && v.planters.length > 0);
            setHasPlanters(withPlanters);
            setFormData({
                ...defaultFormData,
                ...initialData,
                sizeVariants: variants,

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
                    sizeVariants: [...prev.sizeVariants, { size, price: '', comparePrice: '', stock: '', colors: [] }]
                };
            }
        });
    };

    const handleVariantChange = (size: string, field: 'price' | 'comparePrice' | 'stock', value: string) => {
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
                                    i === colorIndex ? { ...c, images: [...(c.images || []), data.url] } : c
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



    // PLANTER HANDLERS (plants only)
    const handlePlanterInputChange = (size: string, field: 'name' | 'price' | 'comparePrice' | 'stock', value: string) => {
        setPlanterInputs(prev => {
            const current = prev[size] || { name: '', price: '', comparePrice: '', stock: '' };
            return { ...prev, [size]: { ...current, [field]: value } };
        });
    };

    const handleAddPlanter = (size: string) => {
        const draft = planterInputs[size];
        if (!draft?.name?.trim()) {
            setUploadError(`Please enter a planter name for size ${size}`);
            return;
        }
        if (!draft?.price?.trim() || parseFloat(draft.price) <= 0) {
            setUploadError(`Please enter a valid price for the planter (size ${size})`);
            return;
        }
        setUploadError(null);
        const newPlanter: PlanterVariant = {
            name: draft.name.trim(),
            price: draft.price,
            comparePrice: draft.comparePrice || '',
            stock: draft.stock || '0',
            colors: [],
        };
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? { ...v, planters: [...(v.planters || []), newPlanter] }
                    : v
            )
        }));
        setPlanterInputs(prev => ({ ...prev, [size]: { name: '', price: '', comparePrice: '', stock: '' } }));
        setShowCustomPlanter(prev => ({ ...prev, [size]: false }));
    };

    // Quick-add an inbuilt preset planter (name, price, MRP and default colors pre-filled).
    const handleAddPresetPlanter = (size: string, preset: typeof PRESET_PLANTERS[number]) => {
        setUploadError(null);
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v => {
                if (v.size !== size) return v;
                const existing = v.planters || [];
                // Skip if a planter with the same name already exists for this size
                if (existing.some(p => p.name.toLowerCase() === preset.name.toLowerCase())) {
                    return v;
                }
                const newPlanter: PlanterVariant = {
                    name: preset.name,
                    price: preset.price,
                    comparePrice: preset.comparePrice,
                    stock: '10',
                    icon: planterNameToIconKey(preset.name),
                    colors: preset.colors.map(c => ({ ...c, images: [] })),
                };
                return { ...v, planters: [...existing, newPlanter] };
            })
        }));
    };

    const handlePlanterChange = (size: string, planterIdx: number, field: 'name' | 'price' | 'comparePrice' | 'stock' | 'icon', value: string) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? { ...v, planters: (v.planters || []).map((p, i) => i === planterIdx ? { ...p, [field]: value } : p) }
                    : v
            )
        }));
    };

    const handleRemovePlanter = (size: string, planterIdx: number) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? { ...v, planters: (v.planters || []).filter((_, i) => i !== planterIdx) }
                    : v
            )
        }));
    };

    const handlePlanterColorInputChange = (key: string, field: 'name' | 'hex', value: string) => {
        setPlanterColorInputs(prev => {
            const current = prev[key] || { name: '', hex: '#4CAF50', file: null };
            return { ...prev, [key]: { ...current, [field]: value } };
        });
    };

    const handleAddColorToPlanter = (size: string, planterIdx: number) => {
        const key = `${size}::${planterIdx}`;
        const draft = planterColorInputs[key];
        if (!draft?.name?.trim()) {
            setUploadError('Please enter a color name');
            return;
        }
        setUploadError(null);

        const newColor: VariantColor = {
            name: draft.name.trim(),
            hex: draft.hex.startsWith('#') ? draft.hex : `#${draft.hex}`,
            images: [],
        };
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? {
                        ...v,
                        planters: (v.planters || []).map((p, i) =>
                            i === planterIdx ? { ...p, colors: [...p.colors, newColor] } : p
                        )
                    }
                    : v
            )
        }));
        setPlanterColorInputs(prev => ({ ...prev, [key]: { name: '', hex: '#4CAF50', file: null } }));
    };

    const handleRemoveColorFromPlanter = (size: string, planterIdx: number, colorIdx: number) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? {
                        ...v,
                        planters: (v.planters || []).map((p, i) =>
                            i === planterIdx ? { ...p, colors: p.colors.filter((_, ci) => ci !== colorIdx) } : p
                        )
                    }
                    : v
            )
        }));
    };

    // Add another image to an EXISTING planter color (gallery support)
    const handleAddImageToPlanterColor = async (size: string, planterIdx: number, colorIdx: number, file: File) => {
        const key = `${size}::${planterIdx}::${colorIdx}`;
        setPlanterColorUploading(prev => ({ ...prev, [key]: true }));
        setUploadError(null);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'vanam-store/products/planters');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
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
                                planters: (v.planters || []).map((p, i) =>
                                    i === planterIdx
                                        ? {
                                            ...p,
                                            colors: p.colors.map((c, ci) =>
                                                ci === colorIdx ? { ...c, images: [...(c.images || []), data.url] } : c
                                            )
                                        }
                                        : p
                                )
                            }
                            : v
                    )
                }));
            } else {
                setUploadError(data.error || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Planter color image upload error:', error);
            setUploadError('Failed to upload image.');
        }
        setPlanterColorUploading(prev => ({ ...prev, [key]: false }));
    };

    const handleRemoveImageFromPlanterColor = (size: string, planterIdx: number, colorIdx: number, imageIdx: number) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map(v =>
                v.size === size
                    ? {
                        ...v,
                        planters: (v.planters || []).map((p, i) =>
                            i === planterIdx
                                ? {
                                    ...p,
                                    colors: p.colors.map((c, ci) =>
                                        ci === colorIdx ? { ...c, images: (c.images || []).filter((_, imgI) => imgI !== imageIdx) } : c
                                    )
                                }
                                : p
                        )
                    }
                    : v
            )
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

        // Warn about missing fields (non-blocking — user can still proceed)
        const warnings: string[] = [];
        if (!formData.name.trim()) warnings.push('• Product name is empty');
        if (!formData.categoryId) warnings.push('• No category selected');
        if (formData.sizeVariants.length === 0 && !formData.price) {
            warnings.push('• No price set');
        }
        if (formData.sizeVariants.length > 0) {
            if (hasPlanters) {
                const noPlanters = formData.sizeVariants.filter(v => !v.planters || v.planters.length === 0);
                if (noPlanters.length > 0) {
                    warnings.push(`• ${noPlanters.length} size(s) have no planters added`);
                }
                const emptyPlanterPrices = formData.sizeVariants
                    .flatMap(v => v.planters || [])
                    .filter(p => !p.price || parseFloat(p.price) <= 0);
                if (emptyPlanterPrices.length > 0) {
                    warnings.push(`• ${emptyPlanterPrices.length} planter(s) have no price`);
                }
            } else {
                const emptyPrices = formData.sizeVariants.filter(v => !v.price || parseFloat(v.price) <= 0);
                if (emptyPrices.length > 0) {
                    warnings.push(`• ${emptyPrices.length} size variant(s) have no price`);
                }
            }
        }
        const hasPlanterImages = formData.sizeVariants.some(v => (v.planters || []).some(p => p.colors?.some(c => c.images?.length > 0)));
        if (formData.images.length === 0 && !formData.sizeVariants.some(v => v.colors?.some(c => c.images?.length > 0)) && !hasPlanterImages) {
            warnings.push('• No images uploaded');
        }

        if (warnings.length > 0) {
            const proceed = confirm(
                `⚠️ Some fields are missing:\n\n${warnings.join('\n')}\n\nDo you want to save anyway?`
            );
            if (!proceed) return;
        }

        // Calculate base price and stock from variants if they exist
        const dataToSubmit = { ...formData };
        if (formData.sizeVariants.length > 0) {
            if (hasPlanters) {
                // In planter mode, each size's price/stock derive from its planters.
                // Sync those onto the size variant, then compute the base product price/stock.
                dataToSubmit.sizeVariants = formData.sizeVariants.map(v => {
                    const planters = v.planters || [];
                    if (planters.length === 0) return v;
                    const planterPrices = planters.map(p => parseFloat(p.price) || 0);
                    const planterStock = planters.reduce((a, p) => a + (parseInt(p.stock) || 0), 0);
                    return {
                        ...v,
                        price: Math.min(...planterPrices).toString(),
                        stock: planterStock.toString(),
                    };
                });
                const allPlanterPrices = dataToSubmit.sizeVariants.flatMap(v => (v.planters || []).map(p => parseFloat(p.price) || 0));
                const allPlanterStock = dataToSubmit.sizeVariants.reduce((sum, v) => sum + (v.planters || []).reduce((a, p) => a + (parseInt(p.stock) || 0), 0), 0);
                if (allPlanterPrices.length > 0) {
                    dataToSubmit.price = Math.min(...allPlanterPrices).toString();
                }
                dataToSubmit.stock = allPlanterStock.toString();
            } else {
                const prices = formData.sizeVariants.map(v => parseFloat(v.price) || 0);
                const stocks = formData.sizeVariants.map(v => parseInt(v.stock) || 0);
                dataToSubmit.price = Math.min(...prices).toString();
                dataToSubmit.stock = stocks.reduce((a, b) => a + b, 0).toString();
            }
        }

        // Auto-derive suitableFor from category name
        const selectedCategory = categories.find(c => c.id === formData.categoryId);
        if (selectedCategory) {
            const catName = selectedCategory.name.toLowerCase();
            if (catName.includes('indoor')) {
                dataToSubmit.suitableFor = 'INDOOR';
            } else if (catName.includes('outdoor')) {
                dataToSubmit.suitableFor = 'OUTDOOR';
            } else {
                dataToSubmit.suitableFor = 'BOTH';
            }
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
                                <span>⭐ Best Seller</span>
                            </label>
                        </div>
                        <div className={styles.statusGroup}>
                            <label className={styles.featuredLabel}>
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
                            <div className={styles.statusGroup}>
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    name="displayOrder"
                                    value={formData.displayOrder}
                                    onChange={handleChange}
                                    min="0"
                                    className={styles.statusSelect}
                                    style={{ width: '80px' }}
                                />
                            </div>
                        )}
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
                        {(formData.productType === 'PLANT' || formData.productType === 'SEED') && (
                            <div className={styles.statusGroup}>
                                <label>Suitable For</label>
                                <select
                                    name="suitableFor"
                                    value={formData.suitableFor}
                                    onChange={handleChange}
                                    className={styles.statusSelect}
                                >
                                    <option value="INDOOR">🏠 Indoor</option>
                                    <option value="OUTDOOR">🌳 Outdoor</option>
                                    <option value="BOTH">🌿 Both</option>
                                </select>
                            </div>
                        )}                    </div>
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

                    {/* Planter Mode Toggle — plants only */}
                    {formData.productType === 'PLANT' && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Planter Options</h2>
                            <div className={styles.colorModeToggle}>
                                <div className={styles.colorModeButtons}>
                                    <button
                                        type="button"
                                        className={`${styles.colorModeBtn} ${!hasPlanters ? styles.colorModeBtnActive : ''}`}
                                        onClick={() => {
                                            setHasPlanters(false);
                                            // Clear planters from all variants when disabling
                                            setFormData(prev => ({
                                                ...prev,
                                                sizeVariants: prev.sizeVariants.map(v => ({ ...v, planters: [] }))
                                            }));
                                        }}
                                    >
                                        <span className={styles.colorModeIcon}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M7 20l4-16m2 16l4-16" strokeLinecap="round" />
                                                <path d="M12 4c-2 0-6 2-6 8s4 8 6 8c2 0 6-2 6-8s-4-8-6-8z" />
                                            </svg>
                                        </span>
                                        <span className={styles.colorModeLabel}>No Planters</span>
                                        <span className={styles.colorModeDesc}>Just the plant — sizes and colors only</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.colorModeBtn} ${hasPlanters ? styles.colorModeBtnActive : ''}`}
                                        onClick={() => {
                                            setHasPlanters(true);
                                            // Colors move under planters, so clear size-level colors
                                            setIsMultiColor(false);
                                            setFormData(prev => ({
                                                ...prev,
                                                sizeVariants: prev.sizeVariants.map(v => ({ ...v, colors: [] }))
                                            }));
                                        }}
                                    >
                                        <span className={styles.colorModeIcon}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 10h16l-2 10H6L4 10z" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2" />
                                            </svg>
                                        </span>
                                        <span className={styles.colorModeLabel}>Include Planters</span>
                                        <span className={styles.colorModeDesc}>Each size offers planters with their own prices & colors</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color Mode Toggle — shown for all types except SEED */}
                    {formData.productType !== 'SEED' && !hasPlanters && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Product Color Type</h2>
                            <div className={styles.colorModeToggle}>
                                <div className={styles.colorModeButtons}>
                                    <button
                                        type="button"
                                        className={`${styles.colorModeBtn} ${!isMultiColor ? styles.colorModeBtnActive : ''}`}
                                        onClick={() => {
                                            setIsMultiColor(false);
                                            // Clear colors from all variants when switching to single
                                            setFormData(prev => ({
                                                ...prev,
                                                sizeVariants: prev.sizeVariants.map(v => ({ ...v, colors: [] }))
                                            }));
                                        }}
                                    >
                                        <span className={styles.colorModeIcon}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="8" />
                                                <circle cx="12" cy="12" r="3" fill="currentColor" />
                                            </svg>
                                        </span>
                                        <span className={styles.colorModeLabel}>Single Color</span>
                                        <span className={styles.colorModeDesc}>One color — upload product images directly</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.colorModeBtn} ${isMultiColor ? styles.colorModeBtnActive : ''}`}
                                        onClick={() => setIsMultiColor(true)}
                                    >
                                        <span className={styles.colorModeIcon}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <circle cx="10" cy="9" r="5" />
                                                <circle cx="16" cy="9" r="5" />
                                                <circle cx="13" cy="15" r="5" />
                                            </svg>
                                        </span>
                                        <span className={styles.colorModeLabel}>Multiple Colors</span>
                                        <span className={styles.colorModeDesc}>Add colors with individual images per variant</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Tags */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Product Tags</h2>
                        <p className={styles.tagHelp}>Select tags that best describe this product. These appear on product cards.</p>
                        <div className={styles.tagChips}>
                            {[
                                'Bestseller', 'New Arrival', 'Low Maintenance', 'Air Purifying',
                                'Pet Friendly', 'Beginner Friendly', 'Rare Find', 'Fast Growing',
                                'Flowering', 'Fragrant', 'Drought Tolerant', 'Sun Loving',
                                'Shade Loving', 'Ceramic', 'Handcrafted', 'Premium', 'Gift Ready'
                            ].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`${styles.tagChip} ${formData.tags?.includes(tag) ? styles.tagChipActive : ''}`}
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            tags: prev.tags?.includes(tag)
                                                ? prev.tags.filter(t => t !== tag)
                                                : [...(prev.tags || []), tag]
                                        }));
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div className={styles.customTagRow}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Add custom tag..."
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customTagInput.trim()) {
                                        e.preventDefault();
                                        const newTag = customTagInput.trim();
                                        if (!formData.tags?.includes(newTag)) {
                                            setFormData(prev => ({
                                                ...prev,
                                                tags: [...(prev.tags || []), newTag]
                                            }));
                                        }
                                        setCustomTagInput('');
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className={styles.addColorBtn}
                                disabled={!customTagInput.trim()}
                                onClick={() => {
                                    const newTag = customTagInput.trim();
                                    if (newTag && !formData.tags?.includes(newTag)) {
                                        setFormData(prev => ({
                                            ...prev,
                                            tags: [...(prev.tags || []), newTag]
                                        }));
                                    }
                                    setCustomTagInput('');
                                }}
                            >
                                + Add
                            </button>
                        </div>
                        {formData.tags && formData.tags.length > 0 && (
                            <div className={styles.selectedTags}>
                                <span className={styles.selectedTagsLabel}>Selected:</span>
                                {formData.tags.map(tag => (
                                    <span key={tag} className={styles.selectedTag}>
                                        {tag}
                                        <button
                                            type="button"
                                            className={styles.removeColorBtn}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                tags: prev.tags.filter(t => t !== tag)
                                            }))}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Images - Hidden when multi-color is selected (they use per-color images) */}
                    {!isMultiColor && (
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

                            {/* Single Size Toggle */}
                            <div className={styles.singleSizeToggle}>
                                <label className={styles.featuredLabel}>
                                    <input
                                        type="checkbox"
                                        checked={isSingleSize}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsSingleSize(checked);
                                            if (checked) {
                                                // Switch to single size: create DEFAULT variant, carrying over price/stock if present
                                                const existingPrice = formData.sizeVariants[0]?.price || formData.price || '';
                                                const existingStock = formData.sizeVariants[0]?.stock || formData.stock || '';
                                                const existingColors = formData.sizeVariants[0]?.colors || [];
                                                const existingComparePrice = formData.sizeVariants[0]?.comparePrice || formData.comparePrice || '';
                                                setFormData(prev => ({
                                                    ...prev,
                                                    sizeVariants: [{ size: 'DEFAULT', price: existingPrice, comparePrice: existingComparePrice, stock: existingStock, colors: existingColors }]
                                                }));
                                            } else {
                                                // Switch to multi-size: clear variants
                                                setFormData(prev => ({
                                                    ...prev,
                                                    sizeVariants: []
                                                }));
                                            }
                                        }}
                                    />
                                    <span>Single Size Product</span>
                                </label>
                                <p className={styles.helpText}>
                                    {isSingleSize
                                        ? 'This product has one size — customers won\'t see a size selector'
                                        : 'Select sizes and configure price, stock, and colors for each'}
                                </p>
                            </div>

                            {/* Multi-size checkboxes (hidden in single-size mode) */}
                            {!isSingleSize && (
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
                            )}

                            {formData.sizeVariants.length > 0 && (
                                <div className={styles.variantBlocks}>
                                    {formData.sizeVariants.map(variant => (
                                        <div key={variant.size} className={styles.variantBlock}>
                                            {/* Only show size header for multi-size products */}
                                            {!isSingleSize && (
                                                <div className={styles.variantHeader}>
                                                    <span className={styles.variantSize}>Size: {variant.size}</span>
                                                </div>
                                            )}

                                            {!hasPlanters && (
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
                                                    <label>MRP (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={variant.comparePrice || ''}
                                                        onChange={(e) => handleVariantChange(variant.size, 'comparePrice', e.target.value)}
                                                        placeholder="499"
                                                        min="0"
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
                                            )}

                                            {/* Planters for this size — planter mode only */}
                                            {hasPlanters && (
                                                <div className={styles.colorSection}>
                                                    <label>Planters{!isSingleSize ? ` for ${variant.size}` : ''}</label>
                                                    <div className={styles.colorInputCard}>
                                                        {/* Option 1: Quick add an inbuilt planter */}
                                                        <div className={styles.planterQuickAdd}>
                                                            <div className={styles.planterSectionHead}>
                                                                <span className={styles.planterSectionTitle}>⚡ Quick add</span>
                                                                <span className={styles.planterSectionHint}>Price &amp; colors pre-filled — just click, then upload images</span>
                                                            </div>
                                                            <div className={styles.presetPlanters}>
                                                                {PRESET_PLANTERS.map((preset) => {
                                                                    const alreadyAdded = (variant.planters || []).some(
                                                                        p => p.name.toLowerCase() === preset.name.toLowerCase()
                                                                    );
                                                                    return (
                                                                        <button
                                                                            key={preset.name}
                                                                            type="button"
                                                                            onClick={() => handleAddPresetPlanter(variant.size, preset)}
                                                                            className={styles.presetChip}
                                                                            disabled={alreadyAdded}
                                                                            title={alreadyAdded ? 'Already added' : `Add ${preset.name} (₹${preset.price})`}
                                                                        >
                                                                            {alreadyAdded ? '✓ ' : '+ '}{preset.name}
                                                                            <span className={styles.presetPrice}>₹{preset.price}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className={styles.planterOr}><span>or</span></div>

                                                        {/* Option 2: Create a custom planter (collapsed by default) */}
                                                        {!showCustomPlanter[variant.size] ? (
                                                            <button
                                                                type="button"
                                                                className={styles.customPlanterToggle}
                                                                onClick={() => setShowCustomPlanter(prev => ({ ...prev, [variant.size]: true }))}
                                                            >
                                                                + Create a custom planter
                                                            </button>
                                                        ) : (
                                                            <div className={styles.customPlanterForm}>
                                                                <div className={styles.planterSectionHead}>
                                                                    <span className={styles.planterSectionTitle}>✏️ New custom planter</span>
                                                                    <button
                                                                        type="button"
                                                                        className={styles.customPlanterCancel}
                                                                        onClick={() => setShowCustomPlanter(prev => ({ ...prev, [variant.size]: false }))}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                                <div className={styles.variantRow}>
                                                                    <div className={styles.variantField}>
                                                                        <label>Planter Name</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g., GroPot"
                                                                            value={planterInputs[variant.size]?.name || ''}
                                                                            onChange={(e) => handlePlanterInputChange(variant.size, 'name', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>Price (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="299"
                                                                            min="0"
                                                                            value={planterInputs[variant.size]?.price || ''}
                                                                            onChange={(e) => handlePlanterInputChange(variant.size, 'price', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>MRP (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="499"
                                                                            min="0"
                                                                            value={planterInputs[variant.size]?.comparePrice || ''}
                                                                            onChange={(e) => handlePlanterInputChange(variant.size, 'comparePrice', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>Stock</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="10"
                                                                            min="0"
                                                                            value={planterInputs[variant.size]?.stock || ''}
                                                                            onChange={(e) => handlePlanterInputChange(variant.size, 'stock', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddPlanter(variant.size)}
                                                                    className={styles.addColorBtn}
                                                                >
                                                                    + Add Planter
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Existing planters for this size */}
                                                    <div className={styles.variantBlocks}>
                                                        {(variant.planters || []).map((planter, pIdx) => (
                                                            <div key={pIdx} className={styles.variantBlock}>
                                                                <div className={styles.variantHeader}>
                                                                    <span className={styles.variantSize}>
                                                                        🪴 {planter.name} — ₹{planter.price || 0}
                                                                        {planter.comparePrice ? ` (MRP ₹${planter.comparePrice})` : ''} · Stock: {planter.stock || 0}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemovePlanter(variant.size, pIdx)}
                                                                        className={styles.removeColorBtn}
                                                                    >×</button>
                                                                </div>

                                                                {/* Editable planter fields */}
                                                                <div className={styles.variantRow}>
                                                                    <div className={styles.variantField}>
                                                                        <label>Name</label>
                                                                        <input
                                                                            type="text"
                                                                            value={planter.name}
                                                                            onChange={(e) => handlePlanterChange(variant.size, pIdx, 'name', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>Price (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={planter.price}
                                                                            onChange={(e) => handlePlanterChange(variant.size, pIdx, 'price', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>MRP (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={planter.comparePrice || ''}
                                                                            onChange={(e) => handlePlanterChange(variant.size, pIdx, 'comparePrice', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.variantField}>
                                                                        <label>Stock</label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={planter.stock}
                                                                            onChange={(e) => handlePlanterChange(variant.size, pIdx, 'stock', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Display mode: uploaded image OR a preset planter icon */}
                                                                <div className={styles.planterDisplaySection}>
                                                                    <label>Display in store</label>
                                                                    <div className={styles.planterDisplayToggle}>
                                                                        <button
                                                                            type="button"
                                                                            className={`${styles.planterDisplayOption} ${!planter.icon ? styles.planterDisplayActive : ''}`}
                                                                            onClick={() => handlePlanterChange(variant.size, pIdx, 'icon', '')}
                                                                        >
                                                                            Product image
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className={`${styles.planterDisplayOption} ${planter.icon ? styles.planterDisplayActive : ''}`}
                                                                            onClick={() => handlePlanterChange(variant.size, pIdx, 'icon', planter.icon || planterNameToIconKey(planter.name) || PLANTER_ICON_OPTIONS[0].key)}
                                                                        >
                                                                            Planter icon
                                                                        </button>
                                                                    </div>

                                                                    {planter.icon && (
                                                                        <div className={styles.planterIconGrid}>
                                                                            {PLANTER_ICON_OPTIONS.map((opt) => (
                                                                                <button
                                                                                    key={opt.key}
                                                                                    type="button"
                                                                                    className={`${styles.planterIconChoice} ${planter.icon === opt.key ? styles.planterIconSelected : ''}`}
                                                                                    onClick={() => handlePlanterChange(variant.size, pIdx, 'icon', opt.key)}
                                                                                    title={opt.label}
                                                                                >
                                                                                    <opt.Icon size={32} />
                                                                                    <span>{opt.label}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <p className={styles.helpText}>
                                                                        Choose a clean planter icon, or keep &quot;Product image&quot; to show an uploaded photo in the Select Planter option.
                                                                    </p>
                                                                </div>

                                                                {/* Colors for this planter */}
                                                                <div className={styles.colorSection}>
                                                                    <label>Colors for {planter.name}</label>
                                                                    <div className={styles.colorInputCard}>
                                                                        <div className={styles.colorInputRow}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Color name (e.g., Ivory)"
                                                                                value={planterColorInputs[`${variant.size}::${pIdx}`]?.name || ''}
                                                                                onChange={(e) => handlePlanterColorInputChange(`${variant.size}::${pIdx}`, 'name', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="color"
                                                                                value={planterColorInputs[`${variant.size}::${pIdx}`]?.hex || '#4CAF50'}
                                                                                onChange={(e) => handlePlanterColorInputChange(`${variant.size}::${pIdx}`, 'hex', e.target.value)}
                                                                                className={styles.colorPicker}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleAddColorToPlanter(variant.size, pIdx)}
                                                                                className={styles.addColorBtn}
                                                                            >
                                                                                Add Color
                                                                            </button>
                                                                        </div>
                                                                        <p className={styles.helpText}>
                                                                            Add the color, then upload its images below.
                                                                        </p>
                                                                    </div>

                                                                    <div className={styles.colorDots}>
                                                                        {planter.colors.map((color, cIdx) => (
                                                                            <div key={cIdx} className={styles.colorDotCard}>
                                                                                <div className={styles.colorDotHeader}>
                                                                                    <span
                                                                                        className={styles.dotPreview}
                                                                                        style={{ backgroundColor: color.hex }}
                                                                                        title={color.name}
                                                                                    ></span>
                                                                                    <span className={styles.colorName}>{color.name}</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveColorFromPlanter(variant.size, pIdx, cIdx)}
                                                                                        className={styles.removeColorBtn}
                                                                                    >×</button>
                                                                                </div>

                                                                                {/* Image gallery for this color */}
                                                                                <div className={styles.planterImageGrid}>
                                                                                    {(color.images || []).map((img, imgIdx) => (
                                                                                        <div key={imgIdx} className={styles.imageCard}>
                                                                                            <img src={img} alt={`${color.name} ${imgIdx + 1}`} className={styles.previewImage} />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleRemoveImageFromPlanterColor(variant.size, pIdx, cIdx, imgIdx)}
                                                                                                className={styles.removeImageBtn}
                                                                                            >×</button>
                                                                                        </div>
                                                                                    ))}
                                                                                    <label className={styles.planterImageAdd}>
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/*"
                                                                                            className={styles.colorImageInput}
                                                                                            onChange={(e) => {
                                                                                                const file = e.target.files?.[0];
                                                                                                if (file) handleAddImageToPlanterColor(variant.size, pIdx, cIdx, file);
                                                                                                e.target.value = '';
                                                                                            }}
                                                                                            disabled={planterColorUploading[`${variant.size}::${pIdx}::${cIdx}`]}
                                                                                        />
                                                                                        {planterColorUploading[`${variant.size}::${pIdx}::${cIdx}`] ? (
                                                                                            <span>Uploading...</span>
                                                                                        ) : (
                                                                                            <span>＋ Image</span>
                                                                                        )}
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {planter.colors.length === 0 && (
                                                                            <span className={styles.noColors}>No colors added</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(variant.planters || []).length === 0 && (
                                                            <span className={styles.noColors}>No planters added for this size</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Colors for this size - shown when multi-color mode is enabled */}
                                            {isMultiColor && !hasPlanters && (
                                                <div className={styles.colorSection}>
                                                    <label>Colors{!isSingleSize ? ` for ${variant.size}` : ''}</label>
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

                            {!isSingleSize && formData.sizeVariants.length === 0 && (
                                <p className={styles.emptyState}>Select sizes above to add variants</p>
                            )}
                        </div>
                    )}


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
