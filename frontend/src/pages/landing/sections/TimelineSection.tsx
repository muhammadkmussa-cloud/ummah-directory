import { motion } from 'framer-motion';
import { UserPlus, SearchCheck, MapPin, HandHeart } from 'lucide-react';

const steps = [
  {
    icon: SearchCheck,
    title: 'Find what you need',
    description: 'Search our comprehensive directory for halal restaurants, trusted services, local mosques, and charities.'
  },
  {
    icon: MapPin,
    title: 'Explore your area',
    description: 'Use our interactive map to discover organizations near you and get detailed directions.'
  },
  {
    icon: UserPlus,
    title: 'Create an account',
    description: 'Sign up to leave reviews, save favorites, and RSVP to community events happening nearby.'
  },
  {
    icon: HandHeart,
    title: 'Support the community',
    description: 'Donate securely to verified charities or claim your business profile to start managing your presence.'
  }
];

export default function TimelineSection() {
  return (
    <section className="py-24 bg-surface-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How ummah Directory works
          </h2>
          <p className="text-lg text-surface-300">
            A simple, intuitive way to connect with your local community.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-surface-800 -translate-y-1/2 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-6 shadow-xl relative">
                  <step.icon className="w-8 h-8 text-emerald-400" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center border-4 border-surface-900 text-sm">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
