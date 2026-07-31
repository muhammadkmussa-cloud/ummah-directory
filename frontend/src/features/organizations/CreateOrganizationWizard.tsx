import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Building2, Heart, GraduationCap, MapPin, ArrowRight, ArrowLeft, Upload, Image, Stethoscope, UtensilsCrossed, Hotel } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { Card, Button, Input } from '@/components/ui'
import ImageUploader from '@/components/ui/ImageUploader'
import type { Category } from '@/types'

const ORG_TYPES = [
  { id: 'business', name: 'Business or Service', icon: Building2, desc: 'Stores, restaurants, agencies, clinics, etc.' },
  { id: 'mosque', name: 'Mosque or Islamic Center', icon: MapPin, desc: 'Places of worship, community centers.' },
  { id: 'charity', name: 'Charity or NGO', icon: Heart, desc: 'Non-profits, relief organizations, foundations.' },
  { id: 'education', name: 'Educational Institution', icon: GraduationCap, desc: 'Schools, madrasas, universities, institutes.' },
  { id: 'hospital', name: 'Hospital / Healthcare', icon: Stethoscope, desc: 'Hospitals, clinics, pharmacies, healthcare providers.' },
  { id: 'hotel', name: 'Hotel / Lodging', icon: Hotel, desc: 'Hotels, guesthouses, lodges, accommodation.' },
  { id: 'restaurant', name: 'Restaurant / Dining', icon: UtensilsCrossed, desc: 'Halal restaurants, cafés, caterers, food services.' },
]

export default function CreateOrganizationWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
    enabled: selectedType === 'business',
  })

  const flattenCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = []
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth })
      if (cat.children) result.push(...flattenCategories(cat.children, depth + 1))
    }
    return result
  }

  const handleNext = () => {
    if (selectedType) {
      setStep(2)
    }
  }

  const handleToMedia = () => {
    setStep(3)
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const onSubmit = async (data: any) => {
    setError('')
    try {
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
      }

      // Route based on type
      let endpoint = ''
      switch (selectedType) {
        case 'business': endpoint = '/businesses'; break;
        case 'mosque': endpoint = '/mosques'; break;
        case 'charity': endpoint = '/charities'; break;
        case 'education': endpoint = '/education'; break;
        case 'hospital': endpoint = '/hospitals'; break;
        case 'hotel': endpoint = '/hotels'; break;
        case 'restaurant': endpoint = '/restaurants'; break;
        default: throw new Error('Invalid organization type')
      }

      const res = await api.post(endpoint, payload)
      // Redirect back to My Organizations
      navigate('/my-organizations', { state: { message: 'Organization created successfully!' } })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create organization')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Create Organization</h1>
      <p className="text-gray-500 mb-8">Register your entity on the ummah Directory.</p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Select Organization Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ORG_TYPES.map(type => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedType === type.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${selectedType === type.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{type.name}</h3>
                </div>
                <p className="text-sm text-gray-500 pl-11">{type.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleNext} disabled={!selectedType} className="flex items-center gap-2">
              Next Step <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-4 mb-2 pb-4 border-b border-gray-100">
              <button type="button" onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">
                Organization Details ({ORG_TYPES.find(t => t.id === selectedType)?.name})
              </h2>
            </div>

            <Input
              label="Organization Name *"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message as string}
            />

            {selectedType === 'business' && (
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
                {errors.category_id && <p className="text-xs text-red-600">{errors.category_id.message as string}</p>}
              </div>
            )}

            {selectedType === 'education' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Institution Type *</label>
                <select
                  {...register('institution_type', { required: 'Type is required' })}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="school">School</option>
                  <option value="madrasa">Madrasa / Islamic School</option>
                  <option value="university">University / College</option>
                  <option value="institute">Institute</option>
                </select>
                {errors.institution_type && <p className="text-xs text-red-600">{errors.institution_type.message as string}</p>}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe your organization..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" type="email" {...register('email')} />
              <Input label="Phone" type="tel" {...register('phone')} />
            </div>

            <Input label="Website" type="url" {...register('website')} placeholder="https://" />
            <Input label="Address" {...register('address')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="City" {...register('city')} />
              <Input label="Country" {...register('country')} defaultValue="Kenya" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Latitude (optional)" {...register('latitude')} placeholder="-1.2921" />
              <Input label="Longitude (optional)" {...register('longitude')} placeholder="36.8219" />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button type="button" onClick={handleToMedia} className="w-full sm:w-auto">Continue to Media</Button>
            </div>
          </Card>
        </form>
      )}

      {step === 3 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Media</h2>
          <p className="text-sm text-gray-500 mb-6">Add a logo and cover photo to make your organization stand out.</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo <span className="text-gray-400 font-normal">(recommended: square, at least 200x200)</span>
              </label>
              <ImageUploader
                currentUrl={logoUrl}
                onUploaded={(url) => setLogoUrl(url)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo <span className="text-gray-400 font-normal">(recommended: 1200x400)</span>
              </label>
              <ImageUploader
                currentUrl={coverUrl}
                onUploaded={(url) => setCoverUrl(url)}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              <Button loading={isSubmitting} className="w-full sm:w-auto" onClick={handleSubmit(onSubmit)}>
                Submit Registration
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
