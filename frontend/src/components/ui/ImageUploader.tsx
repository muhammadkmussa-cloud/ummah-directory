import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api-client';

interface ImageUploaderProps {
  onUploadSuccess: (data: { id: string, url: string }) => void;
  resourceType?: 'business' | 'mosque' | 'charity' | 'education' | 'profile' | 'general' | 'verification';
  resourceId?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUploader({ 
  onUploadSuccess, 
  resourceType = 'general', 
  resourceId, 
  maxSizeMB = 10,
  className = '' 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resource_type', resourceType);
    if (resourceId) {
      formData.append('resource_id', resourceId);
    }

    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUploadSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {error && (
        <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {!preview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-surface-200 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors flex flex-col items-center justify-center gap-2 group relative"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Click to upload image</span>
              <span className="text-xs text-surface-400">JPG, PNG, WEBP (max {maxSizeMB}MB)</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-surface-200 bg-surface-100 flex items-center justify-center">
          {isUploading && (
            <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
              <span className="text-sm font-medium text-surface-800">Uploading...</span>
            </div>
          )}
          <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          {!isUploading && (
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm text-surface-600 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
    </div>
  );
}
