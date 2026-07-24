import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MessageSquare, Star, Reply } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Badge } from '@/components/ui';

interface Props {
  businessId: string;
}

export default function ReviewsManagerTab({ businessId }: Props) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: () => api.get(`/reviews/business/${businessId}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string, content: string }) => 
      api.post(`/reviews/${reviewId}/reply`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', businessId] });
      setReplyingTo(null);
      reset();
    },
  });

  const onSubmitReply = (reviewId: string, data: any) => {
    replyMutation.mutate({ reviewId, content: data.content });
  };

  if (isLoading) {
    return <div className="text-center py-10 text-surface-500">Loading reviews...</div>;
  }

  const reviews = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Customer Reviews
        </h2>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-surface-500 bg-surface-50 rounded-xl border border-dashed border-surface-200">
            No reviews yet. Encourage your customers to leave a review!
          </div>
        ) : (
          reviews.map((review: any) => (
            <Card key={review.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-surface-900">User {review.user_id.slice(0,6)}</span>
                    <span className="text-sm text-surface-400">•</span>
                    <span className="text-sm text-surface-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.is_edited && <span className="text-xs text-surface-400">(edited)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {review.status !== 'published' && (
                  <Badge variant="default">{review.status}</Badge>
                )}
              </div>
              
              <p className="text-surface-700 whitespace-pre-wrap">{review.comment}</p>

              <div className="mt-6">
                {review.reply ? (
                  <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="w-4 h-4 text-primary-600" />
                      <span className="font-semibold text-sm text-surface-900">Your Reply</span>
                      <span className="text-xs text-surface-500">{new Date(review.reply.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-surface-700 whitespace-pre-wrap">{review.reply.content}</p>
                  </div>
                ) : (
                  <div>
                    {replyingTo === review.id ? (
                      <form onSubmit={handleSubmit((data) => onSubmitReply(review.id, data))} className="mt-4 space-y-3">
                        <textarea
                          {...register('content', { required: true })}
                          placeholder="Write your response..."
                          rows={3}
                          className="input-field w-full min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)} type="button">
                            Cancel
                          </Button>
                          <Button size="sm" type="submit" loading={replyMutation.isPending && replyMutation.variables?.reviewId === review.id}>
                            Post Reply
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setReplyingTo(review.id)}>
                        <Reply className="w-4 h-4 mr-2" /> Reply to Review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
