'use client';

import React from 'react';
import AIResponseCard from './AIResponseCard';
import ChatCarCard from './ChatCarCard';

interface ChatResponseProps {
  aiResponse: {
    message: string;
    car_ids: number[];
  };
  cars: any[];
  isLoading?: boolean;
  onCarPress: (car: any) => void;
}

export default function ChatResponse({
  aiResponse,
  cars,
  isLoading = false,
  onCarPress,
}: ChatResponseProps) {
  
  // Filter cars to only show those that match the AI response car_ids
  const relevantCars = cars.filter(car => 
    aiResponse.car_ids.includes(car.id)
  );

  const renderCarSection = () => {
    if (relevantCars.length === 0) return null;

    return (
      <div className="mt-4">
        <div className="px-4 mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Recommended Cars
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {relevantCars.length} car{relevantCars.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex space-x-4 px-4 pb-2">
            {relevantCars.map((car) => (
              <ChatCarCard 
                key={car.id}
                car={car} 
                onPress={() => onCarPress(car)} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    // Don't show any empty state - just return null
    return null;
  };

  return (
    <div className="w-full">
      {/* AI Response Card */}
      <AIResponseCard
        message={aiResponse.message}
        carCount={relevantCars.length}
        isLoading={isLoading}
      />
      
      {/* Car Results Section - only show if there are cars */}
      {renderCarSection()}
    </div>
  );
}
