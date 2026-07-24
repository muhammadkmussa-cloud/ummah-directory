import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api-client';
import { Button, Input } from '@/components/ui';
import AuthLayout from '@/features/auth/components/AuthLayout';
import { formatApiError } from '@/lib/error-formatter';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const roleRedirects: Record<string, string> = {
    'super_admin': '/admin',
    moderator: '/moderator',
    'organization_owner': '/owner/dashboard',
    default: '/dashboard',
  };

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      const role = res.data.role ?? 'user';
      const redirect = roleRedirects[role] ?? roleRedirects.default;
      navigate(redirect);
    } catch (err: any) {
      setError(formatApiError(err.response?.data?.detail, 'Login failed. Please check your credentials.'));
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl text-center font-bold mb-2">{t('auth.login', 'Sign In')}</h1>
        <p className="text-sm text-center text-slate-500 mb-6">{t('auth.login.subtitle', 'Select a demo account or sign in with your credentials')}</p>

        {import.meta.env.MODE !== 'production' && (
          <div className="mb-6 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 text-center">
              {t('auth.login.demo', 'Quick Demo Login')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@ummahdirectory.test', 'Admin@123456')}
                className="px-2 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 shadow-sm transition-colors text-center"
              >
                {t('auth.login.demo.admin', 'Admin')}
              </button>
              <button
                type="button"
                onClick={() => fillDemo('moderator1@ummahdirectory.test', 'Moderator@123')}
                className="px-2 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 shadow-sm transition-colors text-center"
              >
                {t('auth.login.demo.moderator', 'Moderator')}
              </button>
              <button
                type="button"
                onClick={() => fillDemo('user1@ummahdirectory.test', 'User@123')}
                className="px-2 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 shadow-sm transition-colors text-center"
              >
                {t('auth.login.demo.user', 'User')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm border border-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('auth.login.email', 'Email')}
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label={t('auth.login.password', 'Password')}
            type="password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />

          <div className="flex items-center justify-end text-sm">
            <Link to="/forgot-password" className="text-emerald-600 hover:underline">
              {t('auth.login.forgot', 'Forgot password?')}
            </Link>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors" loading={isSubmitting}>
            {t('auth.login.button', 'Sign In')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.login.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" className="text-emerald-600 font-medium hover:underline">
            {t('auth.login.signUp', 'Sign Up')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}