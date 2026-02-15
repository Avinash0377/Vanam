import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import FadeIn, { StaggerContainer } from '@/components/FadeIn';
import {
    LeafIcon, PlantIcon, TruckIcon, MessageIcon,
    GiftIcon, CheckIcon, TreeIcon, PotIcon,
    WhatsAppIcon, ArrowRightIcon, ShieldIcon,
} from '@/components/Icons';
import styles from './page.module.css';

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';

const categories = [
    { name: 'Indoor Plants', slug: 'plants', icon: 'leaf', description: 'Air-purifying plants perfect for your living space', key: 'indoor', color: '#1a4d2e' },
    { name: 'Outdoor Plants', slug: 'outdoor-plants', icon: 'tree', description: 'Hardy plants that thrive in your garden', key: 'outdoor', color: '#164027' },
    { name: 'Seeds', slug: 'seeds', icon: 'seed', description: 'Premium quality seeds for your garden', key: 'seeds', color: '#059669' },
    { name: 'Pots & Planters', slug: 'pots', icon: 'pot', description: 'Handcrafted ceramic, cement & designer pots', key: 'pots', color: '#f59e0b' },
    { name: 'Gift Combos', slug: 'combos', icon: 'gift', description: 'Curated plant bundles at special prices', key: 'combos', color: '#ec4899' },
];

const features = [
    { icon: 'plant', title: 'Healthy Plants', description: 'Each plant is carefully nurtured and shipped at peak health with proper care instructions.' },
    { icon: 'truck', title: 'Safe Delivery', description: 'Custom-designed packaging ensures your plants arrive fresh and undamaged.' },
    { icon: 'message', title: 'Expert Support', description: 'Get personalized plant care guidance via WhatsApp from our horticulture experts.' },
    { icon: 'shield', title: '7-Day Guarantee', description: 'Not satisfied? Get a hassle-free replacement within 7 days of delivery.' },
];

const stats = [
    { number: '500+', label: 'Plant Varieties' },
    { number: '10,000+', label: 'Happy Customers' },
    { number: '4.9', label: 'Average Rating', suffix: '★' },
    { number: '99%', label: 'Positive Reviews' },
];

const getCategoryIcon = (iconName: string, color: string) => {
    const iconProps = { size: 32, color };
    switch (iconName) {
        // eslint-disable-next-line @next/next/no-img-element
        case 'leaf': return <img src="/icons/indoor.png" alt="Indoor" style={{ width: 32, height: 32 }} />;
        // eslint-disable-next-line @next/next/no-img-element
        case 'tree': return <img src="/icons/outdoor.png" alt="Outdoor" style={{ width: 32, height: 32 }} />;
        case 'seed': return <PlantIcon {...iconProps} />;
        case 'pot': return <PotIcon {...iconProps} />;
        case 'gift': return <GiftIcon {...iconProps} />;
        default: return <LeafIcon {...iconProps} />;
    }
};

const getFeatureIcon = (iconName: string) => {
    const iconProps = { size: 28, color: '#16a34a' };
    switch (iconName) {
        case 'plant': return <PlantIcon {...iconProps} />;
        case 'truck': return <TruckIcon {...iconProps} />;
        case 'message': return <MessageIcon {...iconProps} />;
        case 'shield': return <ShieldIcon {...iconProps} />;
        default: return <PlantIcon {...iconProps} />;
    }
};

