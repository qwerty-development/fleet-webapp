'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterPanel from './FilterPanel';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  onResetFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside content area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && event.target === modalRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Count active filters
  const filterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      return count + 1;
    }
    if (key === 'priceRange' && (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000)) {
      return count + 1;
    }
    if (key === 'mileageRange' && (filters.mileageRange[0] > 0 || filters.mileageRange[1] < 500000)) {
      return count + 1;
    }
    if (key === 'yearRange' && (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear())) {
      return count + 1;
    }
    if ((key === 'specialFilter' || key === 'sortBy') && value) {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:hidden"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full h-[85vh] rounded-t-2xl overflow-hidden shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-200">
                <h2 className="font-bold text-gray-900">Filters</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            {/* Filter Panel embedded in scrollable container */}
            <div className="h-[calc(85vh-130px)] overflow-y-auto p-4 bg-white">
              <FilterPanel
                filters={filters}
                onFilterChange={onFilterChange}
                onResetFilters={onResetFilters}
              />
            </div>

            {/* Apply Button (Fixed at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-md">
              <div className="flex gap-3">
                {filterCount > 0 && (
                  <button
                    onClick={onResetFilters}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => {
                    // Apply filters and close
                    onClose();
                  }}
                  className={`${filterCount > 0 ? 'flex-1' : 'w-full'} py-3 bg-accent hover:bg-accent/90 rounded-lg text-white font-semibold transition-colors`}
                >
                  Apply{filterCount > 0 ? ` (${filterCount})` : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;