import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel } from 'lucide-react';
import api from '@/lib/api-client';
import { Card, Button, Input } from '@/components/ui';

interface Appeal {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  moderator_notes?: string | null;
  created_at: string;
}

/**
 * Appeals workflow (workflows.md #30): submit an appeal for a suspended account
 * or organization you own, and track its status.
 */
export default function AppealPage() {
  const queryClient = useQueryClient();
  const [targetType, setTargetType] = useState<'user' | 'organization'>('organization');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  const { data: mine } = useQuery({
    queryKey: ['my-appeals'],
    queryFn: () => api.get('/appeals/mine').then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/appeals', {
        target_type: targetType,
        target_id: targetType === 'organization' ? targetId : undefined,
        reason,
      }),
    onSuccess: () => {
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['my-appeals'] });
    },
  });

  const appeals: Appeal[] = mine?.items ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Gavel className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold">Submit an Appeal</h1>
      </div>

      <Card className="p-5 space-y-4">
        <p className="text-sm text-gray-500">
          If your account or an organization you own has been suspended, you can submit an appeal
          for moderator review.
        </p>

        <label className="block text-sm font-medium">Appeal type</label>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as 'user' | 'organization')}
          className="w-full rounded-lg border border-gray-300 p-2"
        >
          <option value="organization">An organization I own</option>
          <option value="user">My account</option>
        </select>

        {targetType === 'organization' && (
          <Input
            placeholder="Organization ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
        )}

        <label className="block text-sm font-medium">Reason</label>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-2 min-h-24"
          placeholder="Explain why this suspension should be lifted..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {submit.isError && (
          <p className="text-sm text-red-600">
            {(submit.error as any)?.response?.data?.detail || 'Failed to submit appeal'}
          </p>
        )}
        {submit.isSuccess && (
          <p className="text-sm text-green-600">Appeal submitted for review.</p>
        )}

        <Button onClick={() => submit.mutate()} disabled={submit.isPending || !reason.trim()}>
          {submit.isPending ? 'Submitting...' : 'Submit appeal'}
        </Button>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">My appeals</h2>
        {appeals.length === 0 && <p className="text-gray-500 text-sm">No appeals submitted.</p>}
        {appeals.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{a.target_type} appeal</span>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-2 text-sm text-gray-700">{a.reason}</p>
            {a.moderator_notes && (
              <p className="mt-2 text-xs text-gray-500">Moderator: {a.moderator_notes}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    escalated: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
}
