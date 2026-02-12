'use client';

import Link from 'next/link';
import {
    LeafIcon, HeartIcon, UsersIcon, AwardIcon, ArrowRightIcon,
    WhatsAppIcon, PlantIcon, StarIcon
} from '@/components/Icons';
import styles from './page.module.css';

const values = [
    { icon: 'plant', title: 'Quality First', description: 'Every plant is nurtured with care and shipped at peak health' },
    { icon: 'heart', title: 'Sustainability', description: 'Eco-friendly practices from growing to packaging' },
    { icon: 'users', title: 'Customer Love', description: 'Building lasting relationships with our plant parents' },
    { icon: 'award', title: 'Education', description: 'Empowering you with plant care knowledge' },
];

const milestones = [
    { year: '2020', event: 'Started as a small nursery in Hyderabad' },
    { year: '2021', event: 'Launched online store and began shipping pan-India' },
    { year: '2022', event: 'Reached 5,000+ happy customers' },
    { year: '2023', event: 'Expanded to gift hampers and corporate orders' },
    { year: '2024', event: 'Building India\'s most loved plant community' },
];

const getValueIcon = (iconName: string) => {
    const iconProps = { size: 36, color: '#16a34a' };
    switch (iconName) {
        case 'plant': return <PlantIcon {...iconProps} />;
        case 'heart': return <HeartIcon {...iconProps} />;
        case 'users': return <UsersIcon {...iconProps} />;
        case 'award': return <AwardIcon {...iconProps} />;
        default: return <LeafIcon {...iconProps} />;
    }
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <span className={styles.badge}>Our Story</span>
                    <h1 className={styles.title}>
                        Bringing <span>Nature</span> Closer to You
                    </h1>
                    <p className={styles.subtitle}>
                        We're on a mission to make every Indian home greener, healthier, and happier.
                        One plant at a time.
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section className={styles.story}>
                <div className="container">
                    <div className={styles.storyGrid}>
                        <div className={styles.storyImage}>
                            <LeafIcon size={120} color="#16a34a" />
                        </div>
                        <div className={styles.storyContent}>
                            <h2>Why Vanam?</h2>
                            <p>
                                <strong>Vanam</strong> means "forest" in Telugu. We believe everyone deserves
                                a piece of the forest in their home. Whether it's a tiny apartment or a
                                sprawling garden, we help you create your personal green sanctuary.
                            </p>
                            <p>
                                What started as a passion project has grown into a community of over
                                10,000 plant parents across India. We handpick every plant, ensuring
                                only the healthiest ones reach your doorstep.
                            </p>
                            <p>
                                From air-purifying indoor plants to beautiful garden varieties, from
                                designer pots to thoughtfully curated gift hampers — we're your one-stop
                                destination for all things green.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className={styles.values}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>What We Stand For</h2>
                    <div className={styles.valuesGrid}>
                        {values.map((value, idx) => (
                            <div key={idx} className={styles.valueCard}>
                                <span className={styles.valueIcon}>{getValueIcon(value.icon)}</span>
                                <h3>{value.title}</h3>
                                <p>{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className={styles.timeline}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>Our Journey</h2>
                    <div className={styles.timelineGrid}>
                        {milestones.map((milestone, idx) => (
                            <div key={idx} className={styles.milestoneCard}>
                                <span className={styles.year}>{milestone.year}</span>
                                <p>{milestone.event}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className="container">
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>500+</span>
                            <span className={styles.statLabel}>Plant Varieties</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>10,000+</span>
                            <span className={styles.statLabel}>Happy Customers</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>
                                4.9 <StarIcon size={24} color="#f59e0b" filled />
                            </span>
                            <span className={styles.statLabel}>Average Rating</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>25+</span>
                            <span className={styles.statLabel}>Cities Served</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className="container">
                    <div className={styles.ctaCard}>
                        <h2>Ready to Start Your Plant Journey?</h2>
                        <p>Browse our collection and find the perfect plant for your space.</p>
                        <div className={styles.ctaButtons}>
                            <Link href="/plants" className={styles.primaryBtn}>
                                Explore Plants
                                <ArrowRightIcon size={18} />
                            </Link>
                            <a
                                href="https://wa.me/918897249374"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappBtn}
                            >
                                <WhatsAppIcon size={18} color="white" />
                                Chat With Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
