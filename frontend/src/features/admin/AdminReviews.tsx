import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Trash2, CheckCircle, Star } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button } from '@/components/ui';

export default function AdminReviews() {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', 'all'],
    queryFn: () => api.get('/admin/reviews').then(r => r.data),
  });

  const removeReview = useMutation({
    mutationFn: (id: string) => api.post(`/admin/reviews/${id}/remove`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });

  const restoreReview = useMutation({
    mutationFn: (id: string) => api.post(`/admin/reviews/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading reviews...</div>;

  return (
    <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary-600" />
          All Reviews
        </h2>
        <p className="text-sm text-surface-500 mt-1">Manage all user reviews and suspend/restore flagged content.</p>
      </div>

      <div className="divide-y divide-surface-100">
        {(!reviews || reviews.length === 0) && (
          <p className="p-8 text-surface-500 text-center">No reviews found.</p>
        )}
        
        {reviews?.map((review: any) => (
          <div key={review.id} className="p-6 flex items-start justify-between hover:bg-surface-50/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold text-surface-900">{review.rating}</span>
                </div>
                {review.status === 'removed' ? (
                  <Badge variant="error" className="text-[10px]">Removed</Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">Published</Badge>
                )}
              </div>
              <p className="text-sm text-surface-700 bg-surface-100 p-3 rounded-lg border border-surface-200">
                "{review.comment}"
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {review.status !== 'removed' ? (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => removeReview.mutate(review.id)}
                  disabled={removeReview.isPending}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => restoreReview.mutate(review.id)}
                  disabled={restoreReview.isPending}
                  className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4" /> Restore
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
