"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FilterState } from "@/types";
import { createClient } from "@/utils/supabase/client";

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

// Available price range options
const PRICE_RANGES = [
  { label: "Under $15k", value: [0, 15000] as [number, number] },
  { label: "$15k-30k", value: [15000, 30000] as [number, number] },
  { label: "$30k-50k", value: [30000, 50000] as [number, number] },
  { label: "$50k+", value: [50000, 1000000] as [number, number] },
];

// Generate model year options (current year back to 1980)
const generateModelYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1980; year--) {
    years.push({ label: year.toString(), value: year.toString() });
  }
  return years;
};

const MODEL_YEARS = generateModelYears();

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch available makes from database
  useEffect(() => {
    const fetchMakes = async () => {
      setIsLoadingMakes(true);
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("make")
          .eq("status", "available")
          .order("make");

        if (error) throw error;

        const uniqueMakes = Array.from(new Set(data.map((item) => item.make)));
        setMakes(uniqueMakes);
      } catch (error) {
        console.error("Error fetching makes:", error);
      } finally {
        setIsLoadingMakes(false);
      }
    };

    fetchMakes();
  }, []);

  // Fetch models when make is selected
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.make || filters.make.length === 0) {
        setModels([]);
        return;
      }

      setIsLoadingModels(true);
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("model")
          .eq("status", "available")
          .in("make", filters.make)
          .order("model");

        if (error) throw error;

        const uniqueModels = Array.from(
          new Set(data.map((item) => item.model))
        );
        setModels(uniqueModels);
      } catch (error) {
        console.error("Error fetching models:", error);
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [filters.make]);

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

    // Add selected makes if any
    if (filters.make.length > 0) {
      params.set("make", filters.make.join(","));
    }

    // Add selected models if any
    if (filters.model.length > 0) {
      params.set("model", filters.model.join(","));
    }

    // Add year range if different from default
    if (filters.yearRange[0] > 1900) {
      params.set("minYear", filters.yearRange[0].toString());
    }
    if (filters.yearRange[1] < new Date().getFullYear()) {
      params.set("maxYear", filters.yearRange[1].toString());
    }

    // Add price range if different from default
    if (filters.priceRange[0] > 0) {
      params.set("minPrice", filters.priceRange[0].toString());
    }
    if (filters.priceRange[1] < 1000000) {
      params.set("maxPrice", filters.priceRange[1].toString());
    }

    // Redirect to home page with all parameters
    router.push(`/home?${params.toString()}`);
  };

  // Handle clear search
  const handleClear = () => {
    setSearchQuery("");
  };

  // Handle make selection
  const handleMakeChange = (value: string) => {
    setFilters((prev) => {
      const newMakes = prev.make.includes(value)
        ? prev.make.filter((m) => m !== value)
        : [...prev.make, value];

      // Clear models when make changes
      return {
        ...prev,
        make: newMakes,
        model: [], // Reset models when make changes
      };
    });
  };

  // Handle model selection
  const handleModelChange = (value: string) => {
    setFilters((prev) => {
      const newModels = prev.model.includes(value)
        ? prev.model.filter((m) => m !== value)
        : [...prev.model, value];

      return {
        ...prev,
        model: newModels,
      };
    });
  };

  // Handle model year selection
  const handleModelYearChange = (value: string) => {
    const year = parseInt(value);
    if (isNaN(year)) return;

    setFilters((prev) => ({
      ...prev,
      yearRange: [year, year], // Set both min and max to the same year for single year selection
    }));
  };

  // Handle price range selection
  const selectPriceRange = (min: number, max: number) => {
    setFilters({
      ...filters,
      priceRange: [min, max],
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  return (
    <div className="relative bg-gray-100">
      {/* Top Section - 60% viewport height with background image */}
      <div className="relative h-[60vh] lg:h-[70vh] overflow-visible">
        {/* Background Image */}    
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero-fleet.jpg')",
            backgroundPosition: "center 20%",
          }}
        />
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/15" />

        {/* Hero Text Content - Left Aligned */}
        <div className="absolute inset-0 flex items-center px-8 sm:px-12 lg:px-16 xl:px-20">
          <div className="text-white max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className=" text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 lg:mb-6 bg-gradient-to-r text-white bg-clip-text text-transparent leading-tight">
                Find Your <br className="hidden md:block" />{" "}
                <span className="text-accent">
                  Perfect Car
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-blue-100 font-light leading-relaxed">
                Discover thousands of quality vehicles{" "}
                <br className="hidden md:block" /> from trusted dealers
              </p>
            </motion.div>
          </div>
        </div>

        {/* Floating Search Bar - positioned at bottom of top section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute bottom-0 left-0 right-0 z-30" // motion.div is positioned at the bottom of the parent
        >
          {/* Inner div to handle the static translateY */}
          <div className="transform translate-y-1/2">
            {" "}
            {/* This div applies the desired offset */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-0 shadow-2xl border border-white/30 hover:shadow-3xl transition-shadow duration-300">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="absolute left-4 sm:left-6 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                    placeholder="Search by make, model, or keyword..."
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
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - fit content with top padding instead of fixed height */}
      <div className="relative pt-24 min-h-[40vh]  bg-gradient-to-b bg-gray-200 shadow-xl rounded-b-[60px] md:rounded-b-[200px] overflow-visible">
        {/* Filter Section */}
        <div className="flex items-center justify-center pb-8 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="max-w-6xl mx-auto w-full relative z-20"
          >
            {/* Filter Card */}
            <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white hover:shadow-3xl transition-all duration-300 overflow-visible">
              {/* Responsive Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {/* Make */}
                <div className="space-y-2">
                  <CustomSelect
                    id="make"
                    options={makes.map((make) => ({
                      value: make,
                      label: make,
                    }))}
                    value={filters.make[0] || ""}
                    onChange={handleMakeChange}
                    placeholder="Any Make"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    isLoading={isLoadingMakes}
                  />
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <CustomSelect
                    id="model"
                    options={models.map((model) => ({
                      value: model,
                      label: model,
                    }))}
                    value={filters.model[0] || ""}
                    onChange={handleModelChange}
                    placeholder="Any Model"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    isLoading={isLoadingModels}
                    disabled={filters.make.length === 0}
                  />
                </div>

                {/* Model Year */}
                <div className="space-y-2">
                  <CustomSelect
                    id="modelYear"
                    options={MODEL_YEARS}
                    value={
                      filters.yearRange[0] === filters.yearRange[1] &&
                      filters.yearRange[0] !== 1900
                        ? filters.yearRange[0].toString()
                        : ""
                    }
                    onChange={handleModelYearChange}
                    placeholder="Any Year"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <CustomSelect
                    id="priceRange"
                    options={PRICE_RANGES.map((range) => ({
                      value: `${range.value[0]}-${range.value[1]}`,
                      label: range.label,
                      priceRange: range.value,
                    }))}
                    value={`${filters.priceRange[0]}-${filters.priceRange[1]}`}
                    onChange={(value: string, option?: SelectOption) => {
                      if (option?.priceRange) {
                        selectPriceRange(
                          option.priceRange[0],
                          option.priceRange[1]
                        );
                      }
                    }}
                    placeholder="Any Price"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-8"
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Custom Select Component with Proper Z-Index Management
interface EnhancedCustomSelectProps {
  id: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  placeholder: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const CustomSelect = ({
  id,
  options,
  value,
  onChange,
  placeholder,
  openDropdown,
  setOpenDropdown,
  isLoading = false,
  disabled = false,
}: EnhancedCustomSelectProps) => {
  const isOpen = openDropdown === id;
  const selectedOption = options.find(
    (option: { value: any }) => option.value === value
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setOpenDropdown(isOpen ? null : id);
  };

  const handleSelect = (selectedValue: any, selectedOption: any) => {
    onChange(selectedValue, selectedOption);
    setOpenDropdown(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`w-full px-4 py-3 sm:py-4 bg-gray-50/80 hover:bg-white text-gray-900 border border-gray-200/60 hover:border-[#D55004] rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-between focus:outline-none focus:border-[#D55004] focus:ring-2 focus:ring-[#D55004]/20 backdrop-blur-sm shadow-sm hover:shadow-md text-sm sm:text-base ${
          disabled || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`${
            selectedOption ? "text-gray-900 font-medium" : "text-gray-500"
          } text-left truncate pr-2`}
        >
          {isLoading
            ? "Loading..."
            : selectedOption
            ? selectedOption.label
            : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl sm:rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
          style={{
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          {options.map(
            (
              option: {
                value: any;
                label:
                  | string
                  | number
                  | bigint
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | Promise<React.AwaitedReactNode>
                  | null
                  | undefined;
              },
              index: any
            ) => (
              <button
                key={option.value || index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value, option);
                }}
                className={`w-full px-4 py-3 sm:py-4 text-left hover:bg-gray-50/80 transition-all duration-150 border-b border-gray-100/60 last:border-b-0 text-sm sm:text-base ${
                  value === option.value
                    ? "bg-gradient-to-r from-[#D55004]/10 to-[#FF6B1A]/10 text-[#D55004] font-semibold"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                <span className="truncate block">{option.label}</span>
              </button>
            )
          )}
        </motion.div>
      )}
    </div>
  );
};
