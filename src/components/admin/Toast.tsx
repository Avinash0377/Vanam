'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { CheckIcon, XIcon } from '@/components/Icons';
import styles from './Toast.module.css';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    kind: ToastKind;
    message: string;
}

interface ToastContextValue {
    show: (message: string, kind?: ToastKind) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message: string, kind: ToastKind = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, kind, message }]);
        setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 3000);
    }, [dismiss]);

    const value: ToastContextValue = {
        show,
        success: (m) => show(m, 'success'),
        error: (m) => show(m, 'error'),
        info: (m) => show(m, 'info'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.toastStack} role="status" aria-live="polite">
                {toasts.map(t => (
                    <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setEntered(true), 10);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={`${styles.toast} ${styles[toast.kind]} ${entered ? styles.enter : ''}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
        >
            <span className={styles.icon} aria-hidden="true">
                {toast.kind === 'success' ? <CheckIcon size={16} /> : toast.kind === 'error' ? <XIcon size={16} /> : <span className={styles.dot} />}
            </span>
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.close} onClick={onDismiss} aria-label="Dismiss">
                <XIcon size={14} />
            </button>
        </div>
    );
}
