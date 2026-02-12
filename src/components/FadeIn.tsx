'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';

interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    duration?: number;
    fullWidth?: boolean;
}

export default function FadeIn({
    children,
    className = "",
    delay = 0,
    direction = 'up',
    duration = 0.4,
    fullWidth = false
}: FadeInProps) {
    const ref = useRef(null);
    // Trigger animation earlier and only once
    const isInView = useInView(ref, { once: true, margin: "50px 0px -50px 0px" });

    const variants = useMemo(() => {
        const distance = 30; // Reduced distance for snappier feel

        const initial: Record<string, number> = { opacity: 0 };

        switch (direction) {
            case 'up': initial.y = distance; break;
            case 'down': initial.y = -distance; break;
            case 'left': initial.x = distance; break;
            case 'right': initial.x = -distance; break;
        }

        const animate = {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number] // Smooth easeOutQuint
            }
        };

        return { initial, animate };
    }, [direction, duration, delay]);

    return (
        <motion.div
            ref={ref}
            initial={variants.initial}
            animate={isInView ? variants.animate : variants.initial}
            className={className}
            style={{
                width: fullWidth ? '100%' : 'auto',
                willChange: 'transform, opacity',
                transform: 'translateZ(0)' // Force GPU layer
            }}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "50px 0px -50px 0px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.08, // Faster stagger
                        delayChildren: delay
                    }
                }
            }}
            className={className}
            style={{
                willChange: 'opacity',
                transform: 'translateZ(0)'
            }}
        >
            {children}
        </motion.div>
    );
}
