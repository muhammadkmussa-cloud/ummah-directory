import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api-client';
import { Input, Button } from '@/components/ui';
import AuthLayout from '@/features/auth/components/AuthLayout';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage(String(t('forgotPassword.success', 'If an account exists with this email, a reset link has been sent.')));
      setStatus({ loading: false });
    } catch (err: any) {
      const detail = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Request failed';
      setStatus({ loading: false, error: String(t('forgotPassword.error', detail)) });
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-center mb-6">{t('forgotPassword.title', 'Forgot Password')}</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label={t('forgotPassword.email', 'Email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgotPassword.placeholder', 'you@example.com')}
            required
          />

          <Button type="submit" disabled={status.loading} className="w-full">
            {status.loading ? t('forgotPassword.resending', 'Sending...') : t('forgotPassword.reset', 'Reset Password')}
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
            {t('forgotPassword.haveAccount', "Remember your password?")}{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline">
              {t('forgotPassword.signIn', 'Sign In')}
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}