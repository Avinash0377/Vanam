'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import styles from '../layout.module.css';
import faqStyles from './page.module.css';

interface FAQItem {
    question: string;
    answer: string;
}

const faqCategories: { title: string; faqs: FAQItem[] }[] = [
    {
        title: 'Ordering & Payment',
        faqs: [
            {
                question: 'How do I place an order?',
                answer: 'Simply browse our collection, add items to your cart, and proceed to checkout. You can pay using UPI (GPay, PhonePe, Paytm), credit/debit cards, or net banking via our secure Razorpay gateway.',
            },
            {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major payment methods including UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, Rupay), Net Banking, and Wallets via Razorpay.',
            },
            {
                question: 'Can I cancel my order?',
                answer: 'Orders can be cancelled within 2 hours of placing them. Once the order is processed for shipping, cancellation is not possible. Contact us on WhatsApp for urgent requests.',
            },
        ],
    },
    {
        title: 'Shipping & Delivery',
        faqs: [
            {
                question: 'How long does delivery take?',
                answer: 'Delivery typically takes 3-7 business days depending on your location. Metro cities receive orders faster (3-5 days), while remote areas may take 7-10 days.',
            },
            {
                question: 'Do you offer free shipping?',
                answer: 'Yes! We offer FREE shipping on all orders above ₹999. Orders below ₹999 have a flat shipping charge of ₹99.',
            },
            {
                question: 'How are plants packaged for shipping?',
                answer: 'We use custom-designed breathable packaging with root ball protection and moisture retention. Plants are packed in sturdy boxes to prevent damage during transit.',
            },
            {
                question: 'Can I track my order?',
                answer: 'Yes! Once your order is shipped, you will receive a tracking link via SMS/WhatsApp. You can also check order status in your account profile.',
            },
        ],
    },
    {
        title: 'Plant Care',
        faqs: [
            {
                question: 'My plant looks stressed after delivery. Is it normal?',
                answer: 'Yes, mild transit stress is normal. Keep the plant in indirect light, water lightly, and avoid direct sunlight for 2-3 days. Most plants recover within a week.',
            },
            {
                question: 'How often should I water my plants?',
                answer: 'Watering frequency depends on the plant type. Generally, check the top inch of soil - if dry, water thoroughly. We include care instructions with every plant.',
            },
            {
                question: 'Do you provide plant care support?',
                answer: 'Absolutely! Our plant experts are available on WhatsApp to help with any care questions. Just send us a photo and your query!',
            },
        ],
    },
    {
        title: 'Returns & Refunds',
        faqs: [
            {
                question: 'What is your return policy?',
                answer: 'We offer a 7-day replacement guarantee. If your plant arrives damaged or dead, contact us within 24 hours with photos for a quick replacement.',
            },
            {
                question: 'How do I report a damaged plant?',
                answer: 'WhatsApp us at +91 88972 49374 with photos of the damaged plant within 24 hours of delivery. Our team will process your replacement request promptly.',
            },
            {
                question: 'When will I receive my refund?',
                answer: 'Refunds are processed within 5-7 business days after approval and credited to your original payment method.',
            },
        ],
    },
];

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

    const toggleItem = (id: string) => {
        setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Frequently Asked Questions</h1>
                <p className={styles.subtitle}>Find answers to common questions</p>
            </div>

            <div className={faqStyles.faqContainer}>
                {faqCategories.map((category, catIndex) => (
                    <div key={catIndex} className={faqStyles.category}>
                        <h2 className={faqStyles.categoryTitle}>{category.title}</h2>
                        <div className={faqStyles.faqList}>
                            {category.faqs.map((faq, faqIndex) => {
                                const id = `${catIndex}-${faqIndex}`;
                                const isOpen = openItems[id];
                                return (
                                    <div key={id} className={`${faqStyles.faqItem} ${isOpen ? faqStyles.open : ''}`}>
                                        <button
                                            className={faqStyles.question}
                                            onClick={() => toggleItem(id)}
                                            aria-expanded={isOpen}
                                        >
                                            <span>{faq.question}</span>
                                            <span className={faqStyles.icon}>{isOpen ? '−' : '+'}</span>
                                        </button>
                                        {isOpen && (
                                            <div className={faqStyles.answer}>
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.contactBox}>
                <h3>Still have questions?</h3>
                <p>Our team is happy to help!</p>
                <div className={styles.contactLinks}>
                    <a href="https://wa.me/918897249374" target="_blank" rel="noopener noreferrer">
                        💬 Chat on WhatsApp
                    </a>
                    <a href="mailto:vanamstore@gmail.com">
                        ✉️ Email Us
                    </a>
                </div>
            </div>
        </>
    );
}
