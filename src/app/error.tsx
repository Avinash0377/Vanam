'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App error:', error);
    }, [error]);

    return (
        <div style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '480px',
            }}>
                <span style={{ fontSize: '3rem' }}>🌿</span>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#1a4d2e',
                    margin: '1rem 0 0.5rem',
                }}>
                    Something went wrong
                </h1>
                <p style={{
                    color: '#666',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                }}>
                    We&apos;re sorry, something unexpected happened. Please try again.
                </p>
                <button
                    onClick={reset}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#1a4d2e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                    }}
                >
                    Try Again
                </button>
                <a
                    href="/"
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: 'transparent',
                        color: '#1a4d2e',
                        border: '1px solid #1a4d2e',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block',
                    }}
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
