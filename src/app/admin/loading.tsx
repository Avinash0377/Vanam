import Skeleton, { StatCardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function AdminDashboardLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={120} height={16} />
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Revenue Cards */}
                <div className={styles.revenueGrid}>
                    <Skeleton variant="rectangular" height={120} />
                    <Skeleton variant="rectangular" height={120} />
                </div>

                {/* Content Grid */}
                <div className={styles.contentGrid}>
                    <div className={styles.card}>
                        <Skeleton variant="text" width={150} height={20} />
                        <div style={{ marginTop: '1rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--neutral-100)' }}>
                                    <Skeleton variant="text" width="80%" height={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.card}>
                        <Skeleton variant="text" width={150} height={20} />
                        <div style={{ marginTop: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--neutral-100)' }}>
                                    <Skeleton variant="text" width="60%" height={16} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
