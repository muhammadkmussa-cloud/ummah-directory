import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, Search, MapPin, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'

export default function CharityListPage() {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [city, setCity] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['charities', { search, verifiedOnly, city }],
    queryFn: () => api.get('/charities', { params: { search, size: 20, is_verified: verifiedOnly || undefined, city: city || undefined } }).then(r => r.data),
  })

  const clearFilters = () => {
    setVerifiedOnly(false)
    setCity('')
  }

  const hasActiveFilters = verifiedOnly || city

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-surface-900">Charities & Relief</h1>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search charities..."
            className="input-field pl-9 sm:pl-10 text-xs sm:text-sm w-full"
          />
        </div>
        <Button variant="outline" onClick={() => navigate('/map?type=charity')} className="hidden sm:flex shrink-0">
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
            <h3 className="font-bold text-sm text-surface-900">Filter Charities</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Nairobi"
                className="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5">Status</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span>Verified only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-sm">Loading charities...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data?.items?.map((charity: any) => (
            <Card key={charity.id} hover onClick={() => navigate(`/charities/${charity.slug}`)}>
              <div className="h-40 bg-red-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                {charity.logo_url ? (
                  <img src={charity.logo_url} alt="" className="w-full h-full object-contain p-4" />
                ) : (
                  <Heart className="w-16 h-16 text-red-300" />
                )}
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 text-surface-900 line-clamp-1">{charity.name}</h3>
              {charity.mission_statement && (
                <p className="text-xs sm:text-sm text-surface-600 line-clamp-2">{charity.mission_statement}</p>
              )}
              <div className="flex gap-2 mt-3">
                {charity.is_verified && <Badge variant="verified">Verified</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <div className="w-full text-center py-16 px-4 text-surface-500 bg-surface-50 rounded-2xl border border-surface-100 my-4">
          <p className="text-base font-bold text-surface-800">No charities found</p>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}
