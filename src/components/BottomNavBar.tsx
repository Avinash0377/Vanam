'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './BottomNavBar.module.css';

export default function BottomNavBar() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const { summary } = useCart();

    // Hide on checkout/payment pages
    const hiddenRoutes = ['/checkout', '/payment'];
    if (hiddenRoutes.some(route => pathname.startsWith(route))) {
        return null;
    }

    const tabs = [
        {
            href: '/',
            label: 'Home',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
            exact: true,
        },
        {
            href: '/cart',
            label: 'Cart',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            ),
            badge: summary.itemCount > 0 ? summary.itemCount : null,
        },
        {
            href: isAuthenticated ? '/profile?tab=orders' : '/login',
            label: 'Orders',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
            ),
        },
        {
            href: isAuthenticated ? '/profile' : '/login',
            label: 'Account',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    const fullUrl = pathname + (typeof window !== 'undefined' ? window.location.search : '');

    const isActive = (tab: typeof tabs[0]) => {
        if (tab.exact) {
            return pathname === tab.href;
        }
        // For tabs with query params, match the full URL
        if (tab.href.includes('?')) {
            return fullUrl === tab.href || fullUrl.startsWith(tab.href + '&');
        }
        // For Account tab (/profile), only match if no query params
        if (tab.label === 'Account') {
            return pathname === tab.href && !fullUrl.includes('tab=orders');
        }
        return pathname.startsWith(tab.href);
    };

    return (
        <nav className={styles.bottomNav}>
            {tabs.map((tab) => (
                <Link
                    key={tab.href + tab.label}
                    href={tab.href}
                    className={`${styles.tab} ${isActive(tab) ? styles.active : ''}`}
                >
                    <span className={styles.iconWrapper}>
                        {tab.icon}
                        {tab.badge && <span className={styles.badge}>{tab.badge}</span>}
                    </span>
                    <span className={styles.label}>{tab.label}</span>
                </Link>
            ))}
        </nav>
    );
}
