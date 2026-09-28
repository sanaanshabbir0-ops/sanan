import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Product, CartItem } from '@/types';

interface CartContextValue {
  items: CartItem[];
  count: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number, variant?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_CART_KEY = 'zama-guest-cart';

interface GuestCartItem {
  product_id: string;
  quantity: number;
  variant: string;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  const fetchProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    const { data } = await supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), product_images(*)')
      .in('id', productIds);
    if (data) {
      const cache: Record<string, Product> = {};
      data.forEach((p) => {
        cache[p.id] = p as unknown as Product;
      });
      setProductCache((prev) => ({ ...prev, ...cache }));
    }
  }, []);

  const loadCart = useCallback(async () => {
    if (!session?.user) {
      // Guest cart from localStorage
      try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        const guestItems: GuestCartItem[] = raw ? JSON.parse(raw) : [];
        if (guestItems.length > 0) {
          await fetchProducts(guestItems.map((i) => i.product_id));
          const cartItems: CartItem[] = guestItems.map((gi, idx) => ({
            id: `guest-${idx}`,
            user_id: '',
            product_id: gi.product_id,
            quantity: gi.quantity,
            variant: gi.variant,
            created_at: new Date().toISOString(),
          }));
          setItems(cartItems);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    const cartData = data as CartItem[];
    if (cartData.length > 0) {
      await fetchProducts(cartData.map((i) => i.product_id));
    }
    setItems(cartData);
    setLoading(false);
  }, [session, fetchProducts]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const saveGuestCart = (cartItems: GuestCartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  };

  const addToCart = useCallback(
    async (productId: string, quantity = 1, variant = '') => {
      if (!session?.user) {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        const guestItems: GuestCartItem[] = raw ? JSON.parse(raw) : [];
        const existing = guestItems.find(
          (i) => i.product_id === productId && i.variant === variant
        );
        if (existing) {
          existing.quantity += quantity;
        } else {
          guestItems.push({ product_id: productId, quantity, variant });
        }
        saveGuestCart(guestItems);
        await loadCart();
        return;
      }

      const existing = items.find(
        (i) => i.product_id === productId && i.variant === variant
      );
      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: session.user.id,
          product_id: productId,
          quantity,
          variant,
        });
      }
      await loadCart();
    },
    [session, items, loadCart]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      if (!session?.user) {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        const guestItems: GuestCartItem[] = raw ? JSON.parse(raw) : [];
        const idx = parseInt(itemId.replace('guest-', ''));
        if (guestItems[idx]) {
          guestItems[idx].quantity = quantity;
          saveGuestCart(guestItems);
          await loadCart();
        }
        return;
      }
      await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      await loadCart();
    },
    [session, loadCart]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!session?.user) {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        const guestItems: GuestCartItem[] = raw ? JSON.parse(raw) : [];
        const idx = parseInt(itemId.replace('guest-', ''));
        guestItems.splice(idx, 1);
        saveGuestCart(guestItems);
        await loadCart();
        return;
      }
      await supabase.from('cart_items').delete().eq('id', itemId);
      await loadCart();
    },
    [session, loadCart]
  );

  const clearCart = useCallback(async () => {
    if (!session?.user) {
      localStorage.removeItem(GUEST_CART_KEY);
      setItems([]);
      return;
    }
    await supabase.from('cart_items').delete().eq('user_id', session.user.id);
    setItems([]);
  }, [session]);

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const product = productCache[item.product_id];
    if (!product) return sum;
    const price = product.sale_price && product.sale_price < product.price
      ? product.sale_price
      : product.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
