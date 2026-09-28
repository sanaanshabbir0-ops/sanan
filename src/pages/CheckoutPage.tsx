import { useState, useEffect } from 'react';
import { Check, ArrowLeft, CreditCard, Truck, MapPin, Shield } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { formatPrice, getEffectivePrice } from '@/lib/utils';
import type { Product, Address } from '@/types';

export function CheckoutPage() {
  const { navigate } = useRouter();
  const { items, loading, subtotal, clearCart } = useCart();
  const { session, profile } = useAuth();
  const { settings } = useStoreSettings();
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('United States');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.product_id);
    supabase.from('products').select('*, brand:brands(*), product_images(*)').in('id', ids).then(({ data }) => {
      const map: Record<string, Product> = {};
      (data || []).forEach((p) => { map[p.id] = p as unknown as Product; });
      setProductMap(map);
    });
  }, [items]);

  useEffect(() => {
    if (!session?.user) return;
    supabase.from('addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false }).then(({ data }) => {
      setAddresses((data || []) as Address[]);
      if (data && data.length > 0) setSelectedAddressId(data[0].id);
    });
  }, [session]);

  const shippingCost = subtotal >= (settings?.free_shipping_threshold || 99) ? 0 : (settings?.shipping_flat_rate || 9.99);
  const tax = subtotal * (settings?.tax_rate || 0.08);
  const total = subtotal + shippingCost + tax;

  const useSelectedAddress = () => {
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (addr) {
      setFullName(addr.full_name);
      setPhone(addr.phone);
      setAddress1(addr.address_line1);
      setAddress2(addr.address_line2);
      setCity(addr.city);
      setStateVal(addr.state);
      setPostal(addr.postal_code);
      setCountry(addr.country);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session?.user || items.length === 0) return;
    setPlacing(true);

    const shippingAddress = { fullName, address1, address2, city, state: stateVal, postal, country };
    const orderItems = items.map((item) => {
      const product = productMap[item.product_id];
      const price = getEffectivePrice(product);
      return {
        product_id: item.product_id,
        product_name: product.name,
        brand_name: product.brand?.name || '',
        product_image: product.product_images?.[0]?.image_url || '',
        variant: item.variant,
        quantity: item.quantity,
        unit_price: price,
        total_price: price * item.quantity,
      };
    });

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: session.user.id,
      customer_name: fullName,
      customer_email: email,
      status: 'pending',
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
      payment_method: paymentMethod,
      subtotal,
      shipping_cost: shippingCost,
      tax,
      total,
      shipping_address: shippingAddress,
      contact_phone: phone,
      notes,
    }).select().single();

    if (error) {
      setPlacing(false);
      return;
    }

    if (order) {
      await supabase.from('order_items').insert(
        orderItems.map((oi) => ({ ...oi, order_id: order.id }))
      );
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'pending',
        note: 'Order placed',
      });
      await clearCart();
      setPlaced(order.order_number);
    }
    setPlacing(false);
  };

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;

  if (placed) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h1>
          <p className="text-zinc-400 mb-1">Your order number is</p>
          <p className="text-xl font-bold text-white mb-6">{placed}</p>
          <p className="text-sm text-zinc-500 mb-8">We'll send you a confirmation email shortly. You can track your order from your account.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/account/orders" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Track Order</Link>
            <Link to="/shop" className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white text-sm font-semibold rounded-xl">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-20">
        <EmptyState title="Your cart is empty" message="Add some products before checking out." action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Shop Now</Link>} />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sign In to Checkout</h1>
          <p className="text-zinc-400 mb-6">Please sign in to your account to complete your purchase.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signin" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Sign In</Link>
            <Link to="/signup" className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white text-sm font-semibold rounded-xl">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Saved addresses */}
            {addresses.length > 0 && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><MapPin size={16} /> Saved Addresses</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => { setSelectedAddressId(addr.id); useSelectedAddress(); }}
                      className={`text-left p-4 rounded-xl border transition-all ${selectedAddressId === addr.id ? 'border-white bg-white/5' : 'border-zinc-800 hover:border-zinc-600'}`}
                    >
                      <p className="text-sm font-medium text-white">{addr.label}</p>
                      <p className="text-xs text-zinc-500 mt-1">{addr.full_name}</p>
                      <p className="text-xs text-zinc-500">{addr.address_line1}, {addr.city}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <h2 className="text-sm font-semibold text-white">Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" value={fullName} onChange={setFullName} />
                <Input label="Email" value={email} onChange={setEmail} type="email" />
                <Input label="Phone" value={phone} onChange={setPhone} type="tel" />
              </div>
            </div>

            {/* Shipping address */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <h2 className="text-sm font-semibold text-white">Shipping Address</h2>
              <Input label="Address Line 1" value={address1} onChange={setAddress1} />
              <Input label="Address Line 2 (Optional)" value={address2} onChange={setAddress2} />
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="City" value={city} onChange={setCity} />
                <Input label="State" value={stateVal} onChange={setStateVal} />
                <Input label="Postal Code" value={postal} onChange={setPostal} />
              </div>
              <Input label="Country" value={country} onChange={setCountry} />
            </div>

            {/* Delivery */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Truck size={16} /> Delivery Option</h2>
              <div className="space-y-2">
                {[
                  { value: 'standard', label: 'Standard Shipping', desc: '5-7 business days', cost: shippingCost },
                  { value: 'express', label: 'Express Shipping', desc: '2-3 business days', cost: shippingCost + 15 },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${deliveryOption === opt.value ? 'border-white bg-white/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="delivery" checked={deliveryOption === opt.value} onChange={() => setDeliveryOption(opt.value)} className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                        <p className="text-xs text-zinc-500">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white">{opt.cost === 0 ? 'Free' : formatPrice(opt.cost)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard size={16} /> Payment Method</h2>
              <div className="space-y-2">
                {[
                  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex' },
                  { value: 'wallet', label: 'Digital Wallet', desc: 'PayPal, Apple Pay, Google Pay' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === opt.value ? 'border-white bg-white/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="w-4 h-4 text-white" />
                    <div>
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-zinc-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes (optional)"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <h2 className="text-lg font-bold text-white">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const product = productMap[item.product_id];
                  if (!product) return null;
                  const price = getEffectivePrice(product);
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        {product.product_images?.[0]?.image_url && <img src={product.product_images[0].image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white line-clamp-1">{product.name}</p>
                        <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-white">{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-white">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Shipping</span><span className="text-white">{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-zinc-400">Tax</span><span className="text-white">{formatPrice(tax)}</span></div>
              </div>
              <div className="flex justify-between pt-4 border-t border-zinc-800">
                <span className="text-base font-bold text-white">Total</span>
                <span className="text-2xl font-bold text-white">{formatPrice(total)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-4 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Shield size={14} /> Secure 256-bit SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
      />
    </div>
  );
}
