import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Shield, Crown, Upload, CheckCircle, ChevronLeft, Building2, Users, Edit2, X, Trash2, Calendar, Star, MapPinPlus, Power, RefreshCw, GitBranch } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import StaffManager from '@/features/organizations/StaffManager';
import OrganizationEventsTab from '@/features/events/OrganizationEventsTab';
import ReviewsManagerTab from '@/features/reviews/ReviewsManagerTab';

import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
];

export default function BusinessManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [documentUrl, setDocumentUrl] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  
  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get(`/businesses/${id}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    values: business || {},
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/businesses/${id}`, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['business', id], res.data);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/businesses/${id}`),
    onSuccess: () => {
      navigate('/my-organizations');
    },
  });

  const premierMutation = useMutation({
    mutationFn: () => api.post(`/businesses/${id}/premier`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      alert('Premier upgrade requested!');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: { document_type: string; document_url: string }) => 
      api.post(`/businesses/${id}/verification-documents`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      setDocumentUrl('');
      alert('Verification documents submitted successfully!');
    },
  });

  const claimMutation = useMutation({
    mutationFn: (data: { proof_url: string; additional_info: string }) => 
      api.post(`/businesses/${id}/claim`, data),
    onSuccess: () => {
      alert('Claim submitted successfully!');
    },
  });

  // --- NEW: Branches ---
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['business', id, 'branches'],
    queryFn: () => api.get(`/businesses/${id}/branches`).then(r => r.data),
    enabled: activeTab === 'branches',
  });

  const createBranchMutation = useMutation({
    mutationFn: (data: { name: string; address: string }) => api.post(`/businesses/${id}/branches`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id, 'branches'] });
      setNewBranchName('');
      setNewBranchAddress('');
      toast.success('Branch created!');
    },
  });

  // --- NEW: Deactivate ---
  const deactivateMutation = useMutation({
    mutationFn: () => api.post(`/businesses/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      setShowDeactivateModal(false);
      toast.success('Business profile deactivated.');
      navigate('/my-organizations');
    },
  });

  // --- NEW: Premier Confirm ---
  const premierConfirmMutation = useMutation({
    mutationFn: () => api.post(`/businesses/${id}/premier/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      toast.success('Premier payment confirmed!');
    },
    onError: () => {
      toast.error('Payment not yet confirmed. Try again later.');
    },
  });

  // --- NEW: Verification Status ---
  const { data: verificationStatus } = useQuery({
    queryKey: ['business', id, 'verification-status'],
    queryFn: () => api.get(`/businesses/${id}/verification-status`).then(r => r.data),
  });

  if (isLoading) {
    return <div className="text-center py-20 text-surface-500">Loading management suite...</div>;
  }

  if (!business) {
    return <div className="text-center py-20 text-red-500">Business not found.</div>;
  }

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen pb-20 pt-4 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/my-organizations')}
          className="p-2 hover:bg-surface-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-surface-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Manage Listing</h1>
          <p className="text-surface-500 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {business.name}
          </p>
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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-surface-900">Business Details</h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => { reset(business); setIsEditing(true); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Name" {...register('name')} />
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
                <div className="grid grid-cols-2 gap-4">
                  <Input label="WhatsApp" type="tel" {...register('whatsapp')} />
                  <Input label="Website" type="url" {...register('website')} />
                </div>
                <Input label="Address" {...register('address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" {...register('city')} />
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button type="submit" loading={isSubmitting}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-surface-500 block mb-1">Email</span>
                  <span className="font-medium">{business.email || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Phone</span>
                  <span className="font-medium">{business.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">WhatsApp</span>
                  <span className="font-medium">{business.whatsapp || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Website</span>
                  <span className="font-medium">{business.website || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-surface-500 block mb-1">Location</span>
                  <span className="font-medium">{[business.address, business.city, business.country].filter(Boolean).join(', ')}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Verification Status */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield className={`w-6 h-6 ${business.is_verified ? 'text-blue-500' : 'text-surface-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-1">Verification Status</h3>
                  <p className="text-sm text-surface-500 mb-3">
                    {business.is_verified 
                      ? "Your business is verified and features a blue checkmark."
                      : "Verify your business to build trust with the community."}
                  </p>
                  
                  {!business.is_verified && (
                    <div className="flex gap-2 items-center mt-4">
                      <input 
                        type="url" 
                        placeholder="Verification Document URL" 
                        className="flex-1 px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                      />
                      <button 
                        onClick={() => verifyMutation.mutate({ document_type: 'license', document_url: documentUrl })}
                        disabled={verifyMutation.isPending || !documentUrl}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 inline-block mr-1" /> Submit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {business.is_verified && (
                <Badge variant="verified">Verified</Badge>
              )}
            </div>
          </Card>

          {/* Premier Status */}
          <Card className="p-6 border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Crown className={`w-6 h-6 ${business.is_premier ? 'text-amber-500' : 'text-amber-300'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-1">Premier Upgrade</h3>
                  <p className="text-sm text-surface-500 mb-4">
                    {business.is_premier 
                      ? "You are currently enjoying Premier benefits, including priority search ranking."
                      : "Upgrade to Premier to rank higher in search results and stand out."}
                  </p>

                  {!business.is_premier && (
                    <button 
                      onClick={() => premierMutation.mutate()}
                      disabled={premierMutation.isPending}
                      className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      Upgrade to Premier ($49/mo)
                    </button>
                  )}
                </div>
              </div>
              {business.is_premier && (
                <Badge variant="premier">Premier Active</Badge>
              )}
            </div>
          </Card>

          {/* Claim Business */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-surface-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-1">Claim Ownership</h3>
                  <p className="text-sm text-surface-500 mb-4">
                    If this listing was created by someone else, you can claim it by providing proof of ownership.
                  </p>

                  <button 
                    onClick={() => claimMutation.mutate({ proof_url: 'https://example.com/proof', additional_info: 'Owner claim' })}
                    disabled={claimMutation.isPending}
                    className="px-6 py-2.5 bg-surface-200 text-surface-800 rounded-xl text-sm font-semibold hover:bg-surface-300 transition-colors"
                  >
                    Initiate Claim
                  </button>
                </div>
              </div>
            </div>
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
                    Permanently delete or deactivate this business listing.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => setShowDeactivateModal(true)}>
                      <Power className="w-4 h-4 mr-2" /> Deactivate
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete} loading={deleteMutation.isPending}>
                      Delete Business
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Verification Status Widget */}
          {verificationStatus && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-surface-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" /> Verification Progress
              </h3>
              <div className="space-y-3">
                {verificationStatus.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-100 text-surface-400'
                    }`}>
                      {step.completed ? '✓' : idx + 1}
                    </div>
                    <span className={`text-sm ${step.completed ? 'text-surface-900 font-medium' : 'text-surface-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
                {!verificationStatus.steps && (
                  <p className="text-sm text-surface-500">Status: <Badge variant={verificationStatus.status === 'verified' ? 'success' : 'warning'}>{verificationStatus.status}</Badge></p>
                )}
              </div>
            </Card>
          )}

          {/* Premier Confirm Widget */}
          {!business.is_premier && (
            <Card className="p-4 border-amber-100 bg-amber-50/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-800 font-medium">Already paid for Premier? Verify your payment:</p>
                <Button variant="outline" size="sm" onClick={() => premierConfirmMutation.mutate()} loading={premierConfirmMutation.isPending}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Verify Payment
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary-600" /> Branch Locations
            </h3>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Branch name" value={newBranchName} onChange={(e: any) => setNewBranchName(e.target.value)} className="flex-1" />
              <Input placeholder="Address" value={newBranchAddress} onChange={(e: any) => setNewBranchAddress(e.target.value)} className="flex-1" />
              <Button
                onClick={() => createBranchMutation.mutate({ name: newBranchName, address: newBranchAddress })}
                disabled={!newBranchName || !newBranchAddress}
                loading={createBranchMutation.isPending}
              >
                <MapPinPlus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {branchesLoading ? (
              <div className="text-center py-8 text-surface-400 animate-pulse">Loading branches...</div>
            ) : branches?.items?.length > 0 ? (
              <div className="space-y-3">
                {branches.items.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
                    <MapPinPlus className="w-5 h-5 text-primary-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-surface-900 text-sm">{b.name}</p>
                      <p className="text-xs text-surface-500">{b.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface-50 rounded-2xl text-surface-500 text-sm">
                <GitBranch className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                No branches yet. Add your first branch location above.
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <OrganizationEventsTab organizationId={id as string} organizationType="business" />
      )}

      {activeTab === 'reviews' && (
        <ReviewsManagerTab businessId={id as string} />
      )}

      {activeTab === 'team' && (
        <StaffManager organizationId={id} />
      )}

      {/* Deactivate Confirmation Modal */}
      <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Business">
        <div className="space-y-4">
          <p className="text-surface-600 text-sm">Are you sure you want to deactivate <strong>{business.name}</strong>? Your listing will be hidden from search results and the public directory. You can reactivate it later.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => deactivateMutation.mutate()} loading={deactivateMutation.isPending}>
              <Power className="w-4 h-4 mr-2" /> Yes, Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
