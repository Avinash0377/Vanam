'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNavBar from '@/components/BottomNavBar';
import { trackPageView } from '@/lib/analytics';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');

    // Fire PageView on every SPA route change.
    // Skip the first render: the Pixel base code in layout.tsx already fires
    // PageView on initial page load, so we only track subsequent navigations.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        trackPageView(pathname ?? '/');
    }, [pathname]);

    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <div className="app-wrapper">
                        {!isAdminPage && <Navbar />}
                        <main className="main-content">
                            {children}
                        </main>
                        {!isAdminPage && <Footer />}
                        {/* Mobile Bottom Navigation - CSS handles visibility */}
                        {!isAdminPage && <BottomNavBar />}
                    </div>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}

