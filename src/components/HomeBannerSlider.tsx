'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    titleColor: string | null;
    subtitleColor: string | null;
}

interface HomeBannerSliderProps {
    initialBanners: BannerData[];
}

// Moved outside component — pure function, no need to recreate on every render
function isLight(color: string): boolean {
    if (color && color.startsWith('#') && color.length >= 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 128;
    }
    return false;
}

export default function HomeBannerSlider({ initialBanners }: HomeBannerSliderProps) {
    const banners = initialBanners;
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    // Use a ref for imagesLoaded to avoid state-triggered re-renders for preloading
    const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(() => new Set([0]));
    const pausedRef = useRef(paused);
    pausedRef.current = paused;

    const total = banners.length;

    const next = useCallback(() => {
        if (total === 0) return;
        setCurrent(prev => (prev + 1) % total);
    }, [total]);

    // Preload next slide image without triggering full re-render cascade
    useEffect(() => {
        if (total <= 1) return;
        const nextIdx = (current + 1) % total;
        setImagesLoaded(prev => {
            if (prev.has(nextIdx)) return prev; // no-op if already loaded
            const next = new Set(prev);
            next.add(nextIdx);
            return next;
        });
    }, [current, total]);

    useEffect(() => {
        if (paused || total <= 1) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [next, paused, total]);

    // Stable touch handlers — no inline lambda on every render
    const handleTouchStart = useCallback(() => setPaused(true), []);
    const handleTouchEnd = useCallback(() => setPaused(false), []);

    if (banners.length === 0) return null;

    return (
        <div
            className={styles.sliderWrapper}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className={styles.slideTrackOuter}>
                <div
                    className={styles.slideTrack}
                    style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
                >
                    {banners.map((banner, index) => {
                        const txtColor = banner.textColor || '#ffffff';
                        const dark = !isLight(txtColor);
                        const titleClr = banner.titleColor || txtColor;
                        const subtitleClr = banner.subtitleColor || (dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)');
                        const isFirst = index === 0;
                        const shouldLoad = isFirst || imagesLoaded.has(index);

                        return (
                            <div
                                key={banner.id}
                                className={styles.slide}
                                style={banner.imageUrl
                                    ? { backgroundColor: '#111' }
                                    : { background: banner.bgGradient }
                                }
                            >
                                {banner.imageUrl && shouldLoad && (
                                    <Image
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        fill
                                        sizes="100vw"
                                        quality={70}
                                        priority={isFirst}
                                        className={styles.slideImage}
                                    />
                                )}
                                <div className={styles.slideOverlay} />

                                <div className={styles.slideContent}>
                                    {banner.accentBadge && (
                                        <span
                                            className={styles.accentBadge}
                                            style={{
                                                color: dark ? '#ffffff' : '#1a1a1a',
                                                background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                            }}
                                        >
                                            {banner.accentBadge}
                                        </span>
                                    )}

                                    <h2 className={styles.slideTitle} style={{ color: titleClr }}>
                                        {banner.title}
                                        {banner.highlightText && (
                                            <>
                                                {' '}
                                                <span
                                                    className={styles.titleHighlight}
                                                    style={{ color: subtitleClr }}
                                                >
                                                    {banner.highlightText}
                                                </span>
                                            </>
                                        )}
                                    </h2>

                                    {banner.subtitle && (
                                        <p className={styles.slideSubtext} style={{ color: subtitleClr }}>
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
                                                    color: titleClr,
                                                    borderColor: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
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
