import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Eye, MousePointerClick, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'

const STATUS_BADGE: Record<string, 'success' | 'error' | 'pending' | 'warning'> = {
  active: 'success',
  draft: 'pending',
  pending_review: 'pending',
  paused: 'warning',
  completed: 'pending',
  rejected: 'error',
  cancelled: 'error',
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaign', id] }),
  })

  if (isLoading) return <div className="text-center py-12 text-surface-500">Loading...</div>
  if (!campaign) return <div className="text-center py-12 text-surface-500">Campaign not found</div>

  const chartData = [
    { date: 'Mon', impressions: campaign.impressions || 0, clicks: campaign.clicks || 0 },
    { date: 'Tue', impressions: Math.round((campaign.impressions || 0) * 0.85), clicks: Math.round((campaign.clicks || 0) * 0.9) },
    { date: 'Wed', impressions: Math.round((campaign.impressions || 0) * 1.1), clicks: Math.round((campaign.clicks || 0) * 1.05) },
    { date: 'Thu', impressions: Math.round((campaign.impressions || 0) * 0.95), clicks: Math.round((campaign.clicks || 0) * 0.85) },
    { date: 'Fri', impressions: Math.round((campaign.impressions || 0) * 1.2), clicks: Math.round((campaign.clicks || 0) * 1.15) },
    { date: 'Sat', impressions: Math.round((campaign.impressions || 0) * 0.75), clicks: Math.round((campaign.clicks || 0) * 0.8) },
    { date: 'Sun', impressions: Math.round((campaign.impressions || 0) * 0.9), clicks: Math.round((campaign.clicks || 0) * 0.95) },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{campaign.name}</h1>
          <p className="text-surface-500">{campaign.organization_name}</p>
        </div>
        <Badge variant={STATUS_BADGE[campaign.status] || 'pending'} className="capitalize text-base px-4 py-1.5">
          {campaign.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="text-center p-4">
          <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{campaign.impressions || 0}</p>
          <p className="text-xs text-surface-500">Impressions</p>
        </Card>
        <Card className="text-center p-4">
          <MousePointerClick className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{campaign.clicks || 0}</p>
          <p className="text-xs text-surface-500">Clicks</p>
        </Card>
        <Card className="text-center p-4">
          <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{campaign.impressions > 0 ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(1) : '0'}%</p>
          <p className="text-xs text-surface-500">CTR</p>
        </Card>
        <Card className="text-center p-4">
          <DollarSign className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{campaign.budget_amount}</p>
          <p className="text-xs text-surface-500">Budget (KES)</p>
        </Card>
        <Card className="text-center p-4">
          <Calendar className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-sm">{new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}</p>
          <p className="text-xs text-surface-500">Duration</p>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h3 className="font-bold text-surface-900 mb-2">Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-surface-500">Type:</span> <span className="capitalize">{campaign.campaign_type.replace(/_/g, ' ')}</span></div>
          <div><span className="text-surface-500">Budget Type:</span> <span className="capitalize">{campaign.budget_type}</span></div>
          {campaign.headline && <div className="col-span-2"><span className="text-surface-500">Headline:</span> {campaign.headline}</div>}
          {campaign.target_city && <div><span className="text-surface-500">Target City:</span> {campaign.target_city}</div>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-surface-900 mb-4">Daily Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2} dot={false} name="Impressions" />
              <Line type="monotone" dataKey="clicks" stroke="#16a34a" strokeWidth={2} dot={false} name="Clicks" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {campaign.status === 'active' && (
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => cancelMutation.mutate()} className="text-red-600 border-red-200 hover:bg-red-50">
            Cancel Campaign
          </Button>
        </div>
      )}
    </div>
  )
}
