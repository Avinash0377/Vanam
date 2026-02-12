import Skeleton, { ProductCardSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function PlantsLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <Skeleton variant="rectangular" width={120} height={32} />
                    <Skeleton variant="text" width={300} height={40} />
                    <Skeleton variant="text" width={200} height={20} />
                </div>

                {/* Layout */}
                <div className={styles.layout}>
                    {/* Sidebar (Desktop only) */}
                    <div className={styles.sidebar}>
                        <div className={styles.filterCard}>
                            <Skeleton variant="text" width={100} height={20} />
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} variant="text" width="80%" height={16} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div>
                        <div className={styles.grid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
