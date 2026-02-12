import { Metadata } from 'next';
import styles from '../layout.module.css';

export const metadata: Metadata = {
    title: 'Returns & Refunds',
    description: 'Vanam Store returns and refunds policy. Learn about our 7-day replacement guarantee for plants.',
};

export default function ReturnsPage() {
    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Returns & Refunds</h1>
                <p className={styles.subtitle}>Your Satisfaction is Our Priority</p>
                <p className={styles.lastUpdated}>Last updated: February 2026</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>7-Day Replacement Guarantee</h2>
                    <div className={styles.text}>
                        <p>We stand behind the quality of our plants. If your plant arrives damaged or unhealthy, we offer a hassle-free replacement within 7 days of delivery.</p>
                        <div className={styles.highlight}>
                            <p>🌱 We want your plants to thrive! If there's any issue, we'll make it right.</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Eligible for Return/Replacement</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>Plant arrived dead or severely damaged</li>
                            <li>Wrong plant or product delivered</li>
                            <li>Missing items from your order</li>
                            <li>Broken pots or planters during transit</li>
                            <li>Quality significantly different from description</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Not Eligible for Return</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>Minor leaf damage or yellowing (natural transit stress)</li>
                            <li>Requests after 7 days of delivery</li>
                            <li>Damage caused by improper care after delivery</li>
                            <li>Change of mind or wrong order by customer</li>
                            <li>Seeds and bulbs (due to nature of product)</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>How to Request a Return</h2>
                    <div className={styles.text}>
                        <p>Follow these simple steps:</p>
                        <ul>
                            <li><strong>Step 1:</strong> Take clear photos of the damaged plant/product</li>
                            <li><strong>Step 2:</strong> WhatsApp us at +91 88972 49374 within 24 hours of delivery</li>
                            <li><strong>Step 3:</strong> Our team will review and respond within 24 hours</li>
                            <li><strong>Step 4:</strong> If approved, we'll arrange replacement or refund</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Refund Process</h2>
                    <div className={styles.text}>
                        <p>Once your return is approved:</p>
                        <ul>
                            <li>Refunds are processed within 5-7 business days</li>
                            <li>Amount will be credited to original payment method</li>
                            <li>You'll receive email confirmation once processed</li>
                        </ul>
                    </div>
                </section>

                <div className={styles.contactBox}>
                    <h3>Need to report an issue?</h3>
                    <p>Contact us within 24 hours of delivery for fastest resolution</p>
                    <div className={styles.contactLinks}>
                        <a href="https://wa.me/918897249374?text=Hi!%20I%20need%20help%20with%20my%20order" target="_blank" rel="noopener noreferrer">
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
