'use client';

import { useState, useEffect, useCallback } from 'react';
import { BellIcon } from '@/components/Icons';
import styles from './page.module.css';

interface NotificationSettings {
    adminEmail: string;
    orderAlertsEnabled: boolean;
    lowStockAlertsEnabled: boolean;
    customerEmailsEnabled: boolean;
    lowStockThreshold: number;
}

export default function NotificationSettingsPage() {
    const [settings, setSettings] = useState<NotificationSettings>({
        adminEmail: '',
        orderAlertsEnabled: true,
        lowStockAlertsEnabled: true,
        customerEmailsEnabled: true,
        lowStockThreshold: 5,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const fetchSettings = useCallback(async () => {
        try {
            const token = localStorage.getItem('vanam_token');
            const res = await fetch('/api/admin/notification-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        setSuccess('');
        setError('');

        try {
            const token = localStorage.getItem('vanam_token');
            const res = await fetch('/api/admin/notification-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setSuccess('Settings saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save settings');
            }
        } catch {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!settings.adminEmail) {
            setError('Please enter an admin email first');
            return;
        }

        setTesting(true);
        setSuccess('');
        setError('');

        try {
            const token = localStorage.getItem('vanam_token');
            const res = await fetch('/api/admin/notification-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: settings.adminEmail }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message);
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(data.error || 'Failed to send test email');
            }
        } catch {
            setError('Failed to send test email');
        } finally {
            setTesting(false);
        }
    };

    const toggleSetting = (key: keyof NotificationSettings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.headerIcon}><BellIcon size={22} /></div>
                    <h1>Notification Settings</h1>
                </div>
                <div className={styles.skeleton}>
                    <div className={styles.skeletonCard}>
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLine} />
                    </div>
                    <div className={styles.skeletonCard}>
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLine} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerIcon}><BellIcon size={22} /></div>
                <h1>Notification Settings</h1>
            </div>

            {success && <div className={styles.success}>{success}</div>}
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.content}>
                {/* Admin Email */}
                <div className={styles.card}>
                    <h3>📧 Admin Email</h3>
                    <p>Order alerts and low stock notifications will be sent to this email.</p>
                    <div className={styles.formRow}>
                        <label>Admin Notification Email</label>
                        <input
                            type="email"
                            value={settings.adminEmail}
                            onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                            placeholder="admin@example.com"
                        />
                    </div>
                </div>

                {/* Toggle Settings */}
                <div className={styles.card}>
                    <h3>🔔 Alert Preferences</h3>
                    <p>Control which email notifications are sent.</p>

                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <strong>New Order Alerts</strong>
                            <span>Get notified when a new order is placed</span>
                        </div>
                        <button
                            className={`${styles.toggle} ${settings.orderAlertsEnabled ? styles.toggleActive : ''}`}
                            onClick={() => toggleSetting('orderAlertsEnabled')}
                            aria-label="Toggle order alerts"
                        />
                    </div>

                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <strong>Low Stock Alerts</strong>
                            <span>Get notified when product stock is running low</span>
                        </div>
                        <button
                            className={`${styles.toggle} ${settings.lowStockAlertsEnabled ? styles.toggleActive : ''}`}
                            onClick={() => toggleSetting('lowStockAlertsEnabled')}
                            aria-label="Toggle low stock alerts"
                        />
                    </div>

                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <strong>Customer Emails</strong>
                            <span>Send order confirmation and status updates to customers</span>
                        </div>
                        <button
                            className={`${styles.toggle} ${settings.customerEmailsEnabled ? styles.toggleActive : ''}`}
                            onClick={() => toggleSetting('customerEmailsEnabled')}
                            aria-label="Toggle customer emails"
                        />
                    </div>
                </div>

                {/* Low Stock Threshold */}
                <div className={styles.card}>
                    <h3>📦 Low Stock Threshold</h3>
                    <p>Get alerted when product stock drops to or below this number.</p>
                    <div className={styles.formRow}>
                        <label>Threshold (units)</label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={settings.lowStockThreshold}
                            onChange={(e) => setSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button
                        className={styles.testBtn}
                        onClick={handleTestEmail}
                        disabled={testing || !settings.adminEmail}
                    >
                        {testing ? 'Sending...' : '📨 Send Test Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}
