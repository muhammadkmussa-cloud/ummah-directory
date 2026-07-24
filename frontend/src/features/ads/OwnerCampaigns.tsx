import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle, PauseCircle, PlayCircle, Eye } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'
import CampaignWizard from './CampaignWizard'

const STATUS_BADGE: Record<string, 'success' | 'error' | 'pending' | 'warning'> = {
  active: 'success',
  draft: 'pending',
  pending_review: 'pending',
  paused: 'warning',
  completed: 'pending',
  rejected: 'error',
  cancelled: 'error',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  pending_review: 'Pending Review',
  paused: 'Paused',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export default function OwnerCampaigns() {
  const queryClient = useQueryClient()
  const [showWizard, setShowWizard] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['owner', 'campaigns'],
    queryFn: () => api.get('/owner/campaigns').then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner', 'campaigns'] }),
  })

  const campaigns = data?.items || []

  if (isLoading) {
    return <div className="text-center py-12 text-surface-500">Loading campaigns...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-600" />
            Advertising Campaigns
          </h2>
          <p className="text-sm text-surface-500 mt-1">Promote your organizations with featured listings and display ads</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {showWizard && (
        <CampaignWizard onClose={() => setShowWizard(false)} onCreated={() => {
          setShowWizard(false)
          queryClient.invalidateQueries({ queryKey: ['owner', 'campaigns'] })
        }} />
      )}

      {campaigns.length === 0 && !showWizard && (
        <div className="py-16 text-center text-surface-500 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
          <Megaphone className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="font-medium text-surface-900 mb-1">No campaigns yet</p>
          <p className="text-sm">Create your first campaign to promote your organization</p>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((campaign: any) => (
          <Card key={campaign.id} className="p-5 border border-surface-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-surface-900 text-lg">{campaign.name}</h3>
                <p className="text-sm text-surface-500">{campaign.organization_name}</p>
              </div>
              <Badge variant={STATUS_BADGE[campaign.status] || 'pending'} className="capitalize">
                {STATUS_LABEL[campaign.status] || campaign.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-surface-600 mb-4">
              <span className="capitalize bg-surface-100 px-2 py-1 rounded-lg">
                {campaign.campaign_type.replace(/_/g, ' ')}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Budget: {campaign.budget_amount} KES
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {campaign.impressions} impressions
              </span>
            </div>

            {campaign.headline && (
              <p className="text-sm text-surface-700 mb-3 bg-surface-50 p-3 rounded-xl border border-surface-100">
                "{campaign.headline}"{campaign.description ? ` — ${campaign.description.substring(0, 100)}` : ''}
              </p>
            )}

            <div className="flex gap-2 pt-3 border-t border-surface-100">
              {campaign.status === 'active' && (
                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(campaign.id)}>
                  <PauseCircle className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
