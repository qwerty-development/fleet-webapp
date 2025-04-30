'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { FilterState } from '@/types';

// Define filter panel props interface
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  className?: string;
}

// Quick Filters Configuration
const QUICK_FILTERS = [
  {
    id: "most-popular",
    label: "Most Popular",
    filter: { specialFilter: "mostPopular", sortBy: "views_desc" },
  },
  {
    id: "budget-friendly",
    label: "Budget Friendly",
    filter: { priceRange: [0, 20000] as number[] },
  },
  {
    id: "luxury",
    label: "Luxury",
    filter: { priceRange: [50000, 1000000] as number[] },
  },
  {
    id: "new-arrivals",
    label: "New Arrivals",
    filter: { specialFilter: "newArrivals" },
  },
];

// Available option arrays
const PRICE_RANGES = [
  { label: "Under $15k", value: [0, 15000] as [number, number] },
  { label: "$15k-30k", value: [15000, 30000] as [number, number] },
  { label: "$30k-50k", value: [30000, 50000] as [number, number] },
  { label: "$50k+", value: [50000, 1000000] as [number, number] },
];

// Transmission Options
const TRANSMISSION_OPTIONS = [
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
];

// Vehicle Colors
const VEHICLE_COLORS = [
  { name: "Black", color: "#000000" },
  { name: "White", color: "#ffffff" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "Gray", color: "#808080" },
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#008000" },
  { name: "Brown", color: "#8B4513" },
  { name: "Beige", color: "#F5F5DC" },
  { name: "Gold", color: "#FFD700" },
];

// Drivetrain Options
const DRIVETRAIN_OPTIONS = [
  { label: "FWD (Front-Wheel Drive)", value: "FWD" },
  { label: "RWD (Rear-Wheel Drive)", value: "RWD" },
  { label: "AWD (All-Wheel Drive)", value: "AWD" },
  { label: "4WD (Four-Wheel Drive)", value: "4WD" },
  { label: "4x4", value: "4x4" },
];

// Section component for organization
const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`mb-6 ${className}`}>
    <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
    {children}
  </div>
);

