import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  children?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md': variant === 'primary',
            'bg-secondary-50 text-secondary-700 hover:bg-secondary-100': variant === 'secondary',
            'border-2 border-surface-200 text-surface-700 hover:bg-surface-50': variant === 'outline',
            'text-surface-600 hover:bg-surface-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger' || variant === 'destructive',
            'bg-red-500 text-white shadow-sm hover:bg-red-600': variant === 'danger',
            'px-3 py-2 text-xs': size === 'xs',
            'px-4 py-2.5 text-sm': size === 'sm',
            'px-6 py-3 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
            'p-3': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
export default Button
