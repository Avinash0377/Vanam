'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@/components/Icons';
import styles from '@/app/page.module.css';

const testimonials = [
    {
        name: 'Priya Sharma',
        location: 'Hyderabad',
        text: 'The plants arrived in perfect condition! The packaging was exceptional and the money plant I ordered is thriving. Will definitely order again.',
        rating: 5,
        product: 'Money Plant Golden'
    },
    {
        name: 'Rahul Verma',
        location: 'Bangalore',
        text: 'Best plant nursery online. I ordered a Snake Plant and Areca Palm - both are healthy and beautiful. The care guide included was very helpful.',
        rating: 5,
        product: 'Snake Plant'
    },
    {
        name: 'Sneha Reddy',
        location: 'Chennai',
        text: "Ordered the gift hamper for my friend's housewarming. It was beautifully packaged with a handwritten note. She loved it! Great service.",
        rating: 5,
        product: 'Plant Lover Gift Box'
    },
];

export default function TestimonialCarousel() {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <div className={styles.testimonialGrid}>
                {testimonials.map((testimonial, idx) => (
                    <div
                        key={idx}
                        className={`${styles.testimonialCard} ${idx === currentTestimonial ? styles.active : ''}`}
                    >
                        <div className={styles.testimonialStars}>
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <StarIcon key={i} size={18} color="#f59e0b" filled />
                            ))}
                        </div>
                        <p className={styles.testimonialText}>&ldquo;{testimonial.text}&rdquo;</p>
                        <div className={styles.testimonialAuthor}>
                            <div className={styles.authorAvatar}>
                                {testimonial.name.charAt(0)}
                            </div>
                            <div className={styles.authorInfo}>
                                <span className={styles.authorName}>{testimonial.name}</span>
                                <span className={styles.authorLocation}>{testimonial.location}</span>
                            </div>
                        </div>
                        <div className={styles.testimonialProduct}>
                            Purchased: {testimonial.product}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.testimonialDots}>
                {testimonials.map((_, idx) => (
                    <button
                        key={idx}
                        className={`${styles.dot} ${idx === currentTestimonial ? styles.activeDot : ''}`}
                        onClick={() => setCurrentTestimonial(idx)}
                    />
                ))}
            </div>
        </>
    );
}
