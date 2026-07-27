'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './BottomNavBar.module.css';

// useLayoutEffect logs a warning on the server. Fall back to useEffect during SSR.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function BottomNavBar() {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const { summary } = useCart();
    const { count: wishlistCount } = useWishlist();

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
            href: isAuthenticated ? '/wishlist' : '/login?redirect=/wishlist',
            label: 'Wishlist',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            ),
            badge: wishlistCount > 0 ? wishlistCount : null,
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

    // Sliding indicator (#5): measures the active tab's center on the icon
    // and slides a 32px pill to that position. Uses MutationObserver so it
    // stays in sync even when active state changes without a pathname change
    // (e.g. /profile ↔ /profile?tab=orders).
    const navRef = useRef<HTMLElement | null>(null);
    const [indicatorX, setIndicatorX] = useState<number | null>(null);

    useIsoLayoutEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const update = () => {
            const activeEl = nav.querySelector<HTMLElement>('[data-active="true"]');
            if (!activeEl) {
                setIndicatorX(null);
                return;
            }
            const navRect = nav.getBoundingClientRect();
            const rect = activeEl.getBoundingClientRect();
            const center = rect.left - navRect.left + rect.width / 2;
            setIndicatorX(prev => {
                const next = center - 16; // 16 = half of 32px pill
                return prev === next ? prev : next;
            });
        };
        update();
        window.addEventListener('resize', update);
        // Catch data-active changes that happen without a pathname update
        const observer = new MutationObserver(update);
        observer.observe(nav, {
            attributes: true,
            subtree: true,
            attributeFilter: ['data-active'],
        });
        return () => {
            window.removeEventListener('resize', update);
            observer.disconnect();
        };
    }, [pathname]);

    return (
        <nav ref={navRef} className={styles.bottomNav}>
            {indicatorX !== null && (
                <span
                    className={styles.activeIndicator}
                    style={{ transform: `translateX(${indicatorX}px)` }}
                    aria-hidden="true"
                />
            )}
            {tabs.map((tab) => {
                const active = isActive(tab);
                return (
                    <Link
                        key={tab.href + tab.label}
                        href={tab.href}
                        data-active={active ? 'true' : undefined}
                        data-flip-target={tab.label === 'Cart' ? 'cart' : undefined}
                        className={`${styles.tab} ${active ? styles.active : ''}`}
                    >
                        <span className={styles.iconWrapper}>
                            {tab.icon}
                            {tab.badge && <span className={styles.badge}>{tab.badge}</span>}
                        </span>
                        <span className={styles.label}>{tab.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
