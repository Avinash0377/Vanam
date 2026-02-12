'use client';

import Link from 'next/link';
import styles from './CategoryStrip.module.css';
import {
    PlantIcon,
    StackedPotsIcon,
    CombosIcon,
    SeedsIcon,
    GiftPlantIcon,
    ShovelIcon
} from './Icons';

export default function CategoryStrip() {
    const categories = [
        {
            name: 'Plants',
            slug: 'plants',
            icon: <PlantIcon size={28} color="#1a4d2e" className={styles.categoryIcon} />
        },
        {
            name: 'Pots',
            slug: 'pots',
            icon: <StackedPotsIcon size={28} color="#f59e0b" className={styles.categoryIcon} />
        },
        {
            name: 'Seeds',
            slug: 'seeds',
            icon: <SeedsIcon size={28} color="#059669" className={styles.categoryIcon} />
        },
        {
            name: 'Accessories',
            slug: 'accessories',
            icon: <ShovelIcon size={28} color="#8b5cf6" className={styles.categoryIcon} />
        },
        {
            name: 'Gifts',
            slug: 'gift-hampers',
            icon: <GiftPlantIcon size={28} color="#ec4899" className={styles.categoryIcon} />
        },
        {
            name: 'Combos',
            slug: 'combos',
            icon: <CombosIcon size={28} color="#164027" className={styles.categoryIcon} />
        },
    ];

    return (
        <nav className={styles.strip} aria-label="Shop categories">
            <div className={styles.scrollContainer}>
                {categories.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={`/${cat.slug}`}
                        className={styles.category}
                    >
                        <span className={styles.icon}>{cat.icon}</span>
                        <span className={styles.label}>{cat.name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
