import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, Flag, ShieldAlert, CheckCircle, XCircle, Trash2, Ban, FileText, Megaphone, FileBox, LayoutTemplate, LayoutDashboard, Settings } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Badge, Button } from '@/components/ui';
import AdminOverview from './AdminOverview';
import AdminCategories from './AdminCategories';
import AdminCMSPages from './AdminCMSPages';
import AdminAllOrganizations from './AdminAllOrganizations';
import AdminReviews from './AdminReviews';
import AdminPaymentConfig from './AdminPaymentConfig';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const { data: pendingEdits } = useQuery({
    queryKey: ['admin', 'pending-edits'],
    queryFn: () => api.get('/admin/businesses/pending-edits', { params: { size: 50 } }).then(r => r.data),
  });

  const { data: claims } = useQuery({
    queryKey: ['admin', 'claims'],
    queryFn: () => api.get('/admin/claims', { params: { status: 'pending' } }).then(r => r.data),
  });

  const { data: reports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get('/admin/reports', { params: { size: 50 } }).then(r => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users', { params: { size: 50 } }).then(r => r.data),
  });

  // Unified organizations queue (covers businesses, mosques, charities, education)
  const { data: pendingOrgs } = useQuery({
    queryKey: ['admin', 'pending-organizations'],
    queryFn: () => api.get('/admin/organizations/pending', { params: { size: 50 } }).then(r => r.data),
  });

  // New admin endpoints
  const { data: verifications } = useQuery({
    queryKey: ['admin', 'verification-documents'],
    queryFn: () => api.get('/admin/verification-documents').then(r => r.data),
  });

  const { data: ads } = useQuery({
    queryKey: ['admin', 'advertisements'],
    queryFn: () => api.get('/admin/advertisements/pending').then(r => r.data),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => api.get('/admin/audit-logs').then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data),
  });

  const { data: cmsPages } = useQuery({
    queryKey: ['admin', 'cms-pages'],
    queryFn: () => api.get('/admin/cms-pages').then(r => r.data),
  });

  const approveEdit = useMutation({
    mutationFn: (id: string) => api.post(`/admin/businesses/${id}/approve-edit`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const rejectEdit = useMutation({
    mutationFn: (id: string) => api.post(`/admin/businesses/${id}/reject-edit`, { reason: 'Rejected by admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const approveClaim = useMutation({
    mutationFn: (id: string) => api.post(`/admin/claims/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const rejectClaim = useMutation({
    mutationFn: (id: string) => api.post(`/admin/claims/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const suspendUser = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const promoteUser = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => api.put(`/admin/users/${id}/role`, { role_name: role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const removeReview = useMutation({
    mutationFn: (id: string) => api.post(`/admin/reviews/${id}/remove`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, action }: { id: string, action: string }) => api.post(`/admin/reports/${id}/resolve`, { action_taken: action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const approveOrg = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizations/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const rejectOrg = useMutation({
    mutationFn: (id: string) => api.post(`/admin/organizations/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const approveVerification = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verification-documents/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const rejectVerification = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verification-documents/${id}/reject`, { reason: 'Rejected by admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const approveAd = useMutation({
    mutationFn: (id: string) => api.post(`/admin/advertisements/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const rejectAd = useMutation({
    mutationFn: (id: string) => api.post(`/admin/advertisements/${id}/reject`, { reason: 'Rejected by admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  // -------------- MOBILE ADMIN MODE (Fast Moderation) --------------
  const MobileAdminMode = () => (
    <div className="md:hidden pb-24 pt-4 px-4 space-y-6 min-h-screen bg-surface-50">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary-600" /> Admin Mode
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{(stats?.pending_businesses || 0) + (pendingOrgs?.total || 0)}</p>
          <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats?.pending_claims || 0}</p>
          <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Claims</p>
        </Card>
        <Card className="p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-red-600">{stats?.pending_reports || 0}</p>
          <p className="text-xs text-surface-500 font-medium uppercase tracking-wider">Reports</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg text-surface-900">Moderation Queue</h2>
        
        {pendingEdits?.items?.length === 0 && reports?.items?.length === 0 && claims?.length === 0 && pendingOrgs?.items?.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-surface-200 border-dashed">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-surface-600 font-medium">Queue is empty!</p>
          </div>
        )}

        {pendingOrgs?.items?.map((org: any) => (
          <Card key={`org-${org.id}`} className="p-4 border-l-4 border-l-primary-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge variant="pending" className="mb-1 capitalize">{org.organization_type}</Badge>
                <h3 className="font-bold text-surface-900">{org.name}</h3>
                <p className="text-xs text-surface-500">{org.city} · {org.country}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => approveOrg.mutate(org.id)}
                className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => rejectOrg.mutate(org.id)}
                className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </Card>
        ))}

        {pendingEdits?.items?.map((b: any) => (
          <Card key={`edit-${b.id}`} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge variant="pending" className="mb-1">Pending Edit</Badge>
                <h3 className="font-bold text-surface-900">Business ID: {b.business_id || b.id}</h3>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => approveEdit.mutate(b.id)}
                className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => rejectEdit.mutate(b.id)}
                className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </Card>
        ))}

        {claims?.map((c: any) => (
          <Card key={`claim-${c.id}`} className="p-4 border-l-4 border-l-blue-500">
            <Badge variant="info" className="mb-1">Ownership Claim</Badge>
            <p className="font-medium text-sm mb-1">Business: {c.business_name}</p>
            <p className="text-sm text-surface-600 bg-surface-50 p-2 rounded-lg mb-3">"{c.additional_info}" - Proof: <a href={c.proof_url} target="_blank" className="text-blue-500">Link</a></p>
            <div className="flex gap-2">
              <button 
                onClick={() => approveClaim.mutate(c.id)}
                className="flex-1 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => rejectClaim.mutate(c.id)}
                className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </Card>
        ))}

        {reports?.items?.map((r: any) => (
          <Card key={`rep-${r.id}`} className="p-4 border-l-4 border-l-red-500">
            <Badge variant="error" className="mb-1">Flagged Content</Badge>
            <p className="font-medium text-sm mb-1">{r.resource_type}: {r.resource_id}</p>
            <p className="text-sm text-surface-600 bg-surface-50 p-2 rounded-lg mb-3">"{r.description}"</p>
            <div className="flex gap-2">
              <button 
                onClick={() => removeReview.mutate(r.resource_id)}
                className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Remove Content
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // -------------- DESKTOP ADMIN CONSOLE (Comprehensive) --------------
  const DesktopAdminConsole = () => (
    <div className="hidden md:block max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Administration Console</h1>
          <p className="text-surface-500 mt-1">Manage users, organizations, and platform health.</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav for Desktop Console */}
        <div className="w-64 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'organizations', label: 'All Organizations', icon: Building2 },
            { id: 'pending-orgs', label: 'Pending Orgs', icon: Building2 },
            { id: 'pending-edits', label: 'Pending Edits', icon: Building2 },
            { id: 'claims', label: 'Claims', icon: Users },
            { id: 'all-reviews', label: 'All Reviews', icon: Flag },
            { id: 'reports', label: 'Reports & Flags', icon: Flag },
            isSuperAdmin ? { id: 'users', label: 'Users & Roles', icon: Users } : null,
            isSuperAdmin ? { id: 'payments', label: 'Payments', icon: Settings } : null,
            { id: 'verifications', label: 'Verifications', icon: FileText },
            { id: 'ads', label: 'Advertisements', icon: Megaphone },
            isSuperAdmin ? { id: 'audit-logs', label: 'Audit Logs', icon: FileText } : null,
            isSuperAdmin ? { id: 'categories', label: 'Categories', icon: FileBox } : null,
            isSuperAdmin ? { id: 'cms-pages', label: 'CMS Pages', icon: LayoutTemplate } : null,
          ].filter(Boolean).map((t: any) => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              }`}
            >
              <t.icon className="w-5 h-5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {tab === 'overview' && (
            <AdminOverview />
          )}

          {tab === 'organizations' && (
            <AdminAllOrganizations />
          )}

          {tab === 'all-reviews' && (
            <AdminReviews />
          )}

          {tab === 'users' && isSuperAdmin && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">User & Role Management</h2>
                <p className="text-sm text-surface-500 mt-1">Assign roles (Moderator, Admin) to users.</p>
              </div>
              <div className="p-8 text-center text-surface-500">
                User management functionality coming soon.
              </div>
            </Card>
          )}

          {tab === 'payments' && isSuperAdmin && (
            <AdminPaymentConfig />
          )}

          {tab === 'pending-orgs' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Pending Organizations</h2>
                <p className="text-sm text-surface-500 mt-1">Businesses, mosques, charities, schools — all in one queue.</p>
              </div>
              <div className="divide-y divide-surface-100">
                {(!pendingOrgs?.items || pendingOrgs.items.length === 0) && (
                  <p className="p-6 text-surface-500 text-center">No pending organizations. ✓</p>
                )}
                {pendingOrgs?.items?.map((org: any) => (
                  <div key={org.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50">
                    <div>
                      <Badge variant="pending" className="mb-1 capitalize">{org.organization_type}</Badge>
                      <h3 className="font-bold text-surface-900">{org.name}</h3>
                      <p className="text-sm text-surface-500">{org.email} · {org.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveOrg.mutate(org.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectOrg.mutate(org.id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'pending-edits' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Pending Edits</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!pendingEdits?.items || pendingEdits.items.length === 0) && <p className="p-6 text-surface-500 text-center">No pending edits.</p>}
                {pendingEdits?.items?.map((b: any) => (
                  <div key={b.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50">
                    <div>
                      <h3 className="font-bold text-surface-900">Business ID: {b.business_id || b.id}</h3>
                      <p className="text-sm text-surface-500">Edit submitted by: {b.submitted_by || 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveEdit.mutate(b.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectEdit.mutate(b.id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'claims' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Ownership Claims</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!claims || claims.length === 0) && <p className="p-6 text-surface-500 text-center">No pending claims.</p>}
                {claims?.map((c: any) => (
                  <div key={c.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="info" className="mb-2">Claim</Badge>
                        <p className="font-medium text-surface-900 mb-1">Business: {c.business_name}</p>
                        <p className="text-sm text-surface-600 bg-surface-100 p-3 rounded-lg border border-surface-200">
                          {c.additional_info} - Proof: <a href={c.proof_url} target="_blank" rel="noreferrer" className="text-blue-500 underline">Link</a>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveClaim.mutate(c.id)}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectClaim.mutate(c.id)}>Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'reports' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Reported Content</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!reports?.items || reports.items.length === 0) && <p className="p-6 text-surface-500 text-center">No active reports.</p>}
                {reports?.items?.map((r: any) => (
                  <div key={r.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="error" className="mb-2">{r.category}</Badge>
                        <p className="font-medium text-surface-900 mb-1">{r.resource_type}: {r.resource_id}</p>
                        <p className="text-sm text-surface-600 bg-surface-100 p-3 rounded-lg border border-surface-200">
                          {r.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex items-center gap-2"
                          onClick={() => resolveReport.mutate({ id: r.id, action: 'content_removed' })}
                        >
                          <Trash2 className="w-4 h-4" /> Remove Content
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => resolveReport.mutate({ id: r.id, action: 'dismissed' })}
                        >
                          Dismiss Report
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'users' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">User Management</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!users?.items || users.items.length === 0) && <p className="p-6 text-surface-500 text-center">No users found.</p>}
                {users?.items?.map((u: any) => (
                  <div key={u.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50">
                    <div>
                      <h3 className="font-bold text-surface-900">{u.full_name || 'Unknown User'}</h3>
                      <p className="text-sm text-surface-500">{u.email} · Role: {u.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isSuperAdmin && u.role !== 'super_admin' && (
                        <select 
                          value={u.role}
                          onChange={(e) => promoteUser.mutate({ id: u.id, role: e.target.value })}
                          className="text-sm border-surface-200 rounded-lg p-1 bg-surface-50"
                        >
                          <option value="registered_user">User</option>
                          <option value="moderator">Moderator</option>
                        </select>
                      )}
                      <Badge variant={u.is_active ? 'success' : 'error'}>{u.is_active ? 'Active' : 'Suspended'}</Badge>
                      {u.is_active && (
                        <button 
                          onClick={() => suspendUser.mutate(u.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Suspend User"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'verifications' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Verification Documents</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!verifications?.items || verifications.items.length === 0) && <p className="p-6 text-surface-500 text-center">No pending verifications.</p>}
                {verifications?.items?.map((v: any) => (
                  <div key={v.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50">
                    <div>
                      <h3 className="font-bold text-surface-900">Organization: {v.organization_id}</h3>
                      <p className="text-sm text-surface-500">Document Type: {v.document_type}</p>
                      <a href={v.document_url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline">View Document</a>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveVerification.mutate(v.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectVerification.mutate(v.id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'ads' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Pending Advertisements</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!ads?.items || ads.items.length === 0) && <p className="p-6 text-surface-500 text-center">No pending advertisements.</p>}
                {ads?.items?.map((ad: any) => (
                  <div key={ad.id} className="p-6 flex items-center justify-between hover:bg-surface-50/50">
                    <div>
                      <h3 className="font-bold text-surface-900">{ad.title}</h3>
                      <p className="text-sm text-surface-500">Budget: ${ad.budget} · Placement: {ad.placement}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveAd.mutate(ad.id)}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => rejectAd.mutate(ad.id)}>Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'audit-logs' && (
            <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
              <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
                <h2 className="font-bold text-lg">Audit Logs</h2>
              </div>
              <div className="divide-y divide-surface-100">
                {(!auditLogs?.items || auditLogs.items.length === 0) && <p className="p-6 text-surface-500 text-center">No logs found.</p>}
                {auditLogs?.items?.map((log: any) => (
                  <div key={log.id} className="p-6 hover:bg-surface-50/50">
                    <p className="text-sm text-surface-500">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="font-medium text-surface-900">{log.action} by User {log.user_id}</p>
                    <p className="text-sm text-surface-600 bg-surface-100 p-2 rounded mt-2 font-mono text-xs overflow-auto">{JSON.stringify(log.details)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'categories' && (
            <AdminCategories />
          )}

          {tab === 'cms-pages' && (
            <AdminCMSPages />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MobileAdminMode />
      <DesktopAdminConsole />
    </>
  );
}
