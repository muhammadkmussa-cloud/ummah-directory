import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  organizationId: string;
  className?: string;
}

export function FavoriteButton({ organizationId, className }: FavoriteButtonProps) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkFavorite = async () => {
      try {
        const { data } = await api.get('/favorites');
        const items = data.items || data || [];
        const fav = items.find((f: any) => f.organization_id === organizationId);
        if (fav) {
          setIsFavorited(true);
          setFavoriteId(fav.id);
        }
      } catch (err) {
        console.error('Failed to check favorite status', err);
      }
    };

    checkFavorite();
  }, [user, organizationId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to add favorites.');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isFavorited && favoriteId) {
        await api.delete(`/favorites/${favoriteId}`);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        await api.post('/favorites', { organization_id: organizationId });
        setIsFavorited(true);
        const { data } = await api.get('/favorites');
        const items = data.items || data || [];
        const fav = items.find((f: any) => f.organization_id === organizationId);
        if (fav) setFavoriteId(fav.id);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full p-2 transition-colors",
        isFavorited ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100",
        className
      )}
    >
      <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
    </button>
  );
}
