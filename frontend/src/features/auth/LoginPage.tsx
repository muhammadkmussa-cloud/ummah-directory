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

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl text-center font-bold mb-2">{t('auth.login', 'Sign In')}</h1>
        <p className="text-sm text-center text-slate-500 mb-6">{t('auth.login.subtitle', 'Sign in with your credentials')}</p>

        {import.meta.env.MODE !== 'production' && (
          <div className="mb-6">
            <select
              className="w-full text-sm border-emerald-200 rounded-xl bg-emerald-50/50 text-emerald-800 focus:ring-emerald-500 p-2.5 outline-none focus:border-emerald-500"
              onChange={(e) => {
                if (!e.target.value) return;
                const [email, pass] = e.target.value.split('|');
                setValue('email', email, { shouldValidate: true });
                setValue('password', pass, { shouldValidate: true });
              }}
              defaultValue=""
            >
              <option value="" disabled>🧪 Select a Test Account (Dev Only)</option>
              <optgroup label="Administrators">
                <option value="admin@ummadirectory.test|Admin@123456">Super Admin (admin)</option>
              </optgroup>
              <optgroup label="Moderators">
                {[1,2,3,4,5].map(i => (
                  <option key={`mod${i}`} value={`moderator${i}@ummadirectory.test|Moderator@123`}>
                    Moderator {i}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Registered Users">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <option key={`user${i}`} value={`user${i}@ummadirectory.test|User@123`}>
                    User {i}
                  </option>
                ))}
              </optgroup>
            </select>
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