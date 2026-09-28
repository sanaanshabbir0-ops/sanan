import { useEffect, useState, useMemo } from 'react';
import { SlidersHorizontal, Grid3x3, List, X, ChevronDown } from 'lucide-react';
import { useRouter, Link } from '@/context/RouterContext';
import { useProducts, useCategories, useBrands } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton, EmptyState } from '@/components/Loading';
import { formatPrice, getEffectivePrice, cn } from '@/lib/utils';
import type { Product } from '@/types';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'discount', label: 'Biggest Discount' },
];

export function ShopPage() {
  const { query } = useRouter();
  const { categories } = useCategories();
  const { brands } = useBrands();

  const search = query.get('search') || undefined;
  const categorySlug = query.get('category') || undefined;
  const brandSlug = query.get('brand') || undefined;
  const initialSort = query.get('sort') || 'featured';
  const filterParam = query.get('filter');

  const [sort, setSort] = useState(initialSort);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(brandSlug ? [brandSlug] : []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categorySlug ? [categorySlug] : []);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(filterParam === 'deals');

  useEffect(() => {
    if (filterParam === 'deals') setOnSaleOnly(true);
    if (filterParam === 'bestseller') setSort('best_selling');
  }, [filterParam]);

  const { products, loading } = useProducts({ search, sort });

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategories.length > 0) {
      result = result.filter((p) => p.category && selectedCategories.includes(p.category.slug));
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand.slug));
    }
    result = result.filter((p) => {
      const price = getEffectivePrice(p);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    if (minRating > 0) result = result.filter((p) => p.rating >= minRating);
    if (inStockOnly) result = result.filter((p) => p.stock > 0);
    if (onSaleOnly) result = result.filter((p) => p.sale_price && p.sale_price < p.price);
    return result;
  }, [products, selectedCategories, selectedBrands, priceRange, minRating, inStockOnly, onSaleOnly]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };
  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-zinc-300">Shop</span>
            {search && <><span>/</span><span className="text-zinc-300">"{search}"</span></>}
          </div>
          <h1 className="text-3xl font-bold text-white">
            {search ? `Results for "${search}"` : categorySlug ? categories.find(c => c.slug === categorySlug)?.name || 'Shop' : 'All Products'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{filtered.length} products found</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={cn(
            "fixed lg:sticky top-16 lg:top-20 left-0 z-40 w-80 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-y-auto bg-zinc-950 lg:bg-transparent p-6 lg:p-0 transition-transform duration-300",
            showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}>
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h3 className="text-lg font-bold text-white">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={20} className="text-zinc-400" /></button>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <FilterGroup title="Categories">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{cat.name}</span>
                  </label>
                ))}
              </FilterGroup>

              {/* Brands */}
              <FilterGroup title="Brands">
                {brands.map((brand) => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.slug)}
                      onChange={() => toggleBrand(brand.slug)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{brand.name}</span>
                  </label>
                ))}
              </FilterGroup>

              {/* Price */}
              <FilterGroup title="Price Range">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                      placeholder="Min"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                      placeholder="Max"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-white"
                  />
                </div>
              </FilterGroup>

              {/* Rating */}
              <FilterGroup title="Minimum Rating">
                {[4, 3, 2, 1].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === r}
                      onChange={() => setMinRating(r)}
                      className="w-4 h-4 text-white focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-400">{r}★ & up</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} className="w-4 h-4 text-white focus:ring-zinc-500" />
                  <span className="text-sm text-zinc-400">All ratings</span>
                </label>
              </FilterGroup>

              {/* Availability */}
              <FilterGroup title="Availability">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-500" />
                  <span className="text-sm text-zinc-400">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-zinc-500" />
                  <span className="text-sm text-zinc-400">On Sale Only</span>
                </label>
              </FilterGroup>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <div className="hidden lg:block" />

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  <button onClick={() => setView('grid')} className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors", view === 'grid' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white')}>
                    <Grid3x3 size={16} />
                  </button>
                  <button onClick={() => setView('list')} className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors", view === 'list' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white')}>
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <ProductGridSkeleton count={12} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No products found"
                message="Try adjusting your filters or search terms to find what you're looking for."
                action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Clear Filters</Link>}
              />
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((p) => <ProductListItem key={p.id} product={p} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {showFilters && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setShowFilters(false)} />}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-zinc-800/50 pb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <ChevronDown size={16} className={cn("text-zinc-500 transition-transform", !open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function ProductListItem({ product }: { product: Product }) {
  const effectivePrice = getEffectivePrice(product);
  const primaryImage = product.product_images?.[0]?.image_url || '';
  return (
    <Link to={`/product/${product.slug}`} className="group flex gap-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 p-3 transition-all">
      <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
        {primaryImage && <img src={primaryImage} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
      </div>
      <div className="flex-1 min-w-0">
        {product.brand && <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{product.brand.name}</p>}
        <h3 className="text-base font-medium text-white line-clamp-1">{product.name}</h3>
        <p className="text-sm text-zinc-500 line-clamp-2 mt-1">{product.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-lg font-bold text-white">{formatPrice(effectivePrice)}</span>
          {product.sale_price && product.sale_price < product.price && (
            <span className="text-sm text-zinc-500 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
