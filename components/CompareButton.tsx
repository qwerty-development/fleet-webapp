'use client';

import React from 'react';
import { GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompareButtonProps {
  onPress: () => void;
  enabled: boolean;
  inHeader?: boolean;
}

export const CompareButton: React.FC<CompareButtonProps> = ({ 
  onPress, 
  enabled, 
  inHeader = false 
}) => {
  return (
    <motion.button
      whileHover={enabled ? { scale: 1.05 } : {}}
      whileTap={enabled ? { scale: 0.95 } : {}}
      onClick={enabled ? onPress : undefined}
      className={`
        ${inHeader 
          ? 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all' 
          : 'fixed bottom-24 right-6 flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-medium transition-all z-40'
        }
        ${enabled 
          ? 'bg-accent text-white hover:bg-accent/90' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }
      `}
      disabled={!enabled}
    >
      <GitCompare className="w-5 h-5" />
      <span>Compare</span>
    </motion.button>
  );
};