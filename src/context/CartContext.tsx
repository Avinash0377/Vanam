'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
    id?: string;
    productId?: string;
    comboId?: string;
    hamperId?: string;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image: string;
    type: 'product' | 'combo' | 'hamper';
    size?: string;
    color?: string;
    colorHex?: string;
    customMessage?: string;
}

interface CartSummary {
    itemCount: number;
    subtotal: number;
    shipping: number;
    total: number;
}

interface CartContextType {
    items: CartItem[];
    summary: CartSummary;
    isLoading: boolean;
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    updateQuantity: (itemId: string, type: string, quantity: number) => Promise<string | null>;
    removeItem: (itemId: string, type: string) => void;
    clearCart: () => void;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const calculateSummary = (cartItems: CartItem[]): CartSummary => {
        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = subtotal >= 999 ? 0 : 99;
        return { itemCount, subtotal, shipping, total: subtotal + shipping };
    };

    const summary = calculateSummary(items);

    // Load cart on mount or auth change
    useEffect(() => {
        if (isAuthenticated && token) {
            refreshCart();
        } else {
            // Load guest cart from localStorage
            const guestCart = localStorage.getItem('vanam_guest_cart');
            if (guestCart) {
                let parsed;
                try {
                    parsed = JSON.parse(guestCart);
                } catch {
                    localStorage.removeItem('vanam_guest_cart');
                    return;
                }
                const loadedItems: CartItem[] = [];
                // Reconstruct items from stored structure
                if (parsed.items) loadedItems.push(...parsed.items.map((i: any) => ({ ...i, type: 'product', size: i.size })));
                if (parsed.comboItems) loadedItems.push(...parsed.comboItems.map((i: any) => ({ ...i, type: 'combo' })));
                if (parsed.hamperItems) loadedItems.push(...parsed.hamperItems.map((i: any) => ({ ...i, type: 'hamper' })));

                setItems(loadedItems);
            }
        }
    }, [isAuthenticated, token]);

    const refreshCart = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/cart', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.cart) {
                const cartItems: CartItem[] = [];

                data.cart.items?.forEach((item: { id: string; quantity: number; size?: string; selectedColor?: string; colorImage?: string; product: { id: string; name: string; slug: string; price: number; images: string[]; size?: string } }) => {
                    cartItems.push({
                        id: item.id,
                        productId: item.product.id,
                        name: item.product.name,
                        slug: item.product.slug,
                        price: item.product.price,
                        quantity: item.quantity,
                        image: item.colorImage || item.product.images?.[0] || '/placeholder-plant.jpg',
                        type: 'product',
                        size: item.size || item.product.size,
                        color: item.selectedColor,
                    });
                });

                data.cart.comboItems?.forEach((item: { id: string; quantity: number; combo: { id: string; name: string; slug: string; price: number; images: string[] } }) => {
                    cartItems.push({
                        id: item.id,
                        comboId: item.combo.id,
                        name: item.combo.name,
                        slug: item.combo.slug,
                        price: item.combo.price,
                        quantity: item.quantity,
                        image: item.combo.images?.[0] || '/placeholder-plant.jpg',
                        type: 'combo',
                    });
                });

                data.cart.hamperItems?.forEach((item: { id: string; quantity: number; customMessage?: string; hamper: { id: string; name: string; slug: string; price: number; images: string[] } }) => {
                    cartItems.push({
                        id: item.id,
                        hamperId: item.hamper.id,
                        name: item.hamper.name,
                        slug: item.hamper.slug,
                        price: item.hamper.price,
                        quantity: item.quantity,
                        image: item.hamper.images?.[0] || '/placeholder-plant.jpg',
                        type: 'hamper',
                        customMessage: item.customMessage,
                    });
                });

                setItems(cartItems);
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveGuestCart = (cartItems: CartItem[]) => {
        const guestCart = {
            items: cartItems.filter(i => i.type === 'product').map(i => ({
                id: i.id,
                productId: i.productId,
                quantity: i.quantity,
                name: i.name,
                slug: i.slug,
                price: i.price,
                image: i.image,
                size: i.size,
                color: i.color,
                colorHex: i.colorHex,
            })),
            comboItems: cartItems.filter(i => i.type === 'combo').map(i => ({
                id: i.id,
                comboId: i.comboId,
                quantity: i.quantity,
                name: i.name,
                slug: i.slug,
                price: i.price,
                image: i.image,
            })),
            hamperItems: cartItems.filter(i => i.type === 'hamper').map(i => ({
                id: i.id,
                hamperId: i.hamperId,
                quantity: i.quantity,
                customMessage: i.customMessage,
                name: i.name,
                slug: i.slug,
                price: i.price,
                image: i.image,
            })),
        };
        localStorage.setItem('vanam_guest_cart', JSON.stringify(guestCart));
    };

    const addItem = async (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
        if (isAuthenticated && token) {
            // Add to server cart
            try {
                const body: Record<string, unknown> = { quantity };
                if (item.type === 'product') {
                    body.productId = item.productId;
                    body.size = item.size;
                    body.selectedColor = item.color;
                    body.colorImage = item.image;
                }
                if (item.type === 'combo') body.comboId = item.comboId;
                if (item.type === 'hamper') {
                    body.hamperId = item.hamperId;
                    body.customMessage = item.customMessage;
                }

                await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                });

                await refreshCart();
            } catch (error) {
                console.error('Failed to add to cart:', error);
            }
        } else {
            // Add to guest cart
            const existingIndex = items.findIndex(i => {
                if (item.type === 'product') return i.productId === item.productId && i.size === item.size && i.color === item.color;
                if (item.type === 'combo') return i.comboId === item.comboId;
                if (item.type === 'hamper') return i.hamperId === item.hamperId;
                return false;
            });

            let newItems: CartItem[];
            if (existingIndex > -1) {
                newItems = items.map((i, idx) =>
                    idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
                );
            } else {
                // Generate a temp ID for the guest item
                const tempId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                newItems = [...items, { ...item, id: tempId, quantity } as CartItem];
            }

            setItems(newItems);
            saveGuestCart(newItems);
        }
    };

    const updateQuantity = async (itemId: string, type: string, quantity: number): Promise<string | null> => {
        if (quantity < 1) return null;

        if (isAuthenticated && token) {
            try {
                const res = await fetch(`/api/cart/${itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ quantity, type }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    return data.error || 'Failed to update quantity';
                }

                await refreshCart();
                return null;
            } catch (error) {
                console.error('Failed to update cart:', error);
                return 'Failed to update cart';
            }
        } else {
            const newItems = items.map(item =>
                item.id === itemId
                    ? { ...item, quantity }
                    : item
            );
            setItems(newItems);
            saveGuestCart(newItems);
            return null;
        }
    };

    const removeItem = async (itemId: string, type: string) => {
        if (isAuthenticated && token) {
            try {
                await fetch(`/api/cart/${itemId}?type=${type}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                await refreshCart();
            } catch (error) {
                console.error('Failed to remove from cart:', error);
            }
        } else {
            const newItems = items.filter(item => item.id !== itemId);
            setItems(newItems);
            saveGuestCart(newItems);
        }
    };

    const clearCart = async () => {
        if (isAuthenticated && token) {
            try {
                await fetch('/api/cart', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                setItems([]);
            } catch (error) {
                console.error('Failed to clear cart:', error);
            }
        } else {
            setItems([]);
            localStorage.removeItem('vanam_guest_cart');
        }
    };

    return (
        <CartContext.Provider
            value={{
                items,
                summary,
                isLoading,
                addItem,
                updateQuantity,
                removeItem,
                clearCart,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
