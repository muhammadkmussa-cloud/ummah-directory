import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DesktopSidebar from './DesktopSidebar'
import RightSidebar from './RightSidebar'
import BottomNav from './BottomNav'
import { UIProvider, useUI } from '@/contexts/UIContext'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'

function LayoutContent() {
  const { i18n } = useTranslation()
  const { isNotificationsOpen, closeNotifications } = useUI()

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <div className="min-h-screen bg-surface-50 flex justify-center selection:bg-primary-200 selection:text-primary-900 w-full overflow-x-hidden">
      <div className="w-full max-w-[1600px] flex min-w-0 overflow-x-hidden">
        
        {/* Left Sidebar - Desktop Only */}
        <DesktopSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-20 md:pb-0 relative border-l border-r border-transparent md:border-surface-200 bg-white w-full max-w-full">
          <Outlet />
        </main>

        {/* Right Sidebar - Large Desktop Only */}
        <RightSidebar />
        
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
      
      <NotificationsSheet isOpen={isNotificationsOpen} onClose={closeNotifications} />
    </div>
  )
}

export default function Layout() {
  return (
    <UIProvider>
      <LayoutContent />
    </UIProvider>
  )
}
