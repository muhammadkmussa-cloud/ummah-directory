import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserCheck } from 'lucide-react';
import api from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  organizationId: string;
  className?: string;
  showCount?: boolean;
}

/**
 * Follow / unfollow an organization (workflows.md #23).
 * Uses GET /follows/{id}/status for state and POST/DELETE /follows/{id} to toggle.
 */
export function FollowButton({ organizationId, className, showCount = true }: FollowButtonProps) {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['follow-status', organizationId],
    queryFn: () => api.get(`/follows/${organizationId}/status`).then(r => r.data),
    retry: false,
  });

  const isFollowing = Boolean(data?.is_following);
  const followerCount: number | undefined = data?.follower_count;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    if (toggling) return;
    setToggling(true);
    try {
      if (isFollowing) {
        await api.delete(`/follows/${organizationId}`);
      } else {
        await api.post(`/follows/${organizationId}`);
      }
      await queryClient.invalidateQueries({ queryKey: ['follow-status', organizationId] });
      await queryClient.invalidateQueries({ queryKey: ['follow-feed'] });
    } catch (err) {
      console.error('Failed to toggle follow', err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading || toggling}
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-primary-600 text-white hover:bg-primary-700',
        className,
      )}
    >
      {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? 'Following' : 'Follow'}
      {showCount && typeof followerCount === 'number' && (
        <span className="ml-1 text-xs font-normal opacity-75">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </button>
  );
}
