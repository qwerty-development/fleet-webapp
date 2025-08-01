'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TabNavigationProps {
  activeTab: 'basics' | 'features' | 'cost' | 'summary';
  onTabChange: (tab: 'basics' | 'features' | 'cost' | 'summary') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'features', label: 'Features' },
    { id: 'cost', label: 'Cost' },
    { id: 'summary', label: 'Summary' },
  ] as const;

  return (
    <div className="border-b border-gray-200">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative py-4 px-1 font-medium text-sm transition-colors
              ${activeTab === tab.id ? 'text-accent' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};