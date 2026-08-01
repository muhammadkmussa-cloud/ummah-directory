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
import OwnerDashboard from '@/features/owner/OwnerDashboard'
import FollowFeed from '@/features/follows/FollowFeed'
import BusinessCreatePage from '@/features/businesses/BusinessCreatePage'
import MosqueDashboard from '@/features/mosques/MosqueDashboard'
import CharityDashboard from '@/features/charities/CharityDashboard'
import AppealPage from '@/features/appeals/AppealPage'


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
            <Route path="/donate/:id" element={<AuthRoute><PaymentReceiptPage /></AuthRoute>} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={<AuthRoute><DashboardPage /></AuthRoute>} />
            <Route path="/feed" element={<AuthRoute><FollowFeed /></AuthRoute>} />
            <Route path="/appeals" element={<AuthRoute><AppealPage /></AuthRoute>} />
            <Route path="/profile" element={<AuthRoute><ProfilePage /></AuthRoute>} />
            <Route path="/notifications/preferences" element={<AuthRoute><NotificationPreferencesPage /></AuthRoute>} />
            <Route path="/favorites" element={<AuthRoute><FavoritesPage /></AuthRoute>} />
            <Route path="/prayer-times/me" element={<AuthRoute><PrayerTimesPreferences /></AuthRoute>} />


            {/* Organizations */}
            <Route path="/my-organizations" element={<AuthRoute><MyOrganizations /></AuthRoute>} />
            <Route path="/organizations/new" element={<AuthRoute><CreateOrganizationWizard /></AuthRoute>} />
            <Route path="/my-organizations/:id/staff" element={<AuthRoute><StaffManager /></AuthRoute>} />
            <Route path="/my-organizations/:slug" element={<AuthRoute><OrganizationProfileView /></AuthRoute>} />
            <Route path="/my-organizations/:id/manage" element={<AuthRoute><BusinessManager /></AuthRoute>} />

            {/* Owner Dashboard */}
            <Route path="/owner/dashboard" element={<AuthRoute><OwnerDashboard /></AuthRoute>} />

            {/* Organization Management */}
            <Route path="/owner/businesses/:id/manage" element={<AuthRoute><BusinessManager /></AuthRoute>} />
            <Route path="/charity/charities/:id/manage" element={<AuthRoute><CampaignManager /></AuthRoute>} />
            <Route path="/mosque/mosques/:id/manage" element={<AuthRoute><PrayerTimeManager /></AuthRoute>} />
            <Route path="/owner/education/:id/manage" element={<AuthRoute><EducationManager /></AuthRoute>} />

            {/* Direct creation pages */}
            <Route path="/businesses/new" element={<AuthRoute><BusinessCreatePage /></AuthRoute>} />

            {/* Dashboard routes */}
            <Route path="/mosque/dashboard" element={<AuthRoute><MosqueDashboard /></AuthRoute>} />
            <Route path="/charity/dashboard" element={<AuthRoute><CharityDashboard /></AuthRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AuthRoute><AdminDashboard /></AuthRoute>} />

            {/* Campaign & Analytics */}
            <Route path="/campaigns/:id" element={<AuthRoute><CampaignDetail /></AuthRoute>} />
            <Route path="/analytics" element={<AuthRoute><AnalyticsDashboard /></AuthRoute>} />

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
