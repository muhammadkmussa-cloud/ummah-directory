import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Ban, CheckCircle, Trash2 } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button } from '@/components/ui';

export default function AdminAllOrganizations() {
  const queryClient = useQueryClient();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', 'all'],
    queryFn: () => api.get('/admin/organizations').then(r => r.data),
  });

  const suspendOrg = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizations/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  });

  const restoreOrg = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizations/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  });

  const deleteOrg = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] }),
  });

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading organizations...</div>;

  return (
    <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          All Organizations
        </h2>
        <p className="text-sm text-surface-500 mt-1">Manage all businesses, mosques, charities, and educational institutions.</p>
      </div>

      <div className="divide-y divide-surface-100">
        {(!orgs || orgs.length === 0) && (
          <p className="p-8 text-surface-500 text-center">No organizations found.</p>
        )}
        
        {orgs?.map((org: any) => (
          <div key={org.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="capitalize">{org.organization_type}</Badge>
                <h3 className="font-bold text-surface-900">{org.name}</h3>
                {org.status === 'suspended' && <Badge variant="error" className="text-[10px]">Suspended</Badge>}
                {org.status === 'pending' && <Badge variant="pending" className="text-[10px]">Pending</Badge>}
                {org.status === 'approved' && <Badge variant="success" className="text-[10px]">Approved</Badge>}
              </div>
              <p className="text-sm text-surface-500 font-mono text-xs">/{org.slug} · {org.city}</p>
            </div>
            <div className="flex items-center gap-2">
              {org.status !== 'suspended' ? (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => suspendOrg.mutate(org.id)}
                  disabled={suspendOrg.isPending}
                  className="flex items-center gap-1"
                >
                  <Ban className="w-4 h-4" /> Suspend
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => restoreOrg.mutate(org.id)}
                  disabled={restoreOrg.isPending}
                  className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4" /> Restore
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to completely delete this organization? This action cannot be undone.')) {
                    deleteOrg.mutate(org.id);
                  }
                }}
                disabled={deleteOrg.isPending}
                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
