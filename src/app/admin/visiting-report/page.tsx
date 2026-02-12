'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function VisitingReportPage() {
    const { token } = useAuth();

    // Placeholder for visiting reports functionality
    // This could be a table of reports, a form to add a new visit, etc.
    // For now, I'll create a simple "Under Construction" or "Add Report" UI.

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Visiting Reports</h1>
                    <p className={styles.subtitle}>Track and manage site visits</p>
                </div>
                <button className="btn btn-primary" onClick={() => alert('Add Report feature coming soon!')}>
                    + Add Report
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📋</span>
                    <h3>No visiting reports yet</h3>
                    <p>Create a report to track site visits and customer interactions.</p>
                </div>
            </div>
        </div>
    );
}
