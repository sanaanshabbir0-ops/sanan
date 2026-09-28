import { useEffect, useState, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Zap, Clock, Play, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useProducts, useCategories, useBrands, useBanners, useStoreSettings } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Loading';
import { StarRating } from '@/components/StarRating';
import { formatPrice, calculateDiscount, getEffectivePrice, getCountdown, cn } from '@/lib/utils';
import type { Product } from '@/types';

export function HomePage() {
  const { navigate } = useRouter();
  const { settings } = useStoreSettings();
  const { categories } = useCategories();
  const { brands } = useBrands();
  const { banners } = useBanners();
  const { products: trending, loading: trendingLoading } = useProducts({ sort: 'featured', limit: 10 });
  const { products: newArrivals, loading: newLoading } = useProducts({ sort: 'newest', limit: 10 });
  const { products: bestSellers, loading: bestLoading } = useProducts({ sort: 'best_selling', limit: 10 });
  const flashDeals = trending.filter((p) => p.sale_price && p.sale_price < p.price).slice(0, 6);

  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeroVisible(true);
      },
      { threshold: 0.2 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/9811655/pexels-photo-9811655.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="ZAMA"
            className="w-full h-full object-cover scale-105"
            style={{ transform: heroVisible ? 'scale(1.05)' : 'scale(1)', transition: 'transform 8s ease-out' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-zinc-950/40" />
        </div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className={cn("transition-all duration-1000", heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-medium text-zinc-300">The Future of Shopping is Here</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[0.95]">
                {settings?.hero_headline || 'Discover Everything. Experience ZAMA.'}
              </h1>
              <p className="text-lg text-zinc-300 mb-8 max-w-xl leading-relaxed">
                {settings?.hero_subtext || 'Multiple brands. Infinite categories. One extraordinary destination for everything you love.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/shop')}
                  className="group px-8 py-4 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-2xl hover:shadow-white/20 transition-all flex items-center justify-center gap-2"
                >
                  Shop Now
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/categories')}
                  className="px-8 py-4 glass text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Explore Categories
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-600 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-zinc-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <Section title="Trending Now" subtitle="What everyone's talking about" icon={<TrendingUp size={18} className="text-amber-400" />} link="/shop?sort=featured">
        {trendingLoading ? <ProductGridSkeleton count={5} /> : (
          <HorizontalScroll products={trending} />
        )}
      </Section>

      {/* Shop by Category */}
      <Section title="Shop by Category" subtitle="Explore our curated collections" icon={<Sparkles size={18} className="text-blue-400" />} link="/categories">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-zinc-800/50 hover:border-zinc-600 transition-all duration-500 hover:-translate-y-1",
                i < 2 ? "aspect-[16/10]" : "aspect-square"
              )}
            >
              {cat.image_url && (
                <img src={cat.image_url} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop now <ArrowUpRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Featured Brands */}
      <section className="py-16 border-y border-zinc-800/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Brands</h2>
              <p className="text-sm text-zinc-500 mt-1">Premium brands, all in one place</p>
            </div>
            <Link to="/brands" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/shop?brand=${brand.slug}`}
                className="group flex-shrink-0 w-44 h-28 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 hover:border-zinc-600 flex flex-col items-center justify-center transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="text-2xl font-black tracking-tighter text-zinc-300 group-hover:text-white transition-colors">
                  {brand.name}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 group-hover:text-zinc-400 transition-colors">{brand.description.slice(0, 30)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <Section title="New Arrivals" subtitle="Fresh drops, just for you" icon={<Sparkles size={18} className="text-emerald-400" />} link="/shop?sort=newest">
        {newLoading ? <ProductGridSkeleton count={5} /> : <HorizontalScroll products={newArrivals} />}
      </Section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-rose-950/40 via-zinc-950 to-zinc-950 border border-rose-900/30 overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                    <Zap size={24} className="text-white fill-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Flash Deals</h2>
                    <p className="text-sm text-zinc-400">Limited time offers - grab them before they're gone</p>
                  </div>
                </div>
                <FlashCountdown />
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {flashDeals.map((product) => (
                    <FlashDealCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <Section title="Best Sellers" subtitle="Tried, tested, and loved by thousands" icon={<TrendingUp size={18} className="text-amber-400" />} link="/shop?sort=best_selling">
        {bestLoading ? <ProductGridSkeleton count={5} /> : <HorizontalScroll products={bestSellers} />}
      </Section>

      {/* Promo Banners */}
      {banners.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {banners.map((banner) => (
                <Link
                  key={banner.id}
                  to={banner.link_url || '/shop'}
                  className="group relative h-64 rounded-3xl overflow-hidden border border-zinc-800/50"
                >
                  {banner.image_url && (
                    <img src={banner.image_url} alt={banner.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{banner.title}</h3>
                    <p className="text-sm text-zinc-300 mb-3">{banner.subtitle}</p>
                    <div className="inline-flex items-center gap-1 text-sm font-medium text-white">
                      Shop now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Video Shopping */}
      <Section title="Video Shopping" subtitle="See it in action before you buy" icon={<Play size={18} className="text-rose-400" />}>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {bestSellers.slice(0, 6).map((product, i) => (
            <VideoShoppingCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </Section>

      {/* Recommended */}
      <Section title="Recommended For You" subtitle="Handpicked based on what's trending" icon={<Sparkles size={18} className="text-blue-400" />} link="/shop">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {bestSellers.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, icon, link, children }: { title: string; subtitle?: string; icon?: React.ReactNode; link?: string; children: React.ReactNode }) {
  return (
    <section className="py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {link && (
            <Link to={link} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
              View all <ChevronRight size={16} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function HorizontalScroll({ products }: { products: Product[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {products.map((p) => (
        <div key={p.id} className="flex-shrink-0 w-64 sm:w-72">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

function FlashCountdown() {
  const [time, setTime] = useState({ hours: 11, minutes: 42, seconds: 30 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Clock size={18} className="text-rose-400" />
      <div className="flex gap-1.5">
        {[
          { label: 'HRS', value: time.hours },
          { label: 'MIN', value: time.minutes },
          { label: 'SEC', value: time.seconds },
        ].map((t) => (
          <div key={t.label} className="text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-lg font-bold text-white tabular-nums">{String(t.value).padStart(2, '0')}</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1 font-semibold">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlashDealCard({ product }: { product: Product }) {
  const discount = calculateDiscount(product.price, product.sale_price);
  const effectivePrice = getEffectivePrice(product);
  const stockPct = Math.min(100, Math.max(10, (product.stock / 100) * 100));
  const primaryImage = product.product_images?.[0]?.image_url || '';

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 overflow-hidden hover:border-rose-700/50 transition-all hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden">
          {primaryImage && <img src={primaryImage} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold">-{discount}%</div>
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="text-xs font-medium text-zinc-200 line-clamp-1">{product.name}</h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white">{formatPrice(effectivePrice)}</span>
            <span className="text-xs text-zinc-500 line-through">{formatPrice(product.price)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full" style={{ width: `${stockPct}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500">Only {product.stock} left</p>
        </div>
      </div>
    </Link>
  );
}

function VideoShoppingCard({ product, index }: { product: Product; index: number }) {
  const { navigate } = useRouter();
  const primaryImage = product.product_images?.[0]?.image_url || '';
  const effectivePrice = getEffectivePrice(product);

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="flex-shrink-0 w-44 sm:w-52 h-80 rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-zinc-600 cursor-pointer group relative"
    >
      {primaryImage && <img src={primaryImage} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3 w-10 h-10 rounded-full glass-dark flex items-center justify-center">
        <Play size={16} className="text-white fill-white ml-0.5" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {product.brand && <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">{product.brand.name}</p>}
        <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-white">{formatPrice(effectivePrice)}</span>
          <StarRating rating={product.rating} size={10} />
        </div>
      </div>
    </div>
  );
}
