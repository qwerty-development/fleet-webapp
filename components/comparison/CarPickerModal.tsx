'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Car as CarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car } from '@/types/comparison';

interface CarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  cars: Car[];
  onSelect: (car: Car, position: 'left' | 'right') => void;
  selectedCars: [Car | null, Car | null];
  position: 'left' | 'right';
}

export const CarPickerModal: React.FC<CarPickerModalProps> = ({
  visible,
  onClose,
  cars,
  onSelect,
  selectedCars,
  position,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'make' | 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc'>('make');

  const sortOptions = [
    { value: 'make', label: 'Make' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' },
    { value: 'year_desc', label: 'Year (Newest First)' },
    { value: 'year_asc', label: 'Year (Oldest First)' },
  ] as const;

  // Filter and sort cars
  const filteredAndSortedCars = useMemo(() => {
    let filtered = cars;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = cars.filter(car =>
        car.make.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.year.toString().includes(query) ||
        car.category?.toLowerCase().includes(query) ||
        car.dealership_name?.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch(sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_desc':
          return b.year - a.year;
        case 'year_asc':
          return a.year - b.year;
        case 'make':
        default:
          return a.make.localeCompare(b.make);
      }
    });
  }, [cars, searchQuery, sortOption]);

  const isCarSelected = (car: Car) => {
    return (position === 'left' && selectedCars[1]?.id === car.id) ||
           (position === 'right' && selectedCars[0]?.id === car.id);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          className="bg-white w-full max-w-4xl max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Select Car for {position === 'left' ? 'Left' : 'Right'} Position
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Sort */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortOption(option.value)}
                      className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                        sortOption === option.value
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Car List */}
          <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
            {filteredAndSortedCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CarIcon className="w-12 h-12 mb-3" />
                <p className="text-lg font-medium">
                  {searchQuery ? 'No cars match your search' : 'No favorite cars available to compare'}
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {filteredAndSortedCars.map((car) => {
                  const isSelected = isCarSelected(car);
                  
                  return (
                    <motion.div
                      key={car.id}
                      whileHover={{ scale: isSelected ? 1 : 1.02 }}
                      whileTap={{ scale: isSelected ? 1 : 0.98 }}
                      className={`
                        relative flex gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${isSelected 
                          ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                          : 'border-gray-200 bg-white hover:border-accent hover:shadow-md'
                        }
                      `}
                      onClick={() => !isSelected && onSelect(car, position)}
                    >
                      {/* Car Image */}
                      <div className="w-32 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                        <img
                          src={car.images[0]}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Car Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-xl font-bold text-accent mt-1">
                          ${car.price.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{car.mileage.toLocaleString()} km</span>
                          <span>•</span>
                          <span>{car.transmission}</span>
                          <span>•</span>
                          <span>{car.features?.length || 0} features</span>
                        </div>
                      </div>

                      {/* Already Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded-full">
                          Already Selected
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};