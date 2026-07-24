import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/lib/api-client';

interface MediaGalleryProps {
  organizationId: string;
}

export default function MediaGallery({ organizationId }: MediaGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', organizationId],
    queryFn: () => api.get(`/organizations/${organizationId}/media`, { params: { page: 1, size: 50 } }).then(r => r.data),
  });

  const images = (data?.items || []).filter((m: any) => m.file_type === 'image');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-surface-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading gallery...
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-400">
        <Image className="w-10 h-10 mb-2 text-surface-300" />
        <p className="text-sm">No images in gallery yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img: any, idx: number) => (
          <button
            key={img.id}
            onClick={() => setLightboxIdx(idx)}
            className="relative aspect-square rounded-xl overflow-hidden bg-surface-100 group"
          >
            <img
              src={img.thumbnail_url || img.file_url}
              alt={img.alt_text || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                className="absolute left-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                className="absolute right-4 p-2 text-white/80 hover:text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={images[lightboxIdx].file_url}
            alt={images[lightboxIdx].alt_text || ''}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
