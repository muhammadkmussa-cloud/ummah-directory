import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, MousePointerClick, Calendar, Eye } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge } from '@/components/ui';

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'owner', timeframe],
    queryFn: () => api.get('/analytics/owner/dashboard', { params: { timeframe } }).then(r => r.data),
  });

  // Granular single-business analytics
  const { data: businessAnalytics } = useQuery({
    queryKey: ['analytics', 'business', selectedBusinessId, timeframe],
    queryFn: () => api.get(`/analytics/business/${selectedBusinessId}`, { params: { timeframe } }).then(r => r.data),
    enabled: !!selectedBusinessId,
  });

  // Generic resource analytics (for non-business resources)
  const { data: resourceAnalytics } = useQuery({
    queryKey: ['analytics', 'resource', selectedBusinessId, timeframe],
    queryFn: () => api.get(`/analytics/resource/business/${selectedBusinessId}`, { params: { timeframe } }).then(r => r.data),
    enabled: !!selectedBusinessId,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            Analytics Dashboard
          </h1>
          <p className="text-surface-500 mt-1">Track the performance of your organizations</p>
        </div>
        <div className="w-48">
          <select 
            className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            value={timeframe} 
            onChange={(e: any) => setTimeframe(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-surface-500 text-center py-12">Loading analytics...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-6 h-6" />
                </div>
                <Badge variant="success" className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12%
                </Badge>
              </div>
              <h3 className="text-surface-500 font-medium text-sm">Total Views</h3>
              <p className="text-3xl font-bold text-surface-900 mt-1">{analytics?.total_views || 0}</p>
            </Card>

            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <MousePointerClick className="w-6 h-6" />
                </div>
                <Badge variant="success" className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +5%
                </Badge>
              </div>
              <h3 className="text-surface-500 font-medium text-sm">Interactions</h3>
              <p className="text-3xl font-bold text-surface-900 mt-1">{analytics?.total_interactions || 0}</p>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-surface-500 font-medium text-sm">Unique Visitors</h3>
              <p className="text-3xl font-bold text-surface-900 mt-1">{analytics?.unique_visitors || 0}</p>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-surface-500 font-medium text-sm">Bookmarks</h3>
              <p className="text-3xl font-bold text-surface-900 mt-1">{analytics?.total_bookmarks || 0}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-surface-900 mb-6">Recent Activity</h2>
            {(!analytics?.recent_activity || analytics.recent_activity.length === 0) ? (
              <p className="text-surface-500 text-center py-6">No recent activity to display.</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {analytics.recent_activity.map((act: any, idx: number) => (
                  <div key={idx} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-surface-900">{act.action_type}</p>
                      <p className="text-sm text-surface-500">User ID: {act.user_id}</p>
                    </div>
                    <span className="text-sm text-surface-400">{new Date(act.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
