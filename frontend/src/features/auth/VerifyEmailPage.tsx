import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api-client';
import { Button } from '@/components/ui';
import AuthLayout from '@/features/auth/components/AuthLayout';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [message, setMessage] = useState('');

  const resend = async () => {
    setStatus({ loading: true });
    try {
      await api.post('/auth/resend-verification', {});
      setMessage(String(t('verifyEmail.resent', 'Verification link resent. Please check your email.')));
      setStatus({ loading: false });
    } catch (err: any) {
      const detail = typeof err.response?.data?.detail === 'string' ? err.response.data.detail : 'Failed to resend';
      setStatus({ loading: false, error: String(t('verifyEmail.resendError', detail)) });
    }
  };

  return (
    <AuthLayout>
      <div className="w-full text-center">
        <h1 className="text-2xl font-bold text-center mb-6">{t('verifyEmail.title', 'Verify Your Email')}</h1>

        {status.error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 mb-4">
            {status.error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200 mb-4">
            {message}
          </div>
        )}

        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">{t('verifyEmail.status', 'Verification pending')}</p>
          <p className="text-xs text-slate-500 mb-4">{t('verifyEmail.checkMail', 'Please check your email for a verification link.')}</p>
          
          <Button onClick={resend} disabled={status.loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors">
            {status.loading ? 'Sending...' : t('verifyEmail.resend', 'Resend Link')}
          </Button>

          <p className="mt-4 text-sm text-gray-600">
            {t('verifyEmail.haveAccount', "Already verified?")}{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline ml-1">
              {t('verifyEmail.signIn', 'Sign In')}
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}