import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Search, X } from 'lucide-react';
import api from '@/lib/api-client';
import FeedCard from '@/components/ui/FeedCard';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['favorites', search],
    queryFn: () => api.get('/favorites', { params: { page: 1, size: 50, q: search || undefined } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const favorites = (data as any)?.items || [];

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 pt-4 px-4 sm:px-0">
      <div className="mb-6 px-2">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary-600 fill-primary-600" />
          Your Favorites
        </h1>
        <p className="text-surface-500 mt-1">Saved businesses, mosques, and charities</p>
      </div>

      <div className="relative mb-4 px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search favorites..."
          className="w-full pl-12 pr-10 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-surface-900"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-surface-400 hover:text-surface-600" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-surface-500 text-center bg-white rounded-3xl border border-surface-100 shadow-sm mx-2">
          <Heart className="w-12 h-12 mb-4 text-surface-300" />
          <h3 className="text-lg font-bold text-surface-900 mb-2">
            {search ? 'No matching favorites' : 'No favorites yet'}
          </h3>
          <p className="max-w-xs mx-auto">
            {search ? 'Try a different search term.' : 'Tap the heart icon on any listing to save it here for quick access.'}
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            Explore
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav: any) => (
            <FeedCard
              key={fav.id}
              type={fav.organization_type}
              resourceId={fav.organization_id}
              organizationId={fav.organization_id}
              title={fav.organization_name}
              subtitle={fav.city || ''}
              image={fav.cover_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
              logo={fav.logo_url}
              onClick={() => navigate(`/${fav.organization_type}s/${fav.organization_slug}`)}
              actionButtons={
                <button onClick={() => navigate(`/${fav.organization_type}s/${fav.organization_slug}`)} className="w-full py-2 bg-surface-100 hover:bg-surface-200 text-surface-900 rounded-xl text-sm font-bold transition-colors">
                  View Details
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
