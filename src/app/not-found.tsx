import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 24px',
            background: '#f9fafb',
        }}>
            <div style={{ fontSize: '5rem', marginBottom: '16px', lineHeight: 1 }}>🌿</div>
            <h1 style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                fontWeight: 800,
                color: '#1a4d2e',
                margin: '0 0 12px',
                letterSpacing: '-0.03em',
            }}>
                Page Not Found
            </h1>
            <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                margin: '0 0 32px',
                maxWidth: '440px',
                lineHeight: 1.6,
            }}>
                Looks like this page got lost in the garden. Let&apos;s get you back on the right path.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        background: '#1a4d2e',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                    }}
                >
                    🏡 Back to Home
                </Link>
                <Link
                    href="/plants"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 28px',
                        background: '#f0fdf4',
                        color: '#1a4d2e',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        border: '1.5px solid #bbf7d0',
                        transition: 'background 0.2s',
                    }}
                >
                    🌱 Browse Plants
                </Link>
            </div>
        </div>
    );
}
