import Skeleton, { CategoryCardSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function AdminCategoriesLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <Skeleton variant="text" width={150} height={32} />
                        <Skeleton variant="text" width={100} height={16} />
                    </div>
                    <Skeleton variant="rectangular" width={140} height={44} />
                </div>

                {/* Grid */}
                <div className={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <CategoryCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
