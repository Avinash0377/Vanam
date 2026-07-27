import Link from 'next/link';
import { LeafIcon, PhoneIcon, MailIcon, WhatsAppIcon, ArrowRightIcon, SunIcon, PlantIcon, PotIcon, SeedlingIcon } from '@/components/Icons';
import styles from './Footer.module.css';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        {/* Decorative floating icons (mobile only, hidden on desktop via CSS) */}
                        <div className={styles.brandDecor} aria-hidden="true">
                            <span className={`${styles.decorIcon} ${styles.decorSun}`}><SunIcon size={38} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorPlant}`}><PlantIcon size={44} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorPot}`}><PotIcon size={40} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorSeedling}`}><SeedlingIcon size={28} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorLeaf1}`}><LeafIcon size={20} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorLeaf2}`}><LeafIcon size={16} /></span>
                            <span className={`${styles.decorIcon} ${styles.decorLeaf3}`}><LeafIcon size={14} /></span>
                        </div>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoIcon}><LeafIcon size={22} /></span>
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
                                <a href="tel:+918897249374" className={styles.contactLink}>
                                    <span className={styles.contactIcon}><PhoneIcon size={18} /></span>
                                    <span className={styles.contactText}>
                                        <span className={styles.contactLabel}>Call us</span>
                                        <span className={styles.contactValue}>+91 88972 49374</span>
                                    </span>
                                    <ArrowRightIcon size={15} className={styles.contactChevron} />
                                </a>
                            </li>
                            <li className={styles.contactItem}>
                                <a href="mailto:vanamstore@gmail.com" className={styles.contactLink}>
                                    <span className={styles.contactIcon}><MailIcon size={18} /></span>
                                    <span className={styles.contactText}>
                                        <span className={styles.contactLabel}>Email</span>
                                        <span className={styles.contactValue}>vanamstore@gmail.com</span>
                                    </span>
                                    <ArrowRightIcon size={15} className={styles.contactChevron} />
                                </a>
                            </li>
                            <li className={`${styles.contactItem} ${styles.whatsappItem}`}>
                                <a
                                    href="https://wa.me/918897249374"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.whatsappBtn}
                                >
                                    <WhatsAppIcon size={18} />
                                    <span>Chat on WhatsApp</span>
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
