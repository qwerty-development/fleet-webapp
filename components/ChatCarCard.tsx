'use client';

import React from 'react';
import Image from 'next/image';
import { CalendarIcon, MapPinIcon, CogIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { Car } from '@/types';

interface ChatCarCardProps {
  car: Car;
  onPress: () => void;
}

export default function ChatCarCard({ car, onPress }: ChatCarCardProps) {
  return (
    <div 
      onClick={onPress}
      className="w-80 bg-white dark:bg-[#232323] rounded-2xl shadow-lg dark:shadow-xl overflow-hidden border dark:border-[#333] cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 flex-shrink-0"
    >
      {/* Image Container */}
      <div className="relative w-full h-36 bg-gray-200 dark:bg-[#333] overflow-hidden">
        <Image
          src={car.images?.[0] || '/placeholder-car.jpg'}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover"
        />
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-orange-600 rounded-2xl px-3 py-1">
          <span className="text-white font-bold text-sm">
            ${car.price?.toLocaleString() || 'N/A'}
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1">
            {car.make} {car.model}
          </h3>
          <ChevronRightIcon className="w-5 h-5 text-orange-600 dark:text-orange-400 ml-2" />
        </div>

        {/* Specs Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300">{car.year}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {car.mileage ? `${(car.mileage / 1000).toFixed(1)}k` : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <CogIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {car.transmission === 'Automatic' ? 'Auto' : car.transmission === 'Manual' ? 'Manual' : car.transmission || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-300">{car.condition || 'N/A'}</span>
          </div>
        </div>

        {/* Dealer Row */}
        <div className="flex items-center">
          {(car.dealerships?.logo || car.dealership_logo) ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-200 dark:bg-[#444]">
              <Image
                src={car.dealerships?.logo || car.dealership_logo}
                alt={car.dealerships?.name || car.dealership_name || 'Dealership'}
                fill
                className="object-cover"
                onError={(e) => {
                  // Hide the image and show the placeholder div instead
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-[#444] mr-2 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {car.dealerships?.name || car.dealership_name || 'Unknown Dealership'}
            </p>
            <div className="flex items-center">
              <MapPinIcon className="w-3 h-3 text-gray-400 mr-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {car.dealerships?.location || car.dealership_location || 'Location N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
