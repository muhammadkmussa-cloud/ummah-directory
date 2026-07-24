import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button, Input } from '@/components/ui';

export default function AdsManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '',
    link_url: '',
    image_url: '',
    budget: 100,
    placement: 'homepage',
    target_audience: 'general'
  });

  const { data: ads, isLoading } = useQuery({
    queryKey: ['advertisements', 'me'],
    queryFn: () => api.get('/advertisements').then(r => r.data),
  });

  const createAd = useMutation({
    mutationFn: (data: any) => api.post('/advertisements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements', 'me'] });
      setIsCreating(false);
      setNewAd({
        title: '',
        link_url: '',
        image_url: '',
        budget: 100,
        placement: 'homepage',
        target_audience: 'general'
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAd.mutate(newAd);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary-600" />
            Ad Manager
          </h1>
          <p className="text-surface-500 mt-1">Create and manage your advertisements</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2">
          {isCreating ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'Create Ad'}
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 mb-8 border border-primary-200 bg-primary-50">
          <h2 className="text-xl font-bold text-surface-900 mb-4">New Advertisement</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Campaign Title</label>
                <Input
                  required
                  value={newAd.title}
                  onChange={e => setNewAd({...newAd, title: e.target.value})}
                  placeholder="e.g., Summer Sale 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Destination URL</label>
                <Input
                  required
                  type="url"
                  value={newAd.link_url}
                  onChange={e => setNewAd({...newAd, link_url: e.target.value})}
                  placeholder="https://yourwebsite.com/sale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Image URL</label>
                <Input
                  required
                  type="url"
                  value={newAd.image_url}
                  onChange={e => setNewAd({...newAd, image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Budget ($)</label>
                <Input
                  required
                  type="number"
                  min="50"
                  value={newAd.budget}
                  onChange={e => setNewAd({...newAd, budget: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Placement</label>
                <select
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  value={newAd.placement}
                  onChange={(e: any) => setNewAd({...newAd, placement: e.target.value})}
                >
                  <option value="homepage">Homepage Banner</option>
                  <option value="search">Search Results</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Target Audience</label>
                <select
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                  value={newAd.target_audience}
                  onChange={(e: any) => setNewAd({...newAd, target_audience: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="business">B2B</option>
                  <option value="local">Local Only</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createAd.isPending}>
                {createAd.isPending ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-surface-500">Loading ads...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!ads?.items || ads.items.length === 0) && !isCreating && (
            <div className="col-span-full py-12 text-center text-surface-500 bg-surface-50 rounded-2xl border border-dashed border-surface-200">
              <Megaphone className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p>You haven't created any advertisements yet.</p>
            </div>
          )}
          {ads?.items?.map((ad: any) => (
            <Card key={ad.id} className="p-0 overflow-hidden">
              <div className="h-40 bg-surface-100 relative">
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-300">
                    No Image
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={
                    ad.status === 'approved' ? 'success' : 
                    ad.status === 'rejected' ? 'error' : 'pending'
                  } className="shadow-sm">
                    {ad.status}
                  </Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-surface-900 mb-1 truncate">{ad.title}</h3>
                <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline block truncate mb-4">
                  {ad.link_url}
                </a>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-50 p-3 rounded-xl border border-surface-100">
                    <p className="text-xs text-surface-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget</p>
                    <p className="font-bold text-surface-900">${ad.budget}</p>
                  </div>
                  <div className="bg-surface-50 p-3 rounded-xl border border-surface-100">
                    <p className="text-xs text-surface-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Impressions</p>
                    <p className="font-bold text-surface-900">{ad.impressions || 0}</p>
                  </div>
                </div>

                <div className="text-xs text-surface-500 flex items-center justify-between border-t border-surface-100 pt-3">
                  <span className="capitalize">{ad.placement}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
