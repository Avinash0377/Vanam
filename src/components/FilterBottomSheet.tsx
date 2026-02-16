'use client';

import { useEffect } from 'react';
import styles from './FilterBottomSheet.module.css';

interface FilterBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    sortValue: string;
    onSortChange: (value: string) => void;
    onApply: () => void;
}

export default function FilterBottomSheet({
    isOpen,
    onClose,
    sortValue,
    onSortChange,
    onApply,
}: FilterBottomSheetProps) {
    // Prevent body scroll when sheet is open & handle Escape key
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleKeyDown);

            // Focus the sheet for screen readers
            const sheet = document.getElementById('filter-bottom-sheet');
            sheet?.focus();

            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div className={styles.backdrop} onClick={onClose} role="button" aria-label="Close sort options" tabIndex={-1} />

            {/* Bottom Sheet */}
            <div
                id="filter-bottom-sheet"
                className={styles.sheet}
                role="dialog"
                aria-modal="true"
                aria-label="Sort options"
                tabIndex={-1}
            >
                <div className={styles.handle} />

                <div className={styles.header}>
                    <h3 className={styles.title}>Sort</h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Sort Options */}
                    <div className={styles.sortOptions}>
                        <button
                            className={`${styles.sortBtn} ${sortValue === '' ? styles.active : ''}`}
                            onClick={() => onSortChange('')}
                        >
                            Default
                        </button>
                        <button
                            className={`${styles.sortBtn} ${sortValue === 'price-asc' ? styles.active : ''}`}
                            onClick={() => onSortChange('price-asc')}
                        >
                            Price: Low → High
                        </button>
                        <button
                            className={`${styles.sortBtn} ${sortValue === 'price-desc' ? styles.active : ''}`}
                            onClick={() => onSortChange('price-desc')}
                        >
                            Price: High → Low
                        </button>
                    </div>
                </div>

                {/* Apply Button */}
                <div className={styles.footer}>
                    <button className={styles.clearBtn} onClick={() => onSortChange('')}>
                        Clear
                    </button>
                    <button className={styles.applyBtn} onClick={handleApply}>
                        Apply
                    </button>
                </div>
            </div>
        </>
    );
}

// Sort Button Component (renamed from FilterButton)
export function FilterButton({ onClick, activeCount }: { onClick: () => void; activeCount?: number }) {
    return (
        <button className={styles.filterButton} onClick={onClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M6 12h12M9 18h6" />
            </svg>
            <span>Sort</span>
            {activeCount && activeCount > 0 && (
                <span className={styles.filterBadge}>{activeCount}</span>
            )}
        </button>
    );
}

// Mobile Search Input Component
export function MobileSearchInput({ value, onChange, placeholder = "Search..." }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <div className={styles.mobileSearchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
                type="text"
                className={styles.mobileSearchInput}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {value && (
                <button className={styles.clearSearchBtn} onClick={() => onChange('')} aria-label="Clear search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// Mobile Filter Button Component (left side — opens filter options)
export function MobileFilterButton({ onClick, activeCount }: { onClick: () => void; activeCount?: number }) {
    return (
        <button className={styles.filterButton} onClick={onClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filter</span>
            {activeCount && activeCount > 0 && (
                <span className={styles.filterBadge}>{activeCount}</span>
            )}
        </button>
    );
}
