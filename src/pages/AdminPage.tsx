import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, Tags, FolderTree, ShoppingCart, Users, Ticket,
  LayoutTemplate, Image, Settings, LogOut, Plus, Edit3, Trash2, Copy,
  Search, TrendingUp, DollarSign, AlertTriangle, Clock, X, Check, Eye,
  ChevronRight, BarChart3, Boxes, Save
} from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState } from '@/components/Loading';
import { formatPrice, formatDate, cn, slugify } from '@/lib/utils';
import type { Product, Category, Brand, Order, Coupon, StoreSettings, HomepageSection, Banner } from '@/types';

export function AdminPage({ section }: { section: string }) {
  const { profile, isAdmin, loading: authLoading, signOut } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!authLoading && (!profile || !isAdmin)) {
      navigate('/signin');
    }
  }, [profile, isAdmin, authLoading, navigate]);

  if (authLoading || !profile || !isAdmin) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><LoadingSpinner /></div>;
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'categories', label: 'Categories', icon: FolderTree },
    { key: 'brands', label: 'Brands', icon: Tags },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
    { key: 'homepage', label: 'Homepage Builder', icon: LayoutTemplate },
    { key: 'banners', label: 'Banners & Media', icon: Image },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col fixed lg:sticky top-0 h-screen z-40">
        <div className="p-6 border-b border-zinc-800/50">
          <Link to="/" className="block">
            <span className="text-2xl font-black tracking-tighter text-white">ZAMA</span>
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold mt-0.5">Admin Portal</p>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={`/admin/${item.key === 'dashboard' ? '' : item.key}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors",
                (section === item.key || (section === 'dashboard' && item.key === 'dashboard'))
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
              {(profile.full_name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile.full_name || 'Admin'}</p>
              <p className="text-[10px] text-zinc-500 truncate">{profile.email}</p>
            </div>
          </div>
          <button onClick={() => { signOut(); navigate('/'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          {section === 'dashboard' && <AdminDashboard />}
          {section === 'products' && <AdminProducts />}
          {section === 'categories' && <AdminCategories />}
          {section === 'brands' && <AdminBrands />}
          {section === 'orders' && <AdminOrders />}
          {section === 'customers' && <AdminCustomers />}
          {section === 'coupons' && <AdminCoupons />}
          {section === 'homepage' && <AdminHomepage />}
          {section === 'banners' && <AdminBanners />}
          {section === 'settings' && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

// ============ DASHBOARD ============
function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0,
    pendingOrders: 0, lowStock: 0, recentOrders: [] as Order[],
    topProducts: [] as Product[], lowStockProducts: [] as Product[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('sales_count', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'customer'),
      ]);
      const orders = (ordersRes.data || []) as Order[];
      const products = (productsRes.data || []) as Product[];
      const customers = customersRes.data || [];
      const revenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0);
      setStats({
        totalRevenue: revenue,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        lowStock: products.filter(p => p.stock <= p.low_stock_threshold).length,
        recentOrders: orders.slice(0, 5),
        topProducts: products.slice(0, 5),
        lowStockProducts: products.filter(p => p.stock <= p.low_stock_threshold).slice(0, 5),
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={DollarSign} color="from-emerald-500/20 to-emerald-500/5" />
        <StatCard label="Total Orders" value={String(stats.totalOrders)} icon={ShoppingCart} color="from-blue-500/20 to-blue-500/5" />
        <StatCard label="Customers" value={String(stats.totalCustomers)} icon={Users} color="from-amber-500/20 to-amber-500/5" />
        <StatCard label="Products" value={String(stats.totalProducts)} icon={Package} color="from-rose-500/20 to-rose-500/5" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-zinc-400 hover:text-white">View all</Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-500">No orders yet</p>
            ) : stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{order.order_number}</p>
                  <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{formatPrice(order.total)}</p>
                  <p className="text-xs text-zinc-500">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Alerts</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Clock size={18} className="text-amber-400" />
              <p className="text-sm text-zinc-300">{stats.pendingOrders} pending orders</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <AlertTriangle size={18} className="text-rose-400" />
              <p className="text-sm text-zinc-300">{stats.lowStock} products low on stock</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <h2 className="text-sm font-semibold text-white mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-zinc-600 w-5">{i + 1}</span>
                <p className="text-sm text-white flex-1 line-clamp-1">{p.name}</p>
                <span className="text-sm text-zinc-400">{p.sales_count} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <h2 className="text-sm font-semibold text-white mb-4">Low Stock Products</h2>
          <div className="space-y-3">
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-sm text-zinc-500">All products well stocked</p>
            ) : stats.lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-sm text-white line-clamp-1">{p.name}</p>
                <span className={cn("text-sm font-medium", p.stock === 0 ? "text-rose-400" : "text-amber-400")}>{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; color: string }) {
  return (
    <div className={cn("p-5 rounded-2xl border border-zinc-800/50 bg-gradient-to-br", color)}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className="text-white/70" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{label}</p>
    </div>
  );
}

// ============ PRODUCTS ============
function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes, brandRes] = await Promise.all([
      supabase.from('products').select('*, brand:brands(*), category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name'),
    ]);
    setProducts((prodRes.data || []) as unknown as Product[]);
    setCategories((catRes.data || []) as Category[]);
    setBrands((brandRes.data || []) as Brand[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const togglePublish = async (p: Product) => {
    await supabase.from('products').update({ is_published: !p.is_published }).eq('id', p.id);
    load();
  };

  const duplicate = async (p: Product) => {
    await supabase.from('products').insert({
      name: `${p.name} (Copy)`, slug: `${p.slug}-copy-${Date.now()}`,
      description: p.description, brand_id: p.brand_id, category_id: p.category_id,
      sku: `${p.sku}-COPY`, price: p.price, sale_price: p.sale_price, stock: p.stock,
      sizes: p.sizes, colors: p.colors, is_published: false,
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Products ({products.length})</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
              {p.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white line-clamp-1">{p.name}</p>
              <p className="text-xs text-zinc-500">{p.brand?.name || 'No brand'} • {p.category?.name || 'No category'}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white">{formatPrice(p.price)}</p>
              <p className={cn("text-xs", p.stock <= p.low_stock_threshold ? "text-amber-400" : "text-zinc-500")}>Stock: {p.stock}</p>
            </div>
            <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium", p.is_published ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>
              {p.is_published ? 'Published' : 'Draft'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"><Edit3 size={14} /></button>
              <button onClick={() => duplicate(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"><Copy size={14} /></button>
              <button onClick={() => togglePublish(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">{p.is_published ? <Eye size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => remove(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <ProductEditor product={editing} categories={categories} brands={brands} onClose={() => { setEditing(null); setCreating(false); }} onSaved={load} />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, brands, onClose, onSaved }: { product: Product | null; categories: Category[]; brands: Brand[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || '', slug: product?.slug || '', description: product?.description || '',
    brand_id: product?.brand_id || '', category_id: product?.category_id || '', sku: product?.sku || '',
    price: product?.price || 0, sale_price: product?.sale_price || '', stock: product?.stock || 0,
    low_stock_threshold: product?.low_stock_threshold || 5, is_published: product?.is_published ?? true,
    is_featured: product?.is_featured ?? false, is_trending: product?.is_trending ?? false,
    is_best_seller: product?.is_best_seller ?? false, is_new_arrival: product?.is_new_arrival ?? false,
    sizes: (product?.sizes || []).join(', '), colors: (product?.colors || []).join(', '),
    shipping_info: product?.shipping_info || 'Ships within 2-3 business days',
    return_info: product?.return_info || '30-day return policy',
  });
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const save = async () => {
    setSaving(true);
    const data = {
      ...form,
      slug: form.slug || slugify(form.name),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      price: Number(form.price),
      stock: Number(form.stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (product) {
      await supabase.from('products').update(data).eq('id', product.id);
      if (imageUrl) {
        await supabase.from('product_images').insert({ product_id: product.id, image_url: imageUrl });
      }
    } else {
      const { data: newProd } = await supabase.from('products').insert(data).select().single();
      if (newProd && imageUrl) {
        await supabase.from('product_images').insert({ product_id: newProd.id, image_url: imageUrl });
      }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose}><X size={20} className="text-zinc-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" /></Field>
            <Field label="Slug (auto-generated if empty)"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input" /></Field>
          </div>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="admin-input resize-none" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Brand"><select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="admin-input"><option value="">None</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <Field label="Category"><select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input"><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="SKU"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="admin-input" /></Field>
            <Field label="Price"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="admin-input" /></Field>
            <Field label="Sale Price"><input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="admin-input" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Stock"><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="admin-input" /></Field>
            <Field label="Low Stock Threshold"><input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} className="admin-input" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Sizes (comma-separated)"><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="admin-input" /></Field>
            <Field label="Colors (comma-separated)"><input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="admin-input" /></Field>
          </div>
          <Field label="Image URL"><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="admin-input" /></Field>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'is_published', label: 'Published' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_trending', label: 'Trending' },
              { key: 'is_best_seller', label: 'Best Seller' },
              { key: 'is_new_arrival', label: 'New Arrival' },
            ].map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[flag.key as keyof typeof form] as boolean} onChange={(e) => setForm({ ...form, [flag.key]: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-zinc-300">{flag.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-zinc-800 text-white text-sm font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============ CATEGORIES ============
function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', sort_order: 0, is_enabled: true });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setItems((data || []) as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const data = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await supabase.from('categories').update(data).eq('id', editing.id);
    } else {
      await supabase.from('categories').insert(data);
    }
    setForm({ name: '', slug: '', description: '', image_url: '', sort_order: 0, is_enabled: true });
    setEditing(null); setCreating(false); load();
  };

  const edit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description, image_url: c.image_url, sort_order: c.sort_order, is_enabled: c.is_enabled });
    setCreating(true);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Categories ({items.length})</h1>
        <button onClick={() => { setCreating(true); setEditing(null); setForm({ name: '', slug: '', description: '', image_url: '', sort_order: 0, is_enabled: true }); }} className="px-4 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {creating && (
        <div className="mb-6 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={() => { setCreating(false); setEditing(null); }}><X size={18} className="text-zinc-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" /></Field>
            <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" className="admin-input" /></Field>
          </div>
          <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" /></Field>
          <Field label="Image URL"><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="admin-input" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Sort Order"><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="admin-input" /></Field>
            <label className="flex items-center gap-2 cursor-pointer pt-6"><input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-zinc-300">Enabled</span></label>
          </div>
          <button onClick={save} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl">{editing ? 'Update' : 'Create'}</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <div key={c.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-zinc-500">/{c.slug}</p>
              </div>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px]", c.is_enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>{c.is_enabled ? 'Active' : 'Disabled'}</span>
            </div>
            {c.image_url && <img src={c.image_url} alt={c.name} className="w-full h-24 rounded-lg object-cover mb-2" />}
            <div className="flex gap-2">
              <button onClick={() => edit(c)} className="flex-1 py-2 bg-zinc-800 text-white text-xs rounded-lg flex items-center justify-center gap-1"><Edit3 size={12} /> Edit</button>
              <button onClick={() => remove(c.id)} className="px-3 py-2 bg-zinc-800 text-rose-400 rounded-lg"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ BRANDS ============
function AdminBrands() {
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', logo_url: '', banner_url: '', is_enabled: true });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('brands').select('*').order('name');
    setItems((data || []) as Brand[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const data = { ...form, slug: form.slug || slugify(form.name) };
    if (editing) {
      await supabase.from('brands').update(data).eq('id', editing.id);
    } else {
      await supabase.from('brands').insert(data);
    }
    setForm({ name: '', slug: '', description: '', logo_url: '', banner_url: '', is_enabled: true });
    setCreating(false); setEditing(null); load();
  };

  const edit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, description: b.description, logo_url: b.logo_url, banner_url: b.banner_url, is_enabled: b.is_enabled });
    setCreating(true);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    await supabase.from('brands').delete().eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Brands ({items.length})</h1>
        <button onClick={() => { setCreating(true); setEditing(null); setForm({ name: '', slug: '', description: '', logo_url: '', banner_url: '', is_enabled: true }); }} className="px-4 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {creating && (
        <div className="mb-6 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{editing ? 'Edit Brand' : 'New Brand'}</h2>
            <button onClick={() => { setCreating(false); setEditing(null); }}><X size={18} className="text-zinc-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" /></Field>
            <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" className="admin-input" /></Field>
          </div>
          <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" /></Field>
          <Field label="Logo URL"><input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="admin-input" /></Field>
          <Field label="Banner URL"><input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className="admin-input" /></Field>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm text-zinc-300">Enabled</span></label>
          <button onClick={save} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl">{editing ? 'Update' : 'Create'}</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((b) => (
          <div key={b.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-center">
            <div className="text-2xl font-black tracking-tighter text-white mb-2">{b.name}</div>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{b.description}</p>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] inline-block mb-3", b.is_enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>{b.is_enabled ? 'Active' : 'Disabled'}</span>
            <div className="flex gap-2">
              <button onClick={() => edit(b)} className="flex-1 py-2 bg-zinc-800 text-white text-xs rounded-lg flex items-center justify-center gap-1"><Edit3 size={12} /> Edit</button>
              <button onClick={() => remove(b.id)} className="px-3 py-2 bg-zinc-800 text-rose-400 rounded-lg"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ ORDERS ============
function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*, order_items(*), order_status_history(*)').order('created_at', { ascending: false });
    setOrders((data || []) as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    await supabase.from('order_status_history').insert({ order_id: orderId, status, note: `Status updated to ${status}` });
    load();
    if (selected?.id === orderId) setSelected({ ...selected, status: status as Order['status'] });
  };

  if (loading) return <LoadingSpinner />;

  const filtered = orders.filter(o => o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase()));
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Orders ({orders.length})</h1>
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number or customer..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
      </div>

      {selected ? (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">{selected.order_number}</h2>
              <p className="text-sm text-zinc-500">{selected.customer_name} • {formatDate(selected.created_at)}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Shipping Address</p>
              <p className="text-sm text-white">{selected.customer_name}</p>
              <p className="text-sm text-zinc-400">{JSON.stringify(selected.shipping_address)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Payment</p>
              <p className="text-sm text-white">{selected.payment_method} • {selected.payment_status}</p>
              <p className="text-sm text-white mt-2">Total: {formatPrice(selected.total)}</p>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs text-zinc-500 mb-2">Items</p>
            {selected.order_items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
                {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1"><p className="text-sm text-white">{item.product_name}</p><p className="text-xs text-zinc-500">Qty: {item.quantity}</p></div>
                <span className="text-sm text-white">{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors", selected.status === s ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")}>{s.replace(/_/g, ' ')}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <div key={o.id} onClick={() => setSelected(o)} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 cursor-pointer hover:border-zinc-600 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{o.order_number}</p>
                <p className="text-xs text-zinc-500">{o.customer_name} • {formatDate(o.created_at)}</p>
              </div>
              <span className={cn("px-2 py-1 rounded-full text-[10px] font-medium capitalize", o.status === 'delivered' ? "bg-emerald-500/10 text-emerald-400" : o.status === 'cancelled' || o.status === 'refunded' ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400")}>{o.status.replace(/_/g, ' ')}</span>
              <span className="text-sm text-white">{formatPrice(o.total)}</span>
              <ChevronRight size={16} className="text-zinc-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ CUSTOMERS ============
function AdminCustomers() {
  const [customers, setCustomers] = useState<{ id: string; email: string; full_name: string; phone: string; is_active: boolean; created_at: string; orderCount?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
      const { data: orders } = await supabase.from('orders').select('user_id');
      const orderCounts: Record<string, number> = {};
      (orders || []).forEach((o: { user_id: string }) => { orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1; });
      setCustomers((profiles || []).map((p) => ({ ...p, orderCount: orderCounts[p.id] || 0 })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = customers.filter(c => c.email.toLowerCase().includes(search.toLowerCase()) || c.full_name.toLowerCase().includes(search.toLowerCase()));

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    setCustomers(customers.map(c => c.id === id ? { ...c, is_active: !current } : c));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Customers ({customers.length})</h1>
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600" />
      </div>
      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">{(c.full_name || c.email).charAt(0).toUpperCase()}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{c.full_name || 'Unnamed'}</p>
              <p className="text-xs text-zinc-500">{c.email} • {c.orderCount} orders</p>
            </div>
            <span className={cn("px-2 py-1 rounded-full text-[10px]", c.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{c.is_active ? 'Active' : 'Disabled'}</span>
            <button onClick={() => toggleActive(c.id, c.is_active)} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 bg-zinc-800 rounded-lg">{c.is_active ? 'Disable' : 'Enable'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ COUPONS ============
function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: 0, min_purchase: 0, is_active: true, end_date: '', usage_limit: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data || []) as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    await supabase.from('coupons').insert({
      ...form,
      code: form.code.toUpperCase(),
      discount_value: Number(form.discount_value),
      min_purchase: Number(form.min_purchase),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      end_date: form.end_date || null,
    });
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 0, min_purchase: 0, is_active: true, end_date: '', usage_limit: '' });
    setCreating(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Coupons ({coupons.length})</h1>
        <button onClick={() => setCreating(!creating)} className="px-4 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {creating && (
        <div className="mb-6 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">New Coupon</h2>
            <button onClick={() => setCreating(false)}><X size={18} className="text-zinc-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Code"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="admin-input" /></Field>
            <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" /></Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Type"><select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="admin-input"><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></Field>
            <Field label="Value"><input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} className="admin-input" /></Field>
            <Field label="Min Purchase"><input type="number" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: Number(e.target.value) })} className="admin-input" /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Usage Limit"><input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" className="admin-input" /></Field>
            <Field label="End Date"><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="admin-input" /></Field>
          </div>
          <button onClick={save} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Create Coupon</button>
        </div>
      )}

      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Ticket size={18} className="text-amber-400" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{c.code}</p>
              <p className="text-xs text-zinc-500">{c.discount_type === 'percentage' ? `${c.discount_value}% off` : `${formatPrice(c.discount_value)} off`} • Used {c.used_count}/{c.usage_limit || '∞'}</p>
            </div>
            <span className={cn("px-2 py-1 rounded-full text-[10px]", c.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>{c.is_active ? 'Active' : 'Inactive'}</span>
            <button onClick={() => remove(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ HOMEPAGE BUILDER ============
function AdminHomepage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('homepage_sections').select('*').order('sort_order');
    setSections((data || []) as HomepageSection[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSection = async (id: string, enabled: boolean) => {
    await supabase.from('homepage_sections').update({ is_enabled: !enabled }).eq('id', id);
    load();
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const current = sections[idx];
    const swap = sections[swapIdx];
    await Promise.all([
      supabase.from('homepage_sections').update({ sort_order: swap.sort_order }).eq('id', current.id),
      supabase.from('homepage_sections').update({ sort_order: current.sort_order }).eq('id', swap.id),
    ]);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Homepage Builder</h1>
      <p className="text-sm text-zinc-500 mb-6">Enable, disable, and reorder homepage sections</p>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-sm font-bold text-zinc-600 w-6">{i + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white capitalize">{s.section_key.replace(/_/g, ' ')}</p>
              <p className="text-xs text-zinc-500">{s.section_title}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => moveSection(s.id, 'up')} disabled={i === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30">↑</button>
              <button onClick={() => moveSection(s.id, 'down')} disabled={i === sections.length - 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30">↓</button>
            </div>
            <button onClick={() => toggleSection(s.id, s.is_enabled)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium", s.is_enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>
              {s.is_enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ BANNERS ============
function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '/shop', placement: 'homepage', is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners((data || []) as Banner[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    await supabase.from('banners').insert(form);
    setForm({ title: '', subtitle: '', image_url: '', link_url: '/shop', placement: 'homepage', is_active: true });
    setCreating(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('banners').update({ is_active: !active }).eq('id', id);
    load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Banners & Media ({banners.length})</h1>
        <button onClick={() => setCreating(!creating)} className="px-4 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {creating && (
        <div className="mb-6 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">New Banner</h2>
            <button onClick={() => setCreating(false)}><X size={18} className="text-zinc-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" /></Field>
            <Field label="Subtitle"><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="admin-input" /></Field>
          </div>
          <Field label="Image URL"><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="admin-input" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Link URL"><input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="admin-input" /></Field>
            <Field label="Placement"><select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="admin-input"><option value="homepage">Homepage</option><option value="category">Category</option><option value="product">Product</option><option value="sidebar">Sidebar</option><option value="footer">Footer</option></select></Field>
          </div>
          <button onClick={save} className="px-6 py-2.5 bg-white text-zinc-950 text-sm font-semibold rounded-xl">Create Banner</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            {b.image_url && <img src={b.image_url} alt={b.title} className="w-full h-32 rounded-lg object-cover mb-3" />}
            <p className="text-sm font-medium text-white">{b.title}</p>
            <p className="text-xs text-zinc-500 mb-2">{b.subtitle}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{b.placement}</span>
              <button onClick={() => toggleActive(b.id, b.is_active)} className={cn("px-2 py-0.5 rounded-full text-[10px]", b.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}>{b.is_active ? 'Active' : 'Inactive'}</button>
              <button onClick={() => remove(b.id)} className="ml-auto text-rose-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SETTINGS ============
function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('store_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      setSettings(data as StoreSettings);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await supabase.from('store_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
  };

  if (loading || !settings) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Store Settings</h1>
      <div className="space-y-6 max-w-3xl">
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <h2 className="text-sm font-semibold text-white">Store Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Store Name"><input value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="admin-input" /></Field>
            <Field label="Tagline"><input value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} className="admin-input" /></Field>
            <Field label="Contact Email"><input value={settings.contact_email} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} className="admin-input" /></Field>
            <Field label="Contact Phone"><input value={settings.contact_phone} onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })} className="admin-input" /></Field>
            <Field label="Currency Symbol"><input value={settings.currency_symbol} onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })} className="admin-input" /></Field>
            <Field label="Address"><input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="admin-input" /></Field>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <h2 className="text-sm font-semibold text-white">Shipping & Tax</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Flat Shipping Rate"><input type="number" value={settings.shipping_flat_rate} onChange={(e) => setSettings({ ...settings, shipping_flat_rate: Number(e.target.value) })} className="admin-input" /></Field>
            <Field label="Free Shipping Over"><input type="number" value={settings.free_shipping_threshold} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })} className="admin-input" /></Field>
            <Field label="Tax Rate"><input type="number" step="0.01" value={settings.tax_rate} onChange={(e) => setSettings({ ...settings, tax_rate: Number(e.target.value) })} className="admin-input" /></Field>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <h2 className="text-sm font-semibold text-white">Hero Section</h2>
          <Field label="Hero Headline"><input value={settings.hero_headline} onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })} className="admin-input" /></Field>
          <Field label="Hero Subtext"><textarea value={settings.hero_subtext} onChange={(e) => setSettings({ ...settings, hero_subtext: e.target.value })} rows={2} className="admin-input resize-none" /></Field>
          <Field label="Hero Image URL"><input value={settings.hero_image_url} onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })} className="admin-input" /></Field>
          <Field label="Hero Video URL"><input value={settings.hero_video_url} onChange={(e) => setSettings({ ...settings, hero_video_url: e.target.value })} className="admin-input" /></Field>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
          <h2 className="text-sm font-semibold text-white">Social Links</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Facebook"><input value={settings.facebook_url} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} className="admin-input" /></Field>
            <Field label="Twitter"><input value={settings.twitter_url} onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })} className="admin-input" /></Field>
            <Field label="Instagram"><input value={settings.instagram_url} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} className="admin-input" /></Field>
            <Field label="YouTube"><input value={settings.youtube_url} onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })} className="admin-input" /></Field>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="px-6 py-3 bg-white text-zinc-950 text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
