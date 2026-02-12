'use client';

import { useEffect } from 'react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin error:', error);
    }, [error]);

    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '480px',
                background: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}>
                <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#1a4d2e',
                    margin: '1rem 0 0.5rem',
                }}>
                    Dashboard Error
                </h2>
                <p style={{
                    color: '#666',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                }}>
                    Something went wrong loading this admin page.
                </p>
                <p style={{
                    color: '#999',
                    marginBottom: '1.5rem',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    background: '#f5f5f5',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    wordBreak: 'break-word',
                }}>
                    {error.message || 'Unknown error'}
                </p>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.6rem 1.5rem',
                        backgroundColor: '#1a4d2e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        </div>
    );
}
