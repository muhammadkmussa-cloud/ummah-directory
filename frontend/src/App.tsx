import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { PaymentProvider } from '@/contexts/PaymentContext'

import HomePage from '@/pages/HomePage'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import VerifyEmailPage from '@/features/auth/VerifyEmailPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import DashboardPage from '@/features/auth/DashboardPage'
import ProfilePage from '@/features/auth/ProfilePage'
import AuthRoute from "@/features/auth/components/AuthRoute";

import BusinessListPage from '@/features/businesses/BusinessListPage'
import BusinessDetailPage from '@/features/businesses/BusinessDetailPage'
import BusinessManager from '@/features/businesses/BusinessManager'

import MosqueListPage from '@/features/mosques/MosqueListPage'
import MosqueDetailPage from '@/features/mosques/MosqueDetailPage'
import PrayerTimeManager from '@/features/mosques/PrayerTimeManager'

import CharityListPage from '@/features/charities/CharityListPage'
import CharityDetailPage from '@/features/charities/CharityDetailPage'
import CampaignManager from '@/features/charities/CampaignManager'

import EducationListPage from '@/features/education/EducationListPage'
import EducationDetailPage from '@/features/education/EducationDetailPage'
import EducationManager from '@/features/education/EducationManager'

import EventsPage from '@/features/events/EventsPage'
import EventDetailPage from '@/features/events/EventDetailPage'

import SearchPage from '@/features/search/SearchPage'
import CategoryDetailPage from '@/features/categories/CategoryDetailPage'
import AdminDashboard from '@/features/admin/AdminDashboard'
import DonationPage from '@/features/donations/DonationPage'
import NotificationPreferencesPage from '@/features/notifications/NotificationPreferencesPage'
import FavoritesPage from '@/features/interactions/FavoritesPage'
import BlogListPage from '@/features/blog/BlogListPage'
import BlogDetailPage from '@/features/blog/BlogDetailPage'
import MapBrowsePage from '@/features/map/MapBrowsePage'

import MyOrganizations from '@/features/organizations/MyOrganizations'
import StaffManager from '@/features/organizations/StaffManager'
import OrganizationProfileView from '@/features/organizations/OrganizationProfileView'
import CreateOrganizationWizard from '@/features/organizations/CreateOrganizationWizard'

import PageView from '@/pages/PageView'
import NotFoundPage from '@/pages/NotFoundPage'
import CampaignDetail from '@/features/ads/CampaignDetail'
import AnalyticsDashboard from '@/features/analytics/AnalyticsDashboard'
import PrayerTimesPreferences from '@/features/prayer/PrayerTimesPreferences'
import PaymentReceiptPage from '@/features/payments/PaymentReceiptPage'


import { HelmetProvider } from 'react-helmet-async'
import LandingPage from '@/pages/landing/LandingPage'

export default function App() {
  return (
    <HelmetProvider>
      <PaymentProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Standard Page Layout (Header + Sidebar) */}
          <Route element={<Layout />}>
            <Route path="/explore" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories/:slug" element={<CategoryDetailPage />} />
            <Route path="/map" element={<MapBrowsePage />} />

            {/* Businesses */}
            <Route path="/businesses" element={<BusinessListPage />} />
            <Route path="/businesses/:slug" element={<BusinessDetailPage />} />

            {/* Mosques */}
            <Route path="/mosques" element={<MosqueListPage />} />
            <Route path="/mosques/:slug" element={<MosqueDetailPage />} />

            {/* Charities */}
            <Route path="/charities" element={<CharityListPage />} />
            <Route path="/charities/:slug" element={<CharityDetailPage />} />

            {/* Education */}
            <Route path="/education" element={<EducationListPage />} />
            <Route path="/education/:slug" element={<EducationDetailPage />} />

            {/* Events */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />

            {/* Blog */}
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />

            {/* Donations & Payments */}
            <Route path="/donate" element={<DonationPage />} />
            <Route path="/donate/:id" element={<PaymentReceiptPage />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={<AuthRoute><DashboardPage /></AuthRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/prayer-times/me" element={<PrayerTimesPreferences />} />


            {/* Organizations */}
            <Route path="/my-organizations" element={<MyOrganizations />} />
            <Route path="/organizations/new" element={<AuthRoute><CreateOrganizationWizard /></AuthRoute>} />
            <Route path="/my-organizations/:id/staff" element={<StaffManager />} />
            <Route path="/my-organizations/:slug" element={<OrganizationProfileView />} />
            <Route path="/my-organizations/:id/manage" element={<BusinessManager />} />

            {/* Organization Management */}
            <Route path="/owner/businesses/:id/manage" element={<BusinessManager />} />
            <Route path="/charity/charities/:id/manage" element={<CampaignManager />} />
            <Route path="/mosque/mosques/:id/manage" element={<PrayerTimeManager />} />
            <Route path="/owner/education/:id/manage" element={<EducationManager />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Campaign & Analytics */}
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />

            {/* CMS Pages */}
            <Route path="/page/:slug" element={<PageView />} />
            <Route path="/privacy" element={<PageView />} />
            <Route path="/terms" element={<PageView />} />
            <Route path="/cookies" element={<PageView />} />
            <Route path="/donation-policy" element={<PageView />} />
            <Route path="/refund-policy" element={<PageView />} />
          </Route>

          {/* Authentication Routes (Standalone AuthLayout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Redirects */}
          <Route path="/ads" element={<Navigate to="/owner/dashboard?tab=advertising" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PaymentProvider>
    </HelmetProvider>
  )
}
