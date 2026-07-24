import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Users, Mail, Trash2, CheckCircle, Shield, Settings, Save } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button, Input } from '@/components/ui'
import { toast } from 'react-hot-toast'

interface Manager {
  id: string
  user_id: string
  user_name: string
  user_email: string
  role: string
  is_active: boolean
}

interface AssignForm {
  email: string
}

export default function StaffManager({ organizationId: propOrgId }: { organizationId?: string }) {
  const { id: paramId } = useParams<{ id: string }>()
  const orgId = propOrgId || paramId
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgNameLoaded, setOrgNameLoaded] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssignForm>()

  const { data: manager, isLoading: managerLoading } = useQuery<Manager | null>({
    queryKey: ['org-manager', orgId],
    queryFn: () => api.get(`/organizations/${orgId}/manager`)
      .then(r => r.data)
      .catch(e => {
        if (e.response?.status === 404) return null;
        throw e;
      }),
    enabled: !!orgId,
    retry: false,
  })

  // Fetch org details to populate settings
  const { data: orgDetails } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => api.get(`/organizations/${orgId}`).then(r => {
      if (!orgNameLoaded) {
        setOrgName(r.data.name || '')
        setOrgNameLoaded(true)
      }
      return r.data
    }),
    enabled: !!orgId,
  })

  const assignMutation = useMutation({
    mutationFn: (data: AssignForm) =>
      api.post(`/organizations/${orgId}/manager`, data).then(r => r.data),
    onSuccess: () => {
      setSuccessMsg('Manager assigned successfully!')
      setServerError('')
      reset()
      queryClient.invalidateQueries({ queryKey: ['org-manager', orgId] })
      setTimeout(() => setSuccessMsg(''), 4000)
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.detail || 'Failed to assign manager')
      setSuccessMsg('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: () =>
      api.delete(`/organizations/${orgId}/manager`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-manager', orgId] })
    },
  })

  // PUT /organizations/{id}
  const updateOrgMutation = useMutation({
    mutationFn: (data: { name: string }) => api.put(`/organizations/${orgId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] })
      toast.success('Organization settings updated!')
    },
    onError: () => {
      toast.error('Failed to update organization.')
    },
  })

  const onAssignSubmit = (data: AssignForm) => {
    assignMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Assign Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Assign Manager</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          You can assign exactly one manager to your organization. The assigned user must already be registered with this email address.
        </p>

        {serverError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{serverError}</div>
        )}
        {successMsg && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{successMsg}</div>
        )}

        <form onSubmit={handleSubmit(onAssignSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Manager's Email Address *"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
              })}
              error={errors.email?.message}
              placeholder="manager@example.com"
            />
          </div>
          <Button type="submit" loading={isSubmitting} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {manager ? 'Replace Manager' : 'Assign Manager'}
          </Button>
        </form>
      </Card>

      {/* Current Manager */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-gray-900">Current Manager</h3>
        {managerLoading ? (
          <p className="text-gray-500 text-sm py-4">Loading manager...</p>
        ) : !manager ? (
          <Card className="p-8 text-center border border-dashed border-gray-300">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No manager is currently assigned.</p>
          </Card>
        ) : (
          <Card key={manager.id} className="flex items-center justify-between p-4 border-l-4 border-l-primary-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm">
                {(manager.user_name || manager.user_email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{manager.user_name || '—'}</p>
                <p className="text-sm text-gray-500">{manager.user_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Shield className="w-3.5 h-3.5 text-primary-500" />
                <span className="capitalize">{manager.role}</span>
              </div>
              <Badge variant={manager.is_active ? 'success' : 'default'}>
                {manager.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove manager"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Organization Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Organization Settings</h3>
        </div>
        <div className="flex gap-2 items-end">
          <Input
            label="Organization Name"
            value={orgName}
            onChange={(e: any) => setOrgName(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => updateOrgMutation.mutate({ name: orgName })}
            loading={updateOrgMutation.isPending}
            disabled={!orgName.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
      </Card>
    </div>
  )
}
