import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import api from '@/lib/api-client';

export default function LandingNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Check auth status
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    retry: false,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleExploreClick = () => {
    navigate('/explore');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo.svg" alt="Ummah Directory" className="w-10 h-10" />
            <span className="text-xl font-bold text-surface-900 tracking-tight">ummah Directory</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-surface-600 hover:text-emerald-600 font-medium transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/login" className="text-surface-600 hover:text-emerald-600 font-medium text-sm transition-colors">
                  Sign In
                </Link>
                <Button variant="primary" onClick={handleExploreClick} className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20">
                  Explore Directory
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  Dashboard
                </Button>
                <Button variant="primary" onClick={handleExploreClick} className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20">
                  Explore Directory
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-surface-600 hover:text-emerald-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white z-50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-4 border-b border-surface-100 flex justify-end">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-surface-500 hover:bg-surface-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium text-surface-700 hover:text-emerald-600"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
                
                <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-surface-100">
                  {!user ? (
                    <>
                      <Button variant="outline" onClick={() => navigate('/login')} className="w-full justify-center border-emerald-200 text-emerald-700">
                        Sign In
                      </Button>
                      <Button variant="primary" onClick={() => { setIsMobileMenuOpen(false); handleExploreClick(); }} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                        Explore Directory
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full justify-center border-emerald-200 text-emerald-700">
                        Dashboard
                      </Button>
                      <Button variant="primary" onClick={() => { setIsMobileMenuOpen(false); handleExploreClick(); }} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                        Explore Directory
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
