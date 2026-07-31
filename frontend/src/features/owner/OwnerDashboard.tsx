import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Eye, Megaphone, Star, TrendingUp, CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api-client'
import { Card, Badge } from '@/components/ui'
import OwnerCampaigns from '@/features/ads/OwnerCampaigns'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const validTabs = ['overview', 'listings', 'advertising']
  const [tab, setTab] = useState(validTabs.includes(requestedTab || '') ? requestedTab! : 'overview')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner', 'dashboard'],
    queryFn: () => api.get('/analytics/owner/dashboard').then(r => r.data),
  })

  const { data: ownerStats } = useQuery({
    queryKey: ['owner', 'dashboard', 'stats'],
    queryFn: () => api.get('/owner/dashboard/stats').then(r => r.data),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['owner', 'analytics'],
    queryFn: () => {
      if (!stats?.businesses?.length) return null
      const businessId = stats.businesses[0]?.id
      return api.get(`/analytics/resource/business/${businessId}`).then(r => r.data)
    },
    enabled: !!stats?.businesses?.length && tab === 'overview',
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>

  if (!stats || stats.total_businesses === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No businesses yet</h2>
        <p className="text-gray-500 mb-6">Create your first business listing to get started.</p>
        <Link to="/businesses/new" className="btn-primary inline-block">Submit a Business</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'listings', label: 'My Listings', icon: Building2 },
    { id: 'advertising', label: 'Advertising', icon: Megaphone },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Business Owner Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Total', value: stats.total_businesses, color: 'text-blue-600' },
          { icon: CheckCircle, label: 'Approved', value: stats.approved, color: 'text-green-600' },
          { icon: Clock, label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { icon: XCircle, label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
          { icon: Eye, label: 'Total Views', value: stats.total_views, color: 'text-purple-600' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Card>
        ))}
      </div>

      {stats.total_reviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Average Rating</span>
            </div>
            <p className="text-3xl font-bold">{stats.average_rating.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Across {stats.total_reviews} reviews</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Total Reviews</span>
            </div>
            <p className="text-3xl font-bold">{stats.total_reviews}</p>
            <p className="text-sm text-gray-500">From all listings</p>
          </Card>
        </div>
      )}

      <div className="flex gap-4 border-b mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-4">Performance Snapshot</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{analytics.total_views}</p>
                <p className="text-xs text-gray-500">Total Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{analytics.favorite_count}</p>
                <p className="text-xs text-gray-500">Favorites</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{analytics.clicks.website}</p>
                <p className="text-xs text-gray-500">Website Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{analytics.search_impressions}</p>
                <p className="text-xs text-gray-500">Search Impressions</p>
              </div>
            </div>
          </Card>

          {analytics.historical_data && analytics.historical_data.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-surface-500" />
                <h3 className="font-semibold">30-Day Interaction History</h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.historical_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(value) => value ? new Date(value as string | number).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="interactions" 
                      name="Interactions"
                      stroke="#0ea5e9" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-4">
          {stats.businesses?.map((b: any) => (
            <Card key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Link to={`/businesses/${b.slug}`} className="font-medium text-primary-600 hover:underline">
                    {b.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={b.status === 'approved' ? 'success' : b.status === 'pending' ? 'pending' : 'error'}>
                      {b.status}
                    </Badge>
                    {b.is_verified && <Badge variant="verified">Verified</Badge>}
                    {b.is_premier && <Badge variant="premier">Premier</Badge>}
                  </div>
                  <Link 
                    to={`/owner/businesses/${b.id}/manage`}
                    className="inline-block mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"
                  >
                    Manage Settings & Upgrades
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="text-center">
                  <p className="font-semibold text-gray-700">{b.views}</p>
                  <p>Views</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">{b.reviews}</p>
                  <p>Reviews</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">{b.rating.toFixed(1)}</p>
                  <p>Rating</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'advertising' && (
        <OwnerCampaigns />
      )}
    </div>
  )
}