interface Dealership {
  id: string;
  name: string;
  logo: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  className = ""
}) => {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [hasFiltersSelected, setHasFiltersSelected] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Calculate the max height for the fixed container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateMaxHeight = () => {
        if (filterContainerRef.current) {
          const windowHeight = window.innerHeight;
          const offsetTop = 80; // Adjust based on your header height
          filterContainerRef.current.style.maxHeight = `${windowHeight - offsetTop}px`;
        }
      };
      
      updateMaxHeight();
      window.addEventListener('resize', updateMaxHeight);
      
      return () => {
        window.removeEventListener('resize', updateMaxHeight);
      };
    }
  }, []);

  // Load dealerships
  useEffect(() => {
    const fetchDealerships = async () => {
      const { data, error } = await supabase
        .from("dealerships")
        .select("id, name, logo");
      if (!error) setDealerships(data || []);
    };
    fetchDealerships();
  }, []);

  // Load models for selected makes
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.make || filters.make.length === 0) {
        setModels([]);
        return;
      }
      const { data, error } = await supabase
        .from("cars")
        .select("model")
        .eq("status", "available")
        .in("make", filters.make)
        .order("model");

      if (!error && data) {
        const uniqueModels = Array.from(
          new Set(data.map((item: { model: string }) => item.model))
        );
        setModels(uniqueModels);
      }
    };
    fetchModels();
  }, [filters.make]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.make.length > 0) count++;
    if (filters.model.length > 0) count++;
    if (filters.dealership.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.color.length > 0) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.drivetrain.length > 0) count++;
    
    // Check if ranges are different from defaults
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) count++;
    if (filters.mileageRange[0] > 0 || filters.mileageRange[1] < 500000) count++;
    if (filters.yearRange[0] > 1900 || filters.yearRange[1] < new Date().getFullYear()) count++;

    if (filters.specialFilter) count++;
    if (filters.sortBy) count++;

    setFilterCount(count);
    setHasFiltersSelected(count > 0);
  }, [filters]);

  // Range input handlers
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onFilterChange({
      ...filters,
      priceRange: [value, filters.priceRange[1]]
    });
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onFilterChange({
      ...filters,
      priceRange: [filters.priceRange[0], value]
    });
  };

  const handleMileageMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onFilterChange({
      ...filters,
      mileageRange: [value, filters.mileageRange[1]]
    });
  };

  const handleMileageMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onFilterChange({
      ...filters,
      mileageRange: [filters.mileageRange[0], value]
    });
  };

  const handleYearMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1900;
    onFilterChange({
      ...filters,
      yearRange: [value, filters.yearRange[1]]
    });
  };

  const handleYearMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || new Date().getFullYear();
    onFilterChange({
      ...filters,
      yearRange: [filters.yearRange[0], value]
    });
  };

  // Quick filter handlers
  const handleQuickFilterClick = (quickFilter: typeof QUICK_FILTERS[0]) => {
    if (filters.specialFilter === quickFilter.filter.specialFilter) {
      // Deselect if already selected
      onFilterChange({
        ...filters,
        specialFilter: null,
        ...(quickFilter.filter.sortBy ? { sortBy: null } : {})
      });
    } else {
      // Apply new quick filter
      const newFilters = { ...filters };
      
      // Handle price range if present
      if ('priceRange' in quickFilter.filter) {
        newFilters.priceRange = quickFilter.filter.priceRange as number[];
      }
      
      // Handle special filter if present
      if ('specialFilter' in quickFilter.filter) {
        newFilters.specialFilter = quickFilter.filter.specialFilter as string;
      }
      
      // Handle sort option if present
      if ('sortBy' in quickFilter.filter) {
        newFilters.sortBy = quickFilter.filter.sortBy as string;
      }
      
      onFilterChange(newFilters);
    }
  };

  // Toggle filters for arrays
  const toggleModelFilter = (model: string) => {
    const newModels = filters.model.includes(model)
      ? filters.model.filter(m => m !== model)
      : [...filters.model, model];
    
    onFilterChange({
      ...filters,
      model: newModels
    });
  };

  const toggleTransmissionFilter = (transmission: string) => {
    const newTransmission = filters.transmission.includes(transmission)
      ? filters.transmission.filter(t => t !== transmission)
      : [...filters.transmission, transmission];
    
    onFilterChange({
      ...filters,
      transmission: newTransmission
    });
  };

  const toggleDrivetrainFilter = (drivetrain: string) => {
    const newDrivetrain = filters.drivetrain.includes(drivetrain)
      ? filters.drivetrain.filter(d => d !== drivetrain)
      : [...filters.drivetrain, drivetrain];
    
    onFilterChange({
      ...filters,
      drivetrain: newDrivetrain
    });
  };

  const toggleColorFilter = (color: string) => {
    const newColors = filters.color.includes(color)
      ? filters.color.filter(c => c !== color)
      : [...filters.color, color];
    
    onFilterChange({
      ...filters,
      color: newColors
    });
  };

  const toggleDealershipFilter = (dealershipId: string, dealershipName: string) => {
    const newDealerships = filters.dealership.includes(dealershipId)
      ? filters.dealership.filter(d => d !== dealershipId)
      : [...filters.dealership, dealershipId];

    const newDealershipNames = filters.dealershipName.includes(dealershipName)
      ? filters.dealershipName.filter(n => n !== dealershipName)
      : [...filters.dealershipName, dealershipName];
    
    onFilterChange({
      ...filters,
      dealership: newDealerships,
      dealershipName: newDealershipNames
    });
  };

  const selectPriceRange = (min: number, max: number) => {
    onFilterChange({
      ...filters,
      priceRange: [min, max]
    });
  };

  return (
    <div 
      className={`${className} sticky bg-gray-900  rounded-xl overflow-y p-2 `} 
      style={{ height: 'fit-content' }}
    >
      <div 
        ref={filterContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={`py-4 transition-all duration-300 ${isHovered ? "overflow-y-auto" : "overflow-y-hidden"}`}
          style={{ 
            maxHeight: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a4a4a #1e1e1e'
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Filters</h2>
            {hasFiltersSelected && (
              <button
                onClick={onResetFilters}
                className="text-accent hover:text-accent-light transition-colors text-sm"
              >
                Clear All ({filterCount})
              </button>
            )}
          </div>

          {/* Quick Filters */}
          
          <FilterSection title="Quick Filters">
            <div className="grid grid-cols-2 gap-2">
              {QUICK_FILTERS.map((quickFilter) => (
                <button
                  key={quickFilter.id}
                  onClick={() => handleQuickFilterClick(quickFilter)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.specialFilter === quickFilter.filter.specialFilter
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {quickFilter.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Price Filters */}
          <FilterSection title="Price Range">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRICE_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => selectPriceRange(range.value[0], range.value[1])}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Min ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange[0]}
                  onChange={handlePriceMinChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Max ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange[1]}
                  onChange={handlePriceMaxChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </FilterSection>

          {/* Year Range */}
          <FilterSection title="Year Range">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">From</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={filters.yearRange[0]}
                  onChange={handleYearMinChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">To</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={filters.yearRange[1]}
                  onChange={handleYearMaxChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </FilterSection>

          {/* Mileage Range */}
          <FilterSection title="Mileage Range">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Min (mi)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.mileageRange[0]}
                  onChange={handleMileageMinChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Max (mi)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.mileageRange[1]}
                  onChange={handleMileageMaxChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </FilterSection>

          {/* Transmission Options */}
          <FilterSection title="Transmission">
            <div className="flex flex-wrap gap-2">
              {TRANSMISSION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleTransmissionFilter(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.transmission.includes(option.value)
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Drivetrain Options */}
          <FilterSection title="Drivetrain">
            <div className="flex flex-wrap gap-2">
              {DRIVETRAIN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleDrivetrainFilter(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.drivetrain.includes(option.value)
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Colors */}
          <FilterSection title="Exterior Color">
            <div className="flex flex-wrap gap-2">
              {VEHICLE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.name}
                  onClick={() => toggleColorFilter(colorOption.name)}
                  className={`relative p-1 rounded-lg transition-colors ${
                    filters.color.includes(colorOption.name)
                      ? "ring-2 ring-accent"
                      : ""
                  }`}
                  title={colorOption.name}
                >
                  <div 
                    className="w-8 h-8 rounded-md border border-gray-700"
                    style={{ backgroundColor: colorOption.color }}
                  ></div>
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Models (if makes are selected) */}
          {filters.make.length > 0 && models.length > 0 && (
            <FilterSection title={`Models (${filters.make.join(', ')})`}>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-hidden hover:overflow-y-auto pr-2">
                {models.map((model) => (
                  <button
                    key={model}
                    onClick={() => toggleModelFilter(model)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.model.includes(model)
                        ? "bg-accent text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Dealerships */}
          <FilterSection title="Dealerships">
            <div className="flex flex-wrap gap-2 max-h-40 overflow-hidden hover:overflow-y-auto pr-2">
              {dealerships.map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => toggleDealershipFilter(dealer.id, dealer.name)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.dealership.includes(dealer.id)
                      ? "bg-accent text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {dealer.name}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Styling for scrollbar */}
      <style jsx global>{`
        /* Webkit browsers like Chrome/Safari/Edge */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1e1e1e;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #4a4a4a;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #666;
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #4a4a4a #1e1e1e;
        }
      `}</style>
    </div>
  );
};

export default FilterPanel;