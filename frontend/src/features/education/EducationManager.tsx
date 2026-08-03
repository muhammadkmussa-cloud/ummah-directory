import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ChevronLeft, GraduationCap, Users, Edit2, X, Trash2, Calendar, Shield } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input } from '@/components/ui';
import StaffManager from '@/features/organizations/StaffManager';
import OrganizationEventsTab from '@/features/events/OrganizationEventsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: GraduationCap },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
];

export default function EducationManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  const { data: institution, isLoading } = useQuery({
    queryKey: ['education', id],
    queryFn: () => api.get(`/education/${id}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    values: institution || {},
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/education/${id}`, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['education', id], res.data);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/education/${id}`),
    onSuccess: () => {
      navigate('/my-organizations');
    },
  });

  if (isLoading) {
    return <div className="text-center py-20 text-surface-500">Loading management suite...</div>;
  }

  if (!institution) {
    return <div className="text-center py-20 text-red-500">Institution not found.</div>;
  }

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this institution? This action cannot be undone.")) {
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
          <h1 className="text-2xl font-bold text-surface-900">Manage Institution</h1>
          <p className="text-surface-500 text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> {institution.name}
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
              <h2 className="text-lg font-bold text-surface-900">Institution Details</h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => { reset(institution); setIsEditing(true); }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Institution Type" {...register('institution_type')} />
                  <Input label="Curriculum" {...register('curriculum')} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="input-field min-h-[100px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email" type="email" {...register('email')} />
                  <Input label="Phone" type="tel" {...register('phone')} />
                </div>
                <Input label="Website" type="url" {...register('website')} />
                <Input label="Address" {...register('address')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="City" {...register('city')} />
                  <Input label="Country" {...register('country')} />
                </div>
                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_girls_section')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Girls Section</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_boarding')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Boarding</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_quran_program')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Quran Program</span>
                  </label>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button type="submit" loading={isSubmitting}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-surface-500 block mb-1">Institution Type</span>
                  <span className="font-medium capitalize">{institution.institution_type}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Curriculum</span>
                  <span className="font-medium">{institution.curriculum || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Email</span>
                  <span className="font-medium">{institution.email || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Phone</span>
                  <span className="font-medium">{institution.phone || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-surface-500 block mb-1">Location</span>
                  <span className="font-medium">{[institution.address, institution.city, institution.country].filter(Boolean).join(', ')}</span>
                </div>
                <div className="col-span-2 flex gap-4 mt-2">
                  {institution.has_girls_section && <Badge variant="default">Girls Section</Badge>}
                  {institution.has_boarding && <Badge variant="default">Boarding</Badge>}
                  {institution.has_quran_program && <Badge variant="default">Quran Program</Badge>}
                </div>
              </div>
            )}
          </Card>

          {/* Verification Status */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Shield className={`w-6 h-6 ${institution.is_verified ? 'text-blue-500' : 'text-surface-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 mb-1">Verification Status</h3>
                  <p className="text-sm text-surface-500 mb-3">
                    {institution.is_verified 
                      ? "This institution is verified and features a blue checkmark."
                      : "Verification is pending or not started."}
                  </p>
                </div>
              </div>
              {institution.is_verified && (
                <Badge variant="verified">Verified</Badge>
              )}
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
                    Permanently delete this institution. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete} loading={deleteMutation.isPending}>
                    Delete Institution
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <StaffManager organizationId={id as string} />
      )}

      {activeTab === 'events' && (
        <OrganizationEventsTab organizationId={id as string} organizationType="education" />
      )}
    </div>
  );
}
