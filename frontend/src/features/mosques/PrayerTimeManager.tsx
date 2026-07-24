import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Clock, Users, Plus, Save, Edit2, X, Trash2, Home, Calendar, Shield, Bell, UserMinus } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import StaffManager from '@/features/organizations/StaffManager';
import OrganizationEventsTab from '@/features/events/OrganizationEventsTab';

import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'prayer', label: 'Prayer Times', icon: Clock },
  { id: 'admins', label: 'Admins', icon: Shield },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
];

export default function PrayerTimeManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showSubscribers, setShowSubscribers] = useState(false);

  const [prayerTimes, setPrayerTimes] = useState({
    fajr: '',
    dhuhr: '',
    asr: '',
    maghrib: '',
    isha: '',
    jummahh: ''
  });

  const [newAdminEmail, setNewAdminEmail] = useState('');

  const { data: mosque, isLoading } = useQuery<any>({
    queryKey: ['mosque', id],
    queryFn: () => api.get(`/mosques/${id}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    values: mosque || {},
  });

  const updateMosqueMutation = useMutation({
    mutationFn: (data: any) => api.put(`/mosques/${id}`, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['mosque', id], res.data);
      setIsEditing(false);
    },
  });

  const deleteMosqueMutation = useMutation({
    mutationFn: () => api.delete(`/mosques/${id}`),
    onSuccess: () => {
      navigate('/my-organizations');
    },
  });

  // When mosque data loads, initialise prayer times
  useEffect(() => {
    if (mosque?.prayer_times) {
      setPrayerTimes(mosque.prayer_times);
    }
  }, [mosque]);

  const updateTimesMutation = useMutation({
    mutationFn: (data: any) => api.put(`/mosques/${id}/prayer-times`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mosque', id] });
      alert('Prayer times updated successfully!');
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: (email: string) => api.post(`/mosques/${id}/admins`, { email }),
    onSuccess: () => {
      setNewAdminEmail('');
      queryClient.invalidateQueries({ queryKey: ['mosque', id, 'admins'] });
      toast.success('Admin added!');
    },
  });

  // --- NEW: Mosque Admins List ---
  const { data: mosqueAdmins, isLoading: adminsLoading } = useQuery({
    queryKey: ['mosque', id, 'admins'],
    queryFn: () => api.get(`/mosques/${id}/admins`).then(r => r.data),
    enabled: activeTab === 'admins',
  });

  const removeAdminMutation = useMutation({
    mutationFn: (adminId: string) => api.delete(`/mosques/${id}/admins/${adminId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mosque', id, 'admins'] });
      toast.success('Admin removed.');
    },
  });

  // --- NEW: Prayer Subscribers ---
  const { data: subscribers, isLoading: subsLoading } = useQuery({
    queryKey: ['mosque', id, 'subscribers'],
    queryFn: () => api.get(`/mosques/${id}/subscribers`).then(r => r.data),
    enabled: showSubscribers,
  });

  if (isLoading) {
    return <div className="text-center py-20 text-surface-500">Loading manager...</div>;
  }

  if (!mosque) {
    return <div className="text-center py-20 text-red-500">Mosque not found.</div>;
  }

  const onSubmitMosque = (data: any) => {
    updateMosqueMutation.mutate(data);
  };

  const handleDeleteMosque = () => {
    if (window.confirm("Are you sure you want to delete this mosque? This action cannot be undone.")) {
      deleteMosqueMutation.mutate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen pb-20 pt-4 px-4 sm:px-0">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/my-organizations')}
          className="p-2 hover:bg-surface-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-surface-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Manage Mosque</h1>
          <p className="text-surface-500 text-sm">{mosque.name}</p>
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
        <OrganizationEventsTab organizationId={id as string} organizationType="mosque" />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-surface-900">Mosque Details</h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => { reset(mosque); setIsEditing(true); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmitMosque)} className="space-y-4">
                <Input label="Name" {...register('name')} />
                <Input label="Imam Name" {...register('imam_name')} />
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
                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_women_facilities')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Women Facilities</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_parking')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Parking</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('has_children_facilities')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Children Facilities</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('is_wheelchair_accessible')} className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Wheelchair Accessible</span>
                  </label>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button type="submit" loading={isSubmitting}>Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-surface-500 block mb-1">Imam Name</span>
                  <span className="font-medium">{mosque.imam_name || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Email</span>
                  <span className="font-medium">{mosque.email || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Phone</span>
                  <span className="font-medium">{mosque.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-surface-500 block mb-1">Website</span>
                  <span className="font-medium">{mosque.website || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-surface-500 block mb-1">Location</span>
                  <span className="font-medium">{[mosque.address, mosque.city, mosque.country].filter(Boolean).join(', ')}</span>
                </div>
                <div className="col-span-2 flex gap-4 mt-2">
                  {mosque.has_women_facilities && <Badge variant="default">Women Facilities</Badge>}
                  {mosque.has_parking && <Badge variant="default">Parking</Badge>}
                  {mosque.has_children_facilities && <Badge variant="default">Children Facilities</Badge>}
                  {mosque.is_wheelchair_accessible && <Badge variant="default">Wheelchair Accessible</Badge>}
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
                    Permanently delete this mosque. This action cannot be undone.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteMosque} loading={deleteMosqueMutation.isPending}>
                    Delete Mosque
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'prayer' && (
        <div className="space-y-6">
        {/* Prayer Times Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold">Update Prayer Times</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummahh'].map((prayer) => (
              <div key={prayer}>
                <label className="block text-sm font-medium mb-1 capitalize text-surface-700">{prayer}</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-2 border rounded-xl bg-surface-50"
                  value={prayerTimes[prayer as keyof typeof prayerTimes] || ''}
                  onChange={e => setPrayerTimes({ ...prayerTimes, [prayer]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => updateTimesMutation.mutate(prayerTimes)}
              disabled={updateTimesMutation.isPending}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Times
            </button>
          </div>
        </Card>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" /> Mosque Administrators
            </h3>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Admin email address" value={newAdminEmail} onChange={(e: any) => setNewAdminEmail(e.target.value)} className="flex-1" />
              <Button onClick={() => addAdminMutation.mutate(newAdminEmail)} disabled={!newAdminEmail} loading={addAdminMutation.isPending}>
                <Plus className="w-4 h-4 mr-1" /> Add Admin
              </Button>
            </div>
            {adminsLoading ? (
              <div className="text-center py-8 text-surface-400 animate-pulse">Loading admins...</div>
            ) : mosqueAdmins?.items?.length > 0 ? (
              <div className="space-y-3">
                {mosqueAdmins.items.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">{admin.name || admin.email}</p>
                      <p className="text-xs text-surface-500">{admin.email}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                      if (window.confirm(`Remove ${admin.name || admin.email} as admin?`)) {
                        removeAdminMutation.mutate(admin.id);
                      }
                    }}>
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface-50 rounded-2xl text-surface-500 text-sm">
                <Shield className="w-10 h-10 mx-auto mb-2 text-surface-300" />
                No admins assigned yet.
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" /> Prayer Alert Subscribers
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowSubscribers(!showSubscribers)}>
                {showSubscribers ? 'Hide' : 'Show'} Roster
              </Button>
            </div>
            {showSubscribers && (
              subsLoading ? (
                <div className="text-center py-6 animate-pulse text-surface-400">Loading subscribers...</div>
              ) : subscribers?.items?.length > 0 ? (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {subscribers.items.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                        {(sub.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{sub.name || 'Anonymous'}</p>
                        <p className="text-xs text-surface-500">{sub.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                  No subscribers yet.
                </div>
              )
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
