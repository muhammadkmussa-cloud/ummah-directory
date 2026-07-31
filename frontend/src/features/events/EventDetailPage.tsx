import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink, Heart, Share2, Check, Loader2 } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'
import { toast } from 'react-hot-toast'

export default function EventDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => api.get(`/events/${slug}`).then(r => r.data),
  })

  const { data: savedData } = useQuery({
    queryKey: ['saved-events'],
    queryFn: () => api.get('/users/me/saved-events').then(r => r.data),
    retry: false,
  })

  const isSaved = savedData?.items?.some((s: any) => s.event_id === event?.id)

  const saveMutation = useMutation({
    mutationFn: () => isSaved
      ? api.delete(`/events/${event.id}/save`)
      : api.post(`/events/${event.id}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-events'] })
      toast.success(isSaved ? 'Event unsaved' : 'Event saved')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed'),
  })

  const registerMutation = useMutation({
    mutationFn: () => api.post(`/events/${event.id}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', slug] })
      toast.success('Registered for event!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Registration failed'),
  })

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: event?.title, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  const handleAddToCalendar = () => {
    if (!event) return
    const start = event.event_date
    const end = new Date(new Date(start).getTime() + 3600000).toISOString()
    const text = encodeURIComponent(event.title || 'Event')
    const dates = `${start.replace(/[-:]/g, '').split('.')[0]}Z/${end.replace(/[-:]/g, '').split('.')[0]}Z`
    const details = encodeURIComponent(event.description || '')
    const location = encodeURIComponent(event.venue || '')
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`, '_blank')
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-surface-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <p>Loading event...</p>
    </div>
  )
  if (!event) return <div className="text-center py-20 text-surface-500 font-medium">Event not found</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="h-56 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl mb-6 flex items-center justify-center relative">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
        ) : (
          <Calendar className="w-20 h-20 text-primary-300" />
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            {event.category && <Badge variant="success">{event.category}</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {event.event_date}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {event.event_time}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          {event.description && (
            <Card>
              <h2 className="font-semibold mb-2">About This Event</h2>
              <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3">Event Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" /> {event.event_date}
              </div>
              {event.event_time && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" /> {event.event_time}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" /> {event.venue}
                </div>
              )}
              {event.organizer_type && (
                <p className="text-gray-500">Organized by: {event.organizer_type}</p>
              )}
              {event.registration_count > 0 && (
                <p className="text-gray-500">{event.registration_count} registered</p>
              )}
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              variant={isSaved ? 'primary' : 'outline'}
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>

            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={handleAddToCalendar} className="w-full">
            <Calendar className="w-4 h-4 mr-2" /> Add to Google Calendar
          </Button>

          <a href={`/api/v1/events/${event.slug || event.id}/calendar`} download className="block">
            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" /> Download .ics File
            </Button>
          </a>

          {event.registration_link && (
            <a href={event.registration_link} target="_blank" rel="noreferrer">
              <Button className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" /> External Registration
              </Button>
            </a>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            {registerMutation.isPending ? 'Registering...' : 'RSVP / Register'}
          </Button>

          {event.latitude && event.longitude && (
            <Card>
              <h3 className="font-semibold mb-3">Location</h3>
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${event.latitude},${event.longitude}`)}
                className="text-primary-600 hover:underline text-sm"
              >
                Open in Google Maps
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
