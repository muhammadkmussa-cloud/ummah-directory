import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Plus, Star, MapPin, CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import api from '@/lib/api-client'
import { Card, Badge, Button } from '@/components/ui'

interface Organization {
  id: string
  name: string
  slug: string
  organization_type: string
  logo_url: string | null
  is_verified: boolean
  status: string
  role: string
}

export default function MyOrganizations() {
  const navigate = useNavigate()

  const { data: organizations, isLoading, error } = useQuery<Organization[]>({
    queryKey: ['my-organizations'],
    queryFn: () => api.get('/users/me/organizations').then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading your organizations...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">
        Failed to load organizations.
      </div>
    )
  }

  const handleOrgClick = (org: Organization) => {
    switch (org.organization_type) {
      case 'business':
        navigate(`/owner/businesses/${org.id}/manage`)
        break
      case 'charity':
        navigate(`/charity/charities/${org.id}/manage`)
        break
      case 'mosque':
        navigate(`/mosque/mosques/${org.id}/manage`)
        break
      case 'education':
        navigate(`/owner/education/${org.id}/manage`) // Update this route later if needed
        break
      default:
        // Generic fallback or error handling
        console.warn(`No specific dashboard route for type: ${org.organization_type}`)
        break
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Organizations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your businesses, mosques, charities, and institutions.</p>
        </div>
        <Link to="/organizations/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {!organizations || organizations.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No organizations yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Get started by registering your business, mosque, or charity to connect with the ummah Directory community.
          </p>
          <Link to="/organizations/new">
            <Button>Create Your First Organization</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map(org => (
            <Card 
              key={org.id} 
              className="flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow border border-gray-100"
              onClick={() => handleOrgClick(org)}
            >
              <div className="flex items-start gap-4 mb-4">
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate" title={org.name}>
                    {org.name}
                  </h3>
                  <div className="text-sm text-gray-500 capitalize flex items-center gap-1.5 mt-0.5">
                    {org.organization_type} • {org.role}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      org.status === 'approved' ? 'success' : 
                      org.status === 'pending' ? 'pending' : 
                      org.status === 'rejected' ? 'error' : 'default'
                    }
                  >
                    {org.status}
                  </Badge>
                  {org.is_verified && <Badge variant="verified">Verified</Badge>}
                </div>
                
                <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700">
                  Manage &rarr;
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
