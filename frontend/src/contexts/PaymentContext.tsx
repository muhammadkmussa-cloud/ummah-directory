import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, CreditCard, Smartphone } from 'lucide-react';
import { Card, Button, Input, Modal } from '@/components/ui';
import api from '@/lib/api-client';

interface PaymentOptions {
  amount: number;
  currency?: string;
  reference_type: string;
  reference_id: string;
  metadata?: Record<string, any>;
  onSuccess?: (payment_id: string) => void;
  onCancel?: () => void;
}

interface PaymentContextType {
  initiatePayment: (options: PaymentOptions) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'mpesa' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const createIntent = useMutation({
    mutationFn: (gateway: string) => {
      if (options?.reference_type === 'donation') {
        return api.post('/donations/initiate', {
          amount: options.amount.toString(),
          currency: options.currency || 'KES',
          payment_gateway: gateway,
          campaign_id: options.metadata?.campaign_id || undefined,
          charity_id: options.reference_id,
          idempotency_key: undefined
        }).then(r => r.data)
      }
      return api.post('/payments/create-intent', {
        amount: options?.amount,
        currency: options?.currency || 'KES',
        gateway,
        reference_type: options?.reference_type,
        reference_id: options?.reference_id,
        metadata: { ...options?.metadata, phone: phoneNumber }
      }).then(r => r.data)
    },
    onSuccess: (data) => {
      // In a real app, this would trigger Stripe SDK or M-Pesa STK push.
      // For the prototype, we simulate a successful payment.
      toast.success('Payment initiated successfully!');
      if (options?.onSuccess) {
        options.onSuccess(data.payment_id || data.donation_id);
      }
      closeModal();
    },
    onError: () => {
      toast.error('Failed to initiate payment');
    }
  });

  const initiatePayment = (paymentOptions: PaymentOptions) => {
    setOptions(paymentOptions);
    setSelectedGateway(null);
    setPhoneNumber('');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    if (options?.onCancel) {
      options.onCancel();
    }
    setTimeout(() => {
      setOptions(null);
      setSelectedGateway(null);
    }, 300);
  };

  const handleConfirm = () => {
    if (!selectedGateway) return;
    if (selectedGateway === 'mpesa' && !phoneNumber) {
      toast.error('Please enter M-Pesa phone number');
      return;
    }
    createIntent.mutate(selectedGateway);
  };

  return (
    <PaymentContext.Provider value={{ initiatePayment }}>
      {children}
      
      {isOpen && options && (
        <Modal isOpen={isOpen} onClose={closeModal} title="Complete Payment">
          <div className="space-y-6">
            <div className="bg-surface-50 p-4 rounded-lg text-center border border-surface-200">
              <p className="text-surface-500 text-sm mb-1">Amount to pay</p>
              <p className="text-3xl font-bold text-surface-900">
                {options.currency || 'KES'} {options.amount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-semibold text-surface-900">Select Payment Method</p>
              
              <div 
                className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${
                  selectedGateway === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-surface-200 hover:border-green-300'
                }`}
                onClick={() => setSelectedGateway('mpesa')}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-surface-900">M-Pesa</h4>
                  <p className="text-sm text-surface-500">Pay via STK Push</p>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${
                  selectedGateway === 'stripe' ? 'border-indigo-500 bg-indigo-50' : 'border-surface-200 hover:border-indigo-300'
                }`}
                onClick={() => setSelectedGateway('stripe')}
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-surface-900">Credit / Debit Card</h4>
                  <p className="text-sm text-surface-500">Powered by Stripe</p>
                </div>
              </div>
            </div>

            {selectedGateway === 'mpesa' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Input
                  label="M-Pesa Phone Number"
                  placeholder="e.g. 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            )}

            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleConfirm}
              disabled={!selectedGateway || createIntent.isPending}
            >
              {createIntent.isPending ? 'Processing...' : `Pay ${options.currency || 'KES'} ${options.amount.toLocaleString()}`}
            </Button>
          </div>
        </Modal>
      )}
    </PaymentContext.Provider>
  );
};
