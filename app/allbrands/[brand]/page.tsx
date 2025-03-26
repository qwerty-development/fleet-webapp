"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/home/Navbar";
import CarCard from "@/components/home/CarCard";
import SearchBar from "@/components/home/SearchBar";
import SortSelector from "@/components/home/SortSelector";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Car as GlobalCar } from "@/types"; // Import the Car type from global types

// Define constants for sort options
const SORT_OPTIONS = {
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  YEAR_ASC: "year_asc",
  YEAR_DESC: "year_desc",
  MILEAGE_ASC: "mileage_asc",
  MILEAGE_DESC: "mileage_desc",
  VIEWS_DESC: "views_desc"
};

// Use the global Car type instead of redefining it
type Car = GlobalCar;

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const brand = decodeURIComponent(params.brand as string);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [brandLogo, setBrandLogo] = useState("");
  const [totalCarCount, setTotalCarCount] = useState(0);

  const ITEMS_PER_PAGE = 9;
  const supabase = createClient();

  // Get logo URL function
  const getLogoUrl = (make: string): string => {
    const formattedMake = make.toLowerCase().replace(/\s+/g, "-");
    switch (formattedMake) {
      case "range-rover":
        return "https://www.carlogos.org/car-logos/land-rover-logo-2020-green.png";
      case "infiniti":
        return "https://www.carlogos.org/car-logos/infiniti-logo.png";
      case "jetour":
        return "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jetour_Logo.png?20230608073743";
      case "audi":
        return "https://www.freepnglogos.com/uploads/audi-logo-2.png";
      case "nissan":
        return "https://cdn.freebiesupply.com/logos/large/2x/nissan-6-logo-png-transparent.png";
      case "mercedes":
      case "mercedes-benz":
        return "https://www.carlogos.org/car-logos/mercedes-benz-logo.png";
      case "bmw":
        return "https://www.carlogos.org/car-logos/bmw-logo.png";
      case "toyota":
        return "https://www.carlogos.org/car-logos/toyota-logo.png";
      case "honda":
        return "https://www.carlogos.org/car-logos/honda-logo.png";
      case "ford":
        return "https://www.carlogos.org/car-logos/ford-logo.png";
      default:
        return `https://www.carlogos.org/car-logos/${formattedMake}-logo.png`;
    }
  };

  // Set the brand logo on initial load
  useEffect(() => {
    if (brand) {
      setBrandLogo(getLogoUrl(brand));
    }
  }, [brand]);

  // Fetch cars from this brand
  const fetchCars = useCallback(async (page = 1) => {
    if (!brand) return;

    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const normalizedBrand = brand.toLowerCase();

      let queryBuilder = supabase
        .from("cars")
        .select(`*, dealerships (name, logo, location)`, { count: "exact" })
        .eq("status", "available")
        .ilike("make", normalizedBrand);

      // Apply search filter if provided
      if (searchQuery.trim() !== "") {
        const cleanQuery = searchQuery.trim().toLowerCase();
        queryBuilder = queryBuilder.or(`model.ilike.%${cleanQuery}%,transmission.ilike.%${cleanQuery}%,color.ilike.%${cleanQuery}%,condition.ilike.%${cleanQuery}%,drivetrain.ilike.%${cleanQuery}%`);
      }

      // Apply sorting if selected
      if (sortOption) {
        switch (sortOption) {
          case SORT_OPTIONS.PRICE_ASC:
            queryBuilder = queryBuilder.order("price", { ascending: true });
            break;
          case SORT_OPTIONS.PRICE_DESC:
            queryBuilder = queryBuilder.order("price", { ascending: false });
            break;
          case SORT_OPTIONS.YEAR_ASC:
            queryBuilder = queryBuilder.order("year", { ascending: true });
            break;
          case SORT_OPTIONS.YEAR_DESC:
            queryBuilder = queryBuilder.order("year", { ascending: false });
            break;
          case SORT_OPTIONS.MILEAGE_ASC:
            queryBuilder = queryBuilder.order("mileage", { ascending: true });
            break;
          case SORT_OPTIONS.MILEAGE_DESC:
            queryBuilder = queryBuilder.order("mileage", { ascending: false });
            break;
          case SORT_OPTIONS.VIEWS_DESC:
            queryBuilder = queryBuilder.order("views", { ascending: false });
            break;
        }
      } else {
        // Default sort by newest (listed_at)
        queryBuilder = queryBuilder.order("listed_at", { ascending: false });
      }

      // Get total count for pagination
      const { count, error: countError } = await queryBuilder;
      if (countError) {
        console.error("Error getting count:", countError);
        throw countError;
      }

      if (!count) {
        setCars([]);
        setTotalPages(0);
        setCurrentPage(1);
        setTotalCarCount(0);
        return;
      }

      const totalItems = count;
      setTotalCarCount(totalItems);
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      const safePageNumber = Math.min(page, totalPages);
      const startRange = (safePageNumber - 1) * ITEMS_PER_PAGE;
      const endRange = Math.min(safePageNumber * ITEMS_PER_PAGE - 1, totalItems - 1);

      // Fetch data for current page
      const { data, error } = await queryBuilder.range(startRange, endRange);
      if (error) {
        console.error("Error fetching cars:", error);
        throw error;
      }

      // Process the data - ensure all required fields are present
      const processedCars: Car[] = data?.map((item: any) => {
        const dealershipData = item.dealerships || {
          name: "",
          logo: "",
          location: "",
        };

        // Make sure we're providing all required fields
        return {
          ...item,
          id: String(item.id), // Ensure id is a string
          dealership_name: dealershipData.name,
          dealership_logo: dealershipData.logo,
          dealership_phone: dealershipData.phone || "",
          dealership_location: dealershipData.location || "",
          dealership_latitude: dealershipData.latitude || 0,
          dealership_longitude: dealershipData.longitude || 0,
          condition: item.condition || "Unknown",
          category: item.category || "",
          type: item.type || "",
          description: item.description || "",
          features: item.features || [],
          status: item.status || "available",
          listed_at: item.listed_at || new Date().toISOString(),
          dealerships: dealershipData,
          // Provide any other required fields with default values
        };
      }) || [];

      // Update state
      if (safePageNumber === 1) {
        setCars(processedCars);
      } else {
        setCars((prev) => [...prev, ...processedCars]);
      }
      setTotalPages(totalPages);
      setCurrentPage(safePageNumber);
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      if (page === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [brand, supabase, searchQuery, sortOption]);

  // Initial data load
  useEffect(() => {
    if (brand) {
      fetchCars(1);
    }
  }, [brand, fetchCars]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSort = (option: string) => {
    setSortOption(option);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      fetchCars(currentPage + 1);
    }
  };

  const handleBrandLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Format brand name for display (capitalize first letter of each word)
  const formatBrandName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const displayBrandName = formatBrandName(brand);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 pt-20">
        <main className="flex-1 p-4 w-full max-w-7xl mx-auto">
          {/* Search bar and header */}
          <div className="sticky top-16 z-40 bg-black py-4 mb-6 border-b border-gray-800 shadow-md">
            <div className="flex items-center mb-4 gap-4">
              <button
                onClick={() => router.push('/allbrands')}
                className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Back to all brands"
              >
                <ChevronLeftIcon className="h-5 w-5 text-white" />
              </button>

              <div className="flex items-center">
                <div className="w-12 h-12 mr-3 bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src={brandLogo}
                    alt={displayBrandName}
                    className="max-w-full max-h-full object-contain"
                    onError={handleBrandLogoError}
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{displayBrandName}</h1>
                  <p className="text-gray-400">{totalCarCount} {totalCarCount === 1 ? 'car' : 'cars'} available</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearch={handleSearch}
                  className="w-full"
                />
              </div>
              <SortSelector
                onSort={handleSort}
                selectedOption={sortOption}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {/* Cars grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : cars.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-6 mt-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {cars.map((car) => (
                <motion.div key={car.id} variants={itemVariants}>
                  <CarCard
                    car={car}
                    isFavorite={false}
                    onFavoritePress={() => {}}
                    isDealer={false}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center mt-12 p-8 bg-gray-900 rounded-lg">
              <h3 className="text-white text-xl font-bold mb-2">
                No {displayBrandName} cars found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ?
                  "Try adjusting your search query to find more results." :
                  `We couldn't find any ${displayBrandName} cars available at the moment.`}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors rounded-lg text-white font-semibold"
                >
                  Reset Search
                </button>
              )}
            </div>
          )}

          {/* Load more button */}
          {currentPage < totalPages && !isLoading && (
            <div className="flex justify-center mt-8 mb-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors rounded-lg text-white font-semibold disabled:bg-gray-700"
              >
                {isLoadingMore ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}