import { motion } from 'framer-motion';
import { ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-gold-400/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-emerald-500" />
              <span>The #1 Muslim Directory</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 tracking-tight leading-[1.1] mb-6">
              Connect with your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
                local ummahh.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-surface-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover verified halal businesses, mosques, charities, and services. 
              Build a stronger community with trust, transparency, and shared values.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-lg px-8 h-14 rounded-full shadow-lg shadow-emerald-600/20 group"
              >
                Explore Directory
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto border-surface-200 text-surface-700 hover:bg-surface-50 text-lg px-8 h-14 rounded-full"
              >
                List your business
              </Button>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-surface-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Verified Listings
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-500" />
                Community Reviews
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
