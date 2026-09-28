export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="border-2 border-zinc-800 border-t-white rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 overflow-hidden animate-pulse">
          <div className="aspect-[4/5] bg-zinc-800/50" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-1/3" />
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{message}</p>
      {action}
    </div>
  );
}
