import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, User, Bell, Heart, LogOut, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api-client'
import { useUI } from '@/contexts/UIContext'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
]

export default function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const token = localStorage.getItem('access_token')
  const { openNotifications } = useUI()

  const navLinks = [
    { to: '/explore', label: t('nav.home') },
    { to: '/businesses', label: t('nav.businesses') },
    { to: '/mosques', label: t('nav.mosques') },
    { to: '/charities', label: t('nav.charities') },
    { to: '/events', label: t('nav.events') },
    { to: '/education', label: t('nav.education') },
    { to: '/map', label: 'Map' },
  ]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = code
    setLangOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/explore" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-700">ummah</span>
            <span className="text-xl text-gray-600">Directory</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Globe className="w-5 h-5 text-gray-600" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-gray-50',
                        i18n.language === lang.code && 'text-primary-600 font-medium'
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {token ? (
              <>
                <Link to="/owner/dashboard" className="hidden md:block text-sm text-gray-600 hover:text-primary-600 px-2 py-1">
                  My Business
                </Link>
                <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                  <Heart className="w-5 h-5 text-gray-600" />
                </Link>
                <button onClick={openNotifications} className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                  <Bell className="w-5 h-5 text-gray-600" />
                </button>
                <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-outline text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
              </div>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block text-sm font-medium text-gray-600 py-1"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr />
          {token ? (
            <>
              <Link to="/dashboard" className="block text-sm py-1" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/favorites" className="block text-sm py-1" onClick={() => setMenuOpen(false)}>Favorites</Link>
              <button onClick={handleLogout} className="text-sm text-red-600 py-1">Logout</button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-outline text-sm flex-1 text-center">Login</Link>
              <Link to="/register" className="btn-primary text-sm flex-1 text-center">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
