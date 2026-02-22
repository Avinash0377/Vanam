import styles from './page.module.css';

/**
 * Product page loading skeleton.
 * Shown instantly during navigation while the server fetches product data.
 * Uses the same CSS module as the main page for consistent layout.
 */
export default function ProductLoading() {
    return (
        <div className={styles.page}>
            <div className="container">
                <div className={styles.layout}>
                    {/* Image skeleton */}
                    <div className={styles.gallery}>
                        <div
                            className={styles.mainImage}
                            style={{
                                background: 'linear-gradient(110deg, #f0f0f0 8%, #e8e8e8 18%, #f0f0f0 33%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite linear',
                            }}
                        />
                    </div>

                    {/* Details skeleton */}
                    <div className={styles.details}>
                        {/* Category badge */}
                        <div style={{ width: 80, height: 16, borderRadius: 12, background: '#f0f0f0', marginBottom: 8 }} />
                        {/* Product name */}
                        <div style={{ width: '70%', height: 28, borderRadius: 8, background: '#f0f0f0', marginBottom: 12 }} />
                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                            <div style={{ width: 60, height: 24, borderRadius: 20, background: '#f0f0f0' }} />
                            <div style={{ width: 80, height: 24, borderRadius: 20, background: '#f0f0f0' }} />
                        </div>
                        {/* Price */}
                        <div style={{ width: 120, height: 32, borderRadius: 8, background: '#f0f0f0', marginBottom: 20 }} />
                        {/* Stock status */}
                        <div style={{ width: 100, height: 18, borderRadius: 8, background: '#f0f0f0', marginBottom: 20 }} />
                        {/* Description section */}
                        <div style={{ padding: 20, borderRadius: 12, background: '#f8f8f8', marginBottom: 20 }}>
                            <div style={{ width: 100, height: 18, borderRadius: 6, background: '#f0f0f0', marginBottom: 12 }} />
                            <div style={{ width: '100%', height: 14, borderRadius: 4, background: '#f0f0f0', marginBottom: 8 }} />
                            <div style={{ width: '85%', height: 14, borderRadius: 4, background: '#f0f0f0', marginBottom: 8 }} />
                            <div style={{ width: '60%', height: 14, borderRadius: 4, background: '#f0f0f0' }} />
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                            <div style={{ width: 120, height: 48, borderRadius: 12, background: '#f0f0f0' }} />
                            <div style={{ width: 160, height: 48, borderRadius: 12, background: '#e8f5e9' }} />
                            <div style={{ width: 180, height: 48, borderRadius: 12, background: '#e8f5e9' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Shimmer animation for the image */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
