import { motion } from 'framer-motion';
import { Utensils, ShoppingBag, BookOpen, HeartPulse, Building2, Palmtree, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  { name: 'Halal Dining', icon: Utensils, count: '320+' },
  { name: 'Retail & Fashion', icon: ShoppingBag, count: '150+' },
  { name: 'Education', icon: BookOpen, count: '85+' },
  { name: 'Health & Wellness', icon: HeartPulse, count: '110+' },
  { name: 'Professional Services', icon: Building2, count: '200+' },
  { name: 'Travel & Tours', icon: Palmtree, count: '45+' },
];

export default function CategoriesSection() {
  const navigate = useNavigate();

  return (
    <section id="categories" className="py-24 bg-white border-t border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Explore by category
            </h2>
            <p className="text-lg text-surface-600">
              Whatever you're looking for, find trusted and verified local services that align with your values.
            </p>
          </div>
          <button 
            onClick={() => navigate('/explore')}
            className="flex items-center text-emerald-600 font-medium hover:text-emerald-700 group transition-colors whitespace-nowrap"
          >
            View all categories
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => navigate('/explore')}
              className="group cursor-pointer bg-surface-50 hover:bg-emerald-50 border border-surface-100 hover:border-emerald-200 rounded-2xl p-6 flex items-center gap-5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <category.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 group-hover:text-emerald-900 transition-colors">{category.name}</h3>
                <p className="text-sm text-surface-500">{category.count} listings</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
