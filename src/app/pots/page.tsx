'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { PotIcon, LeafIcon, CheckIcon } from '@/components/Icons';
import styles from './page.module.css';

interface VariantColor {
    name: string;
    hex: string;
    images: string[];
}

interface SizeVariant {
    size: string;
    price: number;
    stock: number;
    colors: VariantColor[];
}

interface Pot {
    id: string;
    name: string;
    slug: string;
    type?: string;
    size?: string;
    color?: string;
    material?: string;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
    sizeVariants?: SizeVariant[];
    tags?: string[];

}

const materials = ['All', 'Ceramic', 'Terracotta', 'Cement', 'Plastic', 'Metal'];
const sizes = ['All', 'Small', 'Medium', 'Large'];

export default function PotsPage() {
    const [pots, setPots] = useState<Pot[]>([]);
    const [filteredPots, setFilteredPots] = useState<Pot[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedSize, setSelectedSize] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPots = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/products?productType=POT&limit=50');
                if (res.ok) {
                    const data = await res.json();
                    if (data.products?.length > 0) {
                        setPots(data.products);
                        setFilteredPots(data.products);
                    }
                }
            } catch {
                // Use sample data
            } finally {
                setLoading(false);
            }
        };
        fetchPots();
    }, []);

    useEffect(() => {
        let filtered = pots;
        if (selectedMaterial !== 'All') {
            filtered = filtered.filter(p => p.material?.toLowerCase() === selectedMaterial.toLowerCase());
        }
        if (selectedSize !== 'All') {
            filtered = filtered.filter(p => p.size?.toLowerCase() === selectedSize.toLowerCase());
        }
        setFilteredPots(filtered);
    }, [selectedMaterial, selectedSize, pots]);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.badge}>Shop Collection</span>
                    <h1 className={styles.title}>Pots & Planters</h1>
                    <p className={styles.subtitle}>
                        Beautiful handcrafted pots to complement your plants.
                        From classic terracotta to modern ceramic designs.
                    </p>
                </div>

                <div className={styles.layout}>
                    {/* Filters Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterCard}>
                            <h3 className={styles.filterTitle}>Filters</h3>

                            <div className={styles.filterGroup}>
                                <label>Material</label>
                                <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                                    {materials.map(mat => (
                                        <option key={mat} value={mat}>{mat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.filterGroup}>
                                <label>Size</label>
                                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                                    {sizes.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className={styles.clearBtn}
                                onClick={() => { setSelectedMaterial('All'); setSelectedSize('All'); }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className={styles.main}>
                        {/* Top Bar */}
                        <div className={styles.topBar}>
                            <span className={styles.resultCount}>{filteredPots.length} pots</span>
                            {/* Sort functionality can be added here if needed, keeping it simple for now to match structure */}
                        </div>

                        {/* Pots Grid */}
                        {loading ? (
                            <div className={styles.loading}>Loading pots...</div>
                        ) : (
                            <div className={styles.grid}>
                                {filteredPots.map((pot) => (
                                    <ProductCard
                                        key={pot.id}
                                        id={pot.id}
                                        name={pot.name}
                                        slug={pot.slug}
                                        price={pot.price}
                                        comparePrice={pot.comparePrice}
                                        image={pot.images?.[0] || undefined}
                                        stock={pot.stock}
                                        type="pot"
                                        featured={pot.featured}
                                        sizeVariants={pot.sizeVariants || []}

                                        productType="POT"
                                        tags={pot.tags && pot.tags.length > 0 ? pot.tags : [pot.material, pot.color].filter(Boolean) as string[]}
                                        suitableFor="BOTH"
                                    />
                                ))}
                            </div>
                        )}

                        {filteredPots.length === 0 && !loading && (
                            <div className={styles.noResults}>
                                <PotIcon size={64} color="#94a3b8" />
                                <p>No pots match your filters. Try adjusting your selection.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
