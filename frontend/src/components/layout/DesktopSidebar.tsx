import { NavLink, Link } from 'react-router-dom';
import { Home, Search, Map as MapIcon, Bell, User, Building2, HeartHandshake, Calendar, Shield, ShieldAlert, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUI } from '@/contexts/UIContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { usePermissions } from '@/hooks/usePermissions';

export default function DesktopSidebar() {
  const { t } = useTranslation();
  const { openNotifications } = useUI();
  const token = localStorage.getItem('access_token');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
    enabled: !!token,
  });

  const { canAny, isAdmin } = usePermissions();

  const isAuthenticated = !!user && !!token;

  // Base public links for all users (including Guest)
  const publicLinks = [
    { name: t('nav.home', 'Home'), path: '/explore', icon: Home },
    { name: t('nav.explore', 'Explore'), path: '/search', icon: Search },
    { name: t('nav.businesses', 'Businesses'), path: '/businesses', icon: Building2 },
    { name: t('nav.charities', 'Charities'), path: '/charities', icon: HeartHandshake },
    { name: t('nav.events', 'Events'), path: '/events', icon: Calendar },
    { name: t('nav.map', 'Map'), path: '/map', icon: MapIcon },
  ];

  // Authenticated user extra links
  const authLinks = isAuthenticated
    ? [
        { name: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell },

        ...(isAdmin ? [{ name: 'Admin Console', path: '/admin', icon: ShieldAlert }] : []),
        { name: t('nav.dashboard', 'Dashboard'), path: '/dashboard', icon: User },
        { name: t('nav.myOrganizations', 'My Orgs'), path: '/my-organizations', icon: Building2 },
      ]
    : [];

  const mainLinks = [...publicLinks, ...authLinks];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 border-r border-surface-200 bg-white pt-6 pb-8 px-4 overflow-y-auto z-30">
      {/* Logo */}
      <Link to="/explore" className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-surface-900 leading-none">ummah</span>
          <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-widest mt-0.5">Directory</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {mainLinks.map((link) => {
          if (link.path === '/notifications') {
            return (
              <button
                key={link.path}
                onClick={openNotifications}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium"
              >
                <link.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 stroke-[2px]" />
                <span className="text-sm font-semibold">{link.name}</span>
              </button>
            )
          }

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-bold shadow-xs'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'stroke-[2.5px] text-primary-600' : 'stroke-[2px]'
                    }`}
                  />
                  <span className="text-sm">{link.name}</span>
                  {link.path === '/admin' && (
                    <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Admin
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Add Listing Action Button - only if user can create any org type */}
      {isAuthenticated && canAny('business.create', 'mosque.create', 'charity.create', 'education.create') && (
        <div className="mt-6 px-2">
          <Link
            to="/organizations/new"
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-primary-700 hover:shadow-lg transition-all active:scale-95"
          >
            <span>+ {t('action.addListing', 'Add Listing')}</span>
          </Link>
        </div>
      )}
      
      {/* Bottom Account Section */}
      <div className="mt-auto pt-6 px-2 space-y-2 border-t border-gray-100">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-surface-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-surface-900 truncate">{user?.full_name || 'My Account'}</p>
                <p className="text-[11px] text-surface-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
              </div>
            </Link>

            <button 
              onClick={async () => {
                try {
                  await api.post('/auth/logout');
                } catch (e) {
                  console.error(e);
                } finally {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  window.location.href = '/login';
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-600 hover:bg-red-50 transition-colors text-left font-medium text-xs"
            >
              <LogOut className="w-4 h-4 ml-1" />
              <span>Log Out</span>
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <p className="text-xs font-semibold text-emerald-900 mb-0.5">Join the Community</p>
              <p className="text-[11px] text-emerald-700">Log in to create listings, write reviews, and save favorites.</p>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-primary-700 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </Link>

            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-2 bg-white text-surface-700 border border-surface-200 rounded-xl font-semibold text-xs hover:bg-surface-50 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-surface-500" />
              <span>Create Account</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
