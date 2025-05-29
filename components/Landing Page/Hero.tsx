"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AdjustmentsHorizontalIcon, ChevronDownIcon, Cog6ToothIcon, CurrencyDollarIcon, GlobeAltIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FilterState } from "@/types";

// Import CategorySelector to use directly in Hero
import CategorySelector from "@/components/home/CategorySelectorHero";

// Define constants for filter options
export const SORT_OPTIONS = {
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  YEAR_ASC: "year_asc",
  YEAR_DESC: "year_desc",
  MILEAGE_ASC: "mileage_asc",
  MILEAGE_DESC: "mileage_desc",
  VIEWS_DESC: "views_desc",
};

interface SelectOption {
  value: string;
  label: string;
  priceRange?: number[];
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  placeholder: string;
}

export const SPECIAL_FILTERS = {
  NEW_ARRIVALS: "newArrivals",
  MOST_POPULAR: "mostPopular",
};

// Default filter state
const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  categories: [],
  priceRange: [0, 1000000],
  mileageRange: [0, 500000],
  yearRange: [1900, new Date().getFullYear()],
  transmission: [],
  drivetrain: [],
  color: [],
  make: [],
  model: [],
  dealership: [],
  dealershipName: [],
  specialFilter: null,
  sortBy: null,
};

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

// Available price range options
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

