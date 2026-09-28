import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';

export function AuthPage({ mode }: { mode: 'signin' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName);
      if (error) { setError(error); setLoading(false); return; }
      navigate('/account');
    } else {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      navigate('/account');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-4xl font-black tracking-tighter text-white">ZAMA</span>
          </Link>
          <p className="text-sm text-zinc-500 mt-2">Everything. One Extraordinary Place.</p>
        </div>

        <div className="p-8 rounded-3xl glass-dark border border-zinc-700/50">
          <h1 className="text-2xl font-bold text-white mb-1">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-sm text-zinc-500 mb-6">{mode === 'signin' ? 'Sign in to your ZAMA account' : 'Join the next-generation marketplace'}</p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
              <AlertCircle size={16} className="text-rose-400" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-zinc-950 text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Please wait...' : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Link to={mode === 'signin' ? '/signup' : '/signin'} className="text-white font-medium hover:underline">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
