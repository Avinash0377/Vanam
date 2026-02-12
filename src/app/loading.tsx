import Skeleton, { ProductCardSkeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function HomeLoading() {
    return (
        <div className={styles.page}>
            {/* Hero Section Skeleton */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroContent}>
                        <Skeleton variant="rectangular" width={140} height={36} />
                        <div style={{ marginTop: '1.5rem' }}>
                            <Skeleton variant="text" width="80%" height={48} />
                            <Skeleton variant="text" width="60%" height={48} />
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <Skeleton variant="text" width="70%" height={20} />
                            <Skeleton variant="text" width="50%" height={20} />
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <Skeleton variant="rectangular" width={160} height={52} />
                            <Skeleton variant="rectangular" width={160} height={52} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Skeleton variant="rectangular" width={120} height={28} className="mx-auto" />
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                            <Skeleton variant="text" width={300} height={36} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} variant="circular" width={150} height={150} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section style={{ padding: '4rem 0', background: 'var(--neutral-50)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Skeleton variant="rectangular" width={120} height={28} className="mx-auto" />
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                            <Skeleton variant="text" width={280} height={36} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {[1, 2, 3, 4].map(i => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
