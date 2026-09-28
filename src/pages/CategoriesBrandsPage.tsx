import { Link } from '@/context/RouterContext';
import { useCategories, useBrands } from '@/hooks/useData';
import { useWishlist } from '@/context/WishlistContext';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { ProductCard } from '@/components/ProductCard';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '@/types';

export function CategoriesPage() {
  const { categories, loading } = useCategories();

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Categories</h1>
        <p className="text-sm text-zinc-500 mb-8">Explore every category ZAMA has to offer</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-zinc-600 transition-all hover:-translate-y-1"
            >
              {cat.image_url && <img src={cat.image_url} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-base font-bold text-white">{cat.name}</h3>
                {cat.description && <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{cat.description}</p>}
                <div className="flex items-center gap-1 text-xs text-zinc-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop now <ArrowUpRight size={12} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandsPage() {
  const { brands, loading } = useBrands();

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Featured Brands</h1>
        <p className="text-sm text-zinc-500 mb-8">Premium brands, all in one extraordinary place</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/shop?brand=${brand.slug}`}
              className="group p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 hover:border-zinc-600 transition-all hover:-translate-y-1 text-center"
            >
              <div className="text-3xl font-black tracking-tighter text-zinc-300 group-hover:text-white transition-colors mb-2">
                {brand.name}
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2">{brand.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Wishlist</h1>
        {items.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            message="Save items you love by tapping the heart icon on any product."
            action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Browse Products</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => item.product && <ProductCard key={item.id} product={item.product as Product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
