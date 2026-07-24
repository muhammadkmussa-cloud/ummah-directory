import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock, Search } from 'lucide-react'
import api from '@/lib/api-client'
import { Card } from '@/components/ui'

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events', { params: { upcoming: true, size: 50 } }).then(r => r.data),
  })

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-surface-900">Community Events</h1>

      <div className="relative mb-6 min-w-0 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="input-field pl-9 sm:pl-10 text-xs sm:text-sm w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-sm">Loading events...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data?.items?.map((event: any) => (
            <Card key={event.id} hover onClick={() => navigate(`/events/${event.slug}`)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center min-w-[56px] shrink-0 border border-emerald-100">
                  <p className="text-lg font-extrabold text-emerald-700 leading-none">
                    {event.event_date ? new Date(event.event_date).getDate() : '-'}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase mt-0.5">
                    {event.event_date ? new Date(event.event_date).toLocaleString('default', { month: 'short' }) : ''}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-surface-900 line-clamp-1">{event.title}</h3>
                  {event.category && (
                    <span className="text-xs text-surface-500 capitalize">{event.category}</span>
                  )}
                </div>
              </div>
              {event.venue && (
                <p className="text-xs sm:text-sm text-surface-600 flex items-center gap-1.5 mb-1.5 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" /> {event.venue}
                </p>
              )}
              {(event.event_date || event.event_time) && (
                <p className="text-xs sm:text-sm text-surface-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-surface-400 shrink-0" /> {event.event_date} {event.event_time}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <div className="w-full text-center py-16 px-4 text-surface-500 bg-surface-50 rounded-2xl border border-surface-100 my-4">
          <p className="text-base font-bold text-surface-800">No upcoming events</p>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">Check back later for community updates</p>
        </div>
      )}
    </div>
  )
}
