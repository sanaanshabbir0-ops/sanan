export function formatPrice(price: number, symbol = '$'): string {
  return `${symbol}${price.toFixed(2)}`;
}

export function calculateDiscount(original: number, sale: number | null): number {
  if (!sale || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}

export function getEffectivePrice(product: { price: number; sale_price: number | null }): number {
  return product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getStockStatus(stock: number, threshold = 5): { label: string; color: string } {
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400' };
  if (stock <= threshold) return { label: `Only ${stock} left`, color: 'text-amber-400' };
  return { label: 'In Stock', color: 'text-emerald-400' };
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function getCountdown(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
