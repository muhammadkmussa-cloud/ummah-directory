import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageCircle, Trash2, X } from 'lucide-react';
import api from '@/lib/api-client';
import BottomSheet from '@/components/ui/BottomSheet';
import { Button, StarRating } from '@/components/ui';
import ImageUploader from '@/components/ui/ImageUploader';
import { toast } from 'react-hot-toast';
import type { Review } from '@/types';

interface ReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationType?: 'business' | 'organization';
}

export function ReviewSheet({ isOpen, onClose, organizationId, organizationType = 'organization' }: ReviewSheetProps) {
  const queryClient = useQueryClient();

  const user = useQuery({ queryKey: ['user'], queryFn: () => api.get('/users/me').then(r => r.data) }).data;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', organizationId],
    queryFn: () => api.get(`/reviews/organization/${organizationId}`).then((r) => r.data),
    enabled: isOpen,
  });

  const myReview = user && reviews?.items?.find((r: Review) => r.user_id === user.id);

  useEffect(() => {
    if (isOpen && myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment || '');
      setImageUrls(myReview.image_urls || []);
      setIsEditing(true);
    } else {
      setRating(0);
      setComment('');
      setImageUrls([]);
      setIsEditing(false);
    }
  }, [isOpen, myReview]);

  const submitMutation = useMutation({
    mutationFn: (newReview: { rating: number; comment: string; image_urls: string[] }) => {
      if (isEditing) {
        return api.put(`/reviews/${myReview.id}`, newReview);
      }
      return api.post(`/reviews/organization/${organizationId}`, newReview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', organizationId] });
      toast.success(isEditing ? 'Review updated successfully' : 'Review posted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', organizationId] });
      toast.success('Review deleted successfully');
      setRating(0);
      setComment('');
      setImageUrls([]);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete review');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    submitMutation.mutate({ rating, comment, image_urls: imageUrls });
  };

  const handleDelete = (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
      deleteMutation.mutate(reviewId);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Reviews">
      <div className="flex flex-col h-full">
        {/* Write a review section */}
        <form onSubmit={handleSubmit} className="mb-6 bg-surface-50 p-4 rounded-2xl border border-surface-200">
          <h3 className="font-bold text-surface-900 mb-3 text-sm">{isEditing ? 'Edit Your Review' : 'Leave a Review'}</h3>
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={rating} size="lg" interactive onChange={setRating} />
            {rating > 0 && <span className="text-sm font-bold text-surface-900">{rating}/5</span>}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full bg-white border border-surface-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none mb-3"
          />

          {/* Image upload */}
          <div className="mb-3">
            <ImageUploader
              resourceType="general"
              onUploadSuccess={(data) => {
                setImageUrls((prev) => [...prev, data.url]);
                toast.success('Image added to review');
              }}
            />
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageUrls.map((url, idx) => (
                  <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-200">
                    <img src={url} alt={`Review image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => myReview && handleDelete(myReview.id)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitMutation.isPending || rating === 0}
            >
              {submitMutation.isPending ? 'Submitting...' : isEditing ? 'Update Review' : 'Post Review'}
            </Button>
          </div>
        </form>

        {/* List of reviews */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {isLoading ? (
            <div className="text-center py-4 text-surface-400">Loading reviews...</div>
          ) : reviews?.items?.length > 0 ? (
            reviews.items.map((review: Review) => (
              <div key={review.id} className="border-b border-surface-100 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-200 to-secondary-200 flex items-center justify-center font-bold text-surface-700 text-xs">
                      {(review.user_name || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 text-sm">{review.user_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                    </div>
                  </div>
                  {review.created_at && (
                    <span className="text-xs text-surface-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {review.comment && <p className="text-surface-700 mt-2 text-sm leading-relaxed">{review.comment}</p>}

                {/* Review images */}
                {review.image_urls && review.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {review.image_urls.map((url, idx) => (
                      <img key={url} src={url} alt={`Review photo ${idx + 1}`}
                        className="w-20 h-20 rounded-lg object-cover border border-surface-200"
                      />
                    ))}
                  </div>
                )}

                {review.reply && (
                  <div className="mt-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                    <p className="text-xs font-bold text-primary-600 mb-1">Response from Owner</p>
                    <p className="text-sm text-surface-700">{review.reply.content}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-surface-500">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p className="text-sm">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
