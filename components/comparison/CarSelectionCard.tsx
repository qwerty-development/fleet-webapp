'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { Car } from '@/types/comparison';

interface CarSelectionCardProps {
  car: Car | null;
  position: 'left' | 'right';
  onOpenPicker: (position: 'left' | 'right') => void;
  onClearCar: (position: 'left' | 'right') => void;
}

export const CarSelectionCard: React.FC<CarSelectionCardProps> = ({
  car,
  position,
  onOpenPicker,
  onClearCar,
}) => {
  return (
    <div
      onClick={() => !car && onOpenPicker(position)}
      className={`
        relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 
        ${!car ? 'cursor-pointer hover:border-accent hover:bg-gray-100' : ''}
        transition-all duration-300
      `}
    >
      {car ? (
        <div className="space-y-4">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <img
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearCar(position);
              }}
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {car.year} {car.make} {car.model}
            </h3>
            <p className="text-2xl font-bold text-accent">
              ${car.price.toLocaleString()}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{car.mileage.toLocaleString()} km</span>
              <span>•</span>
              <span>{car.transmission}</span>
              <span>•</span>
              <span>{car.type}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Plus className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium">Select Car</p>
          <p className="text-sm text-gray-500 mt-1">
            {position === 'left' ? 'Choose first car' : 'Choose second car'}
          </p>
        </div>
      )}
    </div>
  );
};