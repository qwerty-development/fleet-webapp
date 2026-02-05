"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SwatchIcon,
  ClockIcon,
  SparklesIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { FilterState } from "@/types";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import CarCard from "./CarCard";
import MarqueeLogos from "./MarqueeLogos";

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
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [randomCars, setRandomCars] = useState<any[]>([]);
  const [loadingRandomCars, setLoadingRandomCars] = useState(false);
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

  // Fetch all banners for display
  useEffect(() => {
    const fetchBanners = async () => {
      setLoadingBanners(true);
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoadingBanners(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Fetch 10 random cars from 10 different dealerships
  useEffect(() => {
    const fetchRandomCars = async () => {
      setLoadingRandomCars(true);
      try {
        // First, get 10 random dealership IDs
        const { data: dealerships, error: dealerError } = await supabase
          .from("dealerships")
          .select("id")
          .limit(100);

        if (dealerError) throw dealerError;

        if (!dealerships || dealerships.length === 0) {
          setRandomCars([]);
          setLoadingRandomCars(false);
          return;
        }

        // Shuffle and pick 10 random dealership IDs
        const shuffledDealerships = dealerships.sort(() => 0.5 - Math.random());
        const selectedDealershipIds = shuffledDealerships
          .slice(0, 10)
          .map((d) => d.id);

        // Fetch one random car from each dealership
        const carPromises = selectedDealershipIds.map(async (dealershipId) => {
          const { data, error } = await supabase
            .from("cars")
            .select("*, dealerships (name, logo, phone, location, latitude, longitude)")
            .eq("dealership_id", dealershipId)
            .eq("status", "available")
            .limit(1);

          if (error || !data || data.length === 0) return null;

          // Get a random car from this dealership if there are multiple
          const randomIndex = Math.floor(Math.random() * data.length);
          return data[randomIndex];
        });

        const cars = await Promise.all(carPromises);
        const validCars = cars.filter((car) => car !== null);
        setRandomCars(validCars);
      } catch (error) {
        console.error("Error fetching random cars:", error);
      } finally {
        setLoadingRandomCars(false);
      }
    };

    fetchRandomCars();
  }, []);

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
    <div className="relative bg-white">
      {/* Hero Section - 3/8 viewport height with image, starts after navbar */}
      <div className="relative h-[37.5vh] overflow-hidden" style={{ marginTop: '64px' }}>
        {/* Hero Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/hero-nw.png')",
            backgroundPosition: "center center",
            backgroundSize: "cover",
          }}
        />
        {/* Dark overlay layer */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-center items-center px-6 sm:px-8 lg:px-12 z-10">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg px-4">
              Find Your Perfect Car
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md px-4">
              Browse, Buy, Sell - All in one place
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section Below Hero - Search bar on top */}
      <div className="relative -mt-8 sm:-mt-12 pb-8 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Search Bar - Positioned on top of next section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="bg-white border-2 border-gray-200 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="absolute left-4 sm:left-5 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="Search by make, model, or keyword..."
                    className="flex-1 py-4 sm:py-5 pl-12 sm:pl-14 pr-24 sm:pr-32 bg-transparent border-none text-gray-900 placeholder-gray-500 focus:outline-none text-base sm:text-lg"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-20 sm:right-24 text-gray-400 hover:text-gray-600 transition-colors p-2"
                      aria-label="Clear search"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-2 sm:right-3 px-4 sm:px-8 py-2.5 sm:py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 text-sm sm:text-base"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Quick Filter Chips - With Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {[
              { 
                label: "New", 
                query: "condition=new",
                icon: <SparklesIcon className="h-4 w-4" />
              },
              { 
                label: "Used", 
                query: "condition=used",
                icon: <ClockIcon className="h-4 w-4" />
              },
              { 
                label: "Under $50k", 
                query: "maxPrice=50000",
                icon: <CurrencyDollarIcon className="h-4 w-4" />
              },
              { 
                label: "Red", 
                query: "color=Red",
                icon: <SwatchIcon className="h-4 w-4" />
              },
              { 
                label: "Low Mileage", 
                query: "maxMileage=50000",
                icon: <ClockIcon className="h-4 w-4" />
              },
              { 
                label: "SUVs", 
                query: "category=SUV",
                icon: <TruckIcon className="h-4 w-4" />
              },
              { 
                label: "Electric", 
                query: "fuel=Electric",
                icon: <SparklesIcon className="h-4 w-4" />
              },
              { 
                label: "Hybrids", 
                query: "fuel=Hybrid",
                icon: <Cog6ToothIcon className="h-4 w-4" />
              },
            ].map((chip, idx) => (
              <Link
                key={idx}
                href={`/home?${chip.query}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-accent hover:text-white text-gray-700 font-medium rounded-full transition-all duration-200 text-sm"
              >
                {chip.icon}
                <span>{chip.label}</span>
              </Link>
            ))}
          </motion.div>

          {/* Single Banner Component - Text Left, Image Right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            {loadingBanners ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-400">Loading banner...</div>
              </div>
            ) : banners.length > 0 ? (
              <div className="relative overflow-hidden rounded-xl shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-300 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Text Content - Left */}
                  <div className="bg-gray-900 p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-3 sm:space-y-4 aspect-[2/1]">
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight px-2 sm:px-0">
                        Stay up to date with all the{" "}
                        <span className="text-white">dealership drops</span>
                      </h2>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed px-2 sm:px-0">
                        Get notified about the latest vehicles, exclusive deals, and special offers from our network of verified dealerships. Never miss out on your dream car.
                      </p>
                    </div>
                    {banners[currentBannerIndex]?.redirect_to && (
                      <div className="px-2 sm:px-0">
                        <Link
                          href={banners[currentBannerIndex].redirect_to}
                          className="inline-block px-5 sm:px-6 py-2 sm:py-2.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 text-xs sm:text-sm"
                        >
                          Explore Now
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Banner Image - Right */}
                  <div className="relative w-full aspect-[2/1]">
                    <Image
                      key={currentBannerIndex}
                      src={banners[currentBannerIndex].image_url}
                      alt="Banner"
                      fill
                      className="object-cover transition-opacity duration-500"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                No banners available at the moment
              </div>
            )}
          </motion.div>

          {/* Random Cars from Different Dealerships - Horizontal Scroll */}
          {randomCars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6 px-4 text-center">
                Featured from Our Dealerships
              </h2>
              {loadingRandomCars ? (
                <div className="flex justify-center py-12">
                  <div className="text-gray-400">Loading cars...</div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 sm:mx-0">
                    <div className="flex gap-3 sm:gap-4 md:gap-6 px-4" style={{ width: 'max-content' }}>
                      {randomCars.map((car) => (
                        <div
                          key={car.id}
                          className="flex-shrink-0 w-[260px] xs:w-[280px] sm:w-[300px] md:w-[320px] lg:w-[360px]"
                        >
                          <CarCard car={car} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-hide {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                </>
              )}
            </motion.div>
          )}

          {/* Marquee Logos - Compact */}
          {randomCars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-12"
            >
              <MarqueeLogos />
            </motion.div>
          )}

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <p className="text-gray-500 text-sm">
              Zero fluff, just solid advice • Verified dealers • No fees
            </p>
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
        className={`w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-between focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm font-normal ${
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
          className="absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0 text-sm font-normal ${
                  value === option.value
                    ? "bg-accent/5 text-accent font-medium"
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
