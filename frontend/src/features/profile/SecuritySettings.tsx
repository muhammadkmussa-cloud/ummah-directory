import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Lock, Smartphone, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import api from '@/lib/api-client';

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<{ secret: string; provisioning_uri: string } | null>(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: mfaStatus } = useQuery({
    queryKey: ['mfa-status'],
    queryFn: () => api.get('/mfa/status').then(r => r.data),
  });

  const setupMfa = useMutation({
    mutationFn: () => api.post('/mfa/setup'),
    onSuccess: (res) => {
      setSetupData(res.data);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to setup MFA');
    }
  });

  const verifyMfa = useMutation({
    mutationFn: (token: string) => api.post('/mfa/verify', { token }),
    onSuccess: () => {
      setMessage('MFA successfully enabled!');
      setSetupData(null);
      setToken('');
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Invalid verification code');
      setTimeout(() => setError(''), 3000);
    }
  });

  const disableMfa = useMutation({
    mutationFn: () => api.post('/mfa/disable'),
    onSuccess: () => {
      setMessage('MFA has been disabled.');
      queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to disable MFA');
      setTimeout(() => setError(''), 3000);
    }
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const current = (document.getElementById('current_password') as HTMLInputElement).value
    const newPass = (document.getElementById('new_password') as HTMLInputElement).value
    const confirm = (document.getElementById('confirm_password') as HTMLInputElement).value
    if (!current || !newPass) return
    if (newPass !== confirm) { 
      setError('Passwords do not match')
      setTimeout(() => setError(''), 3000)
      return 
    }
    if (newPass.length < 8) { 
      setError('Password must be at least 8 characters')
      setTimeout(() => setError(''), 3000)
      return 
    }
    try {
      await api.post('/users/change-password', { current_password: current, new_password: newPass })
      setMessage('Password changed successfully')
      setTimeout(() => setMessage(''), 3000)
      ;(document.getElementById('current_password') as HTMLInputElement).value = ''
      ;(document.getElementById('new_password') as HTMLInputElement).value = ''
      ;(document.getElementById('confirm_password') as HTMLInputElement).value = ''
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Password Change */}
      <section>
        <div className="mb-6 pb-6 border-b border-surface-100">
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-600" /> Password
          </h2>
          <p className="text-surface-500 text-sm mt-1">Update your password to keep your account secure.</p>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <Input label="Current Password" type="password" id="current_password" required className="bg-surface-50" />
          <div className="grid md:grid-cols-2 gap-5">
            <Input label="New Password" type="password" id="new_password" required className="bg-surface-50" />
            <Input label="Confirm New Password" type="password" id="confirm_password" required className="bg-surface-50" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" className="w-full md:w-auto px-8">
              Update Password
            </Button>
          </div>
        </form>
      </section>

      {/* Two-Factor Authentication */}
      <section className="pt-8 border-t border-surface-200">
        <div className="mb-6 pb-6 border-b border-surface-100">
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" /> Two-Factor Authentication (2FA)
          </h2>
          <p className="text-surface-500 text-sm mt-1">Add an extra layer of security to your account.</p>
        </div>

        <Card className="p-6 bg-surface-50 border-surface-200 shadow-none">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mfaStatus?.mfa_enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-200 text-surface-500'}`}>
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                  Authenticator App
                  {mfaStatus?.mfa_enabled && <Badge variant="success">Enabled</Badge>}
                </h3>
                <p className="text-sm text-surface-500 mt-1 max-w-md">
                  Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                </p>
              </div>
            </div>
            <div>
              {mfaStatus?.mfa_enabled ? (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => disableMfa.mutate()}>
                  Disable
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setupMfa.mutate()}>
                  Set Up
                </Button>
              )}
            </div>
          </div>

          {setupData && !mfaStatus?.mfa_enabled && (
            <div className="mt-6 pt-6 border-t border-surface-200">
              <h4 className="font-bold text-surface-900 mb-4">Setup Instructions</h4>
              <ol className="list-decimal pl-5 space-y-3 text-sm text-surface-600 mb-6">
                <li>Download an authenticator app on your mobile device.</li>
                <li>Add a new account manually using this secret key:</li>
              </ol>
              
              <div className="bg-white p-4 rounded-xl border border-surface-200 flex items-center justify-between mb-6 font-mono font-bold tracking-widest text-lg text-center">
                <span className="mx-auto">{setupData.secret}</span>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-surface-700">Enter the 6-digit code from your app</label>
                <div className="flex gap-3">
                  <Input 
                    value={token} 
                    onChange={(e) => setToken(e.target.value)} 
                    placeholder="000000" 
                    className="max-w-[200px] text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                  <Button variant="primary" onClick={() => verifyMfa.mutate(token)} disabled={token.length !== 6}>
                    Verify & Enable
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
