'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
    const [credential, setCredential] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEmail = (value: string) => value.includes('@');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const cred = credential.trim();
            const body = isEmail(cred)
                ? { email: cred }
                : { mobile: cred };

            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setSuccess(data.message);
            setCredential('');
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
                        <span className={styles.icon}>🔑</span>
                        <h1>Forgot Password</h1>
                        <p>Enter your email or mobile number and we&apos;ll send you a link to reset your password.</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}

                    {!success && (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="credential">Email or Mobile Number</label>
                                <input
                                    id="credential"
                                    type="text"
                                    value={credential}
                                    onChange={(e) => setCredential(e.target.value)}
                                    placeholder="Enter your email or mobile number"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    <div className={styles.footer}>
                        <p>
                            Remember your password?
                            <Link href="/login" className={styles.footerLink}>
                                Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
