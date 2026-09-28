import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface RouterContextValue {
  path: string;
  query: URLSearchParams;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function parseHash(): { path: string; query: URLSearchParams } {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  return {
    path: path || '/',
    query: new URLSearchParams(queryString || ''),
  };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(parseHash);

  useEffect(() => {
    const handler = () => {
      setState(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return (
    <RouterContext.Provider value={{ path: state.path, query: state.query, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
