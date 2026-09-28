import { useState, useEffect } from 'react';
import { User, ShoppingBag, Heart, MapPin, Settings, Package, LogOut, Star, Bell, Tag, Eye } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import type { Order, Address, Product } from '@/types';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export function AccountPage({ section }: { section: string }) {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const { items: wishlistItems } = useWishlist();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  useEffect(() => {
    if (!session?.user) { navigate('/signin'); return; }
    loadData();
  }, [session, navigate]);

  const loadData = async () => {
    if (!session?.user) return;
    setLoading(true);
    const [ordersRes, addrRes, viewedRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false }),
      supabase.from('recently_viewed').select('product:products(*, brand:brands(*), category:categories(*), product_images(*))').eq('user_id', session.user.id).order('viewed_at', { ascending: false }).limit(10),
    ]);
    setOrders((ordersRes.data || []) as Order[]);
    setAddresses((addrRes.data || []) as Address[]);
    setRecentlyViewed((viewedRes.data || []).map((r: Record<string, unknown>) => r.product) as Product[]);
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!session?.user) return;
    await supabase.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', session.user.id);
    await refreshProfile();
    setEditingProfile(false);
  };

  if (!session?.user) return null;
  if (loading) return <div className="pt-20"><LoadingSpinner /></div>;

  const navItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
    { key: 'recently-viewed', label: 'Recently Viewed', icon: Eye },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-lg font-bold text-white">
                    {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
                  </div>
                </div>
                <button onClick={() => { signOut(); navigate('/'); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    to={`/account${item.key === 'profile' ? '' : '/' + item.key}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      section === item.key || (section === 'profile' && item.key === 'profile')
                        ? "bg-white text-zinc-950"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon size={18} /> {item.label}
                    {item.key === 'wishlist' && wishlistItems.length > 0 && (
                      <span className="ml-auto text-xs bg-zinc-800 text-white px-2 py-0.5 rounded-full">{wishlistItems.length}</span>
                    )}
                    {item.key === 'orders' && orders.length > 0 && (
                      <span className="ml-auto text-xs bg-zinc-800 text-white px-2 py-0.5 rounded-full">{orders.length}</span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            {section === 'profile' && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-bold text-white">Profile Information</h1>
                  <button onClick={() => { setEditingProfile(!editingProfile); setFullName(profile?.full_name || ''); setPhone(profile?.phone || ''); }} className="text-sm text-zinc-400 hover:text-white">
                    {editingProfile ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1.5 block">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 mb-1.5 block">Phone</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500" />
                    </div>
                    <button onClick={saveProfile} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Save Changes</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <DetailRow label="Full Name" value={profile?.full_name || 'Not set'} />
                    <DetailRow label="Email" value={profile?.email || ''} />
                    <DetailRow label="Phone" value={profile?.phone || 'Not set'} />
                    <DetailRow label="Member Since" value={formatDate(profile?.created_at || new Date().toISOString())} />
                  </div>
                )}
              </div>
            )}

            {section === 'orders' && (
              <div>
                <h1 className="text-xl font-bold text-white mb-6">My Orders</h1>
                {orders.length === 0 ? (
                  <EmptyState title="No orders yet" message="When you place an order, it will appear here." action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Start Shopping</Link>} />
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-bold text-white">{order.order_number}</p>
                            <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium", order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-bold text-white">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                        {/* Status tracker */}
                        <div className="flex items-center gap-1 mb-4">
                          {ORDER_STATUSES.map((status, i) => {
                            const currentIdx = ORDER_STATUSES.indexOf(order.status);
                            const isActive = i <= currentIdx;
                            return (
                              <div key={status} className="flex items-center flex-1 last:flex-none">
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", isActive ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-500")}>
                                  {i + 1}
                                </div>
                                {i < ORDER_STATUSES.length - 1 && <div className={cn("flex-1 h-0.5 mx-1", isActive && i < currentIdx ? "bg-white" : "bg-zinc-800")} />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-2">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white line-clamp-1">{item.product_name}</p>
                                <p className="text-xs text-zinc-500">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                              </div>
                              <span className="text-sm font-medium text-white">{formatPrice(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'wishlist' && (
              <div>
                <h1 className="text-xl font-bold text-white mb-6">My Wishlist</h1>
                {wishlistItems.length === 0 ? (
                  <EmptyState title="Your wishlist is empty" message="Save items you love by tapping the heart icon." action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Browse Products</Link>} />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => item.product && <ProductCard key={item.id} product={item.product} compact />)}
                  </div>
                )}
              </div>
            )}

            {section === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-bold text-white">Saved Addresses</h1>
                </div>
                {addresses.length === 0 ? (
                  <EmptyState title="No addresses saved" message="Add a shipping address during checkout to save it here." />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-white">{addr.label}</span>
                          {addr.is_default && <span className="text-xs text-emerald-400">Default</span>}
                        </div>
                        <p className="text-sm text-white">{addr.full_name}</p>
                        <p className="text-sm text-zinc-500">{addr.address_line1}</p>
                        <p className="text-sm text-zinc-500">{addr.city}, {addr.state} {addr.postal_code}</p>
                        <p className="text-sm text-zinc-500">{addr.country}</p>
                        {addr.phone && <p className="text-sm text-zinc-500 mt-2">{addr.phone}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'recently-viewed' && (
              <div>
                <h1 className="text-xl font-bold text-white mb-6">Recently Viewed</h1>
                {recentlyViewed.length === 0 ? (
                  <EmptyState title="Nothing here yet" message="Products you view will appear here for easy access." action={<Link to="/shop" className="px-6 py-3 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Browse Products</Link>} />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} compact />)}
                  </div>
                )}
              </div>
            )}

            {section === 'settings' && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                <h1 className="text-xl font-bold text-white mb-6">Account Settings</h1>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Email Notifications</p>
                        <p className="text-xs text-zinc-500">Order updates and promotions</p>
                      </div>
                    </div>
                    <ToggleSwitch defaultOn />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <Tag size={18} className="text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Deal Alerts</p>
                        <p className="text-xs text-zinc-500">Flash deals and price drops</p>
                      </div>
                    </div>
                    <ToggleSwitch defaultOn />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(!on)} className={cn("w-12 h-6 rounded-full transition-colors", on ? "bg-white" : "bg-zinc-700")}>
      <div className={cn("w-5 h-5 rounded-full bg-zinc-900 transition-transform", on ? "translate-x-6" : "translate-x-0.5")} />
    </button>
  );
}
