import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { X, Save } from 'lucide-react'
import api from '@/lib/api-client'
import { Button, Input } from '@/components/ui'
import { toast } from 'react-hot-toast'

interface OrgData {
  id: string
  name: string
  description?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  country?: string
  latitude?: number | null
  longitude?: number | null
  logo_url?: string | null
  cover_image_url?: string | null
}

interface OrganizationEditSheetProps {
  isOpen: boolean
  onClose: () => void
  organization: OrgData
  queryKey?: (string | undefined)[]
}

export default function OrganizationEditSheet({
  isOpen,
  onClose,
  organization,
  queryKey,
}: OrganizationEditSheetProps) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>()

  // Reset form when organization changes or sheet opens
  useEffect(() => {
    if (isOpen && organization) {
      reset({
        name: organization.name || '',
        description: organization.description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        country: organization.country || 'Kenya',
        latitude: organization.latitude ?? '',
        longitude: organization.longitude ?? '',
        logo_url: organization.logo_url || '',
        cover_image_url: organization.cover_image_url || '',
      })
      setServerError('')
    }
  }, [isOpen, organization, reset])

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/organizations/${organization.id}`, data),
    onSuccess: (res) => {
      // Refetch the relevant queries so detail pages update
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }
      queryClient.invalidateQueries({ queryKey: ['organization', organization.id] })
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] })
      toast.success('Organization updated successfully!')
      onClose()
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.detail || 'Failed to update organization')
    },
  })

  const onSubmit = (data: any) => {
    // Build payload: only send changed fields
    const payload: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      // Skip empty lat/lng
      if ((key === 'latitude' || key === 'longitude') && (value === '' || value === null || value === undefined)) {
        payload[key] = null
        continue
      }
      if (value !== '' && value !== null && value !== undefined) {
        payload[key] = value
      }
    }
    updateMutation.mutate(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-surface-900">Edit Organization</h2>
            <p className="text-sm text-surface-500 mt-0.5">{organization.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {serverError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100">
              {serverError}
            </div>
          )}

          <form id="org-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Basic Information</h3>
              <div className="space-y-4">
                <Input
                  label="Organization Name *"
                  {...register('name', { required: 'Name is required' })}
                  error={errors.name?.message as string}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Describe your organization..."
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Email" type="email" {...register('email')} placeholder="contact@example.com" />
                <Input label="Phone" type="tel" {...register('phone')} placeholder="+254 700 000 000" />
                <Input label="Website" type="url" {...register('website')} placeholder="https://example.com" className="md:col-span-2" />
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Location</h3>
              <div className="space-y-4">
                <Input label="Address" {...register('address')} placeholder="Street address" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="City" {...register('city')} placeholder="Nairobi" />
                  <Input label="Country" {...register('country')} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Latitude" type="number" step="any" {...register('latitude')} placeholder="-1.2921" />
                  <Input label="Longitude" type="number" step="any" {...register('longitude')} placeholder="36.8219" />
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div>
              <h3 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wider">Media</h3>
              <div className="space-y-4">
                <Input label="Logo URL" type="url" {...register('logo_url')} placeholder="https://example.com/logo.png" />
                <Input label="Cover Image URL" type="url" {...register('cover_image_url')} placeholder="https://example.com/cover.jpg" />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="org-edit-form"
            loading={isSubmitting || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
