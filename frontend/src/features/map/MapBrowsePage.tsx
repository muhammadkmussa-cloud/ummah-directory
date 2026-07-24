import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Navigation, Locate, Building2, Landmark, Heart, Calendar, GraduationCap, Star, CheckCircle2, ChevronRight } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '@/lib/api-client'

interface ResourceType {
  key: string
  label: string
  color: string
  bgHex: string
  borderHex: string
  icon: string
}

const RESOURCE_TYPES: ResourceType[] = [
  { key: 'business', label: 'Businesses', color: 'bg-blue-600', bgHex: '#2563eb', borderHex: '#1d4ed8', icon: '🏪' },
  { key: 'mosque', label: 'Mosques', color: 'bg-emerald-600', bgHex: '#059669', borderHex: '#047857', icon: '🕌' },
  { key: 'charity', label: 'Charities', color: 'bg-rose-600', bgHex: '#e11d48', borderHex: '#be123c', icon: '💚' },
  { key: 'event', label: 'Events', color: 'bg-amber-600', bgHex: '#d97706', borderHex: '#b45309', icon: '📅' },
  { key: 'education', label: 'Schools & Madrasas', color: 'bg-purple-600', bgHex: '#9333ea', borderHex: '#7e22ce', icon: '🎓' },
]

// Fallback coordinate mapping for Nairobi area listings missing exact lat/lon
const NAIROBI_FALLBACKS: Record<string, [number, number]> = {
  'Sultana Gourmet Artisan Bakery': [-1.265, 36.812],
  'Iqra Islamic Bookstore & Gift Shop': [-1.283333, 36.816667],
  'Al-Amana Shariah Legal Consultancy': [-1.295, 36.815],
  'Al-Madina Halal Meats & Grill': [-1.286389, 36.817223],
  'Jamia Mosque Nairobi': [-1.282222, 36.821944],
  'Kenya Muslim Relief Initiative': [-1.288, 36.825],
  'Annual Community Iftar & Lecture': [-1.2825, 36.8215],
}

function createSnapMarkerIcon(item: any, typeInfo: ResourceType, isSelected: boolean) {
  const title = item.name || item.title || 'Listing'
  const shortTitle = title.length > 18 ? title.substring(0, 16) + '…' : title
  const rating = item.avg_rating || item.rating ? (item.avg_rating || item.rating).toFixed(1) : null

  const html = `
    <div class="snap-marker-container flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 cursor-pointer border-2"
         style="background-color: ${isSelected ? '#0f172a' : typeInfo.bgHex}; border-color: ${isSelected ? '#10b981' : '#ffffff'}; color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
      <span class="text-sm font-bold leading-none">${typeInfo.icon}</span>
      <span class="text-xs font-semibold leading-none max-w-[130px] truncate drop-shadow-sm">${shortTitle}</span>
      ${rating ? `
        <span class="flex items-center gap-0.5 bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-amber-300">
          ★ ${rating}
        </span>
      ` : ''}
    </div>
  `

  return L.divIcon({
    className: 'snap-leaflet-icon',
    html,
    iconSize: [160, 36],
    iconAnchor: [80, 18],
    popupAnchor: [0, -20],
  })
}

