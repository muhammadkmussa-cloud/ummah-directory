import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<"div"> {
  className?: string
  children: ReactNode
  hover?: boolean
  glass?: boolean
}

export default function Card({ className, children, hover, glass, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={cn(
        'bg-white rounded-3xl p-5 border border-surface-100',
        hover && 'cursor-pointer hover:shadow-lg hover:border-surface-200 transition-shadow',
        glass && 'bg-white/80 backdrop-blur-md',
        !hover && 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
