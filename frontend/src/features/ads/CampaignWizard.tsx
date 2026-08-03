import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Button, Input } from '@/components/ui'

interface CampaignWizardProps {
  onClose: () => void
  onCreated: () => void
}

const STEPS = ['Type', 'Details', 'Budget', 'Review']

const CAMPAIGN_TYPES = [
  { value: 'featured_listing', label: 'Featured Listing', desc: 'Top placement in search and category pages' },
  { value: 'feed_ad', label: 'Feed Advertisement', desc: 'Appears naturally in the Explore feed' },
  { value: 'category_spotlight', label: 'Category Spotlight', desc: 'Featured at the top of a category page' },
]

const CTA_OPTIONS = [
  { value: 'visit_profile', label: 'Visit Profile' },
  { value: 'call_now', label: 'Call Now' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'book_now', label: 'Book Now' },
  { value: 'donate', label: 'Donate' },
  { value: 'learn_more', label: 'Learn More' },
]

export default function CampaignWizard({ onClose, onCreated }: CampaignWizardProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    campaign_type: 'featured_listing',
    organization_id: '',
    headline: '',
    description: '',
    cta_type: 'visit_profile',
    media_url: '',
    destination_url: '',
    budget_type: 'total',
    budget_amount: 1000,
    start_date: '',
    end_date: '',
    target_city: '',
    target_categories: [] as string[],
  })

  const { data: orgsData } = useQuery({
    queryKey: ['owner', 'dashboard', 'stats'],
    queryFn: () => api.get('/owner/dashboard/stats').then(r => r.data),
  })

  const { data: businessesData } = useQuery({
    queryKey: ['owner', 'businesses'],
    queryFn: () => api.get('/businesses', { params: { size: 100 } }).then(r => r.data),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/organizations/${form.organization_id}/campaigns`, data),
    onSuccess: () => onCreated(),
  })

  const orgs = (businessesData?.items || []).filter((b: any) => b.status === 'approved')

  const handleSubmit = () => {
    if (!form.organization_id || !form.name || !form.start_date || !form.end_date) return
    createMutation.mutate({
      name: form.name,
      campaign_type: form.campaign_type,
      organization_id: form.organization_id,
      headline: form.headline || undefined,
      description: form.description || undefined,
      cta_type: form.cta_type || undefined,
      media_url: form.media_url || undefined,
      destination_url: form.destination_url || undefined,
      budget_type: form.budget_type,
      budget_amount: form.budget_amount,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      target_city: form.target_city || undefined,
      target_categories: form.target_categories.length > 0 ? form.target_categories : undefined,
    })
  }

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  return (
    <Card className="p-6 mb-8 border border-primary-200 bg-primary-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900">New Campaign</h2>
        <button onClick={onClose} className="p-1 hover:bg-surface-200 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-primary-600' : 'bg-surface-200'}`} />
        ))}
      </div>
      <p className="text-sm text-surface-500 mb-4 text-center">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-surface-700 mb-2">Choose promotion type</p>
          {CAMPAIGN_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => { setForm(f => ({ ...f, campaign_type: t.value })) }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                form.campaign_type === t.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-surface-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="font-bold text-surface-900">{t.label}</div>
              <div className="text-sm text-surface-500">{t.desc}</div>
            </button>
          ))}
          {form.campaign_type === 'category_spotlight' && categoriesData && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-surface-700 mb-1">Target Category</label>
              <select
                className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.target_categories[0] || ''}
                onChange={e => setForm(f => ({ ...f, target_categories: e.target.value ? [e.target.value] : [] }))}
              >
                <option value="">Select category...</option>
                {Array.isArray(categoriesData) && categoriesData.flatMap((cat: any) => [
                  <option key={cat.id} value={cat.id}>{cat.name}</option>,
                  ...(cat.children || []).map((child: any) => (
                    <option key={child.id} value={child.id}>— {child.name}</option>
                  )),
                ])}
              </select>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Organization</label>
            <select
              className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={form.organization_id}
              onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
            >
              <option value="">Select organization...</option>
              {orgs.map((o: any) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Campaign Name</label>
            <Input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Ramadan Promotion"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Headline</label>
            <Input
              value={form.headline}
              onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
              placeholder="50% Off Family Meals"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Available this weekend only!"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Call to Action</label>
              <select
                className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.cta_type}
                onChange={e => setForm(f => ({ ...f, cta_type: e.target.value }))}
              >
                {CTA_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Image URL</label>
              <Input
                value={form.media_url}
                onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Budget (KES)</label>
              <Input
                required
                type="number"
                min="100"
                value={form.budget_amount}
                onChange={e => setForm(f => ({ ...f, budget_amount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Budget Type</label>
              <select
                className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.budget_type}
                onChange={e => setForm(f => ({ ...f, budget_type: e.target.value }))}
              >
                <option value="total">Total Budget</option>
                <option value="daily">Daily Budget</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
              <Input
                required
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
              <Input
                required
                type="date"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Target City</label>
            <Input
              value={form.target_city}
              onChange={e => setForm(f => ({ ...f, target_city: e.target.value }))}
              placeholder="Nairobi"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-surface-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-surface-500">Type</span>
              <span className="font-medium capitalize">{form.campaign_type.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-surface-500">Organization</span>
              <span className="font-medium">{orgs.find((o: any) => o.id === form.organization_id)?.name || 'N/A'}</span>
            </div>
            {form.headline && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-500">Headline</span>
                <span className="font-medium">{form.headline}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-surface-500">Budget</span>
              <span className="font-medium">{form.budget_amount} KES ({form.budget_type})</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-surface-500">Duration</span>
              <span className="font-medium">{form.start_date} to {form.end_date}</span>
            </div>
            {form.target_city && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Target</span>
                <span className="font-medium">{form.target_city}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-surface-500 text-center">After creation, submit your campaign for review and complete payment to activate it.</p>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-primary-200">
        <Button variant="outline" onClick={step === 0 ? onClose : prev}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
          </Button>
        )}
      </div>
    </Card>
  )
}
