import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronRight } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, SkeletonList } from '@/components/ui'

export default function BlogListPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => api.get('/cms/blog').then(r => r.data),
  })

  if (isLoading) return <SkeletonList count={3} />

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      {!data?.length ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No blog posts yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((post: any) => (
            <Card
              key={post.id}
              hover
              onClick={() => navigate(`/blog/${post.slug}`)}
              className="flex flex-col sm:flex-row gap-6 p-6"
            >
              {post.cover_image_url && (
                <div className="sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  {post.published_at && (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                    Read more <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
