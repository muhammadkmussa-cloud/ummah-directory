import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function Counter({ from, to, duration = 2, label, suffix = '' }: { from: number, to: number, duration?: number, label: string, suffix?: string }) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing function (easeOutExpo)
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(Math.floor(easeOut * (to - from) + from));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };

      animationFrame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, from, to, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-surface-900 mb-2 font-mono">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-base text-surface-600 font-medium">{label}</div>
    </div>
  );
}

export default function StatisticsSection() {
  return (
    <section className="py-20 bg-white border-y border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <Counter from={0} to={12500} label="Verified Businesses" suffix="+" />
          <Counter from={0} to={840} label="Local Mosques" suffix="+" />
          <Counter from={0} to={2.5} label="Donations Raised" suffix="M+" />
          <Counter from={0} to={98} label="Community Trust" suffix="%" />
        </div>
      </div>
    </section>
  );
}
