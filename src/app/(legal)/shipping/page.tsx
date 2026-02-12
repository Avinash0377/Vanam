import { Metadata } from 'next';
import styles from '../layout.module.css';

export const metadata: Metadata = {
    title: 'Shipping Policy',
    description: 'Learn about Vanam Store shipping policy, delivery times, and charges for plant delivery across India.',
};

export default function ShippingPage() {
    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Shipping Policy</h1>
                <p className={styles.subtitle}>Fast & Safe Plant Delivery Across India</p>
                <p className={styles.lastUpdated}>Last updated: February 2026</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery Areas</h2>
                    <div className={styles.text}>
                        <p>We deliver plants and gardening products across India. Currently, we ship to all major cities and towns via our trusted logistics partners.</p>
                        <ul>
                            <li>Pan-India delivery available</li>
                            <li>Special care packaging for live plants</li>
                            <li>Real-time order tracking</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Delivery Timeline</h2>
                    <div className={styles.text}>
                        <p>We process orders within 1-2 business days. Delivery times vary based on your location:</p>
                        <ul>
                            <li><strong>Metro Cities:</strong> 3-5 business days</li>
                            <li><strong>Tier 2 Cities:</strong> 5-7 business days</li>
                            <li><strong>Other Areas:</strong> 7-10 business days</li>
                        </ul>
                        <div className={styles.highlight}>
                            <p>📦 Orders placed before 12 PM are processed the same day!</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Shipping Charges</h2>
                    <div className={styles.text}>
                        <ul>
                            <li><strong>FREE Shipping</strong> on orders above ₹999</li>
                            <li>Orders below ₹999: ₹99 shipping charge</li>
                            <li>Express delivery available at additional cost</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Plant Packaging</h2>
                    <div className={styles.text}>
                        <p>We take extra care to ensure your plants arrive healthy and happy:</p>
                        <ul>
                            <li>Custom-designed breathable packaging</li>
                            <li>Root ball protection with moisture retention</li>
                            <li>Sturdy outer boxes to prevent damage</li>
                            <li>Care instruction card included with every order</li>
                        </ul>
                    </div>
                </section>

                <div className={styles.contactBox}>
                    <h3>Questions about shipping?</h3>
                    <p>Our team is here to help!</p>
                    <div className={styles.contactLinks}>
                        <a href="https://wa.me/918897249374" target="_blank" rel="noopener noreferrer">
                            💬 WhatsApp Us
                        </a>
                        <a href="mailto:vanamstore@gmail.com">
                            ✉️ Email Support
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
