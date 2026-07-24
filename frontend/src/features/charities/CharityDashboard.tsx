import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle, Clock, XCircle, TrendingUp, Target } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge } from '@/components/ui'

export default function CharityDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['charity', 'dashboard'],
    queryFn: () => api.get('/analytics/charity/dashboard').then(r => r.data),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>

  if (!stats || stats.total_charities === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No charities yet</h2>
        <p className="text-gray-500 mb-6">Register a charity to get started.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Charity Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Total', value: stats.total_charities, color: 'text-blue-600' },
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

      {stats.total_campaigns > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Total Raised</span>
            </div>
            <p className="text-3xl font-bold">{stats.total_raised.toLocaleString()}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Total Target</span>
            </div>
            <p className="text-3xl font-bold">{stats.total_target.toLocaleString()}</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Active Campaigns</span>
            </div>
            <p className="text-3xl font-bold">{stats.active_campaigns}</p>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold">My Charities</h2>
        {stats.charities?.map((c: any) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <Link to={`/charities/${c.slug}`} className="font-medium text-primary-600 hover:underline">
                {c.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={c.status === 'approved' ? 'success' : c.status === 'pending' ? 'pending' : 'error'}>
                  {c.status}
                </Badge>
                {c.is_verified && <Badge variant="verified">Verified</Badge>}
              </div>
              <Link 
                to={`/charity/charities/${c.id}/manage`}
                className="inline-block mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"
              >
                Manage Campaigns
              </Link>
            </div>
            <div className="text-sm text-gray-500">{c.city || '-'}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}