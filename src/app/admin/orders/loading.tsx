import Skeleton, { StatCardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function AdminOrdersLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <Skeleton variant="text" width={120} height={32} />
                        <Skeleton variant="text" width={100} height={16} />
                    </div>
                </div>

                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <Skeleton variant="rectangular" height={48} width={300} />
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} variant="rectangular" height={36} width={80} />
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th><Skeleton variant="text" width={60} height={14} /></th>
                                <th><Skeleton variant="text" width={80} height={14} /></th>
                                <th><Skeleton variant="text" width={50} height={14} /></th>
                                <th><Skeleton variant="text" width={50} height={14} /></th>
                                <th><Skeleton variant="text" width={60} height={14} /></th>
                                <th><Skeleton variant="text" width={70} height={14} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <TableRowSkeleton key={i} columns={6} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
