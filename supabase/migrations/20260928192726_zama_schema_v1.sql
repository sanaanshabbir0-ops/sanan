/*
# ZAMA Marketplace Core Schema

## Overview
Creates the complete database schema for ZAMA, a multi-brand e-commerce marketplace.
Includes products, categories, brands, orders, reviews, coupons, homepage management, and admin settings.

## New Tables
1. profiles - Extends auth.users with role (customer/admin), full name, phone
2. categories - Product categories with parent-child hierarchy, images, banners
3. brands - Brand management with logos, descriptions, banners
4. products - Main product table with pricing, stock, variants, status
5. product_images - Multiple images per product
6. product_videos - Product video URLs
7. product_specifications - Key-value product specs
8. reviews - Customer reviews with ratings, images, verified purchase flag
9. addresses - Customer shipping addresses
10. orders - Order header with status, totals, payment info
11. order_items - Individual items in orders
12. order_status_history - Tracking order status changes
13. wishlist - Customer wishlist items
14. recently_viewed - Customer browsing history
15. coupons - Discount codes with rules
16. homepage_sections - Configurable homepage builder sections
17. banners - Promotional banners
18. store_settings - Store configuration (singleton)
19. cart_items - Persistent cart items per user

## Security
- RLS enabled on ALL tables
- Public read on products, categories, brands, reviews, banners, homepage_sections, store_settings
- Owner-scoped CRUD on orders, addresses, wishlist, cart_items, recently_viewed, reviews
- Admin-only write on products, categories, brands, coupons, homepage_sections, banners, store_settings
- Admin role determined by profiles.role = 'admin'
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON profiles;
CREATE POLICY "profiles_read_self_or_admin" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  image_url text DEFAULT '',
  banner_url text DEFAULT '',
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE
  TO authenticated USING (is_admin());

-- ============ BRANDS ============
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  logo_url text DEFAULT '',
  banner_url text DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_public_read" ON brands;
CREATE POLICY "brands_public_read" ON brands FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "brands_admin_insert" ON brands;
CREATE POLICY "brands_admin_insert" ON brands FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "brands_admin_update" ON brands;
CREATE POLICY "brands_admin_update" ON brands FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "brands_admin_delete" ON brands;
CREATE POLICY "brands_admin_delete" ON brands FOR DELETE
  TO authenticated USING (is_admin());

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sku text DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) DEFAULT NULL,
  stock int NOT NULL DEFAULT 0,
  low_stock_threshold int NOT NULL DEFAULT 5,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  sales_count int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  has_variants boolean NOT NULL DEFAULT false,
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  shipping_info text DEFAULT 'Ships within 2-3 business days',
  return_info text DEFAULT '30-day return policy',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE
  TO authenticated USING (is_admin());

-- ============ PRODUCT IMAGES ============
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_public_read" ON product_images;
CREATE POLICY "product_images_public_read" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_images_admin_insert" ON product_images;
CREATE POLICY "product_images_admin_insert" ON product_images FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON product_images;
CREATE POLICY "product_images_admin_update" ON product_images FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON product_images;
CREATE POLICY "product_images_admin_delete" ON product_images FOR DELETE
  TO authenticated USING (is_admin());

-- ============ PRODUCT VIDEOS ============
CREATE TABLE IF NOT EXISTS product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_videos_public_read" ON product_videos;
CREATE POLICY "product_videos_public_read" ON product_videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_videos_admin_insert" ON product_videos;
CREATE POLICY "product_videos_admin_insert" ON product_videos FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_videos_admin_delete" ON product_videos;
CREATE POLICY "product_videos_admin_delete" ON product_videos FOR DELETE
  TO authenticated USING (is_admin());

-- ============ PRODUCT SPECIFICATIONS ============
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_name text NOT NULL,
  spec_value text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specs_public_read" ON product_specifications;
CREATE POLICY "specs_public_read" ON product_specifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "specs_admin_insert" ON product_specifications;
CREATE POLICY "specs_admin_insert" ON product_specifications FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "specs_admin_update" ON product_specifications;
CREATE POLICY "specs_admin_update" ON product_specifications FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "specs_admin_delete" ON product_specifications;
CREATE POLICY "specs_admin_delete" ON product_specifications FOR DELETE
  TO authenticated USING (is_admin());

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  body text DEFAULT '',
  image_urls text[] DEFAULT '{}',
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_user_insert" ON reviews;
CREATE POLICY "reviews_user_insert" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_user_update" ON reviews;
CREATE POLICY "reviews_user_update" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_user_delete" ON reviews;
CREATE POLICY "reviews_user_delete" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR is_admin());

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  address_line1 text NOT NULL,
  address_line2 text DEFAULT '',
  city text NOT NULL,
  state text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'United States',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_owner_read" ON addresses;
CREATE POLICY "addresses_owner_read" ON addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_insert" ON addresses;
CREATE POLICY "addresses_owner_insert" ON addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_update" ON addresses;
CREATE POLICY "addresses_owner_update" ON addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_delete" ON addresses;
CREATE POLICY "addresses_owner_delete" ON addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','refunded')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method text NOT NULL DEFAULT 'cod',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code text DEFAULT '',
  shipping_address jsonb DEFAULT '{}',
  contact_phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_owner_read" ON orders;
CREATE POLICY "orders_owner_read" ON orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR is_admin()
  );

DROP POLICY IF EXISTS "orders_owner_insert" ON orders;
CREATE POLICY "orders_owner_insert" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  TO authenticated USING (is_admin() OR auth.uid() = user_id) WITH CHECK (is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_delete" ON orders;
CREATE POLICY "orders_admin_delete" ON orders FOR DELETE
  TO authenticated USING (is_admin());

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  brand_name text DEFAULT '',
  product_image text DEFAULT '',
  variant text DEFAULT '',
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_read" ON order_items;
CREATE POLICY "order_items_read" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ============ ORDER STATUS HISTORY ============
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_history_read" ON order_status_history;
CREATE POLICY "order_history_read" ON order_status_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR is_admin()))
  );

DROP POLICY IF EXISTS "order_history_admin_insert" ON order_status_history;
CREATE POLICY "order_history_admin_insert" ON order_status_history FOR INSERT
  TO authenticated WITH CHECK (is_admin());

-- ============ WISHLIST ============
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_owner_read" ON wishlist;
CREATE POLICY "wishlist_owner_read" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_owner_insert" ON wishlist;
CREATE POLICY "wishlist_owner_insert" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_owner_delete" ON wishlist;
CREATE POLICY "wishlist_owner_delete" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ RECENTLY VIEWED ============
CREATE TABLE IF NOT EXISTS recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recently_viewed_owner_read" ON recently_viewed;
CREATE POLICY "recently_viewed_owner_read" ON recently_viewed FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recently_viewed_owner_insert" ON recently_viewed;
CREATE POLICY "recently_viewed_owner_insert" ON recently_viewed FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recently_viewed_owner_delete" ON recently_viewed;
CREATE POLICY "recently_viewed_owner_delete" ON recently_viewed FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  min_purchase numeric(12,2) NOT NULL DEFAULT 0,
  applicable_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  applicable_category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz DEFAULT NULL,
  usage_limit int DEFAULT NULL,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_public_read" ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "coupons_admin_insert" ON coupons;
CREATE POLICY "coupons_admin_insert" ON coupons FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "coupons_admin_update" ON coupons;
CREATE POLICY "coupons_admin_update" ON coupons FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "coupons_admin_delete" ON coupons;
CREATE POLICY "coupons_admin_delete" ON coupons FOR DELETE
  TO authenticated USING (is_admin());

-- ============ HOMEPAGE SECTIONS ============
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  section_title text NOT NULL DEFAULT '',
  section_config jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_public_read" ON homepage_sections;
CREATE POLICY "homepage_public_read" ON homepage_sections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "homepage_admin_insert" ON homepage_sections;
CREATE POLICY "homepage_admin_insert" ON homepage_sections FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "homepage_admin_update" ON homepage_sections;
CREATE POLICY "homepage_admin_update" ON homepage_sections FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "homepage_admin_delete" ON homepage_sections;
CREATE POLICY "homepage_admin_delete" ON homepage_sections FOR DELETE
  TO authenticated USING (is_admin());

-- ============ BANNERS ============
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  image_url text DEFAULT '',
  link_url text DEFAULT '',
  placement text NOT NULL DEFAULT 'homepage' CHECK (placement IN ('homepage','category','product','sidebar','footer')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_read" ON banners;
CREATE POLICY "banners_public_read" ON banners FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "banners_admin_insert" ON banners;
CREATE POLICY "banners_admin_insert" ON banners FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "banners_admin_update" ON banners;
CREATE POLICY "update_banners" ON banners FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_banners" ON banners;
CREATE POLICY "banners_admin_update" ON banners FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "banners_admin_delete" ON banners;
CREATE POLICY "banners_admin_delete" ON banners FOR DELETE
  TO authenticated USING (is_admin());

-- ============ STORE SETTINGS ============
CREATE TABLE IF NOT EXISTS store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'ZAMA',
  tagline text NOT NULL DEFAULT 'Everything. One Extraordinary Place.',
  logo_url text DEFAULT '',
  contact_email text DEFAULT 'support@zama.shop',
  contact_phone text DEFAULT '',
  address text DEFAULT '',
  currency text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  shipping_flat_rate numeric(12,2) DEFAULT 9.99,
  free_shipping_threshold numeric(12,2) DEFAULT 99.00,
  tax_rate numeric(5,4) DEFAULT 0.0800,
  facebook_url text DEFAULT '',
  twitter_url text DEFAULT '',
  instagram_url text DEFAULT '',
  youtube_url text DEFAULT '',
  tiktok_url text DEFAULT '',
  hero_headline text NOT NULL DEFAULT 'Discover Everything. Experience ZAMA.',
  hero_subtext text NOT NULL DEFAULT 'Multiple brands. Infinite categories. One extraordinary destination for everything you love.',
  hero_video_url text DEFAULT '',
  hero_image_url text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON store_settings;
CREATE POLICY "settings_public_read" ON store_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_update" ON store_settings;
CREATE POLICY "settings_admin_update" ON store_settings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============ CART ITEMS ============
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  variant text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_owner_read" ON cart_items;
CREATE POLICY "cart_owner_read" ON cart_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_owner_insert" ON cart_items;
CREATE POLICY "cart_owner_insert" ON cart_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_owner_update" ON cart_items;
CREATE POLICY "cart_owner_update" ON cart_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_owner_delete" ON cart_items;
CREATE POLICY "cart_owner_delete" ON cart_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ============ TRIGGERS ============
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.order_number IS NULL OR new.order_number = '' THEN
    new.order_number := 'ZAMA-' || UPPER(SUBSTRING(HEX_ENCODE(GEN_RANDOM_BYTES(6)) FROM 1 FOR 8));
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();
