import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge } from '@/components/ui'

export default function MosqueDashboard() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['mosque', 'dashboard'],
    queryFn: () => api.get('/analytics/mosque/dashboard').then(r => r.data),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>

  if (!stats || stats.total_mosques === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No mosques yet</h2>
        <p className="text-gray-500 mb-6">Register a mosque to get started.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Mosque Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Total', value: stats.total_mosques, color: 'text-blue-600' },
          { icon: CheckCircle, label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { icon: XCircle, label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">My Mosques</h2>
        {stats.mosques?.map((m: any) => (
          <Card key={m.id} className="flex items-center justify-between">
            <div>
              <Link to={`/mosques/${m.slug}`} className="font-medium text-primary-600 hover:underline">
                {m.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={m.status === 'approved' ? 'success' : m.status === 'pending' ? 'pending' : 'error'}>
                  {m.status}
                </Badge>
                {m.has_prayer_times && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Prayer times set</span>}
              </div>
              <Link 
                to={`/mosque/mosques/${m.id}/manage`}
                className="inline-block mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"
              >
                Manage Settings & Prayer Times
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              {m.city || '-'}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}