// Drivetrain Options
const DRIVETRAIN_OPTIONS = [
  { label: "FWD", value: "FWD" },
  { label: "RWD", value: "RWD" },
  { label: "AWD", value: "AWD" },
  { label: "4WD", value: "4WD" },
  { label: "4x4", value: "4x4" },
];

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const router = useRouter();

  // Handle search query change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission - redirect to home with query params
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Create URL parameters
    const params = new URLSearchParams();

    // Add search query if exists
    if (searchQuery.trim()) {
      params.set("query", searchQuery.trim());
    }

    // Add selected categories if any
    if (filters.categories.length > 0) {
      params.set("categories", filters.categories.join(","));
    }

    // Add price range if different from default
    if (filters.priceRange[0] > 0) {
      params.set("minPrice", filters.priceRange[0].toString());
    }
    if (filters.priceRange[1] < 1000000) {
      params.set("maxPrice", filters.priceRange[1].toString());
    }

    // Add transmission if selected
    if (filters.transmission.length > 0) {
      params.set("transmission", filters.transmission.join(","));
    }

    // Add drivetrain if selected
    if (filters.drivetrain.length > 0) {
      params.set("drivetrain", filters.drivetrain.join(","));
    }

    // Add special filter if selected
    if (filters.specialFilter) {
      params.set("specialFilter", filters.specialFilter);
    }

    // Add sort option if selected
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
    }

    // Redirect to home page with all parameters
    router.push(`/home?${params.toString()}`);
  };

  // Handle clear search
  const handleClear = () => {
    setSearchQuery("");
  };

  // Handle category press through CategorySelector
  const handleCategoryPress = (category: string) => {
    setFilters((prev) => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];

      return { ...prev, categories: updatedCategories };
    });
  };

  // Handle price range selection
  const selectPriceRange = (min: number, max: number) => {
    setFilters({
      ...filters,
      priceRange: [min, max],
    });
  };

  // Handle transmission selection
  const toggleTransmission = (transmission: string) => {
    setFilters((prev) => {
      const newTransmission = prev.transmission.includes(transmission)
        ? prev.transmission.filter((t) => t !== transmission)
        : [...prev.transmission, transmission];

      return {
        ...prev,
        transmission: newTransmission,
      };
    });
  };

  // Handle drivetrain selection
  const toggleDrivetrain = (drivetrain: string) => {
    setFilters((prev) => {
      const newDrivetrain = prev.drivetrain.includes(drivetrain)
        ? prev.drivetrain.filter((d) => d !== drivetrain)
        : [...prev.drivetrain, drivetrain];

      return {
        ...prev,
        drivetrain: newDrivetrain,
      };
    });
  };

  // Handle quick filter selection
  const handleQuickFilterClick = (quickFilter: (typeof QUICK_FILTERS)[0]) => {
    if (filters.specialFilter === quickFilter.filter.specialFilter) {
      // Deselect if already selected
      setFilters({
        ...filters,
        specialFilter: null,
        ...(quickFilter.filter.sortBy ? { sortBy: null } : {}),
      });
    } else {
      // Apply new quick filter
      const newFilters = { ...filters };

      // Handle price range if present
      if ("priceRange" in quickFilter.filter) {
        newFilters.priceRange = quickFilter.filter.priceRange as number[];
      }

      // Handle special filter if present
      if ("specialFilter" in quickFilter.filter) {
        newFilters.specialFilter = quickFilter.filter.specialFilter as string;
      }

      // Handle sort option if present
      if ("sortBy" in quickFilter.filter) {
        newFilters.sortBy = quickFilter.filter.sortBy as string;
      }

      setFilters(newFilters);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  const handleTransmissionChange = (value: any) => {
    setFilters(prev => ({
      ...prev,
      transmission: value
    }));
  };

  const handleDrivetrainChange = (value: any) => {
    setFilters(prev => ({
      ...prev,
      drivetrain: value
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        {/* Background with overlay */}
        <div className="relative h-screen overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/family.png')",
              backgroundPosition: "center 20%"
            }}
          />
          {/* Enhanced gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/15" />
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8 lg:mb-12"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 lg:mb-6 bg-gradient-to-r text-white bg-clip-text text-transparent leading-tight">
                Find Your Perfect Car
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 lg:mb-12 text-blue-100 font-light max-w-4xl mx-auto leading-relaxed">
                Discover thousands of quality vehicles from trusted dealers
              </p>
            </motion.div>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-5xl mx-auto mb-8 lg:mb-16"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-3 sm:p-4 lg:p-6 shadow-2xl border border-white/30 hover:shadow-3xl transition-shadow duration-300">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="absolute left-4 sm:left-6 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                    placeholder="Search..."
                    className="flex-1 py-4 sm:py-5 lg:py-6 pl-12 sm:pl-16 pr-20 sm:pr-32 bg-transparent border-none text-gray-800 placeholder-gray-500 focus:outline-none text-base sm:text-lg lg:text-xl font-medium"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-16 sm:right-32 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  )}

                  <button
                    onClick={handleSearch}
                    className="absolute right-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-[#D55004] to-[#FF6B1A] hover:from-[#B8450A] hover:to-[#D55004] text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Search</span>
                    <MagnifyingGlassIcon className="h-5 w-5 sm:hidden" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Filter Section with Proper Stacking Context */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-6xl mx-auto relative z-40"
            >
              {/* Refined Filter Card with Overflow Visible */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300 overflow-visible">
                
                {/* Responsive Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {/* Quick Filter */}
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 tracking-wide">Quick Filter</label>
                    <CustomSelect
                      id="quickFilter"
                      options={QUICK_FILTERS.map(filter => ({ value: filter.filter.specialFilter, label: filter.label }))}
                      value={filters.specialFilter}
                      onChange={handleQuickFilterClick}
                      placeholder="All Categories"
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 tracking-wide">Price Range</label>
                    <CustomSelect
                      id="priceRange"
                      options={PRICE_RANGES.map(range => ({ 
                        value: `${range.value[0]}-${range.value[1]}`, 
                        label: range.label,
                        priceRange: range.value 
                      }))}
                      value={`${filters.priceRange[0]}-${filters.priceRange[1]}`}
                      onChange={(value: any, option: { priceRange: number[]; }) => selectPriceRange(option.priceRange[0], option.priceRange[1])}
                      placeholder="Any Price"
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 tracking-wide">Transmission</label>
                    <CustomSelect
                      id="transmission"
                      options={TRANSMISSION_OPTIONS}
                      value={filters.transmission}
                      onChange={handleTransmissionChange}
                      placeholder="Any Type"
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  </div>

                  {/* Drivetrain */}
                  <div className="space-y-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 tracking-wide">Drivetrain</label>
                    <CustomSelect
                      id="drivetrain"
                      options={DRIVETRAIN_OPTIONS}
                      value={filters.drivetrain}
                      onChange={handleDrivetrainChange}
                      placeholder="Any Drive"
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Action Buttons with Lower Z-Index */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-8 lg:mt-12 px-4 relative z-10"
            >
              <button
                onClick={handleResetFilters}
                className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white/90 hover:bg-white text-gray-700 font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300 backdrop-blur-sm text-sm sm:text-base"
              >
                Reset Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-8 sm:px-10 lg:px-12 py-3 sm:py-4 bg-gradient-to-r from-[#D55004] to-[#FF6B1A] hover:from-[#B8450A] hover:to-[#D55004] text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                View Results
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Custom Select Component with Proper Z-Index Management
interface EnhancedCustomSelectProps {
  id: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[], option?: SelectOption) => void;
  placeholder: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}

const CustomSelect = ({ 
  id, 
  options, 
  value, 
  onChange, 
  placeholder, 
  openDropdown, 
  setOpenDropdown 
}: EnhancedCustomSelectProps) => {
  const isOpen = openDropdown === id;
  const selectedOption = options.find((option: { value: any; }) => option.value === value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(isOpen ? null : id);
  };

  const handleSelect = (selectedValue: any, selectedOption: any) => {
    if (selectedOption && selectedOption.priceRange) {
      onChange(selectedValue, selectedOption);
    } else {
      onChange(selectedValue);
    }
    setOpenDropdown(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 sm:py-4 bg-gray-50/80 hover:bg-white text-gray-900 border border-gray-200/60 hover:border-[#D55004] rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-between focus:outline-none focus:border-[#D55004] focus:ring-2 focus:ring-[#D55004]/20 backdrop-blur-sm shadow-sm hover:shadow-md text-sm sm:text-base"
      >
        <span className={`${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'} text-left truncate pr-2`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl sm:rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {options.map((option: { 
            value: any; 
            label: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; 
          }, index: any) => (
            <button
              key={option.value || index}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value, option);
              }}
              className={`w-full px-4 py-3 sm:py-4 text-left hover:bg-gray-50/80 transition-all duration-150 border-b border-gray-100/60 last:border-b-0 text-sm sm:text-base ${
                value === option.value 
                  ? 'bg-gradient-to-r from-[#D55004]/10 to-[#FF6B1A]/10 text-[#D55004] font-semibold' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span className="truncate block">{option.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};