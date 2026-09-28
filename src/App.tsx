import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { AuthPage } from '@/pages/AuthPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { CategoriesPage, BrandsPage, WishlistPage } from '@/pages/CategoriesBrandsPage';

function Routes() {
  const { path } = useRouter();

  // Admin routes (no navbar/footer)
  if (path.startsWith('/admin')) {
    const section = path.replace('/admin/', '').replace('/admin', '') || 'dashboard';
    return <AdminPage section={section} />;
  }

  // Auth routes (no navbar/footer)
  if (path === '/signin') return <AuthPage mode="signin" />;
  if (path === '/signup') return <AuthPage mode="signup" />;

  // Storefront routes
  let page: React.ReactNode;
  if (path === '/') page = <HomePage />;
  else if (path === '/shop') page = <ShopPage />;
  else if (path.startsWith('/product/')) page = <ProductPage slug={path.replace('/product/', '')} />;
  else if (path === '/cart') page = <CartPage />;
  else if (path === '/checkout') page = <CheckoutPage />;
  else if (path === '/categories') page = <CategoriesPage />;
  else if (path === '/brands') page = <BrandsPage />;
  else if (path === '/wishlist') page = <WishlistPage />;
  else if (path === '/account') page = <AccountPage section="profile" />;
  else if (path.startsWith('/account/')) page = <AccountPage section={path.replace('/account/', '')} />;
  else if (path === '/page/about' || path === '/page/contact' || path === '/page/shipping-returns' || path === '/page/privacy' || path === '/page/terms' || path === '/page/careers')
    page = <InfoPage slug={path.replace('/page/', '')} />;
  else page = <HomePage />;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      {page}
      <Footer />
    </div>
  );
}

function InfoPage({ slug }: { slug: string }) {
  const content: Record<string, { title: string; body: string }> = {
    about: { title: 'About ZAMA', body: 'ZAMA is a next-generation global marketplace bringing multiple brands and categories together in one extraordinary destination. We believe shopping should be an experience — not just a transaction.' },
    contact: { title: 'Contact Us', body: 'Email: support@zama.shop\nPhone: +1 (800) ZAMA-SHOP\nHours: Monday to Friday, 9am to 6pm EST' },
    'shipping-returns': { title: 'Shipping & Returns', body: 'We offer free shipping on orders over $99. Standard shipping takes 5-7 business days. Express shipping is available for an additional fee. We accept returns within 30 days of delivery.' },
    privacy: { title: 'Privacy Policy', body: 'Your privacy is important to us. We collect only the information necessary to process your orders and improve your shopping experience.' },
    terms: { title: 'Terms & Conditions', body: 'By using ZAMA, you agree to our terms of service. All sales are subject to our return and refund policies.' },
    careers: { title: 'Careers at ZAMA', body: 'We are always looking for talented individuals to join our team. Check back for open positions.' },
  };
  const info = content[slug] || content.about;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16 lg:pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-6">{info.title}</h1>
        <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{info.body}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Routes />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
