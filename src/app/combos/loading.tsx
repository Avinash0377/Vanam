import Skeleton, { ProductCardSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function CombosLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <Skeleton variant="rectangular" width={120} height={32} />
                    <Skeleton variant="text" width={300} height={40} />
                    <Skeleton variant="text" width={200} height={20} />
                </div>

                {/* Product Grid */}
                <div className={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
