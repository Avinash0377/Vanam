'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string; // MongoDB ObjectId
    name: string;
    mobile: string;
    email?: string;
    role: 'CUSTOMER' | 'ADMIN';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored auth on mount
        const storedToken = localStorage.getItem('vanam_token');
        const storedUser = localStorage.getItem('vanam_user');

        if (storedToken && storedUser) {
            // Safely parse stored user data
            let parsedUser: User | null = null;
            try {
                parsedUser = JSON.parse(storedUser);
            } catch {
                // Corrupted localStorage — clear and bail
                localStorage.removeItem('vanam_token');
                localStorage.removeItem('vanam_user');
                setIsLoading(false);
                return;
            }

            // Temporarily set from localStorage for instant UI
            setToken(storedToken);
            setUser(parsedUser);

            // Validate token against server (prevents role spoofing)
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${storedToken}` },
            })
                .then(res => {
                    if (!res.ok) throw new Error('Invalid token');
                    return res.json();
                })
                .then(data => {
                    if (data.user) {
                        setUser(data.user);
                        localStorage.setItem('vanam_user', JSON.stringify(data.user));
                    }
                })
                .catch(() => {
                    // Token expired or invalid — log out
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('vanam_token');
                    localStorage.removeItem('vanam_user');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('vanam_token', newToken);
        localStorage.setItem('vanam_user', JSON.stringify(newUser));

        // Merge guest cart with user cart
        const guestCart = localStorage.getItem('vanam_guest_cart');
        if (guestCart) {
            mergeGuestCart(newToken, JSON.parse(guestCart));
            localStorage.removeItem('vanam_guest_cart');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('vanam_token');
        localStorage.removeItem('vanam_user');
    };

    const mergeGuestCart = async (authToken: string, guestCart: unknown) => {
        try {
            await fetch('/api/cart', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(guestCart),
            });
        } catch (error) {
            console.error('Failed to merge cart:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                login,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'ADMIN',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