export default async function HomePage() {
    // Fetch all data server-side in parallel
    const [
        featuredProducts,
        allPlants,
        pots,
        combos,
        giftHampers,
        indoorCount,
        outdoorCount,
        seedsCount,
        potsCount,
        combosCount,
    ] = await Promise.all([
        prisma.product.findMany({
            where: { status: 'ACTIVE', featured: true },
            take: 4,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.findMany({
            where: { status: 'ACTIVE', productType: 'PLANT' },
            take: 8,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.findMany({
            where: { status: 'ACTIVE', productType: 'POT' },
            take: 4,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.combo.findMany({
            where: { status: 'ACTIVE', featured: true },
            take: 4,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.giftHamper.findMany({
            where: { status: 'ACTIVE', featured: true },
            take: 4,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where: { status: 'ACTIVE', productType: 'PLANT', suitableFor: { in: ['INDOOR', 'BOTH'] } } }),
        prisma.product.count({ where: { status: 'ACTIVE', productType: 'PLANT', suitableFor: { in: ['OUTDOOR', 'BOTH'] } } }),
        prisma.product.count({ where: { status: 'ACTIVE', productType: 'SEED' } }),
        prisma.product.count({ where: { status: 'ACTIVE', productType: 'POT' } }),
        prisma.combo.count({ where: { status: 'ACTIVE' } }),
    ]);

    // If no featured, fallback to latest products
    const products = featuredProducts.length > 0
        ? featuredProducts
        : await prisma.product.findMany({
            where: { status: 'ACTIVE' },
            take: 4,
            orderBy: { createdAt: 'desc' },
        });

    // Split plants by suitability
    const indoorPlants = allPlants
        .filter(p => p.suitableFor === 'INDOOR' || p.suitableFor === 'BOTH')
        .slice(0, 4);
    const outdoorPlants = allPlants
        .filter(p => p.suitableFor === 'OUTDOOR' || p.suitableFor === 'BOTH')
        .slice(0, 4);

    const categoryCounts: Record<string, number> = {
        indoor: indoorCount,
        outdoor: outdoorCount,
        seeds: seedsCount,
        pots: potsCount,
        combos: combosCount,
    };

    // Serialize Prisma objects for client components (strips non-serializable fields, convert null→undefined)
    const serializeProduct = (p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        price: p.price as number,
        comparePrice: (p.comparePrice as number | null) ?? undefined,
        size: (p.size as string | null) ?? undefined,
        suitableFor: (p.suitableFor as string | null) ?? undefined,
        stock: p.stock as number,
        images: p.images as string[],
        featured: p.featured as boolean,
        productType: p.productType as string,
        sizeVariants: (p.sizeVariants || []) as { size: string; price: number; stock: number; colors: { name: string; hex: string; images: string[] }[] }[],
        tags: (p.tags || []) as string[],

    });

    return (
        <>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.heroGradient}></div>
                    <div className={styles.heroPattern}></div>

                    {/* Floating Decorative Elements */}
                    <div className={styles.floatingIcon1}><LeafIcon size={48} color="rgba(34, 197, 94, 0.2)" /></div>
                    <div className={styles.floatingIcon2}><PlantIcon size={40} color="rgba(34, 197, 94, 0.15)" /></div>
                    <div className={styles.floatingIcon3}><LeafIcon size={32} color="rgba(34, 197, 94, 0.18)" /></div>
                    <div className={styles.floatingIcon4}><PotIcon size={36} color="rgba(245, 158, 11, 0.2)" /></div>
                    <div className={styles.floatingIcon5}><LeafIcon size={28} color="rgba(34, 197, 94, 0.22)" /></div>
                    <div className={styles.floatingIcon6}><PlantIcon size={44} color="rgba(16, 185, 129, 0.15)" /></div>
                    <div className={styles.floatingIcon7}><PotIcon size={30} color="rgba(217, 119, 6, 0.18)" /></div>
                    <div className={styles.floatingIcon8}><LeafIcon size={38} color="rgba(34, 197, 94, 0.16)" /></div>
                    <div className={styles.floatingIcon9}><PlantIcon size={35} color="rgba(22, 163, 74, 0.2)" /></div>
                    <div className={styles.floatingIcon10}><LeafIcon size={26} color="rgba(74, 222, 128, 0.25)" /></div>
                    <div className={styles.floatingIcon11}>🌿</div>
                    <div className={styles.floatingIcon12}>🌱</div>
                    <div className={styles.floatingIcon13}>☀️</div>
                    <div className={styles.floatingIcon14}>🌳</div>
                    <div className={styles.floatingIcon15}>🪴</div>
                </div>

                <div className={styles.heroContainer}>
                    <div className={styles.heroContent}>
                        <span className={styles.mobileHeroAccent}>NATURE &bull; SIMPLIFIED</span>

                        <FadeIn direction="up" delay={0.1}>
                            <h1 className={styles.heroTitle}>
                                <span className={styles.mobileHeroLine}>Transform Your</span>
                                <span className={styles.mobileHeroLine}> Space with</span>
                                <span className={styles.heroHighlight}> Living Art</span>
                            </h1>
                        </FadeIn>

                        <p className={styles.mobileHeroSubtext}>
                            Handpicked plants delivered to your doorstep. Make every corner of your home come alive.
                        </p>

                        <FadeIn direction="up" delay={0.2}>
                            <div className={styles.heroBadge}>
                                <span className={styles.badgeDot}></span>
                                <span>🌱 Premium Quality Plants</span>
                            </div>
                        </FadeIn>

                        <FadeIn direction="up" delay={0.4}>
                            <div className={styles.heroActions}>
                                <Link href="/plants" className={styles.primaryBtn}>
                                    <span>Explore Plants</span>
                                    <ArrowRightIcon size={20} />
                                </Link>
                                <Link href="/combos" className={styles.secondaryBtn}>
                                    View Gift Combos
                                </Link>
                            </div>
                        </FadeIn>

                        <FadeIn direction="up" delay={0.5}>
                            <div className={styles.trustBadges}>
                                <div className={styles.trustItem}>
                                    <span className={styles.trustIcon}><CheckIcon size={14} color="#16a34a" /></span>
                                    <span>Healthy Plants Guaranteed</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <span className={styles.trustIcon}><CheckIcon size={14} color="#16a34a" /></span>
                                    <span>Expert Plant Care Support</span>
                                </div>
                                <div className={styles.trustItem}>
                                    <span className={styles.trustIcon}><CheckIcon size={14} color="#16a34a" /></span>
                                    <span>Secure Packaging</span>
                                </div>
                            </div>
                        </FadeIn>

                        <div className={styles.mobileHeroTrustStrip}>
                            &#10003; Healthy Guarantee &nbsp;&middot;&nbsp; &#10003; Secure Packaging &nbsp;&middot;&nbsp; &#10003; Expert Care
                        </div>
                    </div>

                    <div className={styles.heroVisual}>
                        <FadeIn direction="left" delay={0.3} className={styles.heroImageWrapper}>
                            <div className={styles.heroImageBg}></div>
                            <div className={styles.heroPlantImage}>
                                <Image
                                    src="/hero-plant.png"
                                    alt="Beautiful Monstera Plant"
                                    width={350}
                                    height={400}
                                    priority
                                    className={styles.heroPlantImg}
                                />
                            </div>

                            <div className={styles.floatingPlant1}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/snake-plant.png" alt="Snake Plant" className={styles.floatingPlantImg} />
                            </div>
                            <div className={styles.floatingPlant2}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/peace-lily.png" alt="Peace Lily" className={styles.floatingPlantImg} />
                            </div>
                            <div className={styles.floatingPlant3}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/pothos.png" alt="Pothos" className={styles.floatingPlantImg} />
                            </div>
                            <div className={styles.floatingPlant4}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/rubber-plant.png" alt="Rubber Plant" className={styles.floatingPlantImg} />
                            </div>
                            <div className={styles.floatingPlant5}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/succulent.png" alt="Succulent" className={styles.floatingPlantImgSmall} />
                            </div>

                            <div className={styles.floatingBadge1}>
                                <span className={styles.badgeEmoji}>🌿</span>
                                <span className={styles.badgeLabel}>500+ Varieties</span>
                            </div>
                            <div className={styles.floatingBadge2}>
                                <span className={styles.badgeEmoji}>💚</span>
                                <span className={styles.badgeLabel}>100% Organic</span>
                            </div>
                            <div className={styles.floatingBadge3}>
                                <span className={styles.badgeEmoji}>🪴</span>
                                <span className={styles.badgeLabel}>Expert Care Tips</span>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className={styles.categories}>
                <div className="container">
                    <FadeIn direction="up">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionBadge}>Shop by Category</span>
                            <h2 className={styles.sectionTitle}>Find Your Perfect Plant</h2>
                            <p className={styles.sectionDesc}>
                                Whether you&apos;re looking for air-purifying houseplants or garden beauties,
                                we have something for every corner of your home.
                            </p>
                        </div>
                    </FadeIn>

                    <StaggerContainer className={styles.categoryGrid}>
                        {categories.map((category) => (
                            <FadeIn key={category.slug} direction="up" className={styles.categoryWrapper} fullWidth>
                                <Link href={`/${category.slug}`} className={styles.categoryCard}>
                                    <div className={styles.categoryIcon} style={{ background: `${category.color}15` }}>
                                        {getCategoryIcon(category.icon, category.color)}
                                    </div>
                                    <div className={styles.categoryInfo}>
                                        <h3>{category.name}</h3>
                                        <p>{category.description}</p>
                                        <span className={styles.categoryCount}>{categoryCounts[category.key]} items <ArrowRightIcon size={14} /></span>
                                    </div>
                                </Link>
                            </FadeIn>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className={styles.featured}>
                <div className="container">
                    <FadeIn direction="up">
                        <div className={styles.featuredHeader}>
                            <div>
                                <span className={styles.sectionBadge}>Bestsellers</span>
                                <h2 className={styles.sectionTitle}>Featured Products</h2>
                                <p className={styles.sectionDesc}>
                                    Handpicked favorites that our customers can&apos;t stop talking about.
                                </p>
                            </div>
                            <Link href="/plants" className={styles.viewAllLink}>
                                View All Products
                                <ArrowRightIcon size={16} />
                            </Link>
                        </div>
                    </FadeIn>

                    <div className={styles.productGrid}>
                        {products.map((product, idx) => {
                            const p = serializeProduct(product as unknown as Record<string, unknown>);
                            return (
                                <FadeIn key={p.id} direction="up" delay={idx * 0.1}>
                                    <ProductCard
                                        id={p.id}
                                        name={p.name}
                                        slug={p.slug}
                                        price={p.price}
                                        comparePrice={p.comparePrice}
                                        image={p.images?.[0]}
                                        size={p.size}
                                        suitableFor={p.suitableFor}
                                        stock={p.stock}
                                        type={p.productType === 'POT' ? 'pot' : 'product'}
                                        featured={p.featured}
                                        sizeVariants={p.sizeVariants}

                                        productType={p.productType}
                                        tags={p.tags}
                                    />
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Indoor Plants Section */}
            {indoorPlants.length > 0 && (
                <section className={styles.featured}>
                    <div className="container">
                        <FadeIn direction="up">
                            <div className={styles.featuredHeader}>
                                <div>
                                    <span className={styles.sectionBadge}>🌿 Indoor Collection</span>
                                    <h2 className={styles.sectionTitle}>Indoor Plants</h2>
                                    <p className={styles.sectionDesc}>
                                        Air-purifying plants perfect for your living space, bedroom, or office.
                                    </p>
                                </div>
                                <Link href="/plants" className={styles.viewAllLink}>
                                    View All Indoor Plants
                                    <ArrowRightIcon size={16} />
                                </Link>
                            </div>
                        </FadeIn>

                        <div className={styles.productGrid}>
                            {indoorPlants.map((product, idx) => {
                                const p = serializeProduct(product as unknown as Record<string, unknown>);
                                return (
                                    <FadeIn key={p.id} direction="up" delay={idx * 0.1}>
                                        <ProductCard
                                            id={p.id}
                                            name={p.name}
                                            slug={p.slug}
                                            price={p.price}
                                            comparePrice={p.comparePrice}
                                            image={p.images?.[0]}
                                            size={p.size}
                                            suitableFor={p.suitableFor}
                                            stock={p.stock}
                                            type="product"
                                            sizeVariants={p.sizeVariants}

                                            productType={p.productType}
                                            tags={p.tags}
                                        />
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Outdoor Plants Section */}
            {outdoorPlants.length > 0 && (
                <section className={styles.featured}>
                    <div className="container">
                        <FadeIn direction="up">
                            <div className={styles.featuredHeader}>
                                <div>
                                    <span className={styles.sectionBadge}>🌳 Outdoor Collection</span>
                                    <h2 className={styles.sectionTitle}>Outdoor Plants</h2>
                                    <p className={styles.sectionDesc}>
                                        Beautiful flowering and garden plants that thrive in your outdoor space.
                                    </p>
                                </div>
                                <Link href="/plants" className={styles.viewAllLink}>
                                    View All Outdoor Plants
                                    <ArrowRightIcon size={16} />
                                </Link>
                            </div>
                        </FadeIn>

                        <div className={styles.productGrid}>
                            {outdoorPlants.map((product, idx) => {
                                const p = serializeProduct(product as unknown as Record<string, unknown>);
                                return (
                                    <FadeIn key={p.id} direction="up" delay={idx * 0.1}>
                                        <ProductCard
                                            id={p.id}
                                            name={p.name}
                                            slug={p.slug}
                                            price={p.price}
                                            comparePrice={p.comparePrice}
                                            image={p.images?.[0]}
                                            size={p.size}
                                            suitableFor={p.suitableFor}
                                            stock={p.stock}
                                            type="product"
                                            sizeVariants={p.sizeVariants}

                                            productType={p.productType}
                                            tags={p.tags}
                                        />
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Pots & Planters Section */}
            {pots.length > 0 && (
                <section className={styles.featured}>
                    <div className="container">
                        <FadeIn direction="up">
                            <div className={styles.featuredHeader}>
                                <div>
                                    <span className={styles.sectionBadge}>🪴 Pots Collection</span>
                                    <h2 className={styles.sectionTitle}>Pots &amp; Planters</h2>
                                    <p className={styles.sectionDesc}>
                                        Handcrafted ceramic, terracotta, and designer pots to showcase your plants.
                                    </p>
                                </div>
                                <Link href="/pots" className={styles.viewAllLink}>
                                    View All Pots
                                    <ArrowRightIcon size={16} />
                                </Link>
                            </div>
                        </FadeIn>

                        <div className={styles.productGrid}>
                            {pots.map((product, idx) => {
                                const p = serializeProduct(product as unknown as Record<string, unknown>);
                                return (
                                    <FadeIn key={p.id} direction="up" delay={idx * 0.1}>
                                        <ProductCard
                                            id={p.id}
                                            name={p.name}
                                            slug={p.slug}
                                            price={p.price}
                                            comparePrice={p.comparePrice}
                                            image={p.images?.[0]}
                                            size={p.size}
                                            stock={p.stock}
                                            type="pot"
                                            sizeVariants={p.sizeVariants}

                                            productType={p.productType}
                                            tags={p.tags}
                                        />
                                    </FadeIn>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Combo Offers Section */}
            {combos.length > 0 && (
                <section className={styles.featured}>
                    <div className="container">
                        <FadeIn direction="up">
                            <div className={styles.featuredHeader}>
                                <div>
                                    <span className={styles.sectionBadge}>📦 Special Bundles</span>
                                    <h2 className={styles.sectionTitle}>Combo Offers</h2>
                                    <p className={styles.sectionDesc}>
                                        Curated plant bundles at special prices. Save more when you buy together!
                                    </p>
                                </div>
                                <Link href="/combos" className={styles.viewAllLink}>
                                    View All Combos
                                    <ArrowRightIcon size={16} />
                                </Link>
                            </div>
                        </FadeIn>

                        <div className={styles.productGrid}>
                            {combos.map((combo, idx) => (
                                <FadeIn key={combo.id} direction="up" delay={idx * 0.1}>
                                    <ProductCard
                                        id={combo.id}
                                        name={combo.name}
                                        slug={combo.slug}
                                        price={combo.price}
                                        comparePrice={combo.comparePrice ?? undefined}
                                        image={combo.images?.[0]}
                                        stock={combo.stock}
                                        type="combo"
                                        featured={combo.featured}
                                        tags={['Value Pack', 'Save More']}
                                        suitableFor="BOTH"
                                    />
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gift Hampers Section */}
            {giftHampers.length > 0 && (
                <section className={styles.featured}>
                    <div className="container">
                        <FadeIn direction="up">
                            <div className={styles.featuredHeader}>
                                <div>
                                    <span className={styles.sectionBadge}>🎁 Perfect Gifts</span>
                                    <h2 className={styles.sectionTitle}>Gift Hampers</h2>
                                    <p className={styles.sectionDesc}>
                                        Beautifully wrapped plant gifts for every occasion. Make someone&apos;s day special!
                                    </p>
                                </div>
                                <Link href="/gift-hampers" className={styles.viewAllLink}>
                                    View All Gift Hampers
                                    <ArrowRightIcon size={16} />
                                </Link>
                            </div>
                        </FadeIn>

                        <div className={styles.productGrid}>
                            {giftHampers.map((hamper, idx) => (
                                <FadeIn key={hamper.id} direction="up" delay={idx * 0.1}>
                                    <ProductCard
                                        id={hamper.id}
                                        name={hamper.name}
                                        slug={hamper.slug}
                                        price={hamper.price}
                                        comparePrice={hamper.comparePrice ?? undefined}
                                        image={hamper.images?.[0]}
                                        stock={hamper.stock}
                                        type="hamper"
                                        featured={hamper.featured}
                                        tags={['Gift Ready', 'Premium']}
                                        suitableFor="BOTH"
                                    />
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className={styles.features}>
                <div className="container">
                    <FadeIn direction="up">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionBadge}>Why Choose Vanam</span>
                            <h2 className={styles.sectionTitle}>The Vanam Difference</h2>
                        </div>
                    </FadeIn>

                    <StaggerContainer className={styles.featuresGrid}>
                        {features.map((feature, idx) => (
                            <FadeIn key={idx} direction="up" delay={idx * 0.1}>
                                <div className={styles.featureCard}>
                                    <div className={styles.featureIcon}>
                                        {getFeatureIcon(feature.icon)}
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Gallery Section */}
            <section className={styles.gallery}>
                <div className="container">
                    <FadeIn direction="up">
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionBadge}>@vanamstore</span>
                            <h2 className={styles.sectionTitle}>Join Our Plant Community</h2>
                            <p className={styles.sectionDesc}>
                                Share your plant journey with us on Instagram!
                            </p>
                        </div>
                        <div className={styles.galleryGrid}>
                            {[LeafIcon, PlantIcon, TreeIcon, PotIcon, GiftIcon, LeafIcon].map((IconComponent, idx) => (
                                <FadeIn key={idx} direction="up" delay={idx * 0.05}>
                                    <div className={styles.galleryItem}>
                                        <IconComponent size={48} color="#16a34a" />
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className="container">
                    <FadeIn direction="up">
                        <div className={styles.ctaCard}>
                            <div className={styles.ctaContent}>
                                <h2>Ready to Go Green?</h2>
                                <p>
                                    Order directly via WhatsApp for personalized plant recommendations
                                    and instant support from our plant experts.
                                </p>
                                <div className={styles.ctaButtons}>
                                    <a
                                        href="https://wa.me/918897249374?text=Hi!%20I'd%20like%20to%20explore%20your%20plant%20collection."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.whatsappBtn}
                                    >
                                        <WhatsAppIcon size={20} color="white" />
                                        Chat on WhatsApp
                                    </a>
                                    <Link href="/plants" className={styles.browseBtn}>
                                        Browse Collection
                                    </Link>
                                </div>
                            </div>
                            <div className={styles.ctaVisual}>
                                <LeafIcon size={120} color="rgba(255,255,255,0.2)" />
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Stats Bar */}
            <section className={styles.statsBar}>
                <div className={styles.statsContainer}>
                    {stats.map((stat, idx) => (
                        <div key={idx} className={styles.statItem}>
                            <span className={styles.statNumber}>
                                {stat.number}{stat.suffix || ''}
                            </span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
