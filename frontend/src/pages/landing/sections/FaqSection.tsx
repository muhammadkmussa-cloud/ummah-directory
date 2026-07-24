import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Is it free to list my business or mosque?",
    answer: "Yes! Creating a basic profile for your business, charity, or mosque is completely free. We believe in providing equal access to the community for all verified organizations."
  },
  {
    question: "How do you verify organizations?",
    answer: "Our moderation team manually reviews every organization submission. We require official documentation, verify contact details, and cross-reference public records to ensure absolute trust within our platform."
  },
  {
    question: "Can I accept donations through ummah Directory?",
    answer: "Yes. Registered charities and mosques can integrate with our payment providers (Stripe, PayPal, M-Pesa) to securely accept one-time or recurring donations directly from their profile pages."
  },
  {
    question: "How do community reviews work?",
    answer: "Only authenticated users can leave reviews. We employ strict moderation guidelines to ensure all feedback is constructive, genuine, and adheres to our community standards."
  },
  {
    question: "Do I need an account to use the directory?",
    answer: "No, anyone can browse the directory, read reviews, and find local services. However, you need a free account to leave reviews, save favorites, or claim an organization profile."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-surface-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-surface-600">
            Everything you need to know about ummah Directory and how it works.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl border transition-colors duration-300 ${
                openIndex === idx ? 'border-emerald-200 shadow-md' : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
              >
                <span className="font-bold text-surface-900 pr-8">{faq.question}</span>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  openIndex === idx ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-100 text-surface-500'
                }`}>
                  {openIndex === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-surface-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
