'use client';

import styles from './Skeleton.module.css';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
}

export default function Skeleton({
    variant = 'rectangular',
    width,
    height,
    count = 1,
    className = ''
}: SkeletonProps) {
    const style = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : variant === 'circular' ? width : undefined),
        borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : undefined,
    };

    const items = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`${styles.skeleton} ${styles[variant]} ${className}`}
            style={style}
        />
    ));

    return count === 1 ? items[0] : <>{items}</>;
}

// Pre-built skeleton patterns
export function ProductCardSkeleton() {
    return (
        <div className={styles.productCard}>
            <Skeleton variant="rectangular" height={200} className={styles.image} />
            <div className={styles.content}>
                <Skeleton variant="text" width="60%" height={14} />
                <Skeleton variant="text" width="80%" height={18} />
                <Skeleton variant="text" width="40%" height={16} />
            </div>
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className={styles.tableRow}>
            {Array.from({ length: columns }, (_, i) => (
                <td key={i}>
                    <Skeleton variant="text" height={16} />
                </td>
            ))}
        </tr>
    );
}

export function StatCardSkeleton() {
    return (
        <div className={styles.statCard}>
            <Skeleton variant="circular" width={48} height={48} />
            <div className={styles.statContent}>
                <Skeleton variant="text" width={60} height={28} />
                <Skeleton variant="text" width={80} height={14} />
            </div>
        </div>
    );
}

export function CategoryCardSkeleton() {
    return (
        <div className={styles.categoryCard}>
            <Skeleton variant="rectangular" height={160} className={styles.image} />
            <div className={styles.content}>
                <Skeleton variant="text" width="70%" height={18} />
                <Skeleton variant="text" width="100%" height={14} />
                <Skeleton variant="text" width="50%" height={12} />
            </div>
        </div>
    );
}
