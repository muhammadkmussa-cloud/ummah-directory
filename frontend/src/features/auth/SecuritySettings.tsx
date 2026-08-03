import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Button, Input } from '@/components/ui'
import { toast } from 'react-hot-toast'

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function SecuritySettings() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<PasswordForm>()

  const onSubmit = async (data: PasswordForm) => {
    setError('')
    setSuccess('')
    try {
      await api.post('/users/me/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      setSuccess('Password changed successfully!')
      reset()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-50 rounded-lg">
          <Shield className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Security Settings</h3>
          <p className="text-sm text-gray-500">Change your password</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            {...register('current_password', { required: 'Current password is required' })}
            error={errors.current_password?.message}
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            onClick={() => setShowCurrent(s => !s)}
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="New Password"
            type={showNew ? 'text' : 'password'}
            {...register('new_password', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' }
            })}
            error={errors.new_password?.message}
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            onClick={() => setShowNew(s => !s)}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          {...register('confirm_password', {
            required: 'Please confirm your password',
            validate: (v) => v === watch('new_password') || 'Passwords do not match'
          })}
          error={errors.confirm_password?.message}
        />

        <Button type="submit" loading={isSubmitting} className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Update Password
        </Button>
      </form>
    </Card>

    {/* Login History */}
    <LoginHistory />

    {/* Active Sessions */}
    <ActiveSessions />
    </div>
  )
}

function LoginHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: () => api.get('/users/me/login-history').then(r => r.data),
  })
  if (isLoading) return null
  return (
    <Card className="p-6 mt-6">
      <h3 className="font-semibold text-gray-900 mb-4">Login History</h3>
      {data?.items?.length ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {data.items.map((entry: any) => (
            <div key={entry.id} className="text-xs text-gray-500 flex justify-between gap-3 border-b border-gray-50 pb-1.5">
              <span className="min-w-0 break-words">{entry.ip_address || 'Unknown IP'}</span>
              <span className="text-right shrink-0">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No login history available.</p>
      )}
    </Card>
  )
}

function ActiveSessions() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => api.get('/users/me/sessions').then(r => r.data),
  })
  const logoutAll = useMutation({
    mutationFn: () => api.post('/users/me/sessions/logout-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] })
      toast.success('All other sessions logged out')
    },
    onError: () => toast.error('Failed to log out sessions'),
  })
  if (isLoading) return null
  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-semibold text-gray-900">Active Sessions</h3>
        <Button variant="outline" size="sm" onClick={() => logoutAll.mutate()} loading={logoutAll.isPending}>
          Log Out All Others
        </Button>
      </div>
      {data?.sessions?.length ? (
        <div className="space-y-2">
          {data.sessions.map((s: any, i: number) => (
            <div key={i} className="text-xs text-gray-500 flex justify-between gap-3 border-b border-gray-50 pb-1.5">
              <span className="min-w-0 break-words">{s.ip_address || 'Unknown'} · {s.user_agent?.substring(0, 40) || 'Unknown'}</span>
              <span className="text-right shrink-0">{s.logged_in_at ? new Date(s.logged_in_at).toLocaleString() : ''}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No active sessions.</p>
      )}
    </Card>
  )
}
