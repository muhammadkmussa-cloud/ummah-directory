import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, MoreHorizontal } from 'lucide-react';
import Card from './Card';
import Badge from './Badge';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import api from '@/lib/api-client';

interface FeedCardProps {
  type?: 'business' | 'mosque' | 'charity' | 'event' | 'education';
  resourceId?: string;
  organizationId?: string;
  title: string;
  subtitle?: string;
  image: string;
  logo?: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isPremier?: boolean;
  tags?: string[];
  actionButtons?: ReactNode;
  onClick?: () => void;
  isAd?: boolean;
  adId?: string;
}

export default function FeedCard({
  type,
  resourceId,
  organizationId,
  title,
  subtitle,
  image,
  logo,
  distance,
  rating,
  reviewCount,
  isVerified,
  isPremier,
  tags,
  actionButtons,
  onClick,
  isAd,
  adId,
}: FeedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    if (!isAd || !adId || hasTrackedImpression || !cardRef.current) return;

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Element is at least 50% visible, start 1s timer
          timer = setTimeout(() => {
            api.post(`/campaigns/${adId}/impression`).catch(console.error);
            setHasTrackedImpression(true);
            observer.disconnect();
          }, 1000);
        } else {
          // Element is no longer 50% visible, clear timer
          if (timer) clearTimeout(timer);
        }
      },
      {
        threshold: [0.5], // Trigger when crossing 50% visibility
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [isAd, adId, hasTrackedImpression]);

  const handleCardClick = () => {
    if (isAd && adId) {
      api.post(`/campaigns/${adId}/click`).catch(console.error);
    }
    onClick?.();
  };

  return (
    <div ref={cardRef}>
      <Card hover onClick={handleCardClick} className="p-0 overflow-hidden flex flex-col mb-6 bg-white">
        {/* Cover Image */}
      <div className="relative h-48 sm:h-56 w-full bg-surface-200 group overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isPremier && (
            <Badge variant="warning" className="bg-amber-400 text-amber-900 border-none shadow-md backdrop-blur-md">
              Premier
            </Badge>
          )}
          <Badge variant="primary" className="bg-white/90 text-surface-900 shadow-sm backdrop-blur-md capitalize">
            {type}
          </Badge>
        </div>
        
        {/* Distance Badge */}
        {distance && (
          <div className="absolute bottom-4 left-4 glass px-3 py-1.5 rounded-full text-xs font-semibold text-surface-900 flex items-center gap-1 shadow-sm">
            <MapPin className="w-3 h-3 text-primary-600" />
            {distance}
          </div>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <FavoriteButton 
            organizationId={organizationId || resourceId || ''}
            className="glass shadow-sm hover:bg-white/80" 
          />
          <button className="p-2 glass rounded-full text-surface-700 hover:text-primary-600 transition-colors shadow-sm">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 relative">
        {/* Logo overlapping image */}
        {logo && (
          <div className="absolute -top-10 right-5 w-16 h-16 rounded-2xl bg-white p-1 shadow-md border border-surface-100 z-10">
            <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
        )}

        <div className="pr-16 mb-2">
          <h3 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            {title}
            {isVerified && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </h3>
          {subtitle && <p className="text-sm text-surface-500 mt-1">{subtitle}</p>}
        </div>

        {rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-surface-900">{rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="text-sm text-surface-500">({reviewCount} reviews)</span>
            )}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-surface-100 text-surface-600 rounded-lg text-xs font-medium">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2.5 py-1 bg-surface-100 text-surface-600 rounded-lg text-xs font-medium">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-surface-100">
          {actionButtons}
        </div>
      </div>
    </Card>
    </div>
  );
}
