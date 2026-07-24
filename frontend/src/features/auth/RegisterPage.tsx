import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api-client';
import { Button, Input } from '@/components/ui';
import AuthLayout from '@/features/auth/components/AuthLayout';

interface RegisterForm {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone?: string;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || undefined,
      });
      navigate('/login', {
        state: {
          message: {
            en: 'Registration successful! Please check your email to verify.',
            ar: 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني.',
          },
        },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Registration failed. Please try again.',
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-center mb-6">{t('nav.register', 'Create Account')}</h1>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('register.fullName', 'Full Name')}
            {...register('full_name', {
              required: t('register.requiredName', 'Name is required'),
            })}
            error={errors.full_name?.message}
          />
          <Input
            label={t('register.email', 'Email')}
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label={t('register.phone', 'Phone (optional)')}
            type="tel"
            {...register('phone')}
          />
          <Input
            label={t('register.password', 'Password')}
            type="password"
            {...register('password', {
              required: t('register.passwordRequired', 'Password is required'),
              minLength: {
                value: 8,
                message: t('register.minLength', 'Minimum 8 characters'),
              },
            })}
            error={errors.password?.message}
          />
          <Input
            label={t('register.confirmPassword', 'Confirm Password')}
            type="password"
            {...register('confirm_password', {
              required: t('register.confirmRequired', 'Please confirm your password'),
              validate: (value) =>
                value === watch('password') ||
                t('register.passwordMatch', 'Passwords do not match'),
            })}
            error={errors.confirm_password?.message}
          />

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors" loading={isSubmitting}>
            {t('register.register', 'Create Account')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('register.haveAccount', "Already have an account?")}{' '}
          <Link
            to="/login"
            className="text-emerald-600 font-medium hover:underline"
          >
            {t('register.signIn', 'Sign In')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}