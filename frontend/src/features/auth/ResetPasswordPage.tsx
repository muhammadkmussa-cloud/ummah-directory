import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api-client';
import { Input, Button } from '@/components/ui';
import AuthLayout from '@/features/auth/components/AuthLayout';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      await api.post('/auth/reset-password', { email });
      setMessage(String(t('resetPassword.success', 'Password reset email sent. Check your inbox.')));
      setStatus({ loading: false });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const detail = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Request failed';
      setStatus({ loading: false, error: String(t('resetPassword.error', detail)) });
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-center mb-6">{t('resetPassword.title', 'Reset Password')}</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label={t('resetPassword.email', 'Email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('resetPassword.placeholder', 'you@example.com')}
            required
          />

          <Button type="submit" disabled={status.loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors">
            {status.loading ? t('resetPassword.sending', 'Sending...') : t('resetPassword.reset', 'Reset Password')}
          </Button>

          {status.error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {status.error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200">
              {message}
            </div>
          )}

          <p className="text-center text-sm mt-6">
            {t('resetPassword.haveLogin', "Have an account?")}{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline ml-1">
              {t('resetPassword.signIn', 'Sign In')}
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}