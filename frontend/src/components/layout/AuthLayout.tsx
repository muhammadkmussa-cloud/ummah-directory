import React from 'react'
import { ShieldCheck, Compass, Users, HeartHandshake } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  isMobile?: boolean
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 grid grid-cols-1 md:grid-cols-2">
        {/* Left Hero Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">
              Discover, Connect & Grow
            </h1>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              Join thousands of community members exploring verified halal businesses, local mosques, relief charities, and educational institutions.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4 my-8">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Compass className="w-6 h-6 text-emerald-300 mb-2" />
              <p className="text-xs font-bold">Verified Listings</p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">Trusted Directory</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Users className="w-6 h-6 text-emerald-300 mb-2" />
              <p className="text-xs font-bold">Community Feed</p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">Posts & Updates</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <HeartHandshake className="w-6 h-6 text-emerald-300 mb-2" />
              <p className="text-xs font-bold">Direct Support</p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">Charity Relief</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-6 h-6 text-emerald-300 mb-2" />
              <p className="text-xs font-bold">Secure Platform</p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">RBAC & MFA Support</p>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-emerald-200/70">
            © {new Date().getFullYear()} ummah Directory. All rights reserved.
          </div>
        </div>

        {/* Right Form Container */}
        <div className="p-6 md:p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout