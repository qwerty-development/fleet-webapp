'use client';

import React from 'react';
import { DollarSign, TrendingDown, Gauge, Shield, Wrench, FileText } from 'lucide-react';
import { Car } from '@/types/comparison';
import { calculateTotalCostOfOwnership, calculateFutureValue, getBetterValue } from '@/utils/comparison/calculations';
import { ComparisonAttribute } from './ComparisonAttribute';

interface CostTabProps {
  car1: Car;
  car2: Car;
}

export const CostTab: React.FC<CostTabProps> = ({ car1, car2 }) => {
  const car1CostData = calculateTotalCostOfOwnership(car1);
  const car2CostData = calculateTotalCostOfOwnership(car2);
  
  const costDifference = Math.abs(car1CostData.total - car2CostData.total);
  const percentageDifference = ((costDifference / Math.max(car1CostData.total, car2CostData.total)) * 100).toFixed(1);
  
  const betterCar = car1CostData.total < car2CostData.total ? car1 : car2;

  // Calculate depreciation values
  const car1Age = new Date().getFullYear() - car1.year;
  const car2Age = new Date().getFullYear() - car2.year;
  const car1FutureValue = calculateFutureValue(car1.price, car1Age, 5, car1.category);
  const car2FutureValue = calculateFutureValue(car2.price, car2Age, 5, car2.category);
  const car1LossAmount = car1.price - car1FutureValue;
  const car2LossAmount = car2.price - car2FutureValue;
  const car1LossPercent = (car1LossAmount / car1.price) * 100;
  const car2LossPercent = (car2LossAmount / car2.price) * 100;

  const costCategories = [
    { key: 'depreciation', label: 'Depreciation', icon: TrendingDown },
    { key: 'insurance', label: 'Insurance (5 yr)', icon: Shield },
    { key: 'fuel', label: 'Fuel (5 yr)', icon: Gauge },
    { key: 'maintenance', label: 'Maintenance (5 yr)', icon: Wrench },
    { key: 'registration', label: 'Registration Fee', icon: FileText }
  ];

  return (
    <div className="space-y-8">
      {/* 5-Year Total Cost Overview */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">5-Year Ownership Cost Estimate</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Car 1 Cost Card */}
          <div className={`bg-white rounded-lg p-6 border-2 ${
            car1CostData.total < car2CostData.total ? 'border-green-500' : 'border-gray-200'
          }`}>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              {car1.make} {car1.model}
            </h4>
            <p className={`text-3xl font-bold ${
              car1CostData.total < car2CostData.total ? 'text-green-600' : 'text-gray-900'
            }`}>
              ${car1CostData.total.toLocaleString()}
            </p>
            {car1CostData.total < car2CostData.total && (
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Save ${costDifference.toLocaleString()}
              </div>
            )}
          </div>

          {/* Car 2 Cost Card */}
          <div className={`bg-white rounded-lg p-6 border-2 ${
            car2CostData.total < car1CostData.total ? 'border-green-500' : 'border-gray-200'
          }`}>
            <h4 className="text-sm font-medium text-gray-600 mb-1">
              {car2.make} {car2.model}
            </h4>
            <p className={`text-3xl font-bold ${
              car2CostData.total < car1CostData.total ? 'text-green-600' : 'text-gray-900'
            }`}>
              ${car2CostData.total.toLocaleString()}
            </p>
            {car2CostData.total < car1CostData.total && (
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Save ${costDifference.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            The {betterCar.year} {betterCar.make} {betterCar.model} costs approximately <strong>{percentageDifference}%</strong> less 
            to own and operate over 5 years.
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
        
        <div className="space-y-4">
          {costCategories.map((category) => {
            const Icon = category.icon;
            const car1Value = car1CostData.breakdown[category.key as keyof typeof car1CostData.breakdown];
            const car2Value = car2CostData.breakdown[category.key as keyof typeof car2CostData.breakdown];
            const better = car1Value < car2Value ? 1 : car2Value < car1Value ? 2 : 0;

            if (category.key === 'annualMileage') return null;

            return (
              <div key={category.key} className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{category.label}</span>
                </div>
                
                <div className={`text-center p-3 rounded-lg border ${
                  better === 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-sm font-medium ${
                    better === 1 ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    ${car1Value.toLocaleString()}
                  </span>
                </div>
                
                <div className={`text-center p-3 rounded-lg border ${
                  better === 2 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <span className={`text-sm font-medium ${
                    better === 2 ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    ${car2Value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Total Row */}
          <div className="grid grid-cols-3 gap-4 items-center pt-4 border-t-2 border-gray-300">
            <div className="font-semibold text-gray-900">TOTAL</div>
            <div className={`text-center p-3 rounded-lg ${
              car1CostData.total < car2CostData.total 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <span className="font-bold">${car1CostData.total.toLocaleString()}</span>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              car2CostData.total < car1CostData.total 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <span className="font-bold">${car2CostData.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Depreciation Estimate */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Depreciation Estimate</h3>
        <p className="text-sm text-gray-600 mb-4">
          Estimated value after 5 years of ownership based on average depreciation rates.
        </p>
        
        <div className="space-y-2">
          <ComparisonAttribute
            label="Value Now"
            value1={car1.price}
            value2={car2.price}
            better={0}
            prefix="$"
          />
          <ComparisonAttribute
            label="Value in 5 Years"
            value1={car1FutureValue}
            value2={car2FutureValue}
            better={0}
            prefix="$"
          />
          <ComparisonAttribute
            label="Total Depreciation"
            value1={car1LossAmount}
            value2={car2LossAmount}
            better={getBetterValue('depreciation', car1LossAmount, car2LossAmount)}
            prefix="$"
          />
          <ComparisonAttribute
            label="Depreciation Rate"
            value1={car1LossPercent.toFixed(1)}
            value2={car2LossPercent.toFixed(1)}
            better={getBetterValue('depreciation', car1LossPercent, car2LossPercent)}
            suffix="%"
          />
        </div>
      </div>

      {/* Annual Cost Estimates */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Cost Estimates</h3>
        
        <div className="space-y-2">
          <ComparisonAttribute
            label="Est. Annual Mileage"
            value1={car1CostData.breakdown.annualMileage}
            value2={car2CostData.breakdown.annualMileage}
            better={0}
            suffix=" km"
          />
          <ComparisonAttribute
            label="Annual Maintenance"
            value1={Math.round(car1CostData.breakdown.maintenance / 5)}
            value2={Math.round(car2CostData.breakdown.maintenance / 5)}
            better={getBetterValue('price', car1CostData.breakdown.maintenance / 5, car2CostData.breakdown.maintenance / 5)}
            prefix="$"
            suffix="/yr"
          />
          <ComparisonAttribute
            label="Annual Insurance"
            value1={Math.round(car1CostData.breakdown.insurance / 5)}
            value2={Math.round(car2CostData.breakdown.insurance / 5)}
            better={getBetterValue('price', car1CostData.breakdown.insurance / 5, car2CostData.breakdown.insurance / 5)}
            prefix="$"
            suffix="/yr"
          />
          <ComparisonAttribute
            label="Annual Fuel"
            value1={Math.round(car1CostData.breakdown.fuel / 5)}
            value2={Math.round(car2CostData.breakdown.fuel / 5)}
            better={getBetterValue('price', car1CostData.breakdown.fuel / 5, car2CostData.breakdown.fuel / 5)}
            prefix="$"
            suffix="/yr"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        * Estimates based on typical ownership patterns and may vary based on driving habits and location.
      </p>
    </div>
  );
};