import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'KES'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(num)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
