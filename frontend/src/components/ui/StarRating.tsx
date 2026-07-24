import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

export default function StarRating({ rating, max = 5, size = 'sm', interactive, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i + 1)}
          className={cn(
            'transition-colors',
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          )}
        >
          <Star
            className={cn(
              { 'w-3 h-3': size === 'sm', 'w-4 h-4': size === 'md', 'w-5 h-5': size === 'lg' },
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
