'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Car, ComparisonData } from '@/types/comparison';
import { getBetterValue, calculateValueScore } from '@/utils/comparison/calculations';
import { ComparisonAttribute } from './ComparisonAttribute';

interface BasicsTabProps {
  car1: Car;
  car2: Car;
}

export const BasicsTab: React.FC<BasicsTabProps> = ({ car1, car2 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const maxImages = Math.max(car1.images?.length || 0, car2.images?.length || 0);

  const comparisonData: ComparisonData[] = [
    {
      label: "Price",
      value1: car1.price,
      value2: car2.price,
      better: getBetterValue("price", car1.price, car2.price),
      icon: "currency-usd",
      prefix: "$",
      showBar: true,
      maxValue: Math.max(car1.price, car2.price) * 1.1,
      isHigherBetter: false,
    },
    {
      label: "Year",
      value1: car1.year,
      value2: car2.year,
      better: getBetterValue("year", car1.year, car2.year),
      icon: "calendar",
      showBar: true,
      maxValue: Math.max(car1.year, car2.year),
      isHigherBetter: true,
    },
    {
      label: "Mileage",
      value1: car1.mileage,
      value2: car2.mileage,
      better: getBetterValue("mileage", car1.mileage, car2.mileage),
      icon: "speedometer",
      suffix: " km",
      showBar: true,
      maxValue: Math.max(car1.mileage, car2.mileage) * 1.1,
      isHigherBetter: false,
    },
    {
      label: "Condition",
      value1: car1.condition,
      value2: car2.condition,
      better: 0,
      icon: "car-info",
    },
    {
      label: "Transmission",
      value1: car1.transmission,
      value2: car2.transmission,
      better: 0,
      icon: "car-shift-pattern",
    },
    {
      label: "Color",
      value1: car1.color,
      value2: car2.color,
      better: 0,
      icon: "palette",
    },
    {
      label: "Drivetrain",
      value1: car1.drivetrain,
      value2: car2.drivetrain,
      better: 0,
      icon: "car-traction-control",
    },
    {
      label: "Fuel Type",
      value1: car1.type,
      value2: car2.type,
      better: 0,
      icon: "gas-station",
    },
    {
      label: "Category",
      value1: car1.category,
      value2: car2.category,
      better: 0,
      icon: "car-estate",
    },
    {
      label: "Value Score",
      value1: Math.round(calculateValueScore(car1)),
      value2: Math.round(calculateValueScore(car2)),
      better: getBetterValue("value_score", calculateValueScore(car1), calculateValueScore(car2)),
      icon: "chart-line",
      suffix: "/100",
      showBar: true,
      maxValue: 100,
      isHigherBetter: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Image Gallery Comparison */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Car 1 Image */}
          <div className="space-y-2">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-200">
              {car1.images && car1.images.length > currentImageIndex ? (
                <img
                  src={car1.images[currentImageIndex]}
                  alt={`${car1.make} ${car1.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image available
                </div>
              )}
            </div>
            <p className="text-center text-sm font-medium text-gray-700">
              {car1.year} {car1.make} {car1.model}
            </p>
          </div>

          {/* Car 2 Image */}
          <div className="space-y-2">
            <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-200">
              {car2.images && car2.images.length > currentImageIndex ? (
                <img
                  src={car2.images[currentImageIndex]}
                  alt={`${car2.make} ${car2.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No image available
                </div>
              )}
            </div>
            <p className="text-center text-sm font-medium text-gray-700">
              {car2.year} {car2.make} {car2.model}
            </p>
          </div>
        </div>

        {/* Image Navigation */}
        {maxImages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-gray-600">
              {currentImageIndex + 1} / {maxImages}
            </span>
            
            <button
              onClick={() => setCurrentImageIndex(Math.min(maxImages - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === maxImages - 1}
              className="p-2 rounded-full bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Basic Specifications */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Specifications</h3>
        
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200">
            <div></div>
            <div className="text-center text-sm font-medium text-gray-700">
              {car1.year} {car1.make}
            </div>
            <div className="text-center text-sm font-medium text-gray-700">
              {car2.year} {car2.make}
            </div>
          </div>

          {/* Comparison Rows */}
          {comparisonData.map((item, index) => (
            <ComparisonAttribute key={index} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};