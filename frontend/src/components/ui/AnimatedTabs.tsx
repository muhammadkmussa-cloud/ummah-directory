import { motion } from 'framer-motion';

interface AnimatedTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export default function AnimatedTabs({ tabs, activeTab, onChange }: AnimatedTabsProps) {
  return (
    <div className="flex space-x-1 border-b border-surface-200 hide-scrollbar overflow-x-auto w-full px-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative px-3.5 sm:px-5 py-3.5 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === tab ? 'text-emerald-600 font-bold' : 'text-surface-500 hover:text-surface-800'
          }`}
        >
          {activeTab === tab && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
