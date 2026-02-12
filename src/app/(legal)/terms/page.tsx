import { Metadata } from 'next';
import styles from '../layout.module.css';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Vanam Store terms and conditions for using our online plant nursery services.',
};

export default function TermsPage() {
    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Terms of Service</h1>
                <p className={styles.subtitle}>Terms & Conditions for Using Vanam Store</p>
                <p className={styles.lastUpdated}>Last updated: February 2026</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
                    <div className={styles.text}>
                        <p>By accessing and using Vanam Store (vanamstore.in), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Use of Website</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>You must be at least 18 years old to make purchases</li>
                            <li>You agree to provide accurate and complete information</li>
                            <li>You are responsible for maintaining account security</li>
                            <li>You agree not to use the site for unlawful purposes</li>
                            <li>We reserve the right to refuse service to anyone</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Products & Pricing</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>All prices are in Indian Rupees (INR) and inclusive of GST where applicable</li>
                            <li>We reserve the right to modify prices without prior notice</li>
                            <li>Product images are representative; actual plants may vary slightly</li>
                            <li>Stock availability is subject to change</li>
                            <li>We reserve the right to cancel orders due to pricing errors</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Orders & Payment</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>All orders are subject to acceptance and availability</li>
                            <li>Payment must be completed at time of order</li>
                            <li>We use Razorpay for secure payment processing</li>
                            <li>Order confirmation will be sent via email/SMS</li>
                            <li>We may cancel orders if fraud is suspected</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Plant Care Disclaimer</h2>
                    <div className={styles.text}>
                        <p>While we provide care guidelines, plant health after delivery depends on proper care by the customer. We are not responsible for:</p>
                        <ul>
                            <li>Plant damage due to improper watering or lighting</li>
                            <li>Natural leaf shedding or seasonal changes</li>
                            <li>Pest issues occurring after delivery</li>
                            <li>Allergic reactions to plants</li>
                        </ul>
                        <div className={styles.highlight}>
                            <p>💡 Always research plant toxicity if you have pets or children</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Intellectual Property</h2>
                    <div className={styles.text}>
                        <p>All content on this website including text, images, logos, and design is the property of Vanam Store. You may not reproduce, distribute, or use any content without written permission.</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
                    <div className={styles.text}>
                        <p>Vanam Store shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our liability is limited to the value of the products purchased.</p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Governing Law</h2>
                    <div className={styles.text}>
                        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.</p>
                    </div>
                </section>

                <div className={styles.contactBox}>
                    <h3>Questions about these terms?</h3>
                    <p>Contact us for clarification</p>
                    <div className={styles.contactLinks}>
                        <a href="mailto:vanamstore@gmail.com">
                            ✉️ vanamstore@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
