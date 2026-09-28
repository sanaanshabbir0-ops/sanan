import { useState, useEffect, useRef } from 'react';
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronDown, Zap, LayoutDashboard } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useData';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { navigate, path } = useRouter();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { profile, isAdmin, signOut } = useAuth();
  const { categories } = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Categories', to: '/categories' },
    { label: 'Brands', to: '/brands' },
    { label: 'Deals', to: '/shop?filter=deals' },
    { label: 'New Arrivals', to: '/shop?sort=newest' },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50"
            : "bg-transparent"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-white"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
              <Link to="/" className="flex items-center">
                <span className="text-2xl lg:text-3xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  ZAMA
                </span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    path === link.to || (link.to !== '/' && path.startsWith(link.to))
                      ? "text-white"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <div ref={searchRef} className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
                {searchOpen && (
                  <div className="absolute right-0 top-12 w-80 sm:w-96 glass-dark rounded-2xl border border-zinc-700/50 p-4 shadow-2xl animate-fadeIn">
                    <form onSubmit={handleSearch} className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products, brands, categories..."
                        className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                    </form>
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Popular</p>
                      <div className="flex flex-wrap gap-2">
                        {['Sneakers', 'Watches', 'Headphones', 'Skincare', 'Smartphones'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              navigate(`/shop?search=${encodeURIComponent(tag)}`);
                              setSearchOpen(false);
                            }}
                            className="px-3 py-1.5 text-xs rounded-full bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Account"
                >
                  <User size={20} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 w-56 glass-dark rounded-2xl border border-zinc-700/50 p-2 shadow-2xl animate-fadeIn">
                    {profile ? (
                      <>
                        <div className="px-3 py-2 border-b border-zinc-800">
                          <p className="text-sm font-medium text-white">{profile.full_name || 'User'}</p>
                          <p className="text-xs text-zinc-500">{profile.email}</p>
                        </div>
                        <Link to="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <User size={16} /> My Account
                        </Link>
                        <Link to="/account/orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <ShoppingBag size={16} /> My Orders
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors">
                            <LayoutDashboard size={16} /> Admin Portal
                          </Link>
                        )}
                        <button
                          onClick={() => { signOut(); setAccountOpen(false); navigate('/'); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/signin" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          <User size={16} /> Sign In
                        </Link>
                        <Link to="/signup" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link to="/cart" className="relative w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 p-6 overflow-y-auto animate-slideIn">
            <div className="flex items-center justify-between mb-8">
              <span className="text-2xl font-black tracking-tighter text-white">ZAMA</span>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 pt-8 border-t border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3">Categories</p>
              <div className="space-y-1">
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            {profile && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="mt-8 flex items-center gap-2 px-4 py-3 text-sm font-medium text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors"
              >
                <LayoutDashboard size={16} /> Admin Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
