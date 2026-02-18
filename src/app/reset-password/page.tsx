'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../forgot-password/page.module.css';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!token) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <span className={styles.icon}>❌</span>
                            <h1>Invalid Reset Link</h1>
                            <p>This password reset link is invalid or has expired. Please request a new one.</p>
                        </div>
                        <div className={styles.footer}>
                            <p>
                                <Link href="/forgot-password" className={styles.footerLink}>
                                    Request New Reset Link
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setSuccess(data.message);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <span className={styles.icon}>🔒</span>
                        <h1>Reset Password</h1>
                        <p>Enter your new password below.</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success} Redirecting to login...</div>}

                    {!success && (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="password">New Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <div className={styles.footer}>
                        <p>
                            <Link href="/login" className={styles.footerLink}>
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.header}>
                            <span className={styles.icon}>🔒</span>
                            <h1>Loading...</h1>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
