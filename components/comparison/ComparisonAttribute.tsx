'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComparisonAttributeProps {
  label: string;
  value1: any;
  value2: any;
  better: number; // 0 = equal, 1 = left is better, 2 = right is better
  icon?: string;
  prefix?: string;
  suffix?: string;
  showBar?: boolean;
  maxValue?: number;
  isHigherBetter?: boolean;
}

export const ComparisonAttribute: React.FC<ComparisonAttributeProps> = ({
  label,
  value1,
  value2,
  better,
  prefix = '',
  suffix = '',
  showBar = false,
  maxValue = 0,
  isHigherBetter = false,
}) => {
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return `${prefix}${value.toLocaleString()}${suffix}`;
    }
    return `${prefix}${value}${suffix}`;
  };

  const getBarWidth = (value: number) => {
    if (!showBar || !maxValue) return 0;
    return Math.min(100, (value / maxValue) * 100);
  };

  const getBetterClass = (isBetter: boolean) => {
    return isBetter ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
  };

  const getBetterTextClass = (isBetter: boolean) => {
    return isBetter ? 'text-green-700 font-semibold' : 'text-gray-700';
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-3 items-center">
      {/* Label */}
      <div className="text-sm font-medium text-gray-600">{label}</div>

      {/* Value 1 */}
      <div className={`relative text-center p-3 rounded-lg border ${getBetterClass(better === 1)}`}>
        <span className={`text-sm ${getBetterTextClass(better === 1)}`}>
          {formatValue(value1)}
        </span>
        
        {better === 1 && (
          <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-600" />
        )}

        {showBar && typeof value1 === 'number' && (
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getBarWidth(value1)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${
                isHigherBetter
                  ? better === 1 ? 'bg-green-500' : 'bg-blue-400'
                  : better === 1 ? 'bg-green-500' : 'bg-red-400'
              }`}
            />
          </div>
        )}
      </div>

      {/* Value 2 */}
      <div className={`relative text-center p-3 rounded-lg border ${getBetterClass(better === 2)}`}>
        <span className={`text-sm ${getBetterTextClass(better === 2)}`}>
          {formatValue(value2)}
        </span>
        
        {better === 2 && (
          <CheckCircle className="absolute top-1 right-1 w-4 h-4 text-green-600" />
        )}

        {showBar && typeof value2 === 'number' && (
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getBarWidth(value2)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${
                isHigherBetter
                  ? better === 2 ? 'bg-green-500' : 'bg-blue-400'
                  : better === 2 ? 'bg-green-500' : 'bg-red-400'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};