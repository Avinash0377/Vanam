'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNavBar from '@/components/BottomNavBar';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');

    return (
        <AuthProvider>
            <CartProvider>
                <div className="app-wrapper">
                    {!isAdminPage && <Navbar />}
                    <main className="main-content">
                        {children}
                    </main>
                    {!isAdminPage && <Footer />}
                    {/* Mobile Bottom Navigation - CSS handles visibility */}
                    {!isAdminPage && <BottomNavBar />}
                </div>
            </CartProvider>
        </AuthProvider>
    );
}

