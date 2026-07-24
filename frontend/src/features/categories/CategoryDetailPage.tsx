import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Folder, ArrowLeft, Tag, Building2, Sparkles } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button } from '@/components/ui';

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading } = useQuery({
    queryKey: ['categories', slug],
    queryFn: () => api.get(`/categories/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  const { data: spotlight } = useQuery({
    queryKey: ['ads', 'spotlight', category?.id],
    queryFn: () => api.get('/ads/spotlight', { params: { category_id: category.id } }).then(r => r.data),
    enabled: !!category?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-12 bg-surface-200 rounded-xl w-1/3" />
        <div className="h-48 bg-surface-100 rounded-2xl w-full" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Folder className="w-16 h-16 text-surface-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900">Category Not Found</h2>
        <Link to="/search" className="mt-4 inline-block text-primary-600 hover:underline">
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link to="/search" className="inline-flex items-center text-sm text-surface-500 hover:text-surface-900 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Search
      </Link>

      <div className="flex items-center justify-between bg-surface-50 p-6 rounded-2xl border border-surface-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xl">
            <Tag className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{category.name}</h1>
            {category.description && (
              <p className="text-surface-500 text-sm mt-1">{category.description}</p>
            )}
          </div>
        </div>
        <Badge variant="primary">{category.item_count || 0} Listings</Badge>
      </div>

      {/* Subcategories */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-surface-900 mb-3">Subcategories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {category.subcategories.map((sub: any) => (
              <Link key={sub.id} to={`/categories/${sub.slug}`}>
                <Card className="p-4 hover:border-primary-500 transition-colors flex items-center gap-3">
                  <Folder className="w-5 h-5 text-primary-500" />
                  <span className="font-semibold text-surface-900 text-sm">{sub.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category Spotlight */}
      {spotlight && (
        <Link to={spotlight.destination_url || `/org/${spotlight.organization_slug}`} className="block">
          <Card className="p-5 bg-gradient-to-r from-primary-600 to-primary-800 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-primary-200 uppercase tracking-wider mb-1">Sponsored</p>
                <h3 className="text-lg font-bold mb-1">{spotlight.headline}</h3>
                {spotlight.description && <p className="text-sm text-primary-100">{spotlight.description}</p>}
                <p className="text-xs text-primary-200 mt-2">{spotlight.organization_name}</p>
              </div>
              <Button variant="primary" className="bg-white text-primary-700 hover:bg-primary-50 border-none shrink-0">
                {spotlight.cta_type?.replace(/_/g, ' ') || 'Learn More'}
              </Button>
            </div>
          </Card>
        </Link>
      )}

      {/* Associated Businesses / Listings */}
      <div>
        <h3 className="text-lg font-bold text-surface-900 mb-3">Listings in this Category</h3>
        {!category.items || category.items.length === 0 ? (
          <div className="text-center py-12 bg-surface-50 rounded-2xl border border-surface-200 border-dashed">
            <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-2" />
            <p className="text-surface-500 text-sm">No businesses or organizations found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map((item: any) => (
              <Link key={item.id} to={`/businesses/${item.slug}`}>
                <Card className="p-5 hover:border-primary-500 transition-colors flex items-start gap-4">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-surface-900">{item.name}</h4>
                    <p className="text-xs text-surface-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
