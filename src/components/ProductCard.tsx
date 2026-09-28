import { useState } from 'react';
import { Heart, ShoppingBag, Eye, Zap } from 'lucide-react';
import type { Product } from '@/types';
import { Link } from '@/context/RouterContext';
import { StarRating } from '@/components/StarRating';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPrice, calculateDiscount, getEffectivePrice, getStockStatus, cn } from '@/lib/utils';

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { isInWishlist, toggle } = useWishlist();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.price, product.sale_price);
  const effectivePrice = getEffectivePrice(product);
  const stockStatus = getStockStatus(product.stock, product.low_stock_threshold);
  const primaryImage = product.product_images?.[0]?.image_url || product.product_images?.[0]?.image_url || '';
  const hoverImage = product.product_images?.[1]?.image_url;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addToCart(product.id, 1, '');
    setTimeout(() => setAdding(false), 1000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800/50",
        "transition-all duration-500 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/50",
        "hover:-translate-y-1"
      )}>
        {/* Image */}
        <div className={cn("relative overflow-hidden", compact ? "aspect-square" : "aspect-[4/5]")}>
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-zinc-700" />
            </div>
          )}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold shadow-lg">
              -{discount}%
            </div>
          )}

          {/* Trending badge */}
          {product.is_trending && discount === 0 && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
              <Zap size={10} className="fill-white" /> Trending
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Toggle wishlist"
          >
            <Heart
              size={16}
              className={cn(
                "transition-colors",
                inWishlist ? "text-rose-500 fill-rose-500" : "text-white"
              )}
            />
          </button>

          {/* Quick actions */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className="flex-1 glass-dark text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <ShoppingBag size={14} />
              {adding ? 'Added!' : product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
            <div className="w-10 h-10 glass-dark rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer">
              <Eye size={16} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          {product.brand && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{product.brand.name}</p>
          )}
          <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 group-hover:text-white transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} size={12} showNumber reviewCount={product.review_count} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">{formatPrice(effectivePrice)}</span>
              {discount > 0 && (
                <span className="text-xs text-zinc-500 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            <span className={cn("text-[10px] font-medium", stockStatus.color)}>{stockStatus.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
