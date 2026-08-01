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
  const [city, setCity] = useState('')
  const [womenOnly, setWomenOnly] = useState(false)
  const [hasParking, setHasParking] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['mosques', { search, page, city, womenOnly, hasParking }],
    queryFn: () => api.get('/mosques', { params: { search, page, size: 20, city: city || undefined, has_women_facilities: womenOnly || undefined, has_parking: hasParking || undefined } }).then(r => r.data),
  })

  const clearFilters = () => {
    setCity('')
    setWomenOnly(false)
    setHasParking(false)
  }

  const hasActiveFilters = city || womenOnly || hasParking

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
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`shrink-0 text-xs sm:text-sm px-3 py-2 relative ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}>
          <SlidersHorizontal className="w-4 h-4 mr-1 sm:mr-2" /> Filters
          {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-600 rounded-full" />}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-2xl border border-surface-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-surface-900">Filter Mosques</h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1">
                  <span>Clear all</span>
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-surface-100 rounded-lg">
                <span className="text-surface-400 text-sm">✕</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1) }}
                placeholder="e.g. Nairobi"
                className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">Facilities</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={womenOnly} onChange={(e) => { setWomenOnly(e.target.checked); setPage(1) }} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span>Women's section</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">Parking</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={hasParking} onChange={(e) => { setHasParking(e.target.checked); setPage(1) }} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span>Has parking</span>
              </label>
            </div>
          </div>
        </div>
      )}

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
