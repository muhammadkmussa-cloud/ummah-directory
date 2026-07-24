import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, Search, Star, CheckCircle2, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api-client';
import type { Business } from '@/types';

export default function RightSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: trendingData, isLoading } = useQuery({
    queryKey: ['trending', 'businesses'],
    queryFn: () => api.get('/businesses', { params: { size: 4, sort: 'rating' } }).then(r => r.data),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const businesses: Business[] = trendingData?.items || [];

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 border-l border-surface-200 bg-surface-50/50 pt-6 pb-8 px-6 overflow-y-auto">
      
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-8 relative">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search.placeholder', 'Search directory...')} 
          className="w-full bg-white border border-surface-200 rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-surface-400 shadow-sm"
        />
        <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-3.5" />
      </form>

      {/* Trending Section */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-surface-900 mb-4 px-1 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            Trending Near You
          </span>
          <Link to="/search" className="text-xs font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </h3>

        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-2 rounded-xl bg-white/60">
                <div className="w-11 h-11 bg-surface-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-surface-200 rounded w-3/4" />
                  <div className="h-3 bg-surface-200 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : businesses.length > 0 ? (
            businesses.map((biz) => (
              <div 
                key={biz.id} 
                onClick={() => navigate(`/businesses/${biz.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-surface-100 transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-primary-50 border border-surface-200 flex-shrink-0 flex items-center justify-center">
                  {biz.logo_url || biz.cover_image_url ? (
                    <img 
                      src={biz.logo_url || biz.cover_image_url} 
                      alt={biz.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-surface-900 truncate group-hover:text-primary-600 transition-colors">
                      {biz.name}
                    </p>
                    {biz.is_verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {biz.avg_rating ? biz.avg_rating.toFixed(1) : 'New'}
                    </span>
                    <span>•</span>
                    <span className="truncate">{biz.city || 'Nairobi'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-surface-400 px-2">No trending businesses available.</p>
          )}
        </div>
      </div>

      {/* Community Section */}
      <div className="mb-8 bg-gradient-to-br from-primary-900 to-primary-800 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Community Updates
        </h3>
        <p className="text-xs text-primary-100 mb-4 leading-relaxed">
          Join the local volunteer group for the upcoming Annual Community Iftar & Lecture.
        </p>
        <button 
          onClick={() => navigate('/events')}
          className="w-full py-2.5 bg-white text-primary-900 hover:bg-primary-50 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          Explore Events
        </button>
      </div>

      {/* Footer Links */}
      <div className="px-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-surface-400">
        <Link to="/privacy" className="hover:text-surface-600 transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-surface-600 transition-colors">Terms</Link>
        <Link to="/cookies" className="hover:text-surface-600 transition-colors">Cookies</Link>
        <span>© 2026 ummah Directory</span>
      </div>
    </aside>
  );
}
