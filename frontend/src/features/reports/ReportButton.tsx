import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flag, X } from 'lucide-react';
import api from '@/lib/api-client';
import { Button, Card } from '@/components/ui';
import { toast } from 'react-hot-toast';

interface Props {
  resourceType: 'business' | 'mosque' | 'charity' | 'education' | 'event' | 'review';
  resourceId: string;
  className?: string;
}

const CATEGORIES = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive Content' },
  { value: 'incorrect', label: 'Incorrect Information' },
  { value: 'duplicate', label: 'Duplicate Listing' },
  { value: 'fraud', label: 'Fraud / Scam' },
  { value: 'closed', label: 'Permanently Closed' },
  { value: 'other', label: 'Other' },
];

export function ReportButton({ resourceType, resourceId, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: () => 
      api.post(`/reports`, null, {
        params: {
          resource_type: resourceType,
          resource_id: resourceId,
          category,
          description: description || undefined,
        }
      }),
    onSuccess: () => {
      toast.success('Thank you. Your report has been submitted for review.');
      setIsOpen(false);
      setCategory('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to submit report. Please try again later.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error('Please select a reason for reporting.');
      return;
    }
    reportMutation.mutate();
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
        title="Report this listing"
      >
        <Flag className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="w-full max-w-md bg-white p-6 relative">
            <button 
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Report Issue</h3>
                <p className="text-sm text-gray-500">Help us keep the directory safe and accurate.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <select 
                  className="input-field w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a reason...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Additional Details (Optional)</label>
                <textarea 
                  className="input-field w-full min-h-[100px] resize-none"
                  placeholder="Please provide more information..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" loading={reportMutation.isPending}>
                  Submit Report
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
