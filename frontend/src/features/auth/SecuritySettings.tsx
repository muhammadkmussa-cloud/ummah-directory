import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff, Lock } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Button, Input } from '@/components/ui'

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
  )
}
