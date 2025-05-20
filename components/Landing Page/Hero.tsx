"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
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

  return (
    <div className="w-full bg-white">
{/* Hero section with background image */}
<div className="relative overflow-hidden">
  {/* Background image container with proper sizing and positioning */}
  <div 
    className="h-[30vh] md:h-[40vh] lg:h-[50vh] w-full bg-cover bg-center relative"
    style={{ 
      backgroundImage: "url('/buycar.png')",
      backgroundPosition: "center 20%" // Adjust this value to ensure heads aren't cut off
    }}
  >
    
  </div>
  
  {/* Search container - repositioned for better layout */}
  <div className="relative mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 md:-mt-12 lg:-mt-14 mb-10">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="max-w-3xl mx-auto rounded-full shadow-xl overflow-hidden"
    >
      {/* Search area with refined styling */}
      <div className="p-1.5 bg-black/90 rounded-full">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Search for any vehicle..."
              className="w-full py-2.5 sm:py-3 pl-12 pr-24 bg-white border-none rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent/60 shadow-inner text-sm sm:text-base"
            />
            
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-24 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 px-4 sm:px-5 py-1.5 sm:py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-colors text-sm sm:text-base"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  </div>
</div>

      {/* Filters section below the search area */}
      <div className="bg-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Vehicle Type Section - Centered */}
          <div className="mb-8 text-center">
            <div className="flex justify-center items-center">
              <CategorySelector
                selectedCategories={filters.categories}
                onCategoryPress={handleCategoryPress}
              />
            </div>
          </div>

          {/* Filter boxes in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Quick Filters Box */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Quick Filters
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_FILTERS.map((quickFilter) => (
                  <button
                    key={quickFilter.id}
                    onClick={() => handleQuickFilterClick(quickFilter)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.specialFilter === quickFilter.filter.specialFilter
                        ? "bg-accent text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {quickFilter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Box */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                Price Range
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PRICE_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      selectPriceRange(range.value[0], range.value[1])
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.priceRange[0] === range.value[0] &&
                      filters.priceRange[1] === range.value[1]
                        ? "bg-accent text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transmission Box */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Transmission
              </h3>
              <div className="flex gap-3">
                {TRANSMISSION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleTransmission(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
                      filters.transmission.includes(option.value)
                        ? "bg-accent text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drivetrain Box */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-accent"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                    clipRule="evenodd"
                  />
                </svg>
                Drivetrain
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {DRIVETRAIN_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleDrivetrain(option.value)}
                    className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.drivetrain.includes(option.value)
                        ? "bg-accent text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
