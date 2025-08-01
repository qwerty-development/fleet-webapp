'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Car } from '@/types/comparison';
import { calculateValueScore, calculateEnvironmentalScore } from '@/utils/comparison/calculations';

interface ValueComparisonChartProps {
  car1: Car;
  car2: Car;
}

export const ValueComparisonChart: React.FC<ValueComparisonChartProps> = ({ car1, car2 }) => {
  const metrics = [
    {
      label: "Value Score",
      car1Value: calculateValueScore(car1),
      car2Value: calculateValueScore(car2),
      maxValue: 100,
      higherIsBetter: true,
    },
    {
      label: "Env. Score",
      car1Value: calculateEnvironmentalScore(car1),
      car2Value: calculateEnvironmentalScore(car2),
      maxValue: 100,
      higherIsBetter: true,
    },
    {
      label: "Features",
      car1Value: car1.features?.length || 0,
      car2Value: car2.features?.length || 0,
      maxValue: 20,
      higherIsBetter: true,
    },
    {
      label: "Price Ratio",
      car1Value: (car1.features?.length || 1) / (car1.price / 10000),
      car2Value: (car2.features?.length || 1) / (car2.price / 10000),
      maxValue: 5,
      higherIsBetter: true,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Value Comparison Matrix</h3>
      
      <div className="space-y-6">
        {metrics.map((metric, index) => {
          const totalValue = metric.car1Value + metric.car2Value;
          let car1Percentage, car2Percentage;

          if (totalValue === 0 || metric.car1Value === metric.car2Value) {
            car1Percentage = 50;
            car2Percentage = 50;
          } else {
            car1Percentage = (metric.car1Value / totalValue) * 100;
            car2Percentage = (metric.car2Value / totalValue) * 100;
            
            if (metric.car1Value > 0 && car1Percentage < 5) car1Percentage = 5;
            if (metric.car2Value > 0 && car2Percentage < 5) car2Percentage = 5;
            
            if (car1Percentage + car2Percentage > 100) {
              const excess = (car1Percentage + car2Percentage) - 100;
              car1Percentage -= (excess * car1Percentage) / (car1Percentage + car2Percentage);
              car2Percentage -= (excess * car2Percentage) / (car1Percentage + car2Percentage);
            }
          }

          const car1IsBetter = metric.higherIsBetter
            ? metric.car1Value > metric.car2Value
            : metric.car1Value < metric.car2Value;
          const car2IsBetter = metric.higherIsBetter
            ? metric.car2Value > metric.car1Value
            : metric.car2Value < metric.car1Value;

          const car1FormattedValue = metric.label === "Price Ratio"
            ? metric.car1Value.toFixed(1)
            : Math.round(metric.car1Value);
          const car2FormattedValue = metric.label === "Price Ratio"
            ? metric.car2Value.toFixed(1)
            : Math.round(metric.car2Value);

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{metric.label}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-orange-600 font-semibold">{car1FormattedValue}</span>
                  <span className="text-blue-600 font-semibold">{car2FormattedValue}</span>
                </div>
              </div>
              
              <div className="flex h-8 rounded-lg overflow-hidden bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${car1Percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`flex items-center justify-end px-2 ${
                    car1IsBetter ? 'bg-orange-500' : 'bg-orange-300'
                  }`}
                >
                  <span className="text-xs text-white font-medium">
                    {car1FormattedValue}
                  </span>
                </motion.div>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${car2Percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`flex items-center justify-start px-2 ${
                    car2IsBetter ? 'bg-blue-500' : 'bg-blue-300'
                  }`}
                >
                  <span className="text-xs text-white font-medium">
                    {car2FormattedValue}
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-600">
            {car1.make} {car1.model}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">
            {car2.make} {car2.model}
          </span>
        </div>
      </div>
    </div>
  );
};