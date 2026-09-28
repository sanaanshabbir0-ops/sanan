export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  banner_url: string;
  parent_id: string | null;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  banner_url: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  video_url: string;
  sort_order: number;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand_id: string | null;
  category_id: string | null;
  sku: string;
  price: number;
  sale_price: number | null;
  stock: number;
  low_stock_threshold: number;
  rating: number;
  review_count: number;
  sales_count: number;
  is_published: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  has_variants: boolean;
  sizes: string[];
  colors: string[];
  shipping_info: string;
  return_info: string;
  created_at: string;
  updated_at: string;
  brand?: Brand | null;
  category?: Category | null;
  product_images?: ProductImage[];
  product_videos?: ProductVideo[];
  product_specifications?: ProductSpecification[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  body: string;
  image_urls: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  coupon_code: string;
  shipping_address: Record<string, unknown>;
  contact_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  order_status_history?: OrderStatusHistory[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  brand_name: string;
  product_image: string;
  variant: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  variant: string;
  created_at: string;
  product?: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  applicable_product_id: string | null;
  applicable_category_id: string | null;
  start_date: string;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  section_title: string;
  section_config: Record<string, unknown>;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  placement: string;
  sort_order: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  shipping_flat_rate: number;
  free_shipping_threshold: number;
  tax_rate: number;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
  hero_headline: string;
  hero_subtext: string;
  hero_video_url: string;
  hero_image_url: string;
  updated_at: string;
}
