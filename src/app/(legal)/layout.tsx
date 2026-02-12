import styles from './layout.module.css';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {children}
            </div>
        </div>
    );
}
