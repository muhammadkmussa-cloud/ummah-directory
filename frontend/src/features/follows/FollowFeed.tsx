import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import api from '@/lib/api-client';
import { Card } from '@/components/ui';

interface FeedPost {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  author_name: string;
  content: string;
  image_url?: string | null;
  like_count: number;
  created_at: string;
}

/**
 * Home Feed (workflows.md #23): posts from organizations the current user follows.
 */
export default function FollowFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-feed'],
    queryFn: () => api.get('/follows/feed').then(r => r.data),
  });

  const posts: FeedPost[] = data?.items ?? [];

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading feed...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your feed is empty</h2>
        <p className="text-gray-500 mb-6">
          Follow organizations to see their latest posts here.
        </p>
        <Link to="/explore" className="btn-primary inline-block">
          Explore organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Following Feed</h1>
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <h3 className="text-sm font-semibold text-gray-900">{post.organization_name}</h3>
          <p className="mt-1 text-xs text-gray-400">
            by {post.author_name} · {new Date(post.created_at).toLocaleString()}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-gray-800">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="mt-3 rounded-lg max-h-96 w-full object-cover"
            />
          )}
        </Card>
      ))}
    </div>
  );
}
