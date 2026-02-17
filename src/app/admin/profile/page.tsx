'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    UserIcon,
    MailIcon,
    PhoneIcon,
    CalendarIcon,
    ShieldIcon,
    EditIcon,
    PackageIcon,
    PlantIcon,
    UsersIcon,
    TrendingUpIcon,
} from '@/components/Icons';
import styles from './page.module.css';

interface AdminProfile {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    role: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
}

interface Stats {
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    totalRevenue: number;
}

export default function AdminProfilePage() {
    const { token, user: authUser, login } = useAuth();
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Edit form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formMobile, setFormMobile] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const fetchProfile = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data.user);
                setStats(data.stats);
            } else {
                setError(data.error || 'Failed to load profile');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const startEditing = () => {
        if (!profile) return;
        setFormName(profile.name);
        setFormEmail(profile.email || '');
        setFormMobile(profile.mobile);
        setCurrentPassword('');
        setNewPassword('');
        setError('');
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setError('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const body: Record<string, string> = {};
            if (formName !== profile?.name) body.name = formName;
            if (formEmail !== (profile?.email || '')) body.email = formEmail;
            if (formMobile !== profile?.mobile) body.mobile = formMobile;
            if (newPassword) {
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            if (Object.keys(body).length === 0) {
                setError('No changes to save');
                setSaving(false);
                return;
            }

            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setProfile(data.user);
                setSuccess(data.message || 'Profile updated!');
                setEditing(false);

                // Update AuthContext with new user data so sidebar etc. reflects changes
                if (token && data.user) {
                    login(token, {
                        id: data.user.id,
                        name: data.user.name,
                        mobile: data.user.mobile,
                        email: data.user.email || undefined,
                        role: data.user.role as 'CUSTOMER' | 'ADMIN',
                    });
                }
            } else {
                setError(data.error || 'Failed to update');
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerIcon}>
                    <UserIcon size={24} color="white" />
                </div>
                <div>
                    <h1 className={styles.title}>Admin Profile</h1>
                    <p className={styles.subtitle}>Manage your account settings</p>
                </div>
            </div>

            {/* Messages */}
            {success && <div className={styles.successMsg}>✓ {success}</div>}
            {error && !editing && <div className={styles.errorMsg}>⚠ {error}</div>}

            <div className={styles.grid}>
                {/* Profile Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <span className={styles.cardTitleIcon}><UserIcon size={18} /></span>
                            Profile Details
                        </h2>
                        {!editing && (
                            <button className={styles.editBtn} onClick={startEditing}>
                                <EditIcon size={14} /> Edit
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} className={styles.formGrid}>
                            {error && <div className={styles.errorMsg}>⚠ {error}</div>}

                            <div className={styles.formGroup}>
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className={styles.input}
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    className={styles.input}
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mobile Number</label>
                                <input
                                    type="tel"
                                    value={formMobile}
                                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className={styles.input}
                                    placeholder="10-digit mobile"
                                    required
                                />
                            </div>

                            <div className={styles.formDivider} />

                            <div className={styles.formGroup}>
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className={styles.input}
                                    placeholder="Required to change password"
                                />
                                <span className={styles.formHint}>Only needed if changing password</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={styles.input}
                                    placeholder="Min 6 characters"
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.saveBtn} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" className={styles.cancelBtn} onClick={cancelEditing}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {/* Avatar & Name */}
                            <div className={styles.profileTop}>
                                <div className={styles.avatar}>
                                    <span className={styles.avatarLetter}>
                                        {(profile?.name || authUser?.name || 'A').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className={styles.profileName}>{profile?.name || authUser?.name}</h3>
                                <span className={styles.roleBadge}>
                                    <ShieldIcon size={12} color="white" /> Administrator
                                </span>
                            </div>

                            {/* Info Fields */}
                            <div className={styles.infoList}>
                                <div className={styles.infoField}>
                                    <span className={styles.infoIcon}><PhoneIcon size={18} /></span>
                                    <div>
                                        <span className={styles.infoLabel}>Mobile</span>
                                        <span className={styles.infoValue}>{profile?.mobile || '—'}</span>
                                    </div>
                                </div>

                                <div className={styles.infoField}>
                                    <span className={styles.infoIcon}><MailIcon size={18} /></span>
                                    <div>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={`${styles.infoValue} ${!profile?.email ? styles.infoEmpty : ''}`}>
                                            {profile?.email || 'Not set'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.infoField}>
                                    <span className={styles.infoIcon}><CalendarIcon size={18} /></span>
                                    <div>
                                        <span className={styles.infoLabel}>Account Created</span>
                                        <span className={styles.infoValue}>
                                            {profile?.createdAt ? formatDate(profile.createdAt) : '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.infoField}>
                                    <span className={styles.infoIcon}><ShieldIcon size={18} /></span>
                                    <div>
                                        <span className={styles.infoLabel}>Last Login</span>
                                        <span className={styles.infoValue}>
                                            {profile?.lastLoginAt ? formatDateTime(profile.lastLoginAt) : 'Never recorded'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Stats Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <span className={styles.cardTitleIcon}><TrendingUpIcon size={18} /></span>
                            Store Overview
                        </h2>
                    </div>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <PackageIcon size={24} color="#6366f1" />
                            <div className={styles.statValue}>{stats?.totalOrders ?? 0}</div>
                            <div className={styles.statLabel}>Total Orders</div>
                        </div>

                        <div className={styles.statCard}>
                            <PlantIcon size={24} color="#16a34a" />
                            <div className={styles.statValue}>{stats?.totalProducts ?? 0}</div>
                            <div className={styles.statLabel}>Products</div>
                        </div>

                        <div className={styles.statCard}>
                            <UsersIcon size={24} color="#f59e0b" />
                            <div className={styles.statValue}>{stats?.totalCustomers ?? 0}</div>
                            <div className={styles.statLabel}>Customers</div>
                        </div>

                        <div className={styles.statCard}>
                            <TrendingUpIcon size={24} color="#10b981" />
                            <div className={styles.statValue}>
                                {stats ? formatCurrency(stats.totalRevenue) : '₹0'}
                            </div>
                            <div className={styles.statLabel}>Revenue</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
