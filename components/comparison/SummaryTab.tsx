'use client';

import React from 'react';
import { CheckCircle, XCircle, TrendingUp, Leaf, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Car } from '@/types/comparison';
import { 
  calculateValueScore, 
  calculateEnvironmentalScore, 
  calculateTotalCostOfOwnership 
} from '@/utils/comparison/calculations';
import { FEATURE_METADATA } from '@/utils/comparison/constants';

interface SummaryTabProps {
  car1: Car;
  car2: Car;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ car1, car2 }) => {
  // Calculate scores
  const car1ValueScore = calculateValueScore(car1);
  const car2ValueScore = calculateValueScore(car2);
  const car1EnvScore = calculateEnvironmentalScore(car1);
  const car2EnvScore = calculateEnvironmentalScore(car2);
  const car1Cost = calculateTotalCostOfOwnership(car1).total;
  const car2Cost = calculateTotalCostOfOwnership(car2).total;

  // Simple scoring system
  let car1Score = 0;
  let car2Score = 0;

  // Price score (20%)
  if (car1.price < car2.price) car1Score += 20;
  else if (car2.price < car1.price) car2Score += 20;

  // Value score (25%)
  if (car1ValueScore > car2ValueScore) car1Score += 25;
  else if (car2ValueScore > car1ValueScore) car2Score += 25;

  // Total cost score (20%)
  if (car1Cost < car2Cost) car1Score += 20;
  else if (car2Cost < car1Cost) car2Score += 20;

  // Features score (15%)
  const car1FeatureCount = car1.features?.length || 0;
  const car2FeatureCount = car2.features?.length || 0;
  if (car1FeatureCount > car2FeatureCount) car1Score += 15;
  else if (car2FeatureCount > car1FeatureCount) car2Score += 15;

  // Safety score (20%)
  const car1SafetyCount = car1.features?.filter(f => FEATURE_METADATA[f]?.category === 'safety').length || 0;
  const car2SafetyCount = car2.features?.filter(f => FEATURE_METADATA[f]?.category === 'safety').length || 0;
  if (car1SafetyCount > car2SafetyCount) car1Score += 20;
  else if (car2SafetyCount > car1SafetyCount) car2Score += 20;

  const recommendedCar = car1Score > car2Score ? car1 : car2Score > car1Score ? car2 : null;
  const scoreDifference = Math.abs(car1Score - car2Score);
  
  let confidenceLevel = "moderate";
  if (scoreDifference > 30) confidenceLevel = "high";
  else if (scoreDifference < 15) confidenceLevel = "slight";

  // Generate pros and cons
  const generateProsAndCons = (car: Car, otherCar: Car) => {
    const pros = [];
    const cons = [];

    if (car.price < otherCar.price) pros.push("Lower purchase price");
    else if (car.price > otherCar.price) cons.push("Higher purchase price");

    if (car.year > otherCar.year) pros.push("Newer model year");
    else if (car.year < otherCar.year) cons.push("Older model year");

    if (car.mileage < otherCar.mileage) pros.push("Lower mileage");
    else if (car.mileage > otherCar.mileage) cons.push("Higher mileage");

    const carFeatures = car.features?.length || 0;
    const otherFeatures = otherCar.features?.length || 0;
    if (carFeatures > otherFeatures) pros.push("More features overall");
    else if (carFeatures < otherFeatures) cons.push("Fewer features overall");

    const carSafety = car.features?.filter(f => FEATURE_METADATA[f]?.category === 'safety').length || 0;
    const otherSafety = otherCar.features?.filter(f => FEATURE_METADATA[f]?.category === 'safety').length || 0;
    if (carSafety > otherSafety) pros.push("Better safety features");
    else if (carSafety < otherSafety) cons.push("Fewer safety features");

    const carCost = calculateTotalCostOfOwnership(car).total;
    const otherCost = calculateTotalCostOfOwnership(otherCar).total;
    if (carCost < otherCost) pros.push("Lower cost of ownership");
    else if (carCost > otherCost) cons.push("Higher cost of ownership");

    const carEnv = calculateEnvironmentalScore(car);
    const otherEnv = calculateEnvironmentalScore(otherCar);
    if (carEnv > otherEnv) pros.push("Better environmental score");
    else if (carEnv < otherEnv) cons.push("Lower environmental score");

    return { pros, cons };
  };

  const car1ProsAndCons = generateProsAndCons(car1, car2);
  const car2ProsAndCons = generateProsAndCons(car2, car1);

  // Determine use cases
  const determineUseCases = () => {
    const car1Cases = [];
    const car2Cases = [];

    // Urban driving
    if (['Hatchback', 'Sedan'].includes(car1.category)) car1Cases.push("Urban driving");
    if (['Hatchback', 'Sedan'].includes(car2.category)) car2Cases.push("Urban driving");

    // Off-road
    if (['4WD', '4x4'].includes(car1.drivetrain) || ['SUV', 'Truck'].includes(car1.category)) {
      car1Cases.push("Off-road driving");
    }
    if (['4WD', '4x4'].includes(car2.drivetrain) || ['SUV', 'Truck'].includes(car2.category)) {
      car2Cases.push("Off-road driving");
    }

    // Family use
    if (car1.features?.includes('third_row_seats') || ['SUV', 'Minivan'].includes(car1.category)) {
      car1Cases.push("Family trips");
    }
    if (car2.features?.includes('third_row_seats') || ['SUV', 'Minivan'].includes(car2.category)) {
      car2Cases.push("Family trips");
    }

    // Comfort
    const car1ComfortFeatures = car1.features?.filter(f => FEATURE_METADATA[f]?.category === 'comfort').length || 0;
    const car2ComfortFeatures = car2.features?.filter(f => FEATURE_METADATA[f]?.category === 'comfort').length || 0;
    if (car1ComfortFeatures >= 3) car1Cases.push("Comfortable commuting");
    if (car2ComfortFeatures >= 3) car2Cases.push("Comfortable commuting");

    // Tech enthusiasts
    const car1TechFeatures = car1.features?.filter(f => FEATURE_METADATA[f]?.category === 'technology').length || 0;
    const car2TechFeatures = car2.features?.filter(f => FEATURE_METADATA[f]?.category === 'technology').length || 0;
    if (car1TechFeatures >= 3) car1Cases.push("Tech enthusiasts");
    if (car2TechFeatures >= 3) car2Cases.push("Tech enthusiasts");

    // Economy
    if (car1.price < car2.price && car1Cost < car2Cost) car1Cases.push("Budget-conscious buyers");
    if (car2.price < car1.price && car2Cost < car1Cost) car2Cases.push("Budget-conscious buyers");

    // Long trips
    if (['Diesel', 'Hybrid', 'Electric'].includes(car1.type)) car1Cases.push("Long distance travel");
    if (['Diesel', 'Hybrid', 'Electric'].includes(car2.type)) car2Cases.push("Long distance travel");

    return { car1: car1Cases, car2: car2Cases };
  };

  const useCases = determineUseCases();

  return (
    <div className="space-y-8">
      {/* Overall Recommendation */}
      {recommendedCar ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Recommended Choice</h3>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {recommendedCar.year} {recommendedCar.make} {recommendedCar.model}
          </p>
          <p className="text-gray-700">
            With a {confidenceLevel} level of confidence, this vehicle scores better across key metrics including{' '}
            {[
              recommendedCar === car1 && car1.price < car2.price ? 'price' : null,
              recommendedCar === car1 && car1ValueScore > car2ValueScore ? 'value' : null,
              recommendedCar === car1 && car1Cost < car2Cost ? 'cost of ownership' : null,
              recommendedCar === car1 && car1FeatureCount > car2FeatureCount ? 'features' : null,
              recommendedCar === car1 && car1SafetyCount > car2SafetyCount ? 'safety' : null,
              recommendedCar === car2 && car2.price < car1.price ? 'price' : null,
              recommendedCar === car2 && car2ValueScore > car1ValueScore ? 'value' : null,
              recommendedCar === car2 && car2Cost < car1Cost ? 'cost of ownership' : null,
              recommendedCar === car2 && car2FeatureCount > car1FeatureCount ? 'features' : null,
              recommendedCar === car2 && car2SafetyCount > car1SafetyCount ? 'safety' : null,
            ].filter(Boolean).join(', ')}.
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Evenly Matched</h3>
          <p className="text-gray-700">
            Both vehicles have comparable pros and cons. Consider your specific needs and preferences,
            or review the detailed insights below to make your decision.
          </p>
        </div>
      )}

      {/* Pros and Cons */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Pros & Cons Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Car 1 Pros & Cons */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">{car1.make} {car1.model}</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-semibold text-green-700 mb-2">Pros:</h5>
                {car1ProsAndCons.pros.length > 0 ? (
                  <ul className="space-y-1">
                    {car1ProsAndCons.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Plus className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No significant advantages detected</p>
                )}
              </div>

              <div>
                <h5 className="text-sm font-semibold text-red-700 mb-2">Cons:</h5>
                {car1ProsAndCons.cons.length > 0 ? (
                  <ul className="space-y-1">
                    {car1ProsAndCons.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Minus className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No significant disadvantages detected</p>
                )}
              </div>
            </div>
          </div>

          {/* Car 2 Pros & Cons */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">{car2.make} {car2.model}</h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-semibold text-green-700 mb-2">Pros:</h5>
                {car2ProsAndCons.pros.length > 0 ? (
                  <ul className="space-y-1">
                    {car2ProsAndCons.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Plus className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No significant advantages detected</p>
                )}
              </div>

              <div>
                <h5 className="text-sm font-semibold text-red-700 mb-2">Cons:</h5>
                {car2ProsAndCons.cons.length > 0 ? (
                  <ul className="space-y-1">
                    {car2ProsAndCons.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Minus className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No significant disadvantages detected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Use Cases */}
      <div className="bg-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Best Use Cases</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{car1.make} {car1.model}</h4>
            {useCases.car1.length > 0 ? (
              <ul className="space-y-1">
                {useCases.car1.map((useCase, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    {useCase}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific use cases identified</p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">{car2.make} {car2.model}</h4>
            {useCases.car2.length > 0 ? (
              <ul className="space-y-1">
                {useCases.car2.map((useCase, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    {useCase}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific use cases identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-4">
        {/* Value Score */}
        <div className="bg-purple-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Value Score</h4>
              <p className="text-sm text-gray-700">
                {car1ValueScore > car2ValueScore ?
                  `The ${car1.year} ${car1.make} ${car1.model} offers better overall value with a score of ${Math.round(car1ValueScore)}/100 compared to ${Math.round(car2ValueScore)}/100 for the ${car2.make}.` :
                  car2ValueScore > car1ValueScore ?
                  `The ${car2.year} ${car2.make} ${car2.model} offers better overall value with a score of ${Math.round(car2ValueScore)}/100 compared to ${Math.round(car1ValueScore)}/100 for the ${car1.make}.` :
                  `Both vehicles offer similar value with scores of ${Math.round(car1ValueScore)}/100.`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Leaf className="w-6 h-6 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">Environmental Impact</h4>
              <p className="text-sm text-gray-700">
                {car1EnvScore > car2EnvScore ?
                  `The ${car1.year} ${car1.make} ${car1.model} has a better environmental score (${Math.round(car1EnvScore)}/100) based on fuel type, age, and vehicle category.` :
                  car2EnvScore > car1EnvScore ?
                  `The ${car2.year} ${car2.make} ${car2.model} has a better environmental score (${Math.round(car2EnvScore)}/100) based on fuel type, age, and vehicle category.` :
                  `Both vehicles have similar environmental scores of ${Math.round(car1EnvScore)}/100.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};