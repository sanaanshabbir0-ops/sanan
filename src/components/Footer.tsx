import { useState } from 'react';
import { Mail, Facebook, Twitter, Instagram, Youtube, Send } from 'lucide-react';
import { Link } from '@/context/RouterContext';
import { useCategories } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';

export function Footer() {
  const { categories } = useCategories();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const socialLinks = [
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: 'Twitter' },
    { icon: Instagram, label: 'Instagram' },
    { icon: Youtube, label: 'YouTube' },
  ];

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-20">
      {/* Newsletter */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Stay in the Loop</h3>
          <p className="text-zinc-400 mb-8">Get exclusive deals, early access to new arrivals, and member-only offers delivered to your inbox.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-white to-zinc-200 text-zinc-950 text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all flex items-center justify-center gap-2"
            >
              {subscribed ? 'Subscribed!' : <>Subscribe <Send size={14} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-4">
              <span className="text-3xl font-black tracking-tighter text-white">ZAMA</span>
            </Link>
            <p className="text-sm text-zinc-500 mb-4 max-w-xs">Everything. One Extraordinary Place. Your next-generation marketplace for premium products across every category.</p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a key={s.label} href="#" className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors" aria-label={s.label}>
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4">Shop</h4>
            <ul className="space-y-2.5">
              <li><Link to="/shop" className="text-sm text-zinc-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/shop?sort=newest" className="text-sm text-zinc-400 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?filter=deals" className="text-sm text-zinc-400 hover:text-white transition-colors">Flash Deals</Link></li>
              <li><Link to="/shop?filter=bestseller" className="text-sm text-zinc-400 hover:text-white transition-colors">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/shop?category=${cat.slug}`} className="text-sm text-zinc-400 hover:text-white transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li><Link to="/page/shipping-returns" className="text-sm text-zinc-400 hover:text-white transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/page/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/page/privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/page/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4">About</h4>
            <ul className="space-y-2.5">
              <li><Link to="/page/about" className="text-sm text-zinc-400 hover:text-white transition-colors">About ZAMA</Link></li>
              <li><Link to="/brands" className="text-sm text-zinc-400 hover:text-white transition-colors">Our Brands</Link></li>
              <li><Link to="/page/careers" className="text-sm text-zinc-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/admin" className="text-sm text-zinc-400 hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/50 py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 ZAMA. All rights reserved. Everything. One Extraordinary Place.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-600">Secure Payments</span>
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-600">Free Shipping Over $99</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
