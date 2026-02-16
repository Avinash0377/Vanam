'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { PlantIcon, PotIcon, PackageIcon, GiftIcon, UsersIcon, MessageIcon, ShovelIcon } from './Icons';
import SearchBar from './SearchBar';
import CategoryStrip from './CategoryStrip';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { isAuthenticated, user } = useAuth();
    const { summary } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const controlNavbar = () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;

            // Never hide if mobile menu or search is open
            if (mobileMenuOpen || mobileSearchOpen) {
                setIsVisible(true);
                lastScrollY = currentScrollY;
                ticking = false;
                return;
            }

            // Always show when near top
            if (currentScrollY < 100) {
                setIsVisible(true);
            } else if (scrollDelta > 10 && currentScrollY > 80) {
                // Only hide on significant downward scroll (10px+)
                setIsVisible(false);
            } else if (scrollDelta < -5) {
                // Show on any upward scroll (5px+)
                setIsVisible(true);
            }

            lastScrollY = currentScrollY;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(controlNavbar);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [mobileMenuOpen, mobileSearchOpen]);

    const navLinks = [
        { href: '/plants', label: 'Plants', icon: <PlantIcon size={18} /> },
        { href: '/seeds', label: 'Seeds', icon: <PlantIcon size={18} /> },
        { href: '/pots', label: 'Pots', icon: <PotIcon size={18} /> },
        { href: '/combos', label: 'Combos', icon: <PackageIcon size={18} /> },
        { href: '/gift-hampers', label: 'Gifts', icon: <GiftIcon size={18} /> },
        { href: '/accessories', label: 'Accessories', icon: <ShovelIcon size={18} /> },
        { href: '/about', label: 'About', icon: <UsersIcon size={18} /> },
        { href: '/contact', label: 'Contact', icon: <MessageIcon size={18} /> },
    ];

    return (
        <header className={`${styles.header} ${!isVisible ? styles.headerHidden : ''}`}>
            {/* Top Row: Logo | Search | Icons */}
            <div className={styles.topRow}>
                <div className={styles.topRowInner}>
                    {/* Mobile: Hamburger (left) */}
                    <button
                        className={styles.mobileToggle}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={mobileMenuOpen ? styles.xIcon : styles.menuIcon}></span>
                    </button>

                    {/* Logo (centered on mobile) */}
                    <Link href="/" className={styles.logo}>
                        <img src="/logo.png" alt="Vanam Store" className={styles.logoImage} />
                        <span className={styles.tagline}>ROOTED IN NATURE</span>
                    </Link>

                    {/* Wide Search Bar - Centered (desktop only) */}
                    <div className={styles.searchContainer}>
                        <SearchBar />
                    </div>

                    {/* Right Actions */}
                    <div className={styles.actions}>
                        {/* Mobile Search Icon */}
                        <button
                            className={styles.mobileSearchBtn}
                            onClick={() => { setMobileSearchOpen(!mobileSearchOpen); setMobileMenuOpen(false); }}
                            aria-label="Open search"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </button>

                        {/* User (desktop) */}
                        {isAuthenticated ? (
                            <Link href="/profile" className={styles.userBtn}>
                                <div className={styles.avatar}>{user?.name?.charAt(0) || 'U'}</div>
                                <span className={styles.userName}>{user?.name}</span>
                            </Link>
                        ) : (
                            <Link href="/login" className={styles.loginBtn}>
                                Login
                            </Link>
                        )}

                        {/* Cart */}
                        <Link href="/cart" className={styles.iconBtn} aria-label="Cart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            {summary.itemCount > 0 && (
                                <span className={styles.badge}>{summary.itemCount}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Navigation Links (Desktop) */}
            <nav className={styles.bottomRow}>
                <ul className={styles.navLinks}>
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className={styles.navLink}>
                                {link.icon}
                                <span>{link.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Mobile Category Strip */}
            <CategoryStrip />

            {/* Mobile Search Overlay */}
            {mobileSearchOpen && (
                <div className={styles.mobileSearchOverlay}>
                    <div className={styles.mobileSearchBar}>
                        <SearchBar mobile />
                        <button
                            className={styles.mobileSearchClose}
                            onClick={() => setMobileSearchOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <div className={styles.mobileSearch}>
                        <SearchBar mobile />
                    </div>
                    <div className={styles.mobileLinks}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={styles.mobileLink}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className={styles.mobileLinkIcon}>{link.icon}</span>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
