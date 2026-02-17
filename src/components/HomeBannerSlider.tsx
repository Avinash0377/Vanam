'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HomeBannerSlider.module.css';

interface BannerData {
    id: string;
    title: string;
    subtitle: string | null;
    highlightText: string | null;
    accentBadge: string | null;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string | null;
    secondaryBtnLink: string | null;
    bgGradient: string;
    imageUrl: string | null;
    textColor: string;
}

export default function HomeBannerSlider() {
    const [banners, setBanners] = useState<BannerData[]>([]);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));

    useEffect(() => {
        fetch('/api/banners')
            .then(res => res.json())
            .then(data => setBanners(data.banners || []))
            .catch(() => { });
    }, []);

    const total = banners.length;

    const next = useCallback(() => {
        if (total === 0) return;
        setCurrent(prev => (prev + 1) % total);
    }, [total]);

    // Preload the next slide image
    useEffect(() => {
        if (total <= 1) return;
        const nextIdx = (current + 1) % total;
        setImagesLoaded(prev => new Set([...prev, nextIdx]));
    }, [current, total]);

    useEffect(() => {
        if (paused || total <= 1) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [next, paused, total]);

    if (banners.length === 0) return null;

    const isLight = (color: string) => {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 128;
        }
        return false;
    };

    return (
        <div
            className={styles.sliderWrapper}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
        >
            <div className={styles.slideTrackOuter}>
                <div
                    className={styles.slideTrack}
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {banners.map((banner, index) => {
                        const txtColor = banner.textColor || '#ffffff';
                        const isDark = !isLight(txtColor);
                        const isFirst = index === 0;
                        const shouldLoad = isFirst || imagesLoaded.has(index);

                        return (
                            <div
                                key={banner.id}
                                className={styles.slide}
                                style={{ background: banner.bgGradient }}
                            >
                                {/* Next.js optimized Image — auto WebP, responsive, lazy */}
                                {banner.imageUrl && shouldLoad && (
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        fill
                                        sizes="100vw"
                                        quality={75}
                                        priority={isFirst}
                                        className={styles.slideImage}
                                    />
                                )}
                                {/* Dark overlay for readability */}
                                <div className={styles.slideOverlay} />

                                <div className={styles.slideContent}>
                                    {banner.accentBadge && (
                                        <span
                                            className={styles.accentBadge}
                                            style={{
                                                color: isDark ? '#ffffff' : '#1a1a1a',
                                                background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            {banner.accentBadge}
                                        </span>
                                    )}

                                    <h2 className={styles.slideTitle} style={{ color: txtColor }}>
                                        {banner.title}
                                        {banner.highlightText && (
                                            <>
                                                {' '}
                                                <span className={styles.titleHighlight} style={{
                                                    WebkitTextFillColor: 'unset',
                                                    color: isDark ? '#a7f3d0' : '#065f46',
                                                }}>
                                                    {banner.highlightText}
                                                </span>
                                            </>
                                        )}
                                    </h2>

                                    {banner.subtitle && (
                                        <p className={styles.slideSubtext} style={{
                                            color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)',
                                        }}>
                                            {banner.subtitle}
                                        </p>
                                    )}

                                    <div className={styles.slideActions}>
                                        <Link href={banner.primaryBtnLink} className={styles.primaryBtn}>
                                            <span>{banner.primaryBtnText}</span>
                                            <span className={styles.btnArrow}>→</span>
                                        </Link>
                                        {banner.secondaryBtnText && banner.secondaryBtnLink && (
                                            <Link
                                                href={banner.secondaryBtnLink}
                                                className={styles.secondaryBtn}
                                                style={{
                                                    color: txtColor,
                                                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                                }}
                                            >
                                                {banner.secondaryBtnText}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dot indicators */}
            {total > 1 && (
                <div className={styles.dots}>
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                            onClick={() => setCurrent(i)}
                            aria-label={`Go to banner ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
