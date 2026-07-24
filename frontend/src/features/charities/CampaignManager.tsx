import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Target, Plus, Trash2, Users, Heart, Edit2, X, Calendar, PauseCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input } from '@/components/ui';
import StaffManager from '@/features/organizations/StaffManager';
import OrganizationEventsTab from '@/features/events/OrganizationEventsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Heart },
  { id: 'campaigns', label: 'Campaigns', icon: Target },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
];

export default function CampaignManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: 0,
    currency: 'USD',
    deadline: ''
  });

  const { data: charity, isLoading: charityLoading } = useQuery({
    queryKey: ['charity', id],
    queryFn: () => api.get(`/charities/${id}`).then(r => r.data),
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['charity', id, 'campaigns'],
    queryFn: () => api.get(`/charities/${id}/campaigns`).then(r => r.data.items || []),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    values: charity || {},
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/charities/${id}`, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['charity', id], res.data);
      setIsEditing(false);
    },
  });

  const deleteCharityMutation = useMutation({
    mutationFn: () => api.delete(`/charities/${id}`),
    onSuccess: () => {
      navigate('/my-organizations');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/charities/${id}/campaigns`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity', id, 'campaigns'] });
      setShowCreate(false);
      setFormData({ title: '', description: '', target_amount: 0, currency: 'USD', deadline: '' });
      alert('Campaign created successfully!');
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: (data: any) => api.put(`/charities/${id}/campaigns/${editingCampaignId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity', id, 'campaigns'] });
      setEditingCampaignId(null);
      setFormData({ title: '', description: '', target_amount: 0, currency: 'USD', deadline: '' });
      alert('Campaign updated successfully!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (campaignId: number) => api.delete(`/charities/${id}/campaigns/${campaignId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity', id, 'campaigns'] });
      alert('Campaign deleted.');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (campaignId: number) => api.post(`/charities/${id}/campaigns/${campaignId}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity', id, 'campaigns'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (campaignId: number) => api.post(`/charities/${id}/campaigns/${campaignId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charity', id, 'campaigns'] });
    },
  });

  if (charityLoading || campaignsLoading) {
    return <div className="text-center py-20 text-surface-500">Loading campaign manager...</div>;
  }

  if (!charity) {
    return <div className="text-center py-20 text-red-500">Charity not found.</div>;
  }

  const onSubmitCharity = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleDeleteCharity = () => {
    if (window.confirm("Are you sure you want to delete this charity? This action cannot be undone.")) {
      deleteCharityMutation.mutate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen pb-20 pt-4 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/my-organizations')}
            className="p-2 hover:bg-surface-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-surface-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Campaigns</h1>
            <p className="text-surface-500 text-sm">{charity.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && <StaffManager organizationId={id as string} />}

      {activeTab === 'events' && (
        <OrganizationEventsTab organizationId={id as string} organizationType="charity" />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-surface-900">Charity Details</h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => { reset(charity); setIsEditing(true); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmitCharity)} className="space-y-4">
                <Input label="Name" {...register('name')} />
                <Input label="Registration Number" {...register('registration_number')} />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Mission Statement</label>
                  <textarea
                    {...register('mission_statement')}
                    rows={2}
                    className="input-field min-h-[60px] resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="input-field min-h-[100px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email" type="email" {...register('email')} />
                  <Input label="Phone" type="tel" {...register('phone')} />
                </div>
                <Input label="Website" type="url" {...register('website')} />
                <Input label="Address" {...register('address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" {...register('city')} />
                  <Input label="Country" {...register('country')} />
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button type="submit" loading={isSubmitting}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-surface-500 block mb-1">Registration No.</span>
                  <span className="font-medium">{charity.registration_number || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Email</span>
                  <span className="font-medium">{charity.email || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Phone</span>
                  <span className="font-medium">{charity.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Website</span>
                  <span className="font-medium">{charity.website || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-surface-500 block mb-1">Mission Statement</span>
                  <span className="font-medium">{charity.mission_statement || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-surface-500 block mb-1">Location</span>
                  <span className="font-medium">{[charity.address, charity.city, charity.country].filter(Boolean).join(', ')}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-red-100">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700 mb-1">Danger Zone</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete this charity. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteCharity} loading={deleteCharityMutation.isPending}>
                    Delete Charity
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'campaigns' && (<>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {(showCreate || editingCampaignId !== null) && (
        <Card className="p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">{editingCampaignId ? 'Edit Campaign' : 'Create New Campaign'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border rounded-xl bg-surface-50"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                className="w-full px-4 py-2 border rounded-xl bg-surface-50"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Target Amount</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border rounded-xl bg-surface-50"
                  value={formData.target_amount}
                  onChange={e => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border rounded-xl bg-surface-50"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => {
                  setShowCreate(false);
                  setEditingCampaignId(null);
                  setFormData({ title: '', description: '', target_amount: 0, currency: 'USD', deadline: '' });
                }}
                className="px-4 py-2 bg-surface-100 text-surface-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const payload = { ...formData, deadline: new Date(formData.deadline).toISOString() };
                  if (editingCampaignId) {
                    updateCampaignMutation.mutate(payload);
                  } else {
                    createMutation.mutate(payload);
                  }
                }}
                disabled={createMutation.isPending || updateCampaignMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-10 text-surface-500 bg-surface-50 rounded-xl border border-dashed border-surface-200">
            No active campaigns. Create one to start raising funds.
          </div>
        ) : (
          campaigns.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-surface-900">{c.title}</h3>
                  <p className="text-sm text-surface-500 mb-2">{c.description}</p>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-green-600 flex items-center gap-1">
                      <Target className="w-4 h-4" /> 
                      ${Number(c.amount_raised || 0).toLocaleString()} / ${Number(c.target_amount || 0).toLocaleString()}
                    </span>
                    {c.deadline && (
                      <span className="text-surface-500">
                        Ends: {new Date(c.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === 'active' ? 'success' : c.status === 'paused' ? 'pending' : 'default'}>{c.status}</Badge>
                  {c.status === 'active' && (
                    <>
                      <button 
                        onClick={() => pauseMutation.mutate(c.id)}
                        disabled={pauseMutation.isPending}
                        title="Pause Campaign"
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => completeMutation.mutate(c.id)}
                        disabled={completeMutation.isPending}
                        title="Complete Campaign"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      setEditingCampaignId(c.id);
                      setFormData({
                        title: c.title,
                        description: c.description || '',
                        target_amount: Number(c.target_amount),
                        currency: c.currency || 'USD',
                        deadline: c.deadline ? new Date(c.deadline).toISOString().slice(0, 16) : ''
                      });
                      setShowCreate(false);
                    }}
                    title="Edit Campaign"
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Delete this campaign?")) {
                        deleteMutation.mutate(c.id)
                      }
                    }}
                    title="Delete Campaign"
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      </>)}
    </div>
  );
}
