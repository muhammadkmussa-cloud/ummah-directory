import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, Star, SlidersHorizontal } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button, SkeletonList } from '@/components/ui'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { Business } from '@/types'

export default function BusinessListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const { trackSearch } = useAnalytics()
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', { page, search }],
    queryFn: () => api.get('/businesses', { params: { page, size: 20, search, sort: 'newest' } }).then(r => {
      if (search && r.data.items) {
        trackSearch(search, r.data.total);
      }
      return r.data;
    }),
  })

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search businesses..."
            className="input-field pl-9 sm:pl-10 text-xs sm:text-sm w-full"
          />
        </div>
        <Button variant="outline" onClick={() => navigate('/map?type=business')} className="hidden sm:flex shrink-0">
          <MapPin className="w-4 h-4 mr-2" /> View Map
        </Button>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0 text-xs sm:text-sm px-3 py-2">
          <SlidersHorizontal className="w-4 h-4 mr-1 sm:mr-2" /> Filters
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data?.items?.map((business: Business) => (
              <Card key={business.id} hover onClick={() => navigate(`/businesses/${business.slug}`)}>
                <div className="h-40 bg-gradient-to-br from-surface-100 to-surface-200 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-4xl font-bold text-surface-300">{business.name[0]}</div>
                  )}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div className="pr-2">
                    <h3 className="font-bold text-base sm:text-lg line-clamp-1">{business.name}</h3>
                    {business.city && (
                      <p className="text-xs sm:text-sm text-surface-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {business.city}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-900">{business.avg_rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center mt-3">
                  {business.is_verified && <Badge variant="verified">Verified</Badge>}
                  {business.is_premier && <Badge variant="premier">Premier</Badge>}
                  <span className="text-xs text-surface-400 ml-auto">{business.review_count} reviews</span>
                </div>
              </Card>
            ))}
          </div>

          {!data?.items?.length && (
            <div className="w-full text-center py-16 px-4 text-surface-500 bg-surface-50 rounded-2xl border border-surface-100 my-4">
              <p className="text-base font-bold text-surface-800">No businesses found</p>
              <p className="text-xs sm:text-sm text-surface-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-surface-600 font-medium">
                Page {page} of {data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
