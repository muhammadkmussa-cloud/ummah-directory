import { NavLink } from 'react-router-dom';
import { Home, Search, Map as MapIcon, Bell, User, ShieldAlert, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUI } from '@/contexts/UIContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { usePermissions } from '@/hooks/usePermissions';

export default function BottomNav() {
  const { openNotifications } = useUI();
  const token = localStorage.getItem('access_token');
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then(r => r.data),
    retry: false,
    enabled: !!token,
  });

  const { isAdmin } = usePermissions();

  const isAuthenticated = !!user && !!token;

  const guestNavItems = [
    { name: 'Home', path: '/explore', icon: Home },
    { name: 'Explore', path: '/search', icon: Search },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Login', path: '/login', icon: LogIn },
  ];

  const userNavItems = [
    { name: 'Home', path: '/explore', icon: Home },
    { name: 'Explore', path: '/search', icon: Search },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Alerts', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/dashboard', icon: User },
  ];

  const adminNavItems = [
    { name: 'Home', path: '/explore', icon: Home },
    { name: 'Explore', path: '/search', icon: Search },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Admin', path: '/admin', icon: ShieldAlert },
    { name: 'Profile', path: '/dashboard', icon: User },
  ];

  const navItems = !isAuthenticated
    ? guestNavItems
    : isAdmin
    ? adminNavItems
    : userNavItems;

  const gridColsClass = navItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-surface-200/60 md:hidden bg-white/95 backdrop-blur-md pb-safe">
      <div className={`grid ${gridColsClass} items-center h-16 px-1 w-full max-w-md mx-auto`}>
        {navItems.map((item) => {
          if (item.path === '/notifications') {
            return (
              <button
                key={item.path}
                onClick={openNotifications}
                className="relative flex flex-col items-center justify-center w-full h-full py-1 text-surface-500 hover:text-surface-900 transition-colors"
              >
                <item.icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-[10px] font-semibold tracking-tight truncate w-full text-center mt-0.5 px-0.5">
                  {item.name}
                </span>
              </button>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full h-full py-1 ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-surface-500 hover:text-surface-900'
                } transition-colors`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 top-1.5 bottom-1.5 w-10 mx-auto bg-emerald-50 rounded-2xl -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`}
                  />
                  <span className="text-[10px] font-semibold tracking-tight truncate w-full text-center mt-0.5 px-0.5">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  );
}
