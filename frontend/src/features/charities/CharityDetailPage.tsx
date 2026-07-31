import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Globe, ChevronLeft, Heart, Target, Share2, Info, Users, Calendar, Edit2 } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api-client'
import { Card, Badge, Button, Modal } from '@/components/ui'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { formatCurrency } from '@/lib/utils'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { ReportButton } from '@/features/reports/ReportButton'
import MediaGallery from '@/components/ui/MediaGallery'
import OrganizationEditSheet from '@/features/organizations/OrganizationEditSheet'

export default function CharityDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('About')
  const [viewDonorsCampaignId, setViewDonorsCampaignId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const { data: campaignDonors, isLoading: isLoadingDonors } = useQuery({
    queryKey: ['donations', 'campaign', viewDonorsCampaignId],
    queryFn: () => api.get(`/donations/campaign/${viewDonorsCampaignId}`).then(r => r.data),
    enabled: !!viewDonorsCampaignId,
  })

  const { data: charity, isLoading } = useQuery({
    queryKey: ['charity', slug],
    queryFn: () => api.get(`/charities/${slug}`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-surface-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mb-4"></div>
      <p>Loading charity...</p>
    </div>
  )
  if (!charity) return <div className="text-center py-20 text-surface-500 font-medium">Charity not found</div>

  const isOwnerOrAdmin = user && (user.id === charity.owner_id || ['super_admin', 'admin', 'moderator'].includes(user.role?.name))
  const isOwner = user && user.id === charity.owner_id

  return (
    <div className="min-h-screen bg-surface-50 pb-20 md:pb-0">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 w-full bg-surface-200">
        {charity.cover_image_url ? (
          <img src={charity.cover_image_url} alt={charity.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <Heart className="w-24 h-24 text-white/30" />
          </div>
        )}
        
        {/* Navigation Bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
                title="Edit organization"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <FavoriteButton 
              organizationId={charity.id} 
              className="w-10 h-10 bg-white/20 backdrop-blur-md text-white hover:bg-white/30" 
            />
            <ReportButton 
              resourceType="charity" 
              resourceId={charity.id} 
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 leading-tight">
                {charity.name}
              </h1>
              {charity.is_verified && (
                <Badge variant="primary" className="bg-red-50 text-red-700 border-none shadow-sm">Verified</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm font-medium text-surface-500 mb-4">
              {charity.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> 
                  {charity.city}
                </span>
              )}
            </div>

            <div className="mb-4">
              <Button className="w-full md:w-auto px-8" variant="danger" size="lg" onClick={() => navigate(`/donate?charity=${charity.id}`)}>
                <Heart className="w-5 h-5 mr-2" /> Donate Now
              </Button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-2">
              {charity.phone && (
                <a href={`tel:${charity.phone}`} className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 text-red-600 font-semibold transition-colors">
                  <Phone className="w-6 h-6 mb-1" />
                  <span className="text-xs">Call</span>
                </a>
              )}
              {charity.website && (
                <a href={charity.website} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-50 hover:bg-surface-100 text-rose-600 font-semibold transition-colors">
                  <Globe className="w-6 h-6 mb-1" />
                  <span className="text-xs">Website</span>
                </a>
              )}
            </div>
          </div>

          {/* Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md">
            <AnimatedTabs 
              tabs={['About', 'Gallery', 'Campaigns', 'Updates & Posts']} 
              activeTab={activeTab} 
              onChange={setActiveTab} 
            />
          </div>

          <div className="p-6 md:p-8 bg-surface-50 min-h-[400px]">
            {activeTab === 'About' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {charity.mission_statement && (
                  <section>
                    <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" /> Mission
                    </h3>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                      <p className="text-red-900 font-medium italic">"{charity.mission_statement}"</p>
                    </div>
                  </section>
                )}

                {charity.description && (
                  <section>
                    <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-red-500" /> Description
                    </h3>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">
                      {charity.description}
                    </p>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'Gallery' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MediaGallery organizationId={charity.id} />
              </motion.div>
            )}

            {activeTab === 'Campaigns' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {charity.campaigns?.length > 0 ? charity.campaigns.map((camp: any) => (
                  <Card key={camp.id} className="border-none shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{camp.title}</h3>
                        {camp.category && <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">{camp.category}</span>}
                      </div>
                      <Badge variant={camp.status === 'active' ? 'primary' : 'warning'} className="shadow-sm">
                        {camp.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-surface-500">Raised <span className="text-surface-900">{formatCurrency(camp.amount_raised, camp.currency)}</span></span>
                        <span className="text-surface-500">Goal <span className="text-surface-900">{formatCurrency(camp.target_amount, camp.currency)}</span></span>
                      </div>
                      <div className="w-full bg-surface-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (parseFloat(camp.amount_raised) / parseFloat(camp.target_amount)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {camp.status === 'active' && (
                        <Button className="flex-1" variant="primary" onClick={() => navigate(`/donate?charity=${charity.id}&campaign=${camp.id}`)}>
                          Support this campaign
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="shrink-0" 
                        onClick={() => setViewDonorsCampaignId(camp.id)}
                      >
                        <Users className="w-4 h-4 mr-1" /> Donors
                      </Button>
                    </div>
                  </Card>
                )) : (
                  <div className="text-center py-12 text-surface-500">
                    <Target className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p>No active campaigns at the moment.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Donor Leaderboard Modal */}
      {viewDonorsCampaignId && (
        <Modal isOpen={!!viewDonorsCampaignId} onClose={() => setViewDonorsCampaignId(null)} title="Campaign Donors">
          {isLoadingDonors ? (
            <div className="p-8 text-center animate-pulse text-surface-500">Loading donors...</div>
          ) : campaignDonors?.items?.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {campaignDonors.items.map((d: any, idx: number) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-surface-100 text-surface-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-surface-900">{d.is_anonymous ? 'Anonymous Donor' : d.donor_name || 'Donor'}</p>
                    <p className="text-xs text-surface-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-primary-600 text-sm">{d.amount} {d.currency}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-surface-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p>No donations yet for this campaign.</p>
            </div>
          )}
        </Modal>
      )}

      <OrganizationEditSheet
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        organization={charity}
        queryKey={['charity', slug]}
      />
    </div>
  )
}
