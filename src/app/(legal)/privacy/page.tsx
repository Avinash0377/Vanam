import { Metadata } from 'next';
import styles from '../layout.module.css';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Vanam Store privacy policy - how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
    return (
        <>
            <div className={styles.header}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.subtitle}>Your Privacy is Important to Us</p>
                <p className={styles.lastUpdated}>Last updated: February 2026</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Information We Collect</h2>
                    <div className={styles.text}>
                        <p>When you use Vanam Store, we collect information to provide better services:</p>
                        <ul>
                            <li><strong>Personal Information:</strong> Name, email, phone number, and delivery address when you place an order</li>
                            <li><strong>Payment Information:</strong> Processed securely through Razorpay (we don't store card details)</li>
                            <li><strong>Usage Data:</strong> Pages visited, products viewed, and shopping preferences</li>
                            <li><strong>Device Information:</strong> Browser type, device type, and IP address for security</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
                    <div className={styles.text}>
                        <ul>
                            <li>Process and deliver your orders</li>
                            <li>Send order confirmations and shipping updates</li>
                            <li>Provide customer support and plant care guidance</li>
                            <li>Improve our website and product offerings</li>
                            <li>Send promotional offers (only with your consent)</li>
                            <li>Prevent fraud and ensure security</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Information Sharing</h2>
                    <div className={styles.text}>
                        <p>We do not sell your personal information. We only share data with:</p>
                        <ul>
                            <li><strong>Delivery Partners:</strong> To ship your orders</li>
                            <li><strong>Payment Processors:</strong> Razorpay for secure transactions</li>
                            <li><strong>Legal Requirements:</strong> When required by law</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Data Security</h2>
                    <div className={styles.text}>
                        <p>We implement industry-standard security measures:</p>
                        <ul>
                            <li>SSL encryption for all data transmission</li>
                            <li>Secure payment processing via Razorpay</li>
                            <li>Regular security audits and updates</li>
                            <li>Restricted access to personal data</li>
                        </ul>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Your Rights</h2>
                    <div className={styles.text}>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account</li>
                            <li>Opt-out of promotional communications</li>
                        </ul>
                        <div className={styles.highlight}>
                            <p>To exercise these rights, contact us at vanamstore@gmail.com</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Cookies</h2>
                    <div className={styles.text}>
                        <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can manage cookie preferences in your browser settings.</p>
                    </div>
                </section>

                <div className={styles.contactBox}>
                    <h3>Privacy Concerns?</h3>
                    <p>Contact our privacy team</p>
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
