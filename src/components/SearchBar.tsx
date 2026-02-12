'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './SearchBar.module.css';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
}

export default function SearchBar({ mobile = false }: { mobile?: boolean }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                if (data.products) {
                    setResults(data.products);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div ref={wrapperRef} className={`${styles.wrapper} ${mobile ? styles.mobile : ''}`}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Search plants, pots..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true);
                    }}
                />
                <button className={styles.searchBtn} aria-label="Search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {loading ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Searching...</div>
                    ) : results.length > 0 ? (
                        results.map((product) => (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className={styles.resultItem}
                                onClick={() => { setIsOpen(false); setQuery(''); }}
                            >
                                <img
                                    src={product.images[0] || '/placeholder-plant.jpg'}
                                    alt={product.name}
                                    className={styles.resultImage}
                                />
                                <div className={styles.resultInfo}>
                                    <span className={styles.resultName}>{product.name}</span>
                                    <span className={styles.resultPrice}>₹{product.price.toLocaleString('en-IN')}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No results found</div>
                    )}
                </div>
            )}
        </div>
    );
}
