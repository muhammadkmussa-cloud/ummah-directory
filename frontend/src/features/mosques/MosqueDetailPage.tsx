import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Globe, Clock, ChevronLeft, Share2, Navigation, Info, Users, BookOpen, AlertCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import Map from '@/components/ui/Map'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { ReportButton } from '@/features/reports/ReportButton'
import { PrayerSubscribeButton } from './PrayerSubscribeButton'
import { ReviewSheet } from '@/features/reviews/ReviewSheet'
import { StarRating } from '@/components/ui'
import OrganizationPostsTab from '@/features/organizations/OrganizationPostsTab'
import MediaGallery from '@/components/ui/MediaGallery'

export default function MosqueDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('About')
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const { data: mosque, isLoading } = useQuery({
    queryKey: ['mosque', slug],
    queryFn: () => api.get(`/mosques/${slug}`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-surface-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
      <p>Loading mosque profile...</p>
    </div>
  )
  if (!mosque) return <div className="text-center py-20 text-surface-500 font-medium">Mosque not found</div>

  const isOwnerOrAdmin = user && (user.id === mosque.owner_id || ['super_admin', 'admin', 'moderator'].includes(user.role?.name))

  const facilities = [
    { label: "Women's Section", active: mosque.has_women_facilities },
    { label: 'Parking', active: mosque.has_parking },
    { label: "Children's Area", active: mosque.has_children_facilities },
    { label: 'Wheelchair Accessible', active: mosque.is_wheelchair_accessible },
  ]

  return (
    <div className="min-h-screen bg-surface-50 pb-20 md:pb-0">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 w-full bg-emerald-900">
        {mosque.cover_image_url ? (
          <img src={mosque.cover_image_url} alt={mosque.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />
        
        {/* Navigation Bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <FavoriteButton 
              organizationId={mosque.id} 
              className="w-10 h-10 bg-white/20 backdrop-blur-md text-white hover:bg-white/30" 
            />
            <ReportButton 
              resourceType="mosque" 
              resourceId={mosque.id} 
              className="w-10 h-10 bg-white/20 backdrop-blur-md text-white hover:bg-white/30" 
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-0 md:px-4 -mt-8 md:-mt-16 relative z-20">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-xl shadow-surface-200/50 overflow-hidden">
          
          {/* Header Info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="success">Mosque</Badge>
                  {mosque.is_verified && (
                    <Badge variant="verified">Verified</Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-surface-900 leading-tight">
                  {mosque.name}
                </h1>

                <div className="flex items-center gap-4 text-sm font-medium text-surface-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-surface-900">{mosque.avg_rating?.toFixed(1) || '0.0'}</span>
                    <span>({mosque.review_count || 0} reviews)</span>
                  </span>
                  {mosque.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> 
                      {mosque.city}
                    </span>
                  )}
                </div>
              </div>

              {mosque.logo_url && (
                <div className="hidden md:block w-24 h-24 rounded-2xl shadow-md border-4 border-white overflow-hidden bg-white -mt-16 relative z-30">
                  <img src={mosque.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-3 mt-6 overflow-x-auto hide-scrollbar pb-2">
              {mosque.phone && (
                <a href={`tel:${mosque.phone}`} className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 text-emerald-600 font-semibold transition-colors">
                  <Phone className="w-6 h-6 mb-1" />
                  <span className="text-xs">Call</span>
                </a>
              )}
              {mosque.latitude && mosque.longitude && (
                <a href={`https://maps.google.com/?q=${mosque.latitude},${mosque.longitude}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 text-blue-600 font-semibold transition-colors">
                  <Navigation className="w-6 h-6 mb-1" />
                  <span className="text-xs">Directions</span>
                </a>
              )}
              {mosque.website && (
                <a href={mosque.website} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 text-teal-600 font-semibold transition-colors">
                  <Globe className="w-6 h-6 mb-1" />
                  <span className="text-xs">Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-100">
            <AnimatedTabs 
              tabs={['About', 'Gallery', 'Facilities', 'Prayer Times', 'Updates & Posts']} 
              activeTab={activeTab} 
              onChange={setActiveTab} 
            />
          </div>

          <div className="p-6 md:p-8 bg-surface-50 min-h-[400px]">
            {activeTab === 'About' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {mosque.description && (
                  <section>
                    <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-emerald-600" /> Description
                    </h3>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">
                      {mosque.description}
                    </p>
                  </section>
                )}
                
                <section>
                  <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" /> Location
                  </h3>
                  {mosque.address && (
                    <p className="text-surface-600 mb-4">{mosque.address}</p>
                  )}
                  {mosque.latitude && mosque.longitude && (
                    <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden shadow-inner border border-surface-200">
                      <Map 
                        latitude={mosque.latitude} 
                        longitude={mosque.longitude}
                        name={mosque.name}
                      />
                    </div>
                  )}
                </section>
                <section>
                  <Card 
                    className="border border-surface-200 shadow-sm cursor-pointer hover:bg-surface-50 transition-colors mt-6"
                    onClick={() => setIsReviewSheetOpen(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2 rounded-xl">
                          <Star className="w-6 h-6 text-emerald-600 fill-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-surface-900">Reviews & Community Ratings</h3>
                          <p className="text-sm text-surface-500">{mosque.avg_rating?.toFixed(1) || '0.0'} out of 5 ({mosque.review_count || 0} reviews)</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-emerald-600">View All</Button>
                    </div>
                  </Card>
                </section>
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MediaGallery organizationId={mosque.id} />
              </motion.div>
            )}

            {activeTab === 'Facilities' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {facilities.map((f) => (
                    <div key={f.label} className={`p-4 rounded-2xl ${f.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-surface-100 text-surface-400 border border-transparent'}`}>
                      <p className="font-bold">{f.label}</p>
                      <p className="text-xs mt-1">{f.active ? 'Available' : 'Not available'}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Prayer Times' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {mosque.prayer_times ? (
                  <Card className="border-none shadow-sm p-0 overflow-hidden">
                    <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Today's Iqamah Times
                      </h3>
                    </div>
                    <div className="divide-y divide-surface-100">
                      {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                        <div key={prayer} className="flex justify-between items-center p-4">
                          <span className="font-medium text-surface-700">{prayer}</span>
                          <span className="font-bold text-emerald-700">{mosque.prayer_times?.[prayer.toLowerCase()] || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-surface-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p>Prayer times not available yet.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <ReviewSheet 
        isOpen={isReviewSheetOpen} 
        onClose={() => setIsReviewSheetOpen(false)} 
        organizationId={mosque.id} 
      />
    </div>
  )
}
