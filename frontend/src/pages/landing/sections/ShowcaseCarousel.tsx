import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutDashboard, BarChart3, Users, Settings } from 'lucide-react';

const showcases = [
  {
    id: 'dashboard',
    title: 'Business Dashboard',
    description: 'Manage your organization profile, respond to reviews, and track analytics from a unified dashboard.',
    icon: LayoutDashboard,
    color: 'emerald'
  },
  {
    id: 'analytics',
    title: 'Powerful Analytics',
    description: 'Understand your audience with detailed insights into profile views, click-through rates, and user engagement.',
    icon: BarChart3,
    color: 'blue'
  },
  {
    id: 'roles',
    title: 'Team Management',
    description: 'Invite staff members, assign roles, and securely manage access to your organization dashboard.',
    icon: Users,
    color: 'gold'
  }
];

export default function ShowcaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcases.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? showcases.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % showcases.length);
  };

  return (
    <section id="showcase" className="py-24 bg-surface-50 border-t border-surface-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 w-full max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-6">
              Built for organizations to thrive
            </h2>
            <p className="text-lg text-surface-600 mb-8">
              Claim your listing to unlock powerful tools designed to help you manage your presence, engage with the community, and track your growth.
            </p>

            <div className="space-y-4 mb-8">
              {showcases.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                    currentIndex === idx 
                      ? 'bg-white border-emerald-200 shadow-md' 
                      : 'bg-transparent border-transparent hover:bg-surface-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      currentIndex === idx ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-200 text-surface-500'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${currentIndex === idx ? 'text-surface-900' : 'text-surface-600'}`}>
                        {item.title}
                      </h4>
                      <AnimatePresence>
                        {currentIndex === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-sm text-surface-500 mt-1">
                              {item.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrevious}
                className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNext}
                className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-2xl relative perspective-1000">
            {/* Mockup Container */}
            <div className="relative rounded-2xl bg-white border border-surface-200 shadow-2xl overflow-hidden aspect-[4/3] transform transition-transform duration-700">
              
              {/* Header bar mock */}
              <div className="h-12 border-b border-surface-100 bg-surface-50 flex items-center px-4 gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 h-6 bg-white rounded flex items-center px-3 border border-surface-200">
                  <div className="w-32 h-2 bg-surface-200 rounded" />
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="p-6 h-full flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                  >
                    {currentIndex === 0 && (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="w-32 h-24 bg-surface-100 rounded-xl" />
                          <div className="w-32 h-24 bg-surface-100 rounded-xl" />
                          <div className="w-32 h-24 bg-surface-100 rounded-xl" />
                        </div>
                        <div className="w-full h-40 bg-surface-100 rounded-xl mt-6" />
                      </div>
                    )}
                    {currentIndex === 1 && (
                      <div className="space-y-4 h-full flex flex-col">
                        <div className="w-full h-32 bg-blue-50 border border-blue-100 rounded-xl" />
                        <div className="flex gap-4 flex-1">
                          <div className="flex-1 bg-surface-100 rounded-xl" />
                          <div className="w-1/3 bg-surface-100 rounded-xl" />
                        </div>
                      </div>
                    )}
                    {currentIndex === 2 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                          <div className="w-24 h-4 bg-surface-200 rounded" />
                          <div className="w-16 h-6 bg-emerald-100 rounded-full" />
                        </div>
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-surface-200" />
                              <div className="w-32 h-3 bg-surface-200 rounded" />
                            </div>
                            <Settings className="w-4 h-4 text-surface-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
