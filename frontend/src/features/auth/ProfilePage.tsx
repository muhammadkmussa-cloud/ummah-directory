import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { User, Bell, Settings, LogOut, ChevronRight, Lock, Globe, Shield, Heart, AlertTriangle, Camera, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api-client'
import { Button, Input, Card, Modal } from '@/components/ui'
import ImageUploader from '@/components/ui/ImageUploader'
import SecuritySettings from './SecuritySettings'
import DonationHistory from '../donations/DonationHistory'
import FavoritesPage from '../interactions/FavoritesPage'
import { toast } from 'react-hot-toast'

interface ProfileForm {
  full_name: string
  phone: string
  preferred_language: string
  bio: string
  city: string
  country: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications' | 'donations' | 'favorites'>('profile')
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.error('Logout failed on backend:', e)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      queryClient.clear()
      navigate('/login')
    }
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileForm>({
    values: user ? {
      full_name: user.full_name,
      phone: user.phone || '',
      preferred_language: user.preferred_language || 'en',
      bio: user.bio || '',
      city: user.city || '',
      country: user.country || '',
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm & { profile_photo_url?: string | null, cover_photo_url?: string | null }) => {
      const payload: any = { ...data }
      if (avatarUrl !== null && avatarUrl !== user?.profile_photo_url) payload.profile_photo_url = avatarUrl
      if (coverUrl !== null && coverUrl !== user?.cover_photo_url) payload.cover_photo_url = coverUrl
      return api.patch('/users/me', payload)
    },
    onSuccess: () => {
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Update failed')
      setTimeout(() => setError(''), 3000)
    },
  })

  const resendVerification = useMutation({
    mutationFn: () => api.post('/auth/resend-verification', { email: user?.email }),
    onSuccess: () => {
      setMessage('Verification email sent! Please check your inbox.')
      setTimeout(() => setMessage(''), 5000)
    },
    onError: () => {
      setError('Failed to resend verification email. Please try again.')
      setTimeout(() => setError(''), 3000)
    }
  })

  const deactivateMutation = useMutation({
    mutationFn: () => api.post('/users/me/deactivate'),
    onSuccess: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      queryClient.clear()
      toast.success('Account deactivated successfully')
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to deactivate account')
      setShowDeactivateModal(false)
    },
  })

  const onSubmit = (data: ProfileForm) => updateMutation.mutate(data)

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-surface-400">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
      <p>Loading profile...</p>
    </div>
  )

  const menuItems = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'security', label: 'Security & Password', icon: Shield },
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'donations', label: 'Donation History', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Settings</h1>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" /> Log out
        </Button>
      </div>

      {!user?.is_email_verified && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-yellow-800">
            <Shield className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Please verify your email address</p>
              <p className="text-sm opacity-90">Verify your email ({user?.email}) to unlock all features.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={() => resendVerification.mutate()} 
            loading={resendVerification.isPending}
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 shrink-0"
          >
            Resend Verification
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="md:w-64 shrink-0">
          <Card className="p-2 border-none shadow-sm sticky top-24">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeSection === item.id 
                      ? 'bg-primary-50 text-primary-700 font-semibold' 
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium border border-emerald-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              {message}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              {error}
            </motion.div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-surface-100 p-6 md:p-8">
            
            {activeSection === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                {/* Cover Photo */}
                <div className="relative w-full h-40 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 mb-16">
                  {(coverUrl || user?.cover_photo_url) && (
                    <img src={coverUrl || user?.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 right-3">
                    <ImageUploader
                      resourceType="profile"
                      onUploadSuccess={(data) => {
                        setCoverUrl(data.url)
                        toast.success('Cover photo updated')
                      }}
                      className="w-auto"
                    />
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex items-end gap-4 -mt-24 mb-8 pb-8 border-b border-surface-100 relative z-10">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl font-bold uppercase overflow-hidden ring-4 ring-white shadow-md">
                      {user?.profile_photo_url || avatarUrl ? (
                        <img src={avatarUrl || user?.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.full_name?.[0] || user?.email?.[0] || 'U'
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                      <Camera className="w-6 h-6 text-white" />
                      <ImageUploader
                        resourceType="profile"
                        onUploadSuccess={(data) => {
                          setAvatarUrl(data.url)
                          toast.success('Profile photo updated')
                        }}
                        className="!absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="pb-1">
                    <h2 className="text-xl font-bold text-surface-900">{user?.full_name || 'User'}</h2>
                    <p className="text-surface-500">{user?.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input label="Full Name" {...register('full_name', { required: true })} className="bg-surface-50" />
                    <Input label="Phone Number" type="tel" {...register('phone')} className="bg-surface-50" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <Input label="City" {...register('city')} className="bg-surface-50" placeholder="e.g. Nairobi" />
                    <Input label="Country" {...register('country')} className="bg-surface-50" placeholder="e.g. Kenya" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700">Bio</label>
                    <textarea
                      {...register('bio')}
                      rows={3}
                      placeholder="Tell us a little about yourself..."
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-surface-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-surface-700">Preferred Language</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                      <select {...register('preferred_language')} className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none text-surface-900">
                        <option value="en">English</option>
                        <option value="sw">Swahili</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" variant="primary" loading={isSubmitting} className="w-full md:w-auto px-8">
                      Save Changes
                    </Button>
                  </div>
                </form>

                <div className="mt-10 pt-8 border-t border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-surface-500 mb-4">
                    Once you deactivate your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeactivateModal(true)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Deactivate Account
                  </Button>
                </div>

                <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account">
                  <div className="space-y-4">
                    <p className="text-surface-600">
                      Are you sure you want to deactivate your account? You will be logged out and will not be able to log back in.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => setShowDeactivateModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => deactivateMutation.mutate()}
                        loading={deactivateMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Deactivate
                      </Button>
                    </div>
                  </div>
                </Modal>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <SecuritySettings />
              </motion.div>
            )}

            {activeSection === 'donations' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <DonationHistory />
              </motion.div>
            )}

            {activeSection === 'favorites' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <FavoritesPage />
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <div className="mb-6 pb-6 border-b border-surface-100">
                  <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary-600" /> Notifications
                  </h2>
                  <p className="text-surface-500 text-sm mt-1">Manage how we communicate with you.</p>
                </div>

                <div className="text-center py-12 text-surface-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-surface-300" />
                  <h3 className="text-lg font-medium text-surface-900 mb-2">Notification Preferences</h3>
                  <p className="mb-6 max-w-sm mx-auto">Fine-tune your email and push notification settings.</p>
                  <Button variant="outline" onClick={() => navigate('/notifications/preferences')}>
                    Manage Preferences
                  </Button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
