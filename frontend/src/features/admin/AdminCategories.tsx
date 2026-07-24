import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileBox, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Badge } from '@/components/ui';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', slug: '', parent_id: '', is_active: true });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data),
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => api.post('/admin/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setIsAdding(false);
      setFormData({ name: '', slug: '', parent_id: '', is_active: true });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setIsEditing(null);
      setFormData({ name: '', slug: '', parent_id: '', is_active: true });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      slug: formData.slug,
      is_active: formData.is_active,
    };
    if (formData.parent_id) {
      payload.parent_id = formData.parent_id;
    }

    if (isEditing) {
      updateCategory.mutate({ id: isEditing.id, data: payload });
    } else {
      createCategory.mutate(payload);
    }
  };

  const handleEdit = (cat: any) => {
    setIsEditing(cat);
    setIsAdding(false);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || '',
      is_active: cat.is_active ?? true,
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData({ name: '', slug: '', parent_id: '', is_active: true });
  };

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading categories...</div>;

  return (
    <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileBox className="w-5 h-5 text-primary-600" />
            Categories Management
          </h2>
          <p className="text-sm text-surface-500 mt-1">Manage global categories used across the platform.</p>
        </div>
        {!isAdding && !isEditing && (
          <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        )}
      </div>

      {(isAdding || isEditing) && (
        <div className="p-6 bg-surface-50 border-b border-surface-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-surface-900">{isEditing ? 'Edit Category' : 'Create New Category'}</h3>
            <button onClick={cancelEdit} className="text-surface-400 hover:text-surface-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
                <input
                  required
                  type="text"
                  className="w-full border-surface-200 rounded-xl bg-white"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Slug *</label>
                <input
                  required
                  type="text"
                  className="w-full border-surface-200 rounded-xl bg-white"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Parent Category</label>
                <select
                  className="w-full border-surface-200 rounded-xl bg-white"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {categories?.filter((c: any) => c.id !== isEditing?.id).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-surface-700">Is Active</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {isEditing ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-surface-100">
        {(!categories || categories.length === 0) && !isAdding && (
          <p className="p-8 text-surface-500 text-center">No categories found. Create one above.</p>
        )}
        
        {categories?.map((cat: any) => (
          <div key={cat.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-surface-900">{cat.name}</h3>
                {!cat.is_active && <Badge variant="error" className="text-[10px]">Inactive</Badge>}
              </div>
              <p className="text-sm text-surface-500 font-mono text-xs mb-1">/{cat.slug}</p>
              {cat.parent_id && (
                <p className="text-xs text-surface-400">
                  Child of: {categories.find((c: any) => c.id === cat.parent_id)?.name || 'Unknown'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(cat)} className="flex items-center gap-1">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete '${cat.name}'?`)) {
                    deleteCategory.mutate(cat.id);
                  }
                }}
                disabled={deleteCategory.isPending}
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
