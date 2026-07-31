import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Printer, ArrowLeft, RotateCcw } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button } from '@/components/ui';
import { toast } from 'react-hot-toast';

export default function PaymentReceiptPage() {
  const { id } = useParams<{ id: string }>();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.get(`/payments/${id}`).then(r => r.data),
  });

  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: () => api.post(`/payments/${id}/refund`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      toast.success('Refund initiated successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Refund failed.');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-pulse">
        <div className="h-64 bg-surface-100 rounded-xl" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Payment Not Found</h2>
        <p className="text-surface-500 mt-2">We couldn't find a receipt for this transaction.</p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-surface-500 hover:text-surface-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <Card className="p-8 border border-surface-200 shadow-lg text-center relative overflow-hidden">
        {payment.status === 'succeeded' ? (
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-xl">!</span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-surface-900 mb-1">
          {payment.status === 'succeeded' ? 'Payment Successful!' : `Payment ${payment.status}`}
        </h1>
        <p className="text-surface-500">
          Transaction Reference: <span className="font-mono text-sm">{payment.id.split('-')[0].toUpperCase()}</span>
        </p>

        <div className="mt-8 pt-8 border-t border-dashed border-surface-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-surface-500">Amount Paid</span>
            <span className="text-2xl font-bold text-surface-900">
              {payment.currency} {payment.amount.toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-500">Date</span>
              <span className="font-medium text-surface-900">
                {new Date(payment.created_at).toLocaleDateString()} at {new Date(payment.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Payment Method</span>
              <span className="font-medium text-surface-900 capitalize">
                {payment.gateway}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Payment For</span>
              <span className="font-medium text-surface-900 capitalize">
                {payment.reference_type?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 flex justify-center gap-4 flex-wrap">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Receipt
          </Button>
          {payment.status === 'succeeded' && (
            <a href={`/api/v1/payments/${id}/invoice`} download>
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="w-4 h-4" /> Download Invoice
              </Button>
            </a>
          )}
          {payment.status === 'succeeded' && (
            <Button
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (window.confirm('Are you sure you want to request a refund? This cannot be undone.')) {
                  refundMutation.mutate();
                }
              }}
              loading={refundMutation.isPending}
            >
              <RotateCcw className="w-4 h-4" /> Request Refund
            </Button>
          )}
          <Link to="/dashboard">
            <Button>Continue</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
