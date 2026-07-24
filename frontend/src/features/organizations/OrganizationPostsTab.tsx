import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Send, Image as ImageIcon, Trash2, MessageSquare, ShieldCheck } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'

interface OrganizationPostsTabProps {
  organizationId: string
  organizationName: string
  isOwnerOrAdmin?: boolean
}

export default function OrganizationPostsTab({ organizationId, organizationName, isOwnerOrAdmin = false }: OrganizationPostsTabProps) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['org-posts', organizationId],
    queryFn: () => api.get(`/organizations/${organizationId}/posts`).then(r => r.data),
  })

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (newPost: { content: string; image_url?: string }) =>
      api.post(`/organizations/${organizationId}/posts`, newPost).then(r => r.data),
    onSuccess: () => {
      setContent('')
      setImageUrl('')
      setShowImageInput(false)
      queryClient.invalidateQueries({ queryKey: ['org-posts', organizationId] })
    },
  })

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/like`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-posts', organizationId] })
    },
  })

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/posts/${postId}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-posts', organizationId] })
    },
  })

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    createPostMutation.mutate({ content: content.trim(), image_url: imageUrl.trim() || undefined })
  }

  return (
    <div className="space-y-6">
      {/* Create Post Form (For Owners & Admins) */}
      {isOwnerOrAdmin && (
        <Card className="p-4 border border-emerald-100 shadow-sm bg-gradient-to-r from-emerald-50/30 to-white">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Publish Official Update as {organizationName}
              </span>
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share an update, announcement, event news, or deal with the community..."
              className="w-full p-3 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[90px] resize-none"
            />

            {showImageInput && (
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (optional)..."
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>{showImageInput ? 'Remove Image' : 'Attach Image URL'}</span>
              </button>

              <Button
                type="submit"
                disabled={!content.trim() || createPostMutation.isPending}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{createPostMutation.isPending ? 'Publishing…' : 'Publish Post'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading posts & updates…</div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No posts or updates shared yet</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for official announcements and news from {organizationName}.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id} className="p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                    {organizationName[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{organizationName}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Posted by {post.author_name} • {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <button
                    onClick={() => deletePostMutation.mutate(post.id)}
                    className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line mb-3">
                {post.content}
              </p>

              {post.image_url && (
                <div className="mb-3.5 rounded-2xl overflow-hidden border border-slate-100 max-h-80">
                  <img src={post.image_url} alt="Post media" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Interactive Like Action */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (!user) {
                      alert('Please log in to like posts.')
                      return
                    }
                    toggleLikeMutation.mutate(post.id)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    post.is_liked_by_me
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked_by_me ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  <span>{post.like_count} {post.like_count === 1 ? 'Like' : 'Likes'}</span>
                </button>

                <span className="text-[11px] text-slate-400">Community Post</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
