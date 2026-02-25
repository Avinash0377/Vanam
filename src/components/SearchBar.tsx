'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './SearchBar.module.css';

interface SearchResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string | null;
    type: string;
    href: string;
}

const TYPE_LABELS: Record<string, string> = {
    plant: '🌿 Plant',
    pot: '🪴 Pot',
    seed: '🌱 Seed',
    accessory: '🛠 Accessory',
    combo: '📦 Combo',
    hamper: '🎁 Hamper',
};

export default function SearchBar({ mobile = false }: { mobile?: boolean }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
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
        const abortController = new AbortController();

        const searchAll = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(query)}&limit=8`,
                    { signal: abortController.signal }
                );
                const data = await res.json();
                if (data.results) {
                    setResults(data.results);
                    setIsOpen(true);
                }
            } catch (error) {
                // Ignore abort errors — they're expected when a new keystroke fires
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.error('Search failed', error);
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        const debounce = setTimeout(searchAll, 300);
        return () => {
            clearTimeout(debounce);
            abortController.abort();
        };
    }, [query]);

    return (
        <div ref={wrapperRef} className={`${styles.wrapper} ${mobile ? styles.mobile : ''}`}>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Search plants, combos, hampers..."
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
                        <div className={styles.searchMessage}>Searching...</div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((item) => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.href}
                                    className={styles.resultItem}
                                    onClick={() => { setIsOpen(false); setQuery(''); }}
                                >
                                    <div className={styles.resultImageWrap}>
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className={styles.resultImage}
                                            />
                                        ) : (
                                            <span className={styles.resultPlaceholder}>🌱</span>
                                        )}
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <span className={styles.resultName}>{item.name}</span>
                                        <div className={styles.resultMeta}>
                                            <span className={styles.resultPrice}>
                                                ₹{item.price.toLocaleString('en-IN')}
                                            </span>
                                            <span className={`${styles.typeBadge} ${styles[`type_${item.type}`] || ''}`}>
                                                {TYPE_LABELS[item.type] || item.type}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            <div className={styles.searchFooter}>
                                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                            </div>
                        </>
                    ) : (
                        <div className={styles.searchMessage}>
                            No results for &ldquo;{query}&rdquo;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
