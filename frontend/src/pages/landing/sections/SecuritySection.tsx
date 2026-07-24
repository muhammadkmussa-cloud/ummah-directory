import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

export default function SecuritySection() {
  return (
    <section className="py-24 bg-surface-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Bank-grade security, built for the community.
            </h2>
            <p className="text-lg text-surface-300 mb-8">
              We take the security of our users and organizations seriously. From verified listings to encrypted donations, every transaction and interaction is protected.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Strict Verification</h4>
                  <p className="text-surface-400">All registered organizations undergo manual verification to ensure authenticity and protect our users.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Role-Based Access</h4>
                  <p className="text-surface-400">Granular permissions ensure that only authorized staff members can manage your organization's profile and data.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Secure Transactions</h4>
                  <p className="text-surface-400">Donations are processed via PCI-compliant payment gateways, ensuring your financial data is never compromised.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-800/50 rounded-3xl p-8 border border-surface-700">
            <h3 className="text-xl font-bold mb-6 text-center">Trusted Payment Partners</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-800 h-24 rounded-2xl border border-surface-700 flex items-center justify-center p-4">
                <span className="text-2xl font-bold tracking-tighter text-blue-400">stripe</span>
              </div>
              <div className="bg-surface-800 h-24 rounded-2xl border border-surface-700 flex items-center justify-center p-4">
                <span className="text-2xl font-bold italic text-blue-300">PayPal</span>
              </div>
              <div className="bg-surface-800 h-24 rounded-2xl border border-surface-700 flex items-center justify-center p-4 col-span-2">
                <span className="text-xl font-bold text-emerald-400 tracking-wider">M-PESA</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
