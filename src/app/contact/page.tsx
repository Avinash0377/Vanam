'use client';

import { useState, FormEvent } from 'react';
import {
    MessageIcon, MapPinIcon, PhoneIcon, MailIcon, ClockIcon,
    WhatsAppIcon, CheckIcon
} from '@/components/Icons';
import styles from './page.module.css';

const contactInfo = [
    { icon: 'location', label: 'Address', value: 'Hyderabad, Telangana, India' },
    { icon: 'phone', label: 'Phone', value: '+91 88972 49374', href: 'tel:+918897249374' },
    { icon: 'mail', label: 'Email', value: 'vanamstore@gmail.com', href: 'mailto:vanamstore@gmail.com' },
    { icon: 'clock', label: 'Hours', value: 'Mon - Sat: 9am - 7pm' },
];

const faqs = [
    {
        q: 'Do you deliver pan-India?',
        a: 'Yes! We deliver to most locations across India. Delivery charges vary based on location and is free above ₹999.'
    },
    {
        q: 'How do you ensure plants arrive healthy?',
        a: 'We use custom-designed packaging with proper ventilation and support to ensure plants arrive fresh and undamaged.'
    },
    {
        q: 'What if my plant arrives damaged?',
        a: 'We offer a 7-day replacement guarantee. Just share a photo of the damaged plant and we\'ll send a replacement.'
    },
    {
        q: 'Do you offer bulk/corporate orders?',
        a: 'Yes! We offer special pricing for bulk orders. Contact us on WhatsApp for custom quotes.'
    },
];

const getContactIcon = (iconName: string) => {
    const iconProps = { size: 22, color: '#16a34a' };
    switch (iconName) {
        case 'location': return <MapPinIcon {...iconProps} />;
        case 'phone': return <PhoneIcon {...iconProps} />;
        case 'mail': return <MailIcon {...iconProps} />;
        case 'clock': return <ClockIcon {...iconProps} />;
        default: return <MapPinIcon {...iconProps} />;
    }
};

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('sending');

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus('sent');
        setFormData({ name: '', email: '', phone: '', message: '' });
    };

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.badge}>Get in Touch</span>
                    <h1 className={styles.title}>Contact Us</h1>
                    <p className={styles.subtitle}>
                        Have a question? We'd love to hear from you. Send us a message or
                        connect on WhatsApp for instant support.
                    </p>
                </div>

                {/* WhatsApp CTA */}
                <div className={styles.whatsappCta}>
                    <div className={styles.ctaIcon}>
                        <MessageIcon size={28} color="#16a34a" />
                    </div>
                    <div className={styles.ctaContent}>
                        <h3>Quick Response on WhatsApp</h3>
                        <p>Get instant answers to your questions</p>
                    </div>
                    <a
                        href="https://wa.me/918897249374?text=Hi!%20I%20have%20a%20question%20about%20your%20plants."
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappBtn}
                    >
                        <WhatsAppIcon size={18} color="white" />
                        Chat Now
                    </a>
                </div>

                <div className={styles.mainGrid}>
                    {/* Contact Form */}
                    <div className={styles.formSection}>
                        <h2>Send us a Message</h2>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="phone">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="message">Your Message</label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    placeholder="How can we help you?"
                                />
                            </div>
                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? 'Sending...' :
                                    status === 'sent' ? (
                                        <><CheckIcon size={18} color="white" /> Message Sent!</>
                                    ) :
                                        'Send Message'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className={styles.infoSection}>
                        <h2>Contact Information</h2>
                        <div className={styles.infoCards}>
                            {contactInfo.map((info, idx) => (
                                <div key={idx} className={styles.infoCard}>
                                    <span className={styles.infoIcon}>{getContactIcon(info.icon)}</span>
                                    <div>
                                        <span className={styles.infoLabel}>{info.label}</span>
                                        {info.href ? (
                                            <a href={info.href} className={styles.infoValue}>{info.value}</a>
                                        ) : (
                                            <span className={styles.infoValue}>{info.value}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map placeholder */}
                        <div className={styles.mapPlaceholder}>
                            <MapPinIcon size={48} color="#16a34a" />
                            <span>Hyderabad, Telangana</span>
                        </div>
                    </div>
                </div>

                {/* FAQs */}
                <div className={styles.faqSection}>
                    <h2>Frequently Asked Questions</h2>
                    <div className={styles.faqGrid}>
                        {faqs.map((faq, idx) => (
                            <div key={idx} className={styles.faqCard}>
                                <h3>{faq.q}</h3>
                                <p>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
