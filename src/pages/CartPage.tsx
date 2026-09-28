import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X, Truck } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/hooks/useData';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { formatPrice, getEffectivePrice, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export function CartPage() {
  const { navigate } = useRouter();
  const { items, loading, updateQuantity, removeItem, subtotal, addToCart } = useCart();
  const { settings } = useStoreSettings();
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.product_id);
    supabase
      .from('products')
      .select('*, brand:brands(*), product_images(*)')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, Product> = {};
        (data || []).forEach((p) => { map[p.id] = p as unknown as Product; });
        setProductMap(map);
      });
  }, [items]);

  const shippingCost = subtotal >= (settings?.free_shipping_threshold || 99) ? 0 : (settings?.shipping_flat_rate || 9.99);
  const discount = appliedCoupon?.discount || 0;
  const tax = (subtotal - discount) * (settings?.tax_rate || 0.08);
  const total = subtotal - discount + shippingCost + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!data) {
      setCouponError('Invalid coupon code');
      return;
    }
    if (data.min_purchase && subtotal < data.min_purchase) {
      setCouponError(`Minimum purchase of ${formatPrice(data.min_purchase)} required`);
      return;
    }
    let disc = 0;
    if (data.discount_type === 'percentage') {
      disc = (subtotal * data.discount_value) / 100;
    } else {
      disc = data.discount_value;
    }
    setAppliedCoupon({ code: data.code, discount: disc });
    setCouponCode('');
  };

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added anything yet. Let's fix that."
            action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Start Shopping</Link>}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => {
                const product = productMap[item.product_id];
                if (!product) return null;
                const price = getEffectivePrice(product);
                const image = product.product_images?.[0]?.image_url || '';
                return (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                    <Link to={`/product/${product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      {image && <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-cover" />}
                    </Link>
                    <div className="flex-1 min-w-0">
                      {product.brand && <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{product.brand.name}</p>}
                      <Link to={`/product/${product.slug}`} className="text-sm font-medium text-white hover:text-zinc-300 line-clamp-1">{product.name}</Link>
                      {item.variant && <p className="text-xs text-zinc-500 mt-0.5">{item.variant}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-base font-bold text-white">{formatPrice(price)}</span>
                        {product.sale_price && product.sale_price < product.price && (
                          <span className="text-xs text-zinc-500 line-through">{formatPrice(product.price)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-zinc-800 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"><Minus size={14} /></button>
                          <span className="w-10 text-center text-sm text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatPrice(price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
              <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mt-4">
                <ArrowRight size={14} className="rotate-180" /> Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
                <h2 className="text-lg font-bold text-white">Order Summary</h2>

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">{appliedCoupon.code}</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-emerald-400"><X size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Coupon code"
                        className="flex-1 bg-zinc-900 border border-zinc-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                      <button onClick={applyCoupon} className="px-4 py-2.5 bg-zinc-800 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors">Apply</button>
                    </div>
                    {couponError && <p className="text-xs text-rose-400 mt-1">{couponError}</p>}
                    <p className="text-[10px] text-zinc-600 mt-1.5">Try: WELCOME10, SAVE20, FLASH30</p>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Discount</span>
                      <span className="text-emerald-400">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Shipping</span>
                    <span className="text-white font-medium">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Tax</span>
                    <span className="text-white font-medium">{formatPrice(tax)}</span>
                  </div>
                </div>

                {shippingCost > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <Truck size={14} className="text-amber-400" />
                    <p className="text-xs text-amber-400">Add {formatPrice((settings?.free_shipping_threshold || 99) - subtotal)} more for free shipping</p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-zinc-800">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
