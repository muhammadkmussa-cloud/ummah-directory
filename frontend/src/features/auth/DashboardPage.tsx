import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, Heart, Star, Bell, Building2, MapPin, FileText, ShieldCheck, ChevronRight, Plus, ExternalLink, Calendar } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge } from '@/components/ui'

export default function DashboardPage() {
  const [tab, setTab] = useState('overview')

  const { data, isLoading } = useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: () => api.get('/users/dashboard').then(r => r.data),
  })

  const { data: savedEvents } = useQuery({
    queryKey: ['saved-events'],
    queryFn: () => api.get('/users/me/saved-events').then(r => r.data),
    retry: false,
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500 font-medium">Loading dashboard…</div>
  if (!data) return <div className="text-center py-12 text-gray-500">Please log in to view your dashboard.</div>

  const u = data.user
  const s = data.stats || {}
  const orgs = data.organizations || data.businesses || []
  const isAdmin = u.role === 'super_admin' || u.role === 'admin' || u.role === 'moderator'

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'listings', label: 'My Organizations', icon: Building2 },
    { id: 'donations', label: 'Donations', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const getOrgLink = (org: any) => {
    const type = org.organization_type || 'business'
    if (type === 'mosque') return `/mosques/${org.slug || org.id}`
    if (type === 'charity') return `/charities/${org.slug || org.id}`
    return `/businesses/${org.slug || org.id}`
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 overflow-x-hidden">
      {/* Admin Quick Portal Banner */}
      {isAdmin && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                <span>Administrative Access Portal</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold uppercase tracking-wider">
                  {u.role}
                </span>
              </h2>
              <p className="text-xs text-slate-300">You have administrative privileges to manage directory organizations, approve claims, and review content.</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <span>Open Admin Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Pending Items Banner */}
      {((s.pending_organizations || 0) > 0 || (s.pending_claims || 0) > 0) && (
        <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-amber-900">Pending Items</h2>
              <p className="text-xs text-amber-700 break-words">
                {(s.pending_organizations || 0) > 0 && `${s.pending_organizations} organization(s) pending review. `}
                {(s.pending_claims || 0) > 0 && `${s.pending_claims} claim(s) pending review.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Welcome, {u.full_name || 'User'}</h1>
          <p className="text-gray-600 text-sm truncate">{u.email}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Badge variant={u.is_email_verified ? 'success' : 'error'}>
            {u.is_email_verified ? 'Verified Account' : 'Unverified Email'}
          </Badge>
          <Link to="/profile" className="btn-outline text-sm whitespace-nowrap">Edit Profile</Link>
        </div>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile, grid on sm+ */}
      <div className="mb-8">
        {/* Mobile: horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 pb-2 sm:hidden">
          {[
            { icon: Heart, label: 'Favorites', value: s.favorites ?? 0 },
            { icon: Star, label: 'Reviews', value: s.reviews ?? 0 },
            { icon: MapPin, label: 'Donations', value: s.donations ?? 0 },
            { icon: Building2, label: 'Orgs', value: s.organizations ?? s.businesses ?? orgs.length },
            { icon: Bell, label: 'Unread', value: s.unread_notifications ?? 0 },
            { icon: FileText, label: 'Claims', value: s.ownership_claims ?? 0 },
            { icon: Bell, label: 'Campaigns', value: `${s.active_campaigns ?? 0}/${s.total_campaigns ?? 0}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-none w-28 text-center bg-white rounded-2xl p-3 border border-surface-100 shadow-sm"
            >
              <stat.icon className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
        {/* Desktop: grid */}
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { icon: Heart, label: 'Favorites', value: s.favorites ?? 0 },
            { icon: Star, label: 'Reviews', value: s.reviews ?? 0 },
            { icon: MapPin, label: 'Donations', value: s.donations ?? 0 },
            { icon: Building2, label: 'Organizations', value: s.organizations ?? s.businesses ?? orgs.length },
            { icon: Bell, label: 'Unread', value: s.unread_notifications ?? 0 },
            { icon: FileText, label: 'Claims', value: s.ownership_claims ?? 0 },
            { icon: Bell, label: 'Ad Campaigns', value: `${s.active_campaigns ?? 0}/${s.total_campaigns ?? 0}` },
          ].map((stat) => (
            <Card key={stat.label} className="text-center hover:shadow-md transition-shadow">
              <stat.icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-900">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Your Organizations ({orgs.length})
              </h3>
              <Link to="/organizations/new" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 shrink-0">
                <Plus className="w-3.5 h-3.5" /> Add Organization
              </Link>
            </div>

            {orgs.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                You haven't listed any organizations yet.{' '}
                <Link to="/organizations/new" className="text-emerald-600 font-medium hover:underline">
                  Create your first listing
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orgs.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-sm">
                    <div className="min-w-0">
                      <Link to={getOrgLink(o)} className="font-semibold text-slate-900 hover:text-emerald-600 flex items-center gap-1.5">
                        <span className="truncate">{o.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      </Link>
                      <span className="text-xs text-gray-400 capitalize">{o.organization_type || 'business'}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={o.status === 'approved' || o.status === 'active' ? 'success' : o.status === 'pending' ? 'pending' : 'error'}>
                        {o.status}
                      </Badge>
                      {o.is_verified && <Badge variant="verified">Verified</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Saved Events
            </h3>
            {!savedEvents?.items?.length ? (
              <p className="text-gray-500 text-sm">No saved events.</p>
            ) : (
              <div className="space-y-2">
                {savedEvents.items.slice(0, 5).map((s: any) => (
                  <Link key={s.id} to={`/events/${s.event_slug}`} className="flex items-center justify-between text-sm py-1 border-b last:border-0 hover:bg-surface-50 px-2 rounded-lg -mx-2 transition-colors">
                    <span className="font-medium text-slate-900">{s.event_title}</span>
                    <span className="text-xs text-gray-500">{new Date(s.event_date).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Recent Donations
            </h3>
            {data.recent_donations?.length === 0 || !data.recent_donations ? (
              <p className="text-gray-500 text-sm">No donations made yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recent_donations?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <span className="font-medium text-slate-900">{d.amount} {d.currency}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.status === 'completed' ? 'success' : 'pending'}>{d.status}</Badge>
                      {d.receipt_number && (
                        <a href={`/api/v1/donations/${d.id}/receipt/pdf`} className="text-emerald-600 hover:underline text-xs" target="_blank" rel="noreferrer">
                          <FileText className="w-3 h-3 inline" /> PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: My Organizations */}
      {tab === 'listings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
            <h3 className="font-semibold text-lg">My Managed Organizations</h3>
            <Link to="/organizations/new" className="btn-primary text-xs flex items-center gap-1 w-fit shrink-0">
              <Plus className="w-4 h-4" /> Add New Organization
            </Link>
          </div>

          {orgs.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">No organizations listed under your account yet.</p>
            </Card>
          ) : (
            orgs.map((o: any) => (
              <Card key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link to={getOrgLink(o)} className="font-bold text-slate-900 hover:text-emerald-600 text-base flex items-center gap-2">
                    <span className="truncate">{o.name}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                      {o.organization_type || 'business'}
                    </span>
                    <Badge variant={o.status === 'approved' || o.status === 'active' ? 'success' : o.status === 'pending' ? 'pending' : 'error'}>
                      {o.status}
                    </Badge>
                    {o.is_verified && <Badge variant="verified">Verified</Badge>}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Donations */}
      {tab === 'donations' && (
        <div className="space-y-4">
          {data.recent_donations?.length === 0 || !data.recent_donations ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 mb-2">No donations recorded yet.</p>
              <Link to="/donate" className="text-emerald-600 font-semibold hover:underline">
                Make a charitable donation
              </Link>
            </Card>
          ) : (
            data.recent_donations?.map((d: any) => (
              <Card key={d.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{d.amount} {d.currency}</p>
                    <p className="text-xs text-gray-500">Receipt #{d.receipt_number || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={d.status === 'completed' ? 'success' : 'pending'}>{d.status}</Badge>
                    <a href={`/api/v1/donations/${d.id}/receipt/pdf`} className="btn-outline text-xs px-2.5 py-1 whitespace-nowrap" target="_blank" rel="noreferrer">
                      <FileText className="w-3.5 h-3.5 inline mr-1" /> Receipt
                    </a>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Notifications */}
      {tab === 'notifications' && (
        <div className="space-y-3">
          {data.notifications?.length === 0 || !data.notifications ? (
            <Card className="text-center py-8">
              <p className="text-gray-500">No notifications at this time.</p>
            </Card>
          ) : (
            data.notifications?.map((n: any) => (
              <Card key={n.id} className={!n.is_read ? 'border-emerald-200 bg-emerald-50/20' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{n.title}</p>
                    {n.message && <p className="text-xs text-gray-600 mt-1">{n.message}</p>}
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-emerald-600 rounded-full mt-1.5 shrink-0" />}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}