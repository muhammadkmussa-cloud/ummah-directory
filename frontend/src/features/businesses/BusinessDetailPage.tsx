import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Globe, Clock, ChevronLeft, Star, Share2, Flag, Heart, MessageCircle, Navigation, Info, Edit2 } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api-client'
import { Card, Badge, StarRating, Button, Input } from '@/components/ui'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import Map from '@/components/ui/Map'
import type { Review } from '@/types'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { ReviewSheet } from '@/features/reviews/ReviewSheet'
import { ReportButton } from '@/features/reports/ReportButton'
import { useAnalytics } from '@/hooks/useAnalytics'

import OrganizationPostsTab from '@/features/organizations/OrganizationPostsTab'
import OrganizationEditSheet from '@/features/organizations/OrganizationEditSheet'
import MediaGallery from '@/components/ui/MediaGallery'

export default function BusinessDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('About')
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false)
  const { trackClick, trackDirections } = useAnalytics()

  const [isEditing, setIsEditing] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.get(`/businesses/${slug}`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-surface-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
      <p>Loading profile...</p>
    </div>
  )
  if (!business) return <div className="text-center py-20 text-surface-500 font-medium">Business not found</div>

  const isOwnerOrAdmin = user && (user.id === business.owner_id || ['super_admin', 'admin', 'moderator'].includes(user.role?.name))
  const isOwner = user && user.id === business.owner_id

  return (
    <div className="min-h-screen bg-surface-50 pb-20 md:pb-0">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 bg-surface-900">
        {business.cover_image_url ? (
          <img src={business.cover_image_url} alt={business.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-900 via-primary-800 to-surface-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />
        
        {/* Navigation Bar Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2">
            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
                title="Edit organization"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <FavoriteButton organizationId={business.id} />
            <ReportButton resourceType="business" resourceId={business.id} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-surface-100">
          
          {/* Title & Info Section */}
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="success">{business.category?.name || 'Business'}</Badge>
                  {business.is_verified && <Badge variant="verified">Verified</Badge>}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-surface-900">{business.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-surface-600">
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 
                    {business.avg_rating.toFixed(1)} 
                    <span>({business.review_count} reviews)</span>
                  </span>
                  {business.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> 
                      {business.city}
                    </span>
                  )}
                </div>
              </div>

              {business.logo_url && (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-lg border-2 border-white overflow-hidden bg-white">
                  <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            {/* Quick Actions Row */}
            <div className="flex gap-3 mt-6">
              {business.phone && (
                <a href={`tel:${business.phone}`} onClick={() => trackClick(business.id, 'phone')} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-900 font-semibold transition-colors text-sm">
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              {business.latitude && business.longitude && (
                <a href={`https://maps.google.com/?q=${business.latitude},${business.longitude}`} target="_blank" rel="noreferrer" onClick={() => trackDirections(business.id)} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors text-sm">
                  <Navigation className="w-4 h-4" /> Directions
                </a>
              )}
            </div>
          </div>

          {/* Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-100">
            <AnimatedTabs 
              tabs={['About', 'Gallery', 'Updates & Posts']} 
              activeTab={activeTab} 
              onChange={setActiveTab} 
            />
          </div>

          <div className="p-6 md:p-8 bg-surface-50 min-h-[400px]">
            {activeTab === 'About' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {business.description && (
                  <section>
                    <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary-600" /> Description
                    </h3>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">
                      {business.description}
                    </p>
                  </section>
                )}

                <section>
                  <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" /> Location
                  </h3>
                  {business.address && (
                    <p className="text-surface-600 mb-4">{business.address}</p>
                  )}
                  {business.latitude && business.longitude && (
                    <div className="rounded-2xl overflow-hidden shadow-sm h-[200px] border border-surface-200">
                      <Map latitude={business.latitude} longitude={business.longitude} name={business.name} />
                    </div>
                  )}
                </section>
                
                <section>
                  <Card 
                    className="border border-surface-200 shadow-sm cursor-pointer hover:bg-surface-50 transition-colors"
                    onClick={() => setIsReviewSheetOpen(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-50 p-2 rounded-xl">
                          <Star className="w-6 h-6 text-primary-600 fill-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-surface-900">Reviews & Ratings</h3>
                          <p className="text-sm text-surface-500">{business.avg_rating.toFixed(1)} out of 5 ({business.review_count} reviews)</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary-600">View All</Button>
                    </div>
                  </Card>
                </section>
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MediaGallery organizationId={business.id} />
              </motion.div>
            )}

            {activeTab === 'Updates & Posts' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <OrganizationPostsTab 
                  organizationId={business.id} 
                  organizationName={business.name} 
                  isOwnerOrAdmin={!!isOwnerOrAdmin} 
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <ReviewSheet 
        isOpen={isReviewSheetOpen} 
        onClose={() => setIsReviewSheetOpen(false)} 
        organizationId={business.id} 
      />

      <OrganizationEditSheet
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        organization={business}
        queryKey={['business', slug]}
      />
    </div>
  )
}
