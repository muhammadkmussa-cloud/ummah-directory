import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, Building2, Heart, GraduationCap, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api-client'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(q)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [useNearby, setUseNearby] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Query for auto-complete suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search', 'suggestions', searchInput],
    queryFn: () => api.get('/search/suggestions', { params: { q: searchInput } }).then(r => r.data),
    enabled: searchInput.trim().length >= 2 && isSearchFocused,
  })

  // Main search or nearby search
  const { data: nearbyData } = useQuery({
    queryKey: ['search', 'nearby', userCoords],
    queryFn: () => api.get('/search/nearby', { 
      params: { lat: userCoords?.lat, lng: userCoords?.lng, radius_km: 10 } 
    }).then(r => r.data),
    enabled: useNearby && !!userCoords,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get('/search', { params: { q: q || '', size: 20 } }).then(r => r.data),
    enabled: !useNearby,
  })

  const handleNearbyToggle = () => {
    if (!useNearby) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            setUseNearby(true)
          },
          (err) => {
            console.error(err)
            // Fallback default coordinates (Nairobi)
            setUserCoords({ lat: -1.286389, lng: 36.817223 })
            setUseNearby(true)
          }
        )
      }
    } else {
      setUseNearby(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`)
    }
  }

  // Combine results for the masonry layout
  const exploreItems: any[] = []
  const activeDataSource = useNearby ? nearbyData : data
  if (activeDataSource?.businesses) exploreItems.push(...activeDataSource.businesses.map((b: any) => ({ ...b, itemType: 'business' })))
  if (activeDataSource?.mosques) exploreItems.push(...activeDataSource.mosques.map((m: any) => ({ ...m, itemType: 'mosque' })))
  if (activeDataSource?.charities) exploreItems.push(...activeDataSource.charities.map((c: any) => ({ ...c, itemType: 'charity' })))
  if (activeDataSource?.education) exploreItems.push(...activeDataSource.education.map((e: any) => ({ ...e, itemType: 'education' })))
  if (activeDataSource?.events) exploreItems.push(...activeDataSource.events.map((ev: any) => ({ ...ev, itemType: 'event', name: ev.title })))

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen pb-20 relative">
      {/* Floating Search Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-100 p-4">
        <div className="flex gap-2 items-center">
          <form 
            onSubmit={handleSearchSubmit}
            className={`flex-1 flex items-center bg-surface-100 rounded-full transition-all duration-300 relative ${isSearchFocused ? 'ring-2 ring-primary-500 bg-white shadow-md' : 'shadow-sm'}`}
          >
            <Search className="w-5 h-5 text-surface-400 ml-4 flex-shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search businesses, mosques, charities, events..."
              className="flex-1 bg-transparent px-3 py-3.5 text-surface-900 placeholder:text-surface-400 focus:outline-none text-base"
            />
          </form>
          <button
            onClick={handleNearbyToggle}
            className={`p-3.5 rounded-full border text-sm font-bold flex items-center gap-1.5 transition-colors ${
              useNearby 
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm' 
                : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
            }`}
            title="Search Nearby Me"
          >
            <MapPin className="w-5 h-5" />
            <span className="hidden sm:inline">{useNearby ? 'Near Me' : 'Nearby'}</span>
          </button>
        </div>

        {/* Auto-Complete Suggestions Dropdown */}
        {isSearchFocused && suggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-4 right-4 bg-white rounded-2xl shadow-xl border border-surface-100 mt-1 overflow-hidden z-50">
            {suggestions.map((item: any, idx: number) => (
              <div
                key={idx}
                onClick={() => {
                  const queryVal = item.name || item.title || item.text || item;
                  setSearchInput(queryVal);
                  navigate(`/search?q=${encodeURIComponent(queryVal)}`);
                }}
                className="px-4 py-3 hover:bg-surface-50 cursor-pointer flex items-center gap-3 text-sm border-b border-surface-50 last:border-0 text-surface-800 font-medium"
              >
                <Search className="w-4 h-4 text-surface-400" />
                <span>{item.name || item.title || item.text || item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explore Grid */}
      <div className="p-1 md:p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-surface-200 animate-pulse rounded-lg md:rounded-2xl" />
            ))}
          </div>
        ) : exploreItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-500">
            <Search className="w-12 h-12 mb-4 text-surface-300" />
            <h3 className="text-lg font-bold text-surface-900 mb-2">No results found</h3>
            <p>Try searching for something else.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
            {exploreItems.map((item, idx) => {
              // Create a masonry effect by making some items taller
              const isLarge = idx % 5 === 0;
              const imageUrl = item.cover_image_url || item.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
              const displayName = item.name || item.title || 'Listing';
              
              return (
                <motion.div
                  key={`${item.itemType}-${item.id}`}
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const section = item.itemType === 'business' ? 'businesses' : item.itemType === 'event' ? 'events' : item.itemType === 'charity' ? 'charities' : item.itemType + 's';
                    navigate(`/${section}/${item.slug || item.id}`);
                  }}
                  className={`relative group cursor-pointer overflow-hidden rounded-md md:rounded-2xl ${isLarge ? 'row-span-2 aspect-[1/2]' : 'aspect-square'}`}
                >
                  <img src={imageUrl} alt={displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                    <div className="flex items-center gap-1.5 mb-1 opacity-90">
                      {item.itemType === 'business' && <Building2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.itemType === 'mosque' && <Building2 className="w-3.5 h-3.5 text-teal-300" />}
                      {item.itemType === 'charity' && <Heart className="w-3.5 h-3.5 text-rose-400" />}
                      {item.itemType === 'education' && <GraduationCap className="w-3.5 h-3.5 text-sky-300" />}
                      {item.itemType === 'event' && <Calendar className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="text-xs font-medium capitalize">{item.itemType}</span>
                    </div>
                    <h3 className="font-bold text-sm md:text-base leading-tight line-clamp-2">{displayName}</h3>
                    {(item.city || item.venue) && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-80">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{item.city || item.venue}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
