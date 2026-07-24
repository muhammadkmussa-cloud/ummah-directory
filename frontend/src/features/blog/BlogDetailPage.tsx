import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar } from 'lucide-react'
import api from '@/lib/api-client'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get(`/cms/blog/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <Link to="/blog" className="text-primary-600 hover:underline">Back to Blog</Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/blog" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>

      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {post.published_at && (
        <div className="flex items-center gap-1 text-gray-400 text-sm mb-8">
          <Calendar className="w-4 h-4" />
          {new Date(post.published_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>
      )}

      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full h-64 object-cover rounded-lg mb-8"
        />
      )}

      <div className="prose max-w-none text-gray-700 leading-relaxed">
        {(post.content || '').split('\n').map((line: string, i: number) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-2">{line.slice(3)}</h2>
          if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-600">{line.slice(2)}</li>
          if (line.trim() === '') return <br key={i} />
          return <p key={i} className="mb-2">{line}</p>
        })}
      </div>
    </article>
  )
}
