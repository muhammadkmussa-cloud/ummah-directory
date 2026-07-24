import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

export function usePermissions() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    staleTime: 30_000,
    enabled: !!token,
  });

  const permissions = user?.permissions ?? [];
  const role = user?.role ?? '';
  const isAdmin = role === 'super_admin' || role === 'moderator';
  const isSuperAdmin = role === 'super_admin';

  function can(permission: string): boolean {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  }

  function canAny(...perms: string[]): boolean {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }

  function canAll(...perms: string[]): boolean {
    if (isSuperAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }

  return { can, canAny, canAll, isAdmin, isSuperAdmin, role, permissions, user };
}
