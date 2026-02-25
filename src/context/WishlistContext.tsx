'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
    id: string;
    productId?: string;
    comboId?: string;
    hamperId?: string;
    product?: {
        id: string;
        name: string;
        slug: string;
        price: number;
        comparePrice?: number;
        images: string[];
        stock: number;
        status: string;
        productType?: string;
        suitableFor?: string;
        featured?: boolean;
        tags?: string[];
        sizeVariants?: { size: string; price: number; stock: number; colors: { name: string; hex: string; images: string[] }[] }[];
        category?: { name: string; slug: string };
    };
    combo?: {
        id: string;
        name: string;
        slug: string;
        price: number;
        comparePrice?: number;
        images: string[];
        stock: number;
        status: string;
        featured?: boolean;
    };
    hamper?: {
        id: string;
        name: string;
        slug: string;
        price: number;
        comparePrice?: number;
        images: string[];
        stock: number;
        status: string;
        featured?: boolean;
    };
}

interface WishlistToggleParams {
    productId?: string;
    comboId?: string;
    hamperId?: string;
    // For guest mode
    name?: string;
    slug?: string;
    price?: number;
    image?: string;
    type?: 'product' | 'combo' | 'hamper';
}

interface WishlistContextType {
    items: WishlistItem[];
    count: number;
    isLoading: boolean;
    isInWishlist: (productId?: string, comboId?: string, hamperId?: string) => boolean;
    toggleWishlist: (params: WishlistToggleParams) => Promise<void>;
    removeItem: (itemId: string) => void;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = useAuth();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Build memoized lookup sets for O(1) checks — only recomputed when items change
    const wishlistedProductIds = useMemo(() => new Set(items.filter(i => i.productId).map(i => i.productId!)), [items]);
    const wishlistedComboIds = useMemo(() => new Set(items.filter(i => i.comboId).map(i => i.comboId!)), [items]);
    const wishlistedHamperIds = useMemo(() => new Set(items.filter(i => i.hamperId).map(i => i.hamperId!)), [items]);

    const isInWishlist = useCallback((productId?: string, comboId?: string, hamperId?: string): boolean => {
        if (productId) return wishlistedProductIds.has(productId);
        if (comboId) return wishlistedComboIds.has(comboId);
        if (hamperId) return wishlistedHamperIds.has(hamperId);
        return false;
    }, [wishlistedProductIds, wishlistedComboIds, wishlistedHamperIds]);

    // Load wishlist on mount or auth change
    useEffect(() => {
        if (isAuthenticated && token) {
            refreshWishlist();
        } else {
            // Load guest wishlist from localStorage
            const guestWishlist = localStorage.getItem('vanam_guest_wishlist');
            if (guestWishlist) {
                try {
                    const parsed = JSON.parse(guestWishlist);
                    setItems(parsed);
                } catch {
                    localStorage.removeItem('vanam_guest_wishlist');
                }
            }
        }
    }, [isAuthenticated, token]);

    const refreshWishlist = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/wishlist', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.wishlist) {
                setItems(data.wishlist);
            }
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const saveGuestWishlist = useCallback((wishlistItems: WishlistItem[]) => {
        localStorage.setItem('vanam_guest_wishlist', JSON.stringify(wishlistItems));
    }, []);

    const toggleWishlist = useCallback(async (params: WishlistToggleParams) => {
        if (isAuthenticated && token) {
            // Optimistic update
            const alreadyWishlisted = isInWishlist(params.productId, params.comboId, params.hamperId);

            if (alreadyWishlisted) {
                // Optimistically remove
                setItems(prev => prev.filter(item => {
                    if (params.productId) return item.productId !== params.productId;
                    if (params.comboId) return item.comboId !== params.comboId;
                    if (params.hamperId) return item.hamperId !== params.hamperId;
                    return true;
                }));
            } else {
                // Optimistically add a placeholder
                const tempItem: WishlistItem = {
                    id: `temp_${Date.now()}`,
                    productId: params.productId,
                    comboId: params.comboId,
                    hamperId: params.hamperId,
                };
                setItems(prev => [tempItem, ...prev]);
            }

            try {
                const res = await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        productId: params.productId,
                        comboId: params.comboId,
                        hamperId: params.hamperId,
                    }),
                });

                if (!res.ok) {
                    // Rollback on error
                    await refreshWishlist();
                    return;
                }

                // Refresh to get proper server data
                await refreshWishlist();
            } catch (error) {
                console.error('Failed to toggle wishlist:', error);
                // Rollback
                await refreshWishlist();
            }
        } else {
            // Guest mode: toggle in localStorage
            const existingIndex = items.findIndex(item => {
                if (params.productId) return item.productId === params.productId;
                if (params.comboId) return item.comboId === params.comboId;
                if (params.hamperId) return item.hamperId === params.hamperId;
                return false;
            });

            let newItems: WishlistItem[];
            if (existingIndex > -1) {
                newItems = items.filter((_, idx) => idx !== existingIndex);
            } else {
                const tempItem: WishlistItem = {
                    id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    productId: params.productId,
                    comboId: params.comboId,
                    hamperId: params.hamperId,
                    // Store minimal data for guest display
                    ...(params.productId && params.name ? {
                        product: {
                            id: params.productId,
                            name: params.name,
                            slug: params.slug || '',
                            price: params.price || 0,
                            images: params.image ? [params.image] : [],
                            stock: 1,
                            status: 'ACTIVE',
                        }
                    } : {}),
                    ...(params.comboId && params.name ? {
                        combo: {
                            id: params.comboId,
                            name: params.name,
                            slug: params.slug || '',
                            price: params.price || 0,
                            images: params.image ? [params.image] : [],
                            stock: 1,
                            status: 'ACTIVE',
                        }
                    } : {}),
                    ...(params.hamperId && params.name ? {
                        hamper: {
                            id: params.hamperId,
                            name: params.name,
                            slug: params.slug || '',
                            price: params.price || 0,
                            images: params.image ? [params.image] : [],
                            stock: 1,
                            status: 'ACTIVE',
                        }
                    } : {}),
                };
                newItems = [tempItem, ...items];
            }

            setItems(newItems);
            saveGuestWishlist(newItems);
        }
    }, [isAuthenticated, token, items, isInWishlist, refreshWishlist, saveGuestWishlist]);

    const removeItem = useCallback(async (itemId: string) => {
        if (isAuthenticated && token) {
            // Optimistic remove
            setItems(prev => prev.filter(item => item.id !== itemId));

            try {
                await fetch(`/api/wishlist?id=${itemId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                console.error('Failed to remove from wishlist:', error);
                await refreshWishlist();
            }
        } else {
            const newItems = items.filter(item => item.id !== itemId);
            setItems(newItems);
            saveGuestWishlist(newItems);
        }
    }, [isAuthenticated, token, items, refreshWishlist, saveGuestWishlist]);

    const contextValue = useMemo(() => ({
        items,
        count: items.length,
        isLoading,
        isInWishlist,
        toggleWishlist,
        removeItem,
        refreshWishlist,
    }), [items, isLoading, isInWishlist, toggleWishlist, removeItem, refreshWishlist]);

    return (
        <WishlistContext.Provider value={contextValue}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
