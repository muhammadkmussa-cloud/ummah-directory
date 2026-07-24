import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Save } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Input } from '@/components/ui';
import { toast } from 'react-hot-toast';

export default function AdminPaymentConfig() {
  const queryClient = useQueryClient();
  const [stripeKey, setStripeKey] = useState('');
  const [mpesaKey, setMpesaKey] = useState('');
  const [mpesaSecret, setMpesaSecret] = useState('');

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin', 'payment-providers'],
    queryFn: () => api.get('/admin/payment-providers').then(r => r.data),
  });

  const saveProvider = useMutation({
    mutationFn: (data: { name: string; is_active: boolean; credentials: any }) => 
      api.post('/admin/payment-providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-providers'] });
      toast.success('Payment provider saved successfully');
    },
    onError: () => toast.error('Failed to save payment provider')
  });

  if (isLoading) return <div className="p-8 text-center text-surface-500 animate-pulse">Loading configurations...</div>;

  return (
    <Card className="p-0 overflow-hidden border border-surface-200 shadow-sm">
      <div className="px-6 py-4 border-b border-surface-200 bg-surface-50">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-600" />
          Payment Gateways
        </h2>
        <p className="text-sm text-surface-500 mt-1">Configure API keys and webhooks for Stripe, M-Pesa, etc.</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Stripe Config */}
        <div className="space-y-4 max-w-xl">
          <div>
            <h3 className="font-bold text-surface-900 mb-1">Stripe Configuration</h3>
            <p className="text-sm text-surface-500">Enable card payments internationally.</p>
          </div>
          <div className="space-y-4">
            <Input 
              label="Stripe Secret Key" 
              type="password" 
              placeholder="sk_test_..." 
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
            />
            <Button 
              onClick={() => saveProvider.mutate({ name: 'stripe', is_active: true, credentials: { secret_key: stripeKey } })}
              disabled={saveProvider.isPending || !stripeKey}
            >
              <Save className="w-4 h-4 mr-2" /> Save Stripe Config
            </Button>
          </div>
        </div>

        <hr className="border-surface-200" />

        {/* M-Pesa Config */}
        <div className="space-y-4 max-w-xl">
          <div>
            <h3 className="font-bold text-surface-900 mb-1">M-Pesa Configuration (Daraja API)</h3>
            <p className="text-sm text-surface-500">Enable mobile money payments in East Africa.</p>
          </div>
          <div className="space-y-4">
            <Input 
              label="Consumer Key" 
              placeholder="Daraja consumer key" 
              value={mpesaKey}
              onChange={(e) => setMpesaKey(e.target.value)}
            />
            <Input 
              label="Consumer Secret" 
              type="password" 
              placeholder="Daraja consumer secret" 
              value={mpesaSecret}
              onChange={(e) => setMpesaSecret(e.target.value)}
            />
            <Button 
              onClick={() => saveProvider.mutate({ name: 'mpesa', is_active: true, credentials: { consumer_key: mpesaKey, consumer_secret: mpesaSecret } })}
              disabled={saveProvider.isPending || !mpesaKey || !mpesaSecret}
            >
              <Save className="w-4 h-4 mr-2" /> Save M-Pesa Config
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
