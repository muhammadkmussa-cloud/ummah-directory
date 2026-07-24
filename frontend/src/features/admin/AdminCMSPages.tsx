import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutTemplate, Plus, Edit2, Trash2, X, Bold, Italic, Link2, List, ListOrdered } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Badge } from '@/components/ui';

export default function AdminCMSPages() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', slug: '', content: '', is_published: true });

  const { data: cmsPages, isLoading } = useQuery({
    queryKey: ['admin', 'cms-pages'],
    queryFn: () => api.get('/admin/cms-pages').then(r => r.data),
  });

  const createPage = useMutation({
    mutationFn: (data: any) => api.post('/admin/cms-pages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms-pages'] });
      setIsAdding(false);
      setFormData({ title: '', slug: '', content: '', is_published: true });
    },
  });

  const updatePage = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/admin/cms-pages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms-pages'] });
      setIsEditing(null);
      setFormData({ title: '', slug: '', content: '', is_published: true });
    },
  });

  const deletePage = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/cms-pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms-pages'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      is_published: formData.is_published,
    };

    if (isEditing) {
      updatePage.mutate({ id: isEditing.id, data: payload });
    } else {
      createPage.mutate(payload);
    }
  };

  const handleEdit = (page: any) => {
    // We need to fetch full content since list API might not return it
    // Wait, the list API currently does not return content, so we should fetch it or just use it if it's there.
    // If content is not there, we'll refetch or we assume we can just edit the fields and update content.
    // Actually the list endpoint does not return content. Let's fetch it via another endpoint or just check if it's there.
    // Assuming backend /admin/cms-pages returns full page objects including content or we need to GET /cms-pages/{slug}
    
    // We'll fetch full content from public endpoint if needed, or if backend list returns it.
    api.get(`/cms/pages/${page.slug}`).then(r => {
      setIsEditing(page);
      setIsAdding(false);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: r.data.content || '',
        is_published: page.is_published ?? true,
      });
    }).catch(() => {
      setIsEditing(page);
      setIsAdding(false);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content || '',
        is_published: page.is_published ?? true,
      });
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ title: '', slug: '', content: '', is_published: true });
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('cms-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    setFormData({
      ...formData,
      content: `${before}${prefix}${selected || 'text'}${suffix}${after}`
    });
  };

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading CMS pages...</div>;

  return (
    <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary-600" />
            CMS Pages
          </h2>
          <p className="text-sm text-surface-500 mt-1">Manage static pages like About, Privacy Policy, Terms, etc.</p>
        </div>
        {!isAdding && !isEditing && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Page
          </Button>
        )}
      </div>

      {(isAdding || isEditing) && (
        <div className="p-6 bg-surface-50 border-b border-surface-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-surface-900">{isEditing ? 'Edit Page' : 'Create New Page'}</h3>
            <button onClick={cancelEdit} className="text-surface-400 hover:text-surface-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  className="w-full border-surface-200 rounded-xl bg-white"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">URL Slug *</label>
                <input
                  required
                  type="text"
                  className="w-full border-surface-200 rounded-xl bg-white"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., about-us"
                />
              </div>
            </div>

            {/* Simple Markdown Editor Toolbar */}
            <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-surface-100 border-b border-surface-200 p-2 flex gap-2">
                <button type="button" onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-surface-200 rounded text-surface-700" title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertFormat('_', '_')} className="p-1.5 hover:bg-surface-200 rounded text-surface-700" title="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-surface-300 mx-1 self-center"></div>
                <button type="button" onClick={() => insertFormat('[', '](https://)')} className="p-1.5 hover:bg-surface-200 rounded text-surface-700" title="Link">
                  <Link2 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-surface-300 mx-1 self-center"></div>
                <button type="button" onClick={() => insertFormat('\n- ')} className="p-1.5 hover:bg-surface-200 rounded text-surface-700" title="Bullet List">
                  <List className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertFormat('\n1. ')} className="p-1.5 hover:bg-surface-200 rounded text-surface-700" title="Numbered List">
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>
              <textarea
                id="cms-content"
                required
                rows={10}
                className="w-full border-0 focus:ring-0 resize-y p-4 bg-white"
                placeholder="Write your content here using Markdown or HTML..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="flex items-center mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span className="text-sm font-medium text-surface-700">Published</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
              <Button type="submit" disabled={createPage.isPending || updatePage.isPending}>
                {isEditing ? 'Save Changes' : 'Create Page'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-surface-100">
        {(!cmsPages || cmsPages.length === 0) && !isAdding && (
          <p className="p-8 text-surface-500 text-center">No CMS pages found. Create one above.</p>
        )}
        
        {cmsPages?.map((page: any) => (
          <div key={page.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-surface-900">{page.title}</h3>
                {!page.is_published ? (
                  <Badge variant="pending" className="text-[10px]">Draft</Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">Published</Badge>
                )}
              </div>
              <p className="text-sm text-surface-500 font-mono text-xs">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(page)} className="flex items-center gap-1">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete '${page.title}'?`)) {
                    deletePage.mutate(page.id);
                  }
                }}
                disabled={deletePage.isPending}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
