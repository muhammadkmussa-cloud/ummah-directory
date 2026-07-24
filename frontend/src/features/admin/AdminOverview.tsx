import { useQuery } from '@tanstack/react-query';
import { 
  Users, Building2, BookOpen, Heart, 
  AlertCircle, ShieldAlert, FileText, CheckCircle, Clock 
} from 'lucide-react';
import api from '@/lib/api-client';
import { Card } from '@/components/ui';

export default function AdminOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/analytics/admin/overview').then(r => r.data),
  });

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading dashboard statistics...</div>;

  const summahryCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Businesses', value: stats?.total_businesses || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Mosques', value: stats?.total_mosques || 0, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Charities', value: stats?.total_charities || 0, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Education', value: stats?.total_education || 0, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const pendingCards = [
    { label: 'Pending Businesses', value: stats?.pending_businesses || 0 },
    { label: 'Pending Mosques', value: stats?.pending_mosques || 0 },
    { label: 'Pending Charities', value: stats?.pending_charities || 0 },
    { label: 'Pending Education', value: stats?.pending_education || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Platform Statistics */}
      <section>
        <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary-600" /> Platform Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {summahryCards.map((card, i) => (
            <Card key={i} className="p-6 flex flex-col items-center text-center">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color} mb-3`}>
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-surface-900">{card.value}</p>
              <p className="text-sm font-medium text-surface-500 uppercase tracking-wider">{card.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Moderation Queue Summahry */}
      <section>
        <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" /> Moderation Queue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pendingCards.map((card, i) => (
            <Card key={i} className="p-5 border-l-4 border-l-orange-500">
              <p className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-surface-900">{card.value}</p>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-6 border border-red-100 bg-red-50/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Pending Reports
              </p>
              <p className="text-3xl font-black text-red-700">{stats?.pending_reports || 0}</p>
            </div>
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          
          <Card className="p-6 border border-blue-100 bg-blue-50/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" /> Ownership Claims
              </p>
              <p className="text-3xl font-black text-blue-700">{stats?.pending_claims || 0}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
