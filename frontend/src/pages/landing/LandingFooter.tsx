import { Compass, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 pt-20 pb-10 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ummah Directory</span>
            </div>
            <p className="text-surface-400 leading-relaxed mb-8 max-w-sm">
              The premium directory platform connecting the global Muslim community with verified halal businesses, mosques, and charities.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/explore" className="text-surface-400 hover:text-emerald-400 transition-colors">Explore</Link></li>
              <li><Link to="/businesses" className="text-surface-400 hover:text-emerald-400 transition-colors">Halal Dining</Link></li>
              <li><Link to="/mosques" className="text-surface-400 hover:text-emerald-400 transition-colors">Local Mosques</Link></li>
              <li><Link to="/charities" className="text-surface-400 hover:text-emerald-400 transition-colors">Charities</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Organizations</h4>
            <ul className="space-y-4">
              <li><Link to="/register" className="text-surface-400 hover:text-emerald-400 transition-colors">Claim your listing</Link></li>
              <li><Link to="/pricing" className="text-surface-400 hover:text-emerald-400 transition-colors">Pricing</Link></li>
              <li><Link to="/resources" className="text-surface-400 hover:text-emerald-400 transition-colors">Resources</Link></li>
              <li><Link to="/verification" className="text-surface-400 hover:text-emerald-400 transition-colors">Verification Process</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-surface-400 hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-surface-400 hover:text-emerald-400 transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-surface-400 hover:text-emerald-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-surface-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-surface-500 text-sm">
            &copy; {currentYear} ummah Directory. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-surface-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-surface-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-surface-500 hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
