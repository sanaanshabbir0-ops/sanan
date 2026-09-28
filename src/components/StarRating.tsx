import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  showNumber?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 14, showNumber = false, reviewCount }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;
          return (
            <Star
              key={star}
              size={size}
              className={
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : half
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-zinc-600 fill-zinc-600/30'
              }
            />
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs text-zinc-400 ml-1">
          {rating.toFixed(1)}
          {reviewCount !== undefined && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}
