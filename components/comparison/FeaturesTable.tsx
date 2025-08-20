'use client';

import React from 'react';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { Car } from '@/types/comparison';
import { FEATURE_METADATA } from '@/utils/comparison/constants';
import { calculateValueScore, calculateEnvironmentalScore } from '@/utils/comparison/calculations';
import { ValueComparisonChart } from './ValueComparisonChart';

interface FeaturesTabProps {
  car1: Car;
  car2: Car;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ car1, car2 }) => {
  const renderFeatureComparison = (filterByCategory?: string) => {
    const allFeatures = Array.from(new Set([
      ...(car1.features || []),
      ...(car2.features || [])
    ]));

    const filteredFeatures = filterByCategory
      ? allFeatures.filter(feature => FEATURE_METADATA[feature]?.category === filterByCategory)
      : allFeatures;

    if (filteredFeatures.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {filterByCategory
            ? `No ${filterByCategory} features available for comparison`
            : 'No feature information available for comparison'}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredFeatures.map((feature) => {
          const hasCar1 = car1.features?.includes(feature);
          const hasCar2 = car2.features?.includes(feature);
          const metadata = FEATURE_METADATA[feature] || {
            label: feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: 'Car feature',
            importance: 'medium',
            category: 'technology'
          };

          const importanceBorderColor = {
            high: 'border-l-4 border-l-orange-500',
            medium: 'border-l-2 border-l-blue-500',
            low: 'border-l border-l-gray-400'
          }[metadata.importance];

          return (
            <div
              key={feature}
              className={`grid grid-cols-3 gap-4 py-3 px-4 rounded-lg ${importanceBorderColor} ${
                hasCar1 && hasCar2 ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              {/* Feature Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {metadata.label}
                  </span>
                  {metadata.importance === 'high' && (
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                  )}
                </div>
                <p className="text-xs text-gray-600">{metadata.description}</p>
              </div>

              {/* Car 1 Availability */}
              <div className="flex items-center justify-center">
                {hasCar1 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>

              {/* Car 2 Availability */}
              <div className="flex items-center justify-center">
                {hasCar2 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Value Comparison Chart */}
      <ValueComparisonChart car1={car1} car2={car2} />

      {/* All Features */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Features</h3>
        
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200 mb-4">
          <div className="text-sm font-medium text-gray-700">Feature</div>
          <div className="text-center text-sm font-medium text-gray-700">{car1.make}</div>
          <div className="text-center text-sm font-medium text-gray-700">{car2.make}</div>
        </div>

        {renderFeatureComparison()}
      </div>

      {/* Safety Features */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Features</h3>
        {renderFeatureComparison('safety')}
      </div>

      {/* Comfort Features */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comfort Features</h3>
        {renderFeatureComparison('comfort')}
      </div>

      {/* Technology Features */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology Features</h3>
        {renderFeatureComparison('technology')}
      </div>
    </div>
  );
};