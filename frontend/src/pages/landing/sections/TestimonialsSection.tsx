import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    content: "ummah Directory helped us find a reliable halal caterer for our community event in minutes. The verified reviews gave us complete peace of mind.",
    author: "Aisha R.",
    role: "Community Organizer",
    rating: 5
  },
  {
    content: "Since claiming our business profile, we've seen a 40% increase in local foot traffic. The analytics dashboard is incredibly helpful.",
    author: "Omar F.",
    role: "Restaurant Owner",
    rating: 5
  },
  {
    content: "The easiest way to find prayer times and local events when traveling. It's like having a local guide in my pocket wherever I go.",
    author: "Tariq M.",
    role: "Frequent Traveler",
    rating: 5
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
            Trusted by thousands
          </h2>
          <p className="text-lg text-surface-600">
            Join a growing network of users and organizations building a stronger community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-surface-50 rounded-3xl p-8 border border-surface-100"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <p className="text-surface-700 text-lg leading-relaxed mb-8">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-surface-900">{testimonial.author}</div>
                  <div className="text-sm text-surface-500">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
