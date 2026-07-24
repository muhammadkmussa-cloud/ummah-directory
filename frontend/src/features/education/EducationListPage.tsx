import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, GraduationCap, BookOpen } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'

export default function EducationListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['education', { search, institution_type: filterType }],
    queryFn: () => api.get('/education', { params: { search, institution_type: filterType || undefined, size: 20 } }).then(r => r.data),
  })

  const types = [
    { value: '', label: 'All' },
    { value: 'islamic_school', label: 'Islamic Schools' },
    { value: 'madrasa', label: 'Madrasa' },
    { value: 'quran_center', label: 'Quran Centers' },
    { value: 'university', label: 'Universities' },
    { value: 'college', label: 'Colleges' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-surface-900">Islamic Education</h1>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institutions..."
            className="input-field pl-9 sm:pl-10 text-xs sm:text-sm w-full"
          />
        </div>
        <Button variant="outline" onClick={() => navigate('/map?type=education')} className="hidden sm:flex shrink-0">
          <MapPin className="w-4 h-4 mr-2" /> View Map
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar scroll-smooth py-1 w-full max-w-full">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
              filterType === t.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-sm">Loading institutions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {data?.items?.map((inst: any) => (
            <Card key={inst.id} hover onClick={() => navigate(`/education/${inst.slug}`)}>
              <div className="h-40 bg-indigo-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                {inst.logo_url ? (
                  <img src={inst.logo_url} alt="" className="w-full h-full object-contain p-4" />
                ) : (
                  <GraduationCap className="w-16 h-16 text-indigo-300" />
                )}
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-1 text-surface-900 line-clamp-1">{inst.name}</h3>
              <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span className="capitalize">{inst.institution_type?.replace('_', ' ')}</span>
                {inst.curriculum && <span>· {inst.curriculum}</span>}
              </div>
              {inst.city && (
                <p className="text-xs sm:text-sm text-surface-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-surface-400" /> {inst.city}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {inst.is_verified && <Badge variant="verified">Verified</Badge>}
                {inst.has_quran_program && <Badge variant="success">Quran Program</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.items?.length === 0 && !isLoading && (
        <div className="w-full text-center py-16 px-4 text-surface-500 bg-surface-50 rounded-2xl border border-surface-100 my-4">
          <p className="text-base font-bold text-surface-800">No institutions found</p>
          <p className="text-xs sm:text-sm text-surface-500 mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}
