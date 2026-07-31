import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Globe, ChevronLeft, Calendar, Shield, Flag, MessageSquare, Edit2 } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import OrganizationEditSheet from './OrganizationEditSheet';

export default function OrganizationProfileView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => api.get(`/organizations/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  })

  const [isEditing, setIsEditing] = useState(false)

  const claimMutation = useMutation({
    mutationFn: () => api.post(`/organizations/${org?.id}/claim`),
    onSuccess: () => toast.success('Claim submitted for review'),
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Claim failed'),
  })

  const isOwner = currentUser && org && currentUser.id === org.owner_id

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-48 bg-surface-200 rounded-2xl" />
        <div className="h-8 bg-surface-200 rounded-xl w-2/3" />
        <div className="h-4 bg-surface-100 rounded-xl w-1/2" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-surface-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900">Organization Not Found</h2>
        <Link to="/" className="mt-4 inline-block text-primary-600 hover:underline">Return Home</Link>
      </div>
    );
  }

  // Determine the type-specific detail page route
  const detailRoute = org.type === 'mosque' ? `/mosques/${org.slug}`
    : org.type === 'charity' ? `/charities/${org.slug}`
    : org.type === 'education' ? `/education/${org.slug}`
    : `/businesses/${org.slug}`;

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {/* Hero */}
      <div className="relative h-52 md:h-64 w-full bg-surface-200">
        {org.cover_image_url ? (
          <img src={org.cover_image_url} alt={org.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center">
            <Building2 className="w-20 h-20 text-white/30" />
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          {isOwner && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition"
              title="Edit organization"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Card */}
      <div className="max-w-4xl mx-auto px-0 md:px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-xl shadow-surface-200/50 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            {/* Org Logo + Name */}
            <div className="flex items-start gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-surface-900">{org.name}</h1>
                  {org.is_verified && <Badge variant="primary"><Shield className="w-3 h-3 mr-1" />Verified</Badge>}
                  <Badge variant="default" className="capitalize">{org.type || 'Organization'}</Badge>
                </div>
                {org.city && (
                  <p className="text-surface-500 text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {org.city}{org.country ? `, ${org.country}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {org.description && (
              <p className="text-surface-600 leading-relaxed whitespace-pre-line">{org.description}</p>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {org.phone && (
                <a href={`tel:${org.phone}`} className="flex items-center gap-3 p-4 bg-surface-50 rounded-2xl hover:bg-surface-100 transition-colors">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-surface-900">{org.phone}</span>
                </a>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-surface-50 rounded-2xl hover:bg-surface-100 transition-colors">
                  <Globe className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-surface-900 truncate">{org.website}</span>
                </a>
              )}
              {org.created_at && (
                <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-2xl">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-surface-900">Joined {new Date(org.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* View Full Profile */}
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => navigate(detailRoute)}>
                View Full Profile
              </Button>
              {currentUser && org.owner_id !== currentUser.id && (
                <Button
                  variant="outline"
                  onClick={() => claimMutation.mutate()}
                  loading={claimMutation.isPending}
                >
                  <Flag className="w-4 h-4 mr-2" /> Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrganizationEditSheet
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        organization={org}
        queryKey={['organization', slug]}
      />
    </div>
  );
}
