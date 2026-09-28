import { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingBag, Zap, Minus, Plus, Truck, RotateCcw, Shield, Check, ChevronRight, Star } from 'lucide-react';
import { useRouter, Link } from '@/context/RouterContext';
import { useProduct, useProducts, useReviews } from '@/hooks/useData';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { StarRating } from '@/components/StarRating';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { formatPrice, calculateDiscount, getEffectivePrice, getStockStatus, cn, formatDate } from '@/lib/utils';
import type { Review } from '@/types';

export function ProductPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { product, loading } = useProduct(slug);
  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();
  const { session } = useAuth();
  const { products: related } = useProducts({ limit: 6 });
  const { reviews, refresh } = useReviews(product?.id || '');

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [zoom, setZoom] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    if (product?.sizes?.length) setSelectedSize(product.sizes[0]);
    if (product?.colors?.length) setSelectedColor(product.colors[0]);
  }, [product]);

  useEffect(() => {
    if (product && session?.user) {
      supabase.from('recently_viewed').upsert({
        user_id: session.user.id,
        product_id: product.id,
        viewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,product_id' }).then(() => {});
    }
  }, [product, session]);

  const inWishlist = product ? isInWishlist(product.id) : false;
  const discount = product ? calculateDiscount(product.price, product.sale_price) : 0;
  const effectivePrice = product ? getEffectivePrice(product) : 0;
  const stockStatus = product ? getStockStatus(product.stock, product.low_stock_threshold) : null;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return related.filter((p) => p.id !== product.id && (p.category_id === product.category_id || p.brand_id === product.brand_id)).slice(0, 5);
  }, [related, product]);

  const allImages = product?.product_images?.sort((a, b) => a.sort_order - b.sort_order) || [];

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    const variant = [selectedSize, selectedColor].filter(Boolean).join(' / ');
    await addToCart(product.id, quantity, variant);
    setTimeout(() => setAdding(false), 1000);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const variant = [selectedSize, selectedColor].filter(Boolean).join(' / ');
    await addToCart(product.id, quantity, variant);
    navigate('/cart');
  };

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;
  if (!product) return (
    <div className="pt-20">
      <EmptyState title="Product not found" message="This product may have been removed or is no longer available." action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Continue Shopping</Link>} />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-white">Shop</Link>
          {product.category && <><ChevronRight size={12} /><Link to={`/shop?category=${product.category.slug}`} className="hover:text-white">{product.category.name}</Link></>}
          <ChevronRight size={12} />
          <span className="text-zinc-300 line-clamp-1">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/50 cursor-zoom-in"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
            >
              {allImages[activeImage]?.image_url && (
                <img
                  src={allImages[activeImage].image_url}
                  alt={product.name}
                  className={cn("w-full h-full object-cover transition-transform duration-500", zoom ? "scale-150" : "scale-100")}
                />
              )}
              {discount > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-bold shadow-lg">
                  -{discount}%
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                      activeImage === i ? "border-white" : "border-zinc-800 hover:border-zinc-600"
                    )}
                  >
                    <img src={img.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <Link to={`/shop?brand=${product.brand.slug}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">{product.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <StarRating rating={product.rating} size={16} showNumber reviewCount={product.review_count} />
                <button onClick={() => setActiveTab('reviews')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  {product.review_count} reviews
                </button>
                <span className={cn("text-sm font-medium", stockStatus?.color)}>{stockStatus?.label}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">{formatPrice(effectivePrice)}</span>
              {discount > 0 && <span className="text-xl text-zinc-500 line-through">{formatPrice(product.price)}</span>}
              {discount > 0 && <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-sm font-semibold">Save {formatPrice(product.price - effectivePrice)}</span>}
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>

            {/* Variants */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        selectedSize === size ? "border-white bg-white text-zinc-950" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {product.colors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-white mb-2">Color: <span className="text-zinc-400">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        selectedColor === color ? "border-white bg-white text-zinc-950" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium text-white mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-11 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={16} /></button>
                  <span className="w-12 text-center text-white font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-11 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={16} /></button>
                </div>
                <span className="text-sm text-zinc-500">{product.stock} available</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
                className="flex-1 py-4 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                {adding ? 'Added to Cart!' : product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap size={18} /> Buy Now
              </button>
              <button
                onClick={() => toggle(product.id)}
                className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-colors"
              >
                <Heart size={20} className={cn(inWishlist ? "text-rose-500 fill-rose-500" : "text-zinc-400")} />
              </button>
            </div>

            {/* Info badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-800/50">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck size={20} className="text-zinc-400" />
                <p className="text-[10px] text-zinc-500">{product.shipping_info}</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw size={20} className="text-zinc-400" />
                <p className="text-[10px] text-zinc-500">{product.return_info}</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield size={20} className="text-zinc-400" />
                <p className="text-[10px] text-zinc-500">Secure checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-zinc-800/50 pt-8">
          <div className="flex gap-6 mb-8">
            {(['description', 'specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm font-medium pb-2 border-b-2 transition-colors capitalize",
                  activeTab === tab ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab === 'specs' ? 'Specifications' : tab === 'reviews' ? `Reviews (${product.review_count})` : 'Description'}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-3xl">
              <p className="text-zinc-400 leading-relaxed">{product.description}</p>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="max-w-2xl">
              {product.product_specifications && product.product_specifications.length > 0 ? (
                <div className="space-y-2">
                  {product.product_specifications.sort((a, b) => a.sort_order - b.sort_order).map((spec) => (
                    <div key={spec.id} className="flex justify-between py-3 border-b border-zinc-800/50">
                      <span className="text-sm text-zinc-500">{spec.spec_name}</span>
                      <span className="text-sm text-white font-medium">{spec.spec_value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No specifications available for this product.</p>
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewsSection reviews={reviews} productId={product.id} productName={product.name} onRefresh={refresh} />
          )}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsSection({ reviews, productId, productName, onRefresh }: { reviews: Review[]; productId: string; productName: string; onRefresh: () => void }) {
  const { session, profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setSubmitting(true);
    await supabase.from('reviews').insert({
      product_id: productId,
      user_id: session.user.id,
      user_name: profile?.full_name || session.user.email || 'Anonymous',
      rating,
      title,
      body,
      is_verified_purchase: false,
    });
    setSubmitting(false);
    setShowForm(false);
    setTitle('');
    setBody('');
    setRating(5);
    onRefresh();
  };

  return (
    <div className="max-w-4xl">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="text-center">
          <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
          <StarRating rating={avgRating} size={20} />
          <p className="text-sm text-zinc-500 mt-2">{reviews.length} reviews</p>
        </div>
        <div className="md:col-span-2 space-y-2">
          {distribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm text-zinc-400 w-12">{star} star</span>
              <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm text-zinc-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {session?.user && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl hover:border-zinc-600 transition-colors"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      )}

      {showForm && session?.user && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
          <div>
            <p className="text-sm font-medium text-white mb-2">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star size={24} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
          />
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-zinc-500 text-sm">No reviews yet. Be the first to review {productName}!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{review.user_name}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={12} />
                      {review.is_verified_purchase && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <Check size={10} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{formatDate(review.created_at)}</span>
              </div>
              {review.title && <h4 className="text-sm font-semibold text-white mb-1">{review.title}</h4>}
              <p className="text-sm text-zinc-400">{review.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
