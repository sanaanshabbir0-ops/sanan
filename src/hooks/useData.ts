import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Brand, StoreSettings, Banner, HomepageSection, Review } from '@/types';

export function useProducts(opts?: {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  limit?: number;
  filter?: Record<string, unknown>;
  sort?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), product_images(*)')
      .eq('is_published', true);

    if (opts?.limit) query = query.limit(opts.limit);

    if (opts?.categorySlug) {
      query = query.eq('category.slug', opts.categorySlug);
    }
    if (opts?.brandSlug) {
      query = query.eq('brand.slug', opts.brandSlug);
    }
    if (opts?.search) {
      query = query.or(`name.ilike.%${opts.search}%,description.ilike.%${opts.search}%,sku.ilike.%${opts.search}%`);
    }

    switch (opts?.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'best_selling':
        query = query.order('sales_count', { ascending: false });
        break;
      case 'discount':
        query = query.order('sale_price', { ascending: true });
        break;
      default:
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    }

    query.then(({ data, error }) => {
      if (error) {
        console.error('Error fetching products:', error);
      }
      setProducts((data || []) as unknown as Product[]);
      setLoading(false);
    });
  }, [opts?.categorySlug, opts?.brandSlug, opts?.search, opts?.limit, opts?.sort]);

  return { products, loading };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), product_images(*), product_videos(*), product_specifications(*)')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error fetching product:', error);
        setProduct(data as unknown as Product);
        setLoading(false);
      });
  }, [slug]);

  return { product, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching categories:', error);
        setCategories((data || []) as Category[]);
        setLoading(false);
      });
  }, []);

  return { categories, loading };
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .eq('is_enabled', true)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching brands:', error);
        setBrands((data || []) as Brand[]);
        setLoading(false);
      });
  }, []);

  return { brands, loading };
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error fetching settings:', error);
        setSettings(data as StoreSettings);
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}

export function useBanners(placement = 'homepage') {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .eq('placement', placement)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching banners:', error);
        setBanners((data || []) as Banner[]);
        setLoading(false);
      });
  }, [placement]);

  return { banners, loading };
}

export function useHomepageSections() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching homepage sections:', error);
        setSections((data || []) as HomepageSection[]);
        setLoading(false);
      });
  }, []);

  return { sections, loading };
}

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Error fetching reviews:', error);
        setReviews((data || []) as Review[]);
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reviews, loading, refresh };
}
