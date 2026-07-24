import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'
import { PrayerSubscribeButton } from './PrayerSubscribeButton'

export default function MosqueListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['mosques', { search, page }],
    queryFn: () => api.get('/mosques', { params: { search, page, size: 20 } }).then(r => r.data),
  })

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-surface-900">Mosques</h1>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search mosques..."
            className="input-field pl-9 sm:pl-10 text-xs sm:text-sm w-full"
          />
        </div>
        <Button variant="outline" onClick={() => navigate('/map?type=mosque')} className="hidden sm:flex shrink-0">
          <MapPin className="w-4 h-4 mr-2" /> View Map
        </Button>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0 text-xs sm:text-sm px-3 py-2">
          <SlidersHorizontal className="w-4 h-4 mr-1 sm:mr-2" /> Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-sm">Loading mosques...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data?.items?.map((mosque: any) => (
            <Card key={mosque.id} hover onClick={() => navigate(`/mosques/${mosque.slug}`)}>
              <div className="h-40 bg-emerald-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                {mosque.logo_url ? (
                  <img src={mosque.logo_url} alt="" className="w-full h-full object-contain p-4" />
                ) : (
                  <Building2 className="w-16 h-16 text-emerald-300" />
                )}
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 text-surface-900 line-clamp-1">{mosque.name}</h3>
              {mosque.city && (
                <p className="text-xs sm:text-sm text-surface-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {mosque.city}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mosque.is_verified && <Badge variant="verified">Verified</Badge>}
                {mosque.has_women_facilities && (
                  <Badge variant="success">Women's Section</Badge>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/mosques/${mosque.slug}`)
                }}>
                  View Details
                </Button>
                <PrayerSubscribeButton mosqueId={mosque.id} className="flex-none px-3 min-w-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <div className="w-full text-center py-16 px-4 text-surface-500 bg-surface-50 rounded-2xl border border-surface-100 my-4">
          <p className="text-base font-bold text-surface-800">No mosques found</p>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">Try adjusting your search</p>
        </div>
      )}
    </div>
  )
}
