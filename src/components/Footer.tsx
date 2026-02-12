import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}>🌿</span>
                            <span className={styles.logoText}>
                                Vanam<span className={styles.logoAccent}>Store</span>
                            </span>
                        </Link>
                        <p className={styles.tagline}>Rooted in Nature</p>
                        <p className={styles.description}>
                            Your trusted online plant nursery. We deliver happiness in the form of plants,
                            pots, and green gift hampers.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.column}>
                        <h4 className={styles.columnTitle}>Shop</h4>
                        <ul className={styles.links}>
                            <li><Link href="/plants">Indoor Plants</Link></li>
                            <li><Link href="/plants?type=outdoor">Outdoor Plants</Link></li>
                            <li><Link href="/pots">Pots & Planters</Link></li>
                            <li><Link href="/combos">Combo Offers</Link></li>
                            <li><Link href="/gift-hampers">Gift Hampers</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div className={styles.column}>
                        <h4 className={styles.columnTitle}>Help</h4>
                        <ul className={styles.links}>
                            <li><Link href="/about">About Us</Link></li>
                            <li><Link href="/contact">Contact</Link></li>
                            <li><Link href="/shipping">Shipping Policy</Link></li>
                            <li><Link href="/returns">Returns & Refunds</Link></li>
                            <li><Link href="/faq">FAQs</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.column}>
                        <h4 className={styles.columnTitle}>Contact Us</h4>
                        <ul className={styles.contactList}>
                            <li className={styles.contactItem}>
                                <span className={styles.contactIcon}>📞</span>
                                <a href="tel:+918897249374">+91 88972 49374</a>
                            </li>
                            <li className={styles.contactItem}>
                                <span className={styles.contactIcon}>✉️</span>
                                <a href="mailto:vanamstore@gmail.com">vanamstore@gmail.com</a>
                            </li>
                            <li className={styles.contactItem}>
                                <span className={styles.contactIcon}>💬</span>
                                <a
                                    href="https://wa.me/918897249374"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    WhatsApp Us
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © {currentYear} Vanam Store. All rights reserved.
                    </p>
                    <div className={styles.legal}>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
