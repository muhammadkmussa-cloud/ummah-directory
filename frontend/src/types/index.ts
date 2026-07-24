export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  profile_photo_url?: string
  preferred_language: string
  is_email_verified: boolean
  role: string
  permissions: string[]
  created_at?: string
}

export interface Business {
  id: string
  name: string
  slug: string
  description?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  address?: string
  city?: string
  country: string
  latitude?: number
  longitude?: number
  logo_url?: string
  cover_image_url?: string
  avg_rating: number
  review_count: number
  is_verified: boolean
  is_premier: boolean
  status: string
  category_id: string
  category_name?: string
  created_at?: string
}

export interface Category {
  id: string
  name: string
  name_ar?: string
  name_sw?: string
  slug: string
  description?: string
  icon?: string
  parent_id?: string
  children: Category[]
}

export interface Review {
  id: string
  rating: number
  comment?: string
  image_urls?: string[]
  user_id: string
  user_name?: string
  organization_id: string
  reply?: ReviewReply
  created_at?: string
}

export interface ReviewReply {
  id: string
  content: string
  user_id: string
  created_at?: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description?: string
  event_date: string
  event_time?: string
  venue?: string
  category?: string
  organizer_type: string
}

export interface Donation {
  id: string
  amount: string
  currency: string
  status: string
  receipt_number?: string
  charity_name?: string
  campaign_title?: string
  created_at?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message?: string
  is_read: boolean
  created_at?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface Favorite {
  id: string
  organization_id: string
  organization_name?: string
  organization_type?: string
  organization_slug?: string
  resource_type?: string
  resource_id?: string
  created_at?: string
}
