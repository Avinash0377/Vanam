'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawRedirect = searchParams.get('redirect') || '/';
    // Prevent open redirect: only allow relative paths starting with /
    const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
    const mode = searchParams.get('mode');
    const { login } = useAuth();

    const [isRegister, setIsRegister] = useState(mode === 'register');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        credential: '', // For login: email or mobile
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // Detect if input is email or mobile
    const isEmail = (value: string) => value.includes('@');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        let body;
        if (isRegister) {
            body = {
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email || undefined,
                password: formData.password,
            };
        } else {
            // Auto-detect email vs mobile
            const cred = formData.credential.trim();
            body = isEmail(cred)
                ? { email: cred, password: formData.password }
                : { mobile: cred, password: formData.password };
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            login(data.token, data.user);
            router.push(redirect);

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
                        <span className={styles.icon}>🌿</span>
                        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                        <p>{isRegister ? 'Join Vanam Store today' : 'Login to your account'}</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {isRegister && (
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        )}

                        {isRegister ? (
                            <>
                                <div className={styles.formGroup}>
                                    <label htmlFor="login-mobile">Mobile Number</label>
                                    <input
                                        id="login-mobile"
                                        type="tel"
                                        name="mobile"
                                        autoComplete="tel"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="login-email">Email (Optional)</label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={styles.formGroup}>
                                <label htmlFor="credential">Email or Mobile Number</label>
                                <input
                                    id="credential"
                                    type="text"
                                    name="credential"
                                    autoComplete="username"
                                    value={formData.credential}
                                    onChange={handleChange}
                                    placeholder="Enter email or mobile number"
                                    required
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="password">Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
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

                        {!isRegister && (
                            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                                <Link
                                    href="/forgot-password"
                                    style={{ fontSize: '0.8125rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 500 }}
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p>
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                type="button"
                                onClick={() => setIsRegister(!isRegister)}
                                className={styles.switchBtn}
                            >
                                {isRegister ? 'Login' : 'Register'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <span className={styles.icon}>🌿</span>
                        <h1>Loading...</h1>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}
