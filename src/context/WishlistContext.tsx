import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { WishlistItem, Product } from '@/types';

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'zama-guest-wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  const loadWishlist = useCallback(async () => {
    if (!session?.user) {
      try {
        const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
        const productIds: string[] = raw ? JSON.parse(raw) : [];
        if (productIds.length > 0) {
          const { data } = await supabase
            .from('products')
            .select('*, brand:brands(*), category:categories(*), product_images(*)')
            .in('id', productIds);
          const wishItems: WishlistItem[] = (data || []).map((p) => ({
            id: `guest-${p.id}`,
            user_id: '',
            product_id: p.id,
            created_at: new Date().toISOString(),
            product: p as unknown as Product,
          }));
          setItems(wishItems);
          const cache: Record<string, Product> = {};
          (data || []).forEach((p) => {
            cache[p.id] = p as unknown as Product;
          });
          setProductCache(cache);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('wishlist')
      .select('*, product:products(*, brand:brands(*), category:categories(*), product_images(*))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setItems((data || []) as unknown as WishlistItem[]);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((i) => i.product_id === productId);
    },
    [items]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!session?.user) {
        const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
        const productIds: string[] = raw ? JSON.parse(raw) : [];
        const idx = productIds.indexOf(productId);
        if (idx >= 0) {
          productIds.splice(idx, 1);
        } else {
          productIds.push(productId);
        }
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(productIds));
        await loadWishlist();
        return;
      }

      if (isInWishlist(productId)) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', session.user.id)
          .eq('product_id', productId);
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: session.user.id, product_id: productId });
      }
      await loadWishlist();
    },
    [session, isInWishlist, loadWishlist]
  );

  const refresh = useCallback(async () => {
    await loadWishlist();
  }, [loadWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        isInWishlist,
        toggle,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