export default function MapBrowsePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    initialType && RESOURCE_TYPES.some(r => r.key === initialType)
      ? new Set([initialType])
      : new Set(RESOURCE_TYPES.map(r => r.key))
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const toggleType = (key: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const fetchAll = async (type: string, endpoint: string) => {
    try {
      const resp = await api.get(endpoint, { params: { size: 100 } })
      const data = resp.data
      const items = data.items || data
      return (Array.isArray(items) ? items : []).map((item: any) => {
        let lat = item.latitude
        let lon = item.longitude
        const name = item.name || item.title

        if ((!lat || !lon) && NAIROBI_FALLBACKS[name]) {
          [lat, lon] = NAIROBI_FALLBACKS[name]
        } else if (!lat || !lon) {
          // Default jitter near Nairobi CBD
          const hash = (name || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
          lat = -1.286389 + ((hash % 20) - 10) * 0.003
          lon = 36.817223 + (((hash * 7) % 20) - 10) * 0.003
        }

        return {
          ...item,
          resource_type: type,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }
      })
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err)
      return []
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchAll('business', '/businesses'),
      fetchAll('mosque', '/mosques'),
      fetchAll('charity', '/charities'),
      fetchAll('event', '/events'),
      fetchAll('education', '/education'),
    ]).then(results => {
      const flat = results.flat()
      setListings(flat)
      setLoading(false)
    })
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([-1.286389, 36.817223], 13)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    const filtered = listings.filter(l => {
      const matchesType = activeTypes.has(l.resource_type)
      const title = (l.name || l.title || '').toLowerCase()
      const city = (l.city || '').toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || title.includes(q) || city.includes(q)
      return matchesType && matchesSearch && !isNaN(l.latitude) && !isNaN(l.longitude)
    })

    const bounds = L.latLngBounds([])

    filtered.forEach(item => {
      const typeInfo = RESOURCE_TYPES.find(r => r.key === item.resource_type) || RESOURCE_TYPES[0]
      const isSelected = selectedItem?.id === item.id
      const icon = createSnapMarkerIcon(item, typeInfo, isSelected)

      const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map)

      marker.on('click', () => {
        setSelectedItem(item)
        map.flyTo([item.latitude, item.longitude], 15, { duration: 0.8 })
      })

      markersRef.current.set(item.id, marker)
      bounds.extend([item.latitude, item.longitude])
    })

    if (filtered.length > 0 && !selectedItem) {
      map.fitBounds(bounds.pad(0.2))
    }
  }, [listings, activeTypes, searchQuery, selectedItem])

  const handleLocateMe = () => {
    const map = mapInstanceRef.current
    if (!map) return
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 })
        },
        () => {
          map.flyTo([-1.286389, 36.817223], 14, { duration: 1 })
        }
      )
    } else {
      map.flyTo([-1.286389, 36.817223], 14, { duration: 1 })
    }
  }

  const handleFitAll = () => {
    const map = mapInstanceRef.current
    if (!map || listings.length === 0) return
    const bounds = L.latLngBounds(listings.map(l => [l.latitude, l.longitude]))
    map.fitBounds(bounds.pad(0.15))
    setSelectedItem(null)
  }

  const getProfileLink = (item: any) => {
    switch (item.resource_type) {
      case 'business': return `/businesses/${item.slug || item.id}`
      case 'mosque': return `/mosques/${item.slug || item.id}`
      case 'charity': return `/charities/${item.slug || item.id}`
      case 'event': return `/events/${item.slug || item.id}`
      case 'education': return `/education/${item.slug || item.id}`
      default: return `/explore`
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-900 font-sans">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-4xl mx-auto flex flex-col gap-3">
        {/* Search Bar & Type Badges */}
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search map by name or city (e.g., Nairobi, Bakery, Jamia)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {RESOURCE_TYPES.map(rt => {
              const isActive = activeTypes.has(rt.key)
              return (
                <button
                  key={rt.key}
                  onClick={() => toggleType(rt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm">{rt.icon}</span>
                  <span>{rt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200">
            {loading ? 'Updating map pins…' : `${listings.filter(l => activeTypes.has(l.resource_type)).length} Places Plotted`}
          </span>

          <button
            onClick={handleFitAll}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-200 transition-colors"
          >
            Show All Locations
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapRef} className="w-full h-full z-0 bg-slate-100" />

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute right-4 top-36 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          title="Locate Me"
          className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-white transition-all active:scale-95"
        >
          <Locate className="w-5 h-5" />
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In"
          className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-white transition-all text-lg font-bold leading-none active:scale-95"
        >
          +
        </button>

        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out"
          className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 hover:text-emerald-600 hover:bg-white transition-all text-lg font-bold leading-none active:scale-95"
        >
          −
        </button>
      </div>

      {/* Snapchat-Style Bottom Drawer Card Preview when Marker is Selected */}
      {selectedItem && (
        <div className="absolute bottom-6 left-4 right-4 z-30 max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-slate-200/80 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {selectedItem.cover_image_url || selectedItem.image_url ? (
                <img
                  src={selectedItem.cover_image_url || selectedItem.image_url}
                  alt={selectedItem.name || selectedItem.title}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 shrink-0">
                  {(selectedItem.name || selectedItem.title || 'U')[0]}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {selectedItem.resource_type}
                  </span>
                  {selectedItem.is_verified && (
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-blue-600">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" /> Verified
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-lg leading-snug truncate">
                  {selectedItem.name || selectedItem.title}
                </h3>

                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <span>📍</span> {selectedItem.address || selectedItem.venue || selectedItem.city || 'Nairobi'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {(selectedItem.avg_rating || selectedItem.rating) ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{(selectedItem.avg_rating || selectedItem.rating).toFixed(1)}</span>
                {selectedItem.review_count && (
                  <span className="text-xs text-slate-400 font-normal">({selectedItem.review_count} reviews)</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Community Verified</span>
            )}

            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.latitude},${selectedItem.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Directions</span>
              </a>

              <button
                onClick={() => navigate(getProfileLink(selectedItem))}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <span>View Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}