'use client';

import { useState } from 'react';
import styles from './WhatsAppButton.module.css';
import { trackWhatsAppClick } from '@/lib/analytics';

const WHATSAPP_NUMBER = '918897249374'; // Country code + number
const PRE_FILLED_MESSAGE = `Hi 🌿 Thank you for reaching Vanam Store!
I'd be happy to help you choose the perfect plants 😊
Are you looking for indoor plants or outdoor plants?`;

export default function WhatsAppButton() {
    const [hovered, setHovered] = useState(false);

    const handleClick = () => {
        // Track first — no await, does not block navigation
        trackWhatsAppClick('floating_button');
        const encoded = encodeURIComponent(PRE_FILLED_MESSAGE);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={styles.wrapper}>
            {hovered && (
                <div className={styles.tooltip}>
                    Chat with us on WhatsApp
                </div>
            )}
            <button
                className={styles.button}
                onClick={handleClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-label="Chat on WhatsApp"
                title="Chat on WhatsApp"
            >
                {/* Pulse ring */}
                <span className={styles.pulse} />
                {/* WhatsApp SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className={styles.icon}
                    aria-hidden="true"
                >
                    <circle cx="24" cy="24" r="24" fill="#25D366" />
                    <path
                        fill="#fff"
                        d="M24 10C16.27 10 10 16.27 10 24c0 2.48.67 4.8 1.83 6.8L10 38l7.4-1.79A13.93 13.93 0 0 0 24 38c7.73 0 14-6.27 14-14S31.73 10 24 10zm0 25.4a11.4 11.4 0 0 1-5.8-1.58l-.42-.25-4.39 1.06 1.1-4.28-.28-.45A11.38 11.38 0 0 1 12.6 24C12.6 17.7 17.7 12.6 24 12.6S35.4 17.7 35.4 24 30.3 35.4 24 35.4zm6.26-8.55c-.34-.17-2.02-1-2.34-1.11-.32-.11-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.01-1.9-2.35-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H18.6c-.23 0-.6.09-.91.43-.31.34-1.2 1.17-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.42 3.7 5.87 5.19.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.02-.83 2.3-1.63.29-.8.29-1.49.2-1.63-.08-.14-.32-.23-.66-.4z"
                    />
                </svg>
            </button>
        </div>
    );
}
