'use client';

import ProductCard from '@/components/ProductCard';
import { GiftIcon, RibbonIcon, MailIcon, CalendarIcon, FlowerIcon, ButterflyIcon, WhatsAppIcon } from '@/components/Icons';
import styles from './page.module.css';

interface Hamper {
    id: string;
    name: string;
    slug: string;
    description?: string;
    giftWrap: boolean;
    messageCard: boolean;
    price: number;
    comparePrice?: number;
    stock: number;
    images: string[];
    featured?: boolean;
}

interface HampersClientProps {
    initialHampers: Hamper[];
}

export default function HampersClient({ initialHampers }: HampersClientProps) {
    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroContent}>
                        <span className={styles.heroBadge}>
                            <GiftIcon size={16} />
                            Perfect for Every Occasion
                        </span>
                        <h1 className={styles.heroTitle}>
                            <span className={styles.highlight}>Nature's</span> Gifts
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Give the gift of life and growth. Thoughtfully curated plant hampers
                            that bring joy and serenity to your loved ones. Includes premium eco-friendly packaging.
                        </p>
                        <div className={styles.heroStats}>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>500+</span>
                                <span className={styles.statLabel}>Happy Gifting</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>4.9★</span>
                                <span className={styles.statLabel}>Star Rating</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statValue}>Eco</span>
                                <span className={styles.statLabel}>Friendly Wrap</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.heroDecor}></div>
            </section>

            <div className="container">
                {/* Features */}
                <div className={styles.features}>
                    <div className={styles.featureItem}>
                        <span className={styles.featureIcon}><RibbonIcon size={24} /></span>
                        <div>
                            <h4>Premium Gift Wrap</h4>
                            <p>Beautiful eco-packaging</p>
                        </div>
                    </div>
                    <div className={styles.featureItem}>
                        <span className={styles.featureIcon}><MailIcon size={24} /></span>
                        <div>
                            <h4>Message Card</h4>
                            <p>Personalized wishes</p>
                        </div>
                    </div>
                    <div className={styles.featureItem}>
                        <span className={styles.featureIcon}><CalendarIcon size={24} /></span>
                        <div>
                            <h4>Scheduled Delivery</h4>
                            <p>Pick your date</p>
                        </div>
                    </div>
                </div>

                {/* Hampers Grid */}
                {initialHampers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FlowerIcon size={48} />
                        <p>No gift hampers available yet.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Check back soon for our curated collection!</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {initialHampers.map((hamper) => (
                            <ProductCard
                                key={hamper.id}
                                id={hamper.id}
                                name={hamper.name}
                                slug={hamper.slug}
                                price={hamper.price}
                                comparePrice={hamper.comparePrice}
                                image={hamper.images?.[0] || undefined}
                                stock={hamper.stock}
                                type="hamper"
                                featured={hamper.featured}
                                tags={hamper.giftWrap ? ['Gift Wrapped'] : []}
                                giftCount={50}
                            />
                        ))}
                    </div>
                )}

                {/* Custom Hamper CTA */}
                <div className={styles.customCta}>
                    <div className={styles.ctaContent}>
                        <span className={styles.ctaIcon}><ButterflyIcon size={32} /></span>
                        <div>
                            <h3>Need a Custom Gift?</h3>
                            <p>Let us create a personalized plant hamper tailored just for your special someone! We can mix and match plants, pots, and goodies.</p>
                        </div>
                    </div>
                    <a
                        href="https://wa.me/918897249374?text=Hi!%20I'd%20like%20to%20create%20a%20custom%20gift%20hamper."
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappBtn}
                    >
                        <WhatsAppIcon size={20} color="white" />
                        Chat on WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}
