import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'verified' | 'premier' | 'pending' | 'success' | 'error' | 'info' | 'warning' | 'primary' | 'default'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-blue-100 text-blue-800':   variant === 'verified' || variant === 'info',
        'bg-yellow-100 text-yellow-800': variant === 'premier' || variant === 'warning',
        'bg-gray-100 text-gray-800':   variant === 'pending' || variant === 'default',
        'bg-green-100 text-green-800': variant === 'success',
        'bg-red-100 text-red-800':     variant === 'error',
        'bg-primary-100 text-primary-800': variant === 'primary',
      },
      className
    )}>
      {children}
    </span>
  )
}
