import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle, Compass } from 'lucide-react'
import api from '@/lib/api-client'
import FeedCard from '@/components/ui/FeedCard'
import AnimatedTabs from '@/components/ui/AnimatedTabs'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Business } from '@/types'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('For You')

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const isAuthenticated = !!user

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['feed', 'businesses'],
    queryFn: () => api.get('/businesses', { params: { size: 10, sort: 'rating' } }).then(r => r.data),
    enabled: activeTab === 'For You' || activeTab === 'Nearby',
  })

  const { data: adsData } = useQuery({
    queryKey: ['feed', 'ads'],
    queryFn: () => api.get('/ads/feed', { params: { size: 5 } }).then(r => r.data),
    enabled: activeTab === 'For You',
  })

  const { data: cmsBanners } = useQuery({
    queryKey: ['cms', 'banners'],
    queryFn: () => api.get('/cms/banners').then(r => r.data),
  })

  const { data: favoritesFeed, isLoading: isFavoritesLoading } = useQuery({
    queryKey: ['feed', 'favorites'],
    queryFn: () => api.get('/favorites/feed', { params: { page: 1, size: 20 } }).then(r => r.data),
    enabled: activeTab === 'Favorites' && isAuthenticated,
  })

  const tabs = isAuthenticated
    ? ['For You', 'Favorites', 'Nearby']
    : ['For You', 'Nearby']

  const handleTabChange = (tab: string) => {
    if (!isAuthenticated && tab === 'Favorites') {
      navigate('/login')
      return
    }
    setActiveTab(tab)
  }

  // Quick Links at the top like Instagram Stories
  const quickLinks = [
    { label: 'Mosques', icon: '🕌', link: '/mosques' },
    { label: 'Charities', icon: '❤️', link: '/charities' },
    { label: 'Events', icon: '📅', link: '/events' },
    { label: 'Halal Food', icon: '🍔', link: '/businesses?category=food' },
    { label: 'Education', icon: '📚', link: '/education' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 overflow-x-hidden">
      {/* Top Header Mobile */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-100 md:hidden flex items-center justify-between px-4 h-14">
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">ummah Directory</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/my-organizations')} className="text-surface-900">
            <PlusCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* CMS Promotional Banners Carousel */}
      {cmsBanners && cmsBanners.length > 0 && (
        <div className="py-2 px-3 md:px-0 mb-2">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x py-1">
            {cmsBanners.map((banner: any, idx: number) => (
              <div 
                key={banner.id || idx}
                onClick={() => {
                  const url = banner.link_url || banner.target_url;
                  if (url) navigate(url);
                }}
                className="snap-center shrink-0 w-[85%] md:w-[90%] h-36 rounded-2xl overflow-hidden relative shadow-md cursor-pointer group bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
              >
                {banner.image_url && (
                  <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
                )}
                <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <h3 className="font-bold text-base sm:text-lg leading-tight">{banner.title}</h3>
                  {banner.subtitle && <p className="text-xs text-surface-200 mt-1 line-clamp-1">{banner.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories / Quick Links Horizontal Scroll */}
      <div className="py-3 border-b border-surface-100 mb-2 w-full overflow-hidden">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar px-3 py-1 scroll-smooth">
          {quickLinks.map((link, idx) => (
            <button
              key={idx}
              onClick={() => navigate(link.link)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group min-w-[62px]"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-full bg-white border-2 border-white flex items-center justify-center text-xl sm:text-2xl group-hover:bg-surface-50 transition-colors">
                  {link.icon}
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-surface-700 truncate max-w-[68px] text-center">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="sticky top-14 md:top-0 z-30 bg-white/95 backdrop-blur-md pt-1 mb-4">
        <AnimatedTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={handleTabChange} 
        />
      </div>

      {/* Feed Content */}
      <div className="px-3 sm:px-4 space-y-5">
        {activeTab === 'For You' && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-sm">Loading your feed...</p>
            </div>
          ) : businesses?.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-500 text-center px-4">
              <Compass className="w-12 h-12 mb-4 text-surface-300" />
              <h3 className="text-lg font-bold text-surface-900 mb-2">Nothing to see here</h3>
              <p className="text-sm">Explore the directory to find businesses and organizations near you.</p>
            </div>
          ) : (
            (() => {
              const items = businesses?.items || [];
              const ads = adsData?.items || [];
              const feed = [];
              let adIndex = 0;

              for (let i = 0; i < items.length; i++) {
                const business = items[i];
                feed.push(
                  <FeedCard
                    key={`biz-${business.id}`}
                    type="business"
                    resourceId={business.id}
                    organizationId={business.id}
                    title={business.name}
                    subtitle={business.description?.substring(0, 80) + '...'}
                    image={business.cover_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
                    logo={business.logo_url}
                    distance={business.city}
                    rating={business.avg_rating}
                    reviewCount={business.review_count}
                    isVerified={business.is_verified}
                    isPremier={business.is_premier}
                    tags={['Halal', 'Local']}
                    onClick={() => navigate(`/businesses/${business.slug}`)}
                    actionButtons={
                      <>
                        <button className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 text-surface-900 rounded-xl text-xs sm:text-sm font-bold transition-colors">
                          View Details
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/businesses/${business.slug}`); }} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm">
                          Contact
                        </button>
                      </>
                    }
                  />
                );

                if ((i + 1) % 3 === 0 && adIndex < ads.length) {
                  const ad = ads[adIndex++];
                  feed.push(
                    <FeedCard
                      key={`ad-${ad.id}`}
                      isAd={true}
                      adId={ad.id}
                      type={ad.organization_type || 'business'}
                      resourceId={ad.organization_id}
                      organizationId={ad.organization_id}
                      title={ad.title}
                      subtitle={ad.subtitle || ad.description}
                      image={ad.image_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800'}
                      tags={['Sponsored']}
                      onClick={() => {
                        if (ad.target_url) window.open(ad.target_url, '_blank');
                      }}
                      actionButtons={
                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm">
                          Learn More
                        </button>
                      }
                    />
                  );
                }
              }

              return feed;
            })()
          )
        )}

        {activeTab === 'Nearby' && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-sm">Finding nearby organizations...</p>
            </div>
          ) : (
            businesses?.items?.map((business: Business) => (
              <FeedCard
                key={`nearby-${business.id}`}
                type="business"
                resourceId={business.id}
                organizationId={business.id}
                title={business.name}
                subtitle={business.address}
                image={business.cover_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
                logo={business.logo_url}
                distance={business.city}
                rating={business.avg_rating}
                reviewCount={business.review_count}
                isVerified={business.is_verified}
                isPremier={business.is_premier}
                onClick={() => navigate(`/businesses/${business.slug}`)}
                actionButtons={
                  <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm">
                    View Profile
                  </button>
                }
              />
            ))
          )
        )}

        {activeTab === 'Favorites' && (
          isFavoritesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-sm">Loading your favorites...</p>
            </div>
          ) : favoritesFeed?.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-500 text-center px-4">
              <Compass className="w-12 h-12 mb-4 text-surface-300" />
              <h3 className="text-lg font-bold text-surface-900 mb-2">No Favorites Saved</h3>
              <p className="text-sm">Favorite businesses and organizations to see their updates here.</p>
            </div>
          ) : (
            favoritesFeed?.items?.map((item: any) => (
              <FeedCard
                key={`fav-${item.id}`}
                type={item.organization_type}
                resourceId={item.organization_id}
                organizationId={item.organization_id}
                title={item.name}
                subtitle={item.description}
                image={item.cover_image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
                logo={item.logo_url}
                onClick={() => navigate(`/${item.organization_type}s/${item.slug}`)}
                actionButtons={
                  <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm">
                    View Listing
                  </button>
                }
              />
            ))
          )
        )}
      </div>
    </div>
  )
}
