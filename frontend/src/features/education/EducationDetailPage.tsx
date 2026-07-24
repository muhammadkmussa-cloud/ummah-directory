import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Globe, Mail, ArrowLeft, BookOpen, GraduationCap } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge } from '@/components/ui'
import { ReportButton } from '@/features/reports/ReportButton'
import OrganizationPostsTab from '@/features/organizations/OrganizationPostsTab'
import MediaGallery from '@/components/ui/MediaGallery'

export default function EducationDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const { data: institution, isLoading } = useQuery({
    queryKey: ['education', slug],
    queryFn: () => api.get(`/education/${slug}`).then(r => r.data),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>
  if (!institution) return <div className="text-center py-12">Institution not found</div>

  const isOwnerOrAdmin = user && (user.id === institution.owner_id || ['super_admin', 'admin', 'moderator'].includes(user.role?.name))

  const features = [
    { label: "Girls' Section", active: institution.has_girls_section },
    { label: 'Boarding', active: institution.has_boarding },
    { label: 'Quran Program', active: institution.has_quran_program },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ReportButton resourceType="education" resourceId={institution.id} />
      </div>

      <div className="h-56 bg-indigo-50 rounded-2xl mb-6 flex items-center justify-center">
        {institution.cover_image_url ? (
          <img src={institution.cover_image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <GraduationCap className="w-20 h-20 text-indigo-300" />
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{institution.name}</h1>
            {institution.is_verified && <Badge variant="verified">Verified</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1 uppercase font-semibold text-indigo-600">
              <BookOpen className="w-4 h-4" /> {institution.institution_type?.replace('_', ' ')}
            </span>
            {institution.curriculum && <span>· {institution.curriculum}</span>}
            {institution.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {institution.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h2 className="font-bold text-lg mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{institution.description || 'No description provided.'}</p>
          </Card>

          {features.some(f => f.active) && (
            <Card>
              <h2 className="font-bold text-lg mb-3">Features & Programs</h2>
              <div className="flex flex-wrap gap-2">
                {features.filter(f => f.active).map(f => (
                  <Badge key={f.label} variant="success">{f.label}</Badge>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h2 className="font-bold text-xl text-slate-900 mb-4">Official Updates & Announcements</h2>
            <OrganizationPostsTab 
              organizationId={institution.id} 
              organizationName={institution.name} 
              isOwnerOrAdmin={!!isOwnerOrAdmin} 
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              {institution.phone && (
                <a href={`tel:${institution.phone}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Phone className="w-4 h-4" /> {institution.phone}
                </a>
              )}
              {institution.email && (
                <a href={`mailto:${institution.email}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Mail className="w-4 h-4" /> {institution.email}
                </a>
              )}
              {institution.website && (
                <a href={institution.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Globe className="w-4 h-4" /> Visit Website
                </a>
              )}
              {institution.address && (
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" /> {institution.address}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">Gallery</h3>
            <MediaGallery organizationId={institution.id} />
          </Card>
        </div>
      </div>
    </div>
  )
}
