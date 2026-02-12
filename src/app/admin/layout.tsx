'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    DashboardIcon,
    PlantIcon,
    PackageIcon,
    FolderIcon,
    HomeIcon,
    LogoutIcon,
    UsersIcon,
    TrendingUpIcon,
    GiftIcon,
    TruckIcon,
} from '@/components/Icons';
import styles from './layout.module.css';

const navItems = [
    { href: '/admin', icon: DashboardIcon, label: 'Dashboard' },
    { href: '/admin/products', icon: PlantIcon, label: 'Products' },
    { href: '/admin/combos', icon: PackageIcon, label: 'Combos' },
    { href: '/admin/gift-hampers', icon: GiftIcon, label: 'Gift Hampers' },
    { href: '/admin/orders', icon: PackageIcon, label: 'Orders' },
    { href: '/admin/analytics', icon: FolderIcon, label: 'Analytics' },
    { href: '/admin/customers', icon: UsersIcon, label: 'Customers' },
    { href: '/admin/sales-reports', icon: TrendingUpIcon, label: 'Reports' },
    { href: '/admin/delivery-settings', icon: TruckIcon, label: 'Delivery' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin, isLoading, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push('/login?redirect=/admin');
        }
    }, [isAdmin, isLoading, router]);

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className={styles.adminLayout}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    className={styles.menuBtn}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <span className={styles.logo}><img src="/logo.png" alt="Vanam" className={styles.logoImage} /> Admin</span>
                <Link href="/" className={styles.homeBtn}><HomeIcon size={20} /></Link>
            </header>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <img src="/logo.png" alt="" className={styles.sidebarLogo} />
                    <span className={styles.sidebarLogoText}>Vanam</span>
                    <span className={styles.badge}>Admin</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navIcon}><item.icon size={20} /></span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <span className={styles.userAvatar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        <div>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userRole}>Administrator</span>
                        </div>
                    </div>
                    <div className={styles.footerActions}>
                        <Link href="/" className={styles.footerBtn}>
                            <HomeIcon size={18} /> View Store
                        </Link>
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            <LogoutIcon size={18} /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
