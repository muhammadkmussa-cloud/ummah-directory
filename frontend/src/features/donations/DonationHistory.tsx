import { useQuery } from '@tanstack/react-query';
import { Download, HeartHandshake, Calendar, DollarSign, RefreshCw, Eye } from 'lucide-react';
import { Card, Badge, Button, Modal } from '@/components/ui';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export default function DonationHistory() {
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['donations', 'history'],
    queryFn: () => api.get('/donations/history').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['donations', 'stats'],
    queryFn: () => api.get('/donations/stats').then(r => r.data),
  });

  const { data: webReceipt, isLoading: isLoadingReceipt } = useQuery({
    queryKey: ['donations', 'receipt', viewReceiptId],
    queryFn: () => api.get(`/donations/${viewReceiptId}/receipt`).then(r => r.data),
    enabled: !!viewReceiptId,
  });

  const handleConfirm = async (id: string) => {
    try {
      await api.post(`/donations/${id}/confirm`);
      refetch();
      toast.success('Donation confirmed!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment not yet confirmed');
    }
  };

  const downloadReceipt = async (id: string) => {
    try {
      const response = await api.get(`/donations/${id}/receipt/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt', err);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-24 bg-surface-100 rounded-2xl w-full"></div>
      <div className="h-24 bg-surface-100 rounded-2xl w-full"></div>
      <div className="h-24 bg-surface-100 rounded-2xl w-full"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-6 border-b border-surface-100 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-primary-600" /> Donation History
          </h2>
          <p className="text-surface-500 text-sm mt-1">View your past contributions and download receipts.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold text-primary-600">
            ${stats?.total_amount ? parseFloat(stats.total_amount).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">Total Given ({stats?.total_donations || 0} donations)</p>
        </div>
      </div>

      {(!history?.items || history.items.length === 0) ? (
        <div className="text-center py-12 bg-surface-50 rounded-2xl border border-surface-200 border-dashed">
          <HeartHandshake className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="font-bold text-surface-900">No Donations Yet</h3>
          <p className="text-surface-500 text-sm mt-1 max-w-sm mx-auto">
            You haven't made any donations on the platform yet. When you do, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.items.map((donation: any) => (
            <Card key={donation.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-surface-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="min-w-0 break-words">
                  <h3 className="font-bold text-surface-900 text-lg">
                    ${donation.amount.toFixed(2)} {donation.currency.toUpperCase()}
                  </h3>
                  <p className="text-sm font-medium text-surface-700">
                    To: {donation.campaign_title || donation.charity_name || 'Charity'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(donation.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <Badge variant={donation.status === 'completed' ? 'success' : 'pending'}>
                      {donation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {donation.status === 'completed' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewReceiptId(donation.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadReceipt(donation.id)}
                  >
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </div>
              )}
              {donation.status === 'pending' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleConfirm(donation.id)}
                  className="w-full md:w-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Check Status
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {viewReceiptId && (
        <Modal isOpen={!!viewReceiptId} onClose={() => setViewReceiptId(null)} title="Donation Receipt">
          {isLoadingReceipt ? (
            <div className="p-8 text-center animate-pulse text-surface-500">Loading receipt details...</div>
          ) : webReceipt ? (
            <div className="space-y-4">
              <div className="bg-surface-50 p-4 rounded-lg text-center border border-surface-200">
                <p className="text-surface-500 text-sm mb-1">Receipt Number</p>
                <p className="text-xl font-mono font-bold text-surface-900">{webReceipt.receipt_number || 'N/A'}</p>
              </div>
              <div className="space-y-2 text-sm border-t border-surface-100 pt-4">
                <div className="flex justify-between"><span className="text-surface-500">Amount</span><span className="font-bold">{webReceipt.amount} {webReceipt.currency}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Charity</span><span className="font-bold">{webReceipt.charity_name}</span></div>
                {webReceipt.campaign_name && <div className="flex justify-between"><span className="text-surface-500">Campaign</span><span className="font-bold">{webReceipt.campaign_name}</span></div>}
                <div className="flex justify-between"><span className="text-surface-500">Date</span><span className="font-bold">{new Date(webReceipt.donation_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Status</span><Badge variant="success">{webReceipt.status}</Badge></div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-red-500">Failed to load receipt.</div>
          )}
        </Modal>
      )}
    </div>
  );
}
