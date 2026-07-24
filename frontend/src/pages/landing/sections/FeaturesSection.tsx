import { motion } from 'framer-motion';
import { ShieldCheck, Map, MessageSquare, HandHeart, Users, LineChart } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified Organizations',
    description: 'Every business and charity goes through a strict verification process to ensure authenticity and halal compliance.',
    color: 'emerald'
  },
  {
    icon: MessageSquare,
    title: 'Community Reviews',
    description: 'Read and write authentic reviews. Build trust within the community by sharing your genuine experiences.',
    color: 'blue'
  },
  {
    icon: Map,
    title: 'Interactive Maps',
    description: 'Easily locate nearby halal restaurants, local mosques, and community centers with our integrated maps.',
    color: 'gold'
  },
  {
    icon: HandHeart,
    title: 'Secure Donations',
    description: 'Support local charities with one-click secure donations processed via Stripe, PayPal, or M-Pesa.',
    color: 'emerald'
  },
  {
    icon: Users,
    title: 'Prayer Times & Events',
    description: 'Stay connected with your local mosque. Get accurate prayer times and RSVP to community events.',
    color: 'blue'
  },
  {
    icon: LineChart,
    title: 'Business Analytics',
    description: 'Claim your organization to access a powerful dashboard with insights on profile views and engagement.',
    color: 'gold'
  }
];

const colorMap = {
  emerald: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  gold: 'bg-gold-100 text-gold-600'
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
            Everything you need, in one place.
          </h2>
          <p className="text-lg text-surface-600">
            A powerful, all-in-one platform built specifically for the needs of our community. 
            Discover, review, donate, and connect seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-8 border border-surface-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colorMap[feature.color as keyof typeof colorMap]}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-3">{feature.title}</h3>
              <p className="text-surface-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
