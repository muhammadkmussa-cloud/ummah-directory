import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api-client'
import { Button, Input, Card } from '@/components/ui'
import type { Category } from '@/types'

interface BusinessForm {
  name: string
  description: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  category_id: string
  latitude: string
  longitude: string
}

export default function BusinessCreatePage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BusinessForm>()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  })

  const onSubmit = async (data: BusinessForm) => {
    setError('')
    try {
      const res = await api.post('/businesses', {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      })
      navigate(`/businesses/${res.data.slug}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create business')
    }
  }

  const flattenCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = []
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth })
      if (cat.children) result.push(...flattenCategories(cat.children, depth + 1))
    }
    return result
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Submit a Business</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6 space-y-4">
          <Input
            label="Business Name *"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="input-field min-h-[100px] resize-none"
              placeholder="Describe your business..."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              {...register('category_id', { required: 'Category is required' })}
              className="input-field"
            >
              <option value="">Select a category</option>
              {categories && flattenCategories(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'\u00A0'.repeat(cat.depth * 2)}{cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-600">{errors.category_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Phone" type="tel" {...register('phone')} />
          </div>

          <Input label="Website" type="url" {...register('website')} placeholder="https://" />

          <Input label="Address" {...register('address')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" {...register('city')} />
            <Input label="Country" {...register('country')} defaultValue="Kenya" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Latitude" {...register('latitude')} placeholder="-1.2921" />
            <Input label="Longitude" {...register('longitude')} placeholder="36.8219" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={isSubmitting}>Submit Business</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
