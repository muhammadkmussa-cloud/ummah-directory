import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Bell } from 'lucide-react'
import api from '@/lib/api-client'
import { Button, Card } from '@/components/ui'

export default function NotificationPreferencesPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.get('/notifications/preferences').then(r => r.data),
  })

  const [localPrefs, setLocalPrefs] = useState<any>(null)

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/notifications/preferences', data),
    onSuccess: () => setMessage('Preferences updated'),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  const current = localPrefs || prefs || {}

  const toggle = (key: string) => {
    const updated = { ...current, [key]: !current[key] }
    setLocalPrefs(updated)
  }

  const save = () => {
    updateMutation.mutate(localPrefs || prefs)
  }

  const items = [
    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'in_app_notifications', label: 'In-App Notifications', desc: 'Show notifications in the app' },
    { key: 'listing_updates', label: 'Listing Updates', desc: 'When your listings are approved or updated' },
    { key: 'donation_updates', label: 'Donation Updates', desc: 'When you receive or make a donation' },
    { key: 'review_updates', label: 'Review Updates', desc: 'When someone reviews your business' },
    { key: 'promotional', label: 'Promotional', desc: 'New features and promotional content' },
    { key: 'security_alerts', label: 'Security Alerts', desc: 'Important security notifications' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      {message && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>}

      <Card className="p-6">
        <div className="space-y-4">
          {items.map((item) => (
            <label key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={current[item.key] !== false}
                onChange={() => toggle(item.key)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          ))}
        </div>

        <Button className="mt-6" onClick={save} loading={updateMutation.isPending}>
          Save Preferences
        </Button>
      </Card>
    </div>
  )
}
