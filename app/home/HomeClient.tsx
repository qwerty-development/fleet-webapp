"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import FilterPanel from "@/components/home/FilterPanel";
import FilterModal from "@/components/home/FilterModal";
import BrandRow from "@/components/home/BrandRow";
import CategorySelector from "@/components/home/CategorySelector";
import CarCard from "@/components/home/CarCard";
import SearchBar from "@/components/home/SearchBar";
import SortSelector from "@/components/home/SortSelector";
import Navbar from "@/components/home/Navbar";
import { createClient } from "@/utils/supabase/client";
import { FilterState, Car, Brand } from "@/types";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { useRouter, useSearchParams } from "next/navigation";

// Define constants for filter options to avoid string literals
export const SORT_OPTIONS = {
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  YEAR_ASC: "year_asc",
  YEAR_DESC: "year_desc",
  MILEAGE_ASC: "mileage_asc",
  MILEAGE_DESC: "mileage_desc",
  VIEWS_DESC: "views_desc",
} as const;

export const SPECIAL_FILTERS = {
  NEW_ARRIVALS: "newArrivals",
  MOST_POPULAR: "mostPopular",
} as const;

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

export default function HomePage() {
  // Authentication hooks
  const { user, profile, isLoaded, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add a loading state for role determination
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  // Global UI states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState<boolean>(false);

  const ITEMS_PER_PAGE = 9;
  const supabase = createClient();

  // Process URL parameters and set initial filters
  useEffect(() => {
    if (!searchParams || urlParamsProcessed) return;

    try {
      const newFilters = { ...DEFAULT_FILTERS };
      let hasSearchParams = false;

      // Extract search query
      const query = searchParams.get("query");
      if (query) {
        newFilters.searchQuery = query;
        setSearchQuery(query);
        hasSearchParams = true;
      }

      // Extract categories
      const categories = searchParams.get("categories");
      if (categories) {
        newFilters.categories = categories.split(",");
        hasSearchParams = true;
      }

      // Extract price range
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      if (minPrice || maxPrice) {
        newFilters.priceRange = [
          minPrice ? parseInt(minPrice) : 0,
          maxPrice ? parseInt(maxPrice) : 1000000,
        ];
        hasSearchParams = true;
      }

      // Extract year range
      const minYear = searchParams.get("minYear");
      const maxYear = searchParams.get("maxYear");
      if (minYear || maxYear) {
        newFilters.yearRange = [
          minYear ? parseInt(minYear) : 1900,
          maxYear ? parseInt(maxYear) : new Date().getFullYear(),
        ];
        hasSearchParams = true;
      }

      // Extract transmission
      const transmission = searchParams.get("transmission");
      if (transmission) {
        newFilters.transmission = transmission.split(",");
        hasSearchParams = true;
      }

      // Extract drivetrain
      const drivetrain = searchParams.get("drivetrain");
      if (drivetrain) {
        newFilters.drivetrain = drivetrain.split(",");
        hasSearchParams = true;
      }

      // Extract engine types if available in your data model
      const engineTypes = searchParams.get("engineTypes");
      if (engineTypes) {
        // Depending on your data model, map these to the appropriate filter
        // This might be categories, or a custom field
        hasSearchParams = true;
      }

      // Extract fuel types if available in your data model
      const fuelTypes = searchParams.get("fuelTypes");
      if (fuelTypes) {
        // Depending on your data model, map these to the appropriate filter
        hasSearchParams = true;
      }

      // Extract make (brand)
      const make = searchParams.get("make");
      if (make) {
        newFilters.make = make.split(",");
        hasSearchParams = true;
      }

      // Extract special filter
      const specialFilter = searchParams.get("specialFilter");
      if (specialFilter) {
        newFilters.specialFilter = specialFilter;
        hasSearchParams = true;
      }

      // Extract sort option
      const sortBy = searchParams.get("sortBy");
      if (sortBy) {
        newFilters.sortBy = sortBy;
        hasSearchParams = true;
      }

      if (hasSearchParams) {
        console.log("URL params found, setting filters:", newFilters);
        setFilters(newFilters);
      }

      setUrlParamsProcessed(true);
    } catch (error) {
      console.error("Error processing URL parameters:", error);
    }
  }, [searchParams]);

  // Sync user to Supabase (for both signed-in and guest users)
  useEffect(() => {
    const syncUserToSupabase = async () => {
      if ((!isSignedIn && !isGuest) || !isLoaded) return;

      try {
        const userId = isGuest ? `guest_${guestId}` : user?.id;
        if (!userId) return;

        // Check if user exists in Supabase
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select()
          .eq("id", userId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        // Create user if they don't exist
        if (!existingUser) {
          const email = isGuest
            ? `guest_${guestId}@example.com`
            : user?.email || "";
          const name = isGuest
            ? "Guest User"
            : profile?.name || user?.user_metadata?.name || "";

          const { error: upsertError } = await supabase.from("users").upsert(
            [
              {
                id: userId,
                name: name,
                email: email,
                favorite: [],
                is_guest: isGuest,
                last_active: new Date().toISOString(),
                timezone: "UTC",
              },
            ],
            {
              onConflict: "id",
              ignoreDuplicates: false,
            }
          );

          if (upsertError && upsertError.code !== "23505") {
            throw upsertError;
          }
        }

        // Update last_active timestamp
        const { error: updateError } = await supabase
          .from("users")
          .update({ last_active: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) throw updateError;
      } catch (error) {
        console.error("Error syncing user to Supabase:", error);
      }
    };

    syncUserToSupabase();
  }, [isSignedIn, isGuest, isLoaded, user, profile, guestId]);

  // Redirect admin users to the admin panel if applicable
  useEffect(() => {
    if (!isLoaded) return;

    const redirectBasedOnRole = async () => {
      // Set loading state when attempting to redirect
      if (isSignedIn) {
        setIsRoleLoading(true);
      }

      if (isSignedIn && profile?.role === "admin") {
        router.push("/admin");
      } else if (isSignedIn && profile?.role === "dealer") {
        router.push("/dealer");
      } else {
        // Only clear loading state when we know it's a regular user
        setIsRoleLoading(false);
      }
    };

    redirectBasedOnRole();
  }, [isLoaded, isSignedIn, profile]);

  // Get logo URL function
  const getLogoUrl = (make: string, isLightMode: boolean): string => {
    const formattedMake = make.toLowerCase().replace(/\s+/g, "-");
    switch (formattedMake) {
      case "range-rover":
        return isLightMode
          ? "https://www.carlogos.org/car-logos/land-rover-logo-2020-green.png"
          : "https://www.carlogos.org/car-logos/land-rover-logo.png";
      case "infiniti":
        return "https://www.carlogos.org/car-logos/infiniti-logo.png";
      case "jetour":
        return "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jetour_Logo.png?20230608073743";
      case "audi":
        return "https://www.freepnglogos.com/uploads/audi-logo-2.png";
      case "nissan":
        return "https://cdn.freebiesupply.com/logos/large/2x/nissan-6-logo-png-transparent.png";
      default:
        return `https://www.carlogos.org/car-logos/${formattedMake}-logo.png`;
    }
  };

  const fetchCars = useCallback(
    async (
      page = 1,
      currentFilters = filters,
      sortOption: string | null = null
    ) => {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        console.log(
          "Fetching cars with query:",
          currentFilters.searchQuery || searchQuery
        );
        console.log("Current filters:", currentFilters);
        console.log("Sort option:", sortOption || currentFilters.sortBy);

        let queryBuilder = supabase
          .from("cars")
          .select(
            `*, dealerships (name,logo,phone,location,latitude,longitude)`,
            { count: "exact" }
          )
          .eq("status", "available");

        // Special Filters
        if (currentFilters.specialFilter) {
          switch (currentFilters.specialFilter) {
            case SPECIAL_FILTERS.NEW_ARRIVALS:
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              queryBuilder = queryBuilder.gte(
                "listed_at",
                sevenDaysAgo.toISOString()
              );
              break;
            case SPECIAL_FILTERS.MOST_POPULAR:
              sortOption = SORT_OPTIONS.VIEWS_DESC;
              break;
          }
        }

        // Categories
        if (currentFilters.categories && currentFilters.categories.length > 0) {
          queryBuilder = queryBuilder.in("category", currentFilters.categories);
        }

        // Multi‑select filters
        if (
          Array.isArray(currentFilters.dealership) &&
          currentFilters.dealership.length > 0
        ) {
          queryBuilder = queryBuilder.in(
            "dealership_id",
            currentFilters.dealership
          );
        }
        if (
          Array.isArray(currentFilters.make) &&
          currentFilters.make.length > 0
        ) {
          queryBuilder = queryBuilder.in("make", currentFilters.make);
        }
        if (
          Array.isArray(currentFilters.model) &&
          currentFilters.model.length > 0
        ) {
          queryBuilder = queryBuilder.in("model", currentFilters.model);
        }
        if (
          Array.isArray(currentFilters.color) &&
          currentFilters.color.length > 0
        ) {
          queryBuilder = queryBuilder.in("color", currentFilters.color);
        }
        if (
          Array.isArray(currentFilters.transmission) &&
          currentFilters.transmission.length > 0
        ) {
          queryBuilder = queryBuilder.in(
            "transmission",
            currentFilters.transmission
          );
        }
        if (
          Array.isArray(currentFilters.drivetrain) &&
          currentFilters.drivetrain.length > 0
        ) {
          queryBuilder = queryBuilder.in(
            "drivetrain",
            currentFilters.drivetrain
          );
        }

        // Year Range
        if (currentFilters.yearRange) {
          queryBuilder = queryBuilder
            .gte("year", currentFilters.yearRange[0])
            .lte("year", currentFilters.yearRange[1]);
        }

        // Price Range
        if (currentFilters.priceRange) {
          queryBuilder = queryBuilder
            .gte("price", currentFilters.priceRange[0])
            .lte("price", currentFilters.priceRange[1]);
        }

        // Mileage Range
        if (currentFilters.mileageRange) {
          queryBuilder = queryBuilder
            .gte("mileage", currentFilters.mileageRange[0])
            .lte("mileage", currentFilters.mileageRange[1]);
        }

        // Search query (from filters or searchQuery state)
        const currentSearchQuery = currentFilters.searchQuery || searchQuery;
        if (currentSearchQuery && currentSearchQuery.trim() !== "") {
          const cleanQuery = currentSearchQuery.trim().toLowerCase();
          console.log("Clean search query:", cleanQuery);

          let searchConditions = [
            `make.ilike.%${cleanQuery}%`,
            `model.ilike.%${cleanQuery}%`,
            `description.ilike.%${cleanQuery}%`,
            `color.ilike.%${cleanQuery}%`,
            `category.ilike.%${cleanQuery}%`,
            `transmission.ilike.%${cleanQuery}%`,
            `drivetrain.ilike.%${cleanQuery}%`,
            `type.ilike.%${cleanQuery}%`,
            `condition.ilike.%${cleanQuery}%`,
          ];

          // If the user input is numeric (year, price, mileage), add specific conditions
          if (!isNaN(Number(cleanQuery))) {
            searchConditions = searchConditions.concat([
              `year::text.ilike.%${cleanQuery}%`,
              `price::text.ilike.%${cleanQuery}%`,
              `mileage::text.ilike.%${cleanQuery}%`,
            ]);
          }

          // Apply the OR filter properly
          queryBuilder = queryBuilder.or(searchConditions.join(","));
        }

        // Sorting: Only apply ordering if a sort option is provided.
        const currentSortOption = sortOption || currentFilters.sortBy;
        if (currentSortOption) {
          console.log("Applying sort option:", currentSortOption);
          switch (currentSortOption) {
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
              queryBuilder = queryBuilder.order("mileage", {
                ascending: false,
              });
              break;
            case SORT_OPTIONS.VIEWS_DESC:
              queryBuilder = queryBuilder.order("views", { ascending: false });
              break;
          }
        }

        // Get total count for pagination
        const { count, error: countError } = await queryBuilder;
        if (countError) {
          console.error("Error getting count:", countError);
          throw countError;
        }

        if (!count) {
          console.log("No cars found matching criteria");
          setCars([]);
          setTotalPages(0);
          setCurrentPage(1);
          return;
        }

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const safePageNumber = Math.min(page, totalPages);
        const startRange = (safePageNumber - 1) * ITEMS_PER_PAGE;
        const endRange = Math.min(
          safePageNumber * ITEMS_PER_PAGE - 1,
          totalItems - 1
        );

        console.log(
          `Fetching page ${safePageNumber}, range ${startRange}-${endRange}`
        );

        // Fetch data for current page
        const { data, error } = await queryBuilder.range(startRange, endRange);

        if (error) {
          console.error("Error fetching cars:", error);
          throw error;
        }

        console.log(`Found ${data?.length || 0} cars`);

        // If no sort option is selected, randomize the order of the fetched data
        if (!currentSortOption && data) {
          for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
          }
        }

        // Merge dealership info into the car data
        const newCars: Car[] =
          data?.map((item: any) => {
            const dealershipData = item.dealerships || {
              name: "",
              logo: "",
              phone: "",
              location: "",
              latitude: 0,
              longitude: 0,
            };

            return {
              ...item,
              dealership_name: dealershipData.name,
              dealership_logo: dealershipData.logo,
              dealership_phone: dealershipData.phone,
              dealership_location: dealershipData.location,
              dealership_latitude: dealershipData.latitude,
              dealership_longitude: dealershipData.longitude,
              condition: item.condition || "Unknown",
              dealerships: dealershipData, // Ensure dealerships is defined
            };
          }) || [];

        // Deduplicate car entries by id
        const uniqueCarIds = Array.from(new Set(newCars.map((car) => car.id)));
        const uniqueCars = uniqueCarIds
          .map((id) => newCars.find((car) => car.id === id))
          .filter((car): car is Car => car !== undefined);

        setCars((prevCars) =>
          safePageNumber === 1 ? uniqueCars : [...prevCars, ...uniqueCars]
        );
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
    },
    [filters, searchQuery]
  );

  // Fetch brands for brand selector
  const fetchBrands = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("make")
        .eq("status", "available")
        .order("make");

      if (error) throw error;

      const uniqueBrands = Array.from(new Set(data.map((item) => item.make)));

      const brandsData: Brand[] = uniqueBrands.map((make) => ({
        name: make,
        logoUrl: getLogoUrl(make, true),
      }));

      setBrands(brandsData);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  }, []);

  // Initial data load - wait for URL params to be processed
  useEffect(() => {
    // Only fetch cars once URL params have been processed
    if (urlParamsProcessed) {
      console.log("URL params processed, initial data load");
      fetchCars(1, filters);
      fetchBrands();
    }
  }, [urlParamsProcessed]);

  // Refetch when filters or search query change (but not on initial load)
  useEffect(() => {
    if (urlParamsProcessed && !isLoading) {
      console.log("Search query or filters changed, refetching cars");
      fetchCars(1);
    }
  }, [filters, searchQuery]);

  const handleSearch = (query: string) => {
    console.log("Search triggered with query:", query);
    setSearchQuery(query);
    setFilters((prevFilters) => ({
      ...prevFilters,
      searchQuery: query,
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleBrandSelect = (brand: string) => {
    console.log("Brand selected:", brand);
    setFilters((prev) => {
      const newMake = prev.make.includes(brand)
        ? prev.make.filter((b) => b !== brand)
        : [...prev.make, brand];

      return { ...prev, make: newMake };
    });
  };

  const handleSort = (sortOption: string) => {
    console.log("Sort option selected:", sortOption);
    setFilters((prev) => ({ ...prev, sortBy: sortOption }));
    setCurrentPage(1);
  };

  const handleCategoryPress = (category: string) => {
    console.log("Category pressed:", category);
    setFilters((prev) => {
      const updatedCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];

      return { ...prev, categories: updatedCategories };
    });
  };

  const handleResetFilters = () => {
    console.log("Resetting all filters");
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");

    // Clear URL parameters by redirecting to the base URL
    router.push("/");
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      console.log("Loading more cars, page:", currentPage + 1);
      fetchCars(currentPage + 1);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Show loading state if role is being determined
  if (isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mb-4"></div>
          <p className="text-gray-700 text-lg">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Main content area */}
      <div className="flex flex-1 pt-3">
        {/* Left Sidebar Filter Panel - Fixed position with proper height and scrollable content */}
        <aside className="hidden md:block w-1/4 shrink-0">
          <div className="fixed top-16 bottom-0 w-1/4 border-r border-gray-200 p-4 overflow-y-auto custom-scrollbar">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          </div>
        </aside>

        {/* Main Content - Scrollable area */}
        <main className="flex-1 p-4 min-w-0 overflow-x-hidden">
          {/* Fixed search bar that stays at the top */}
          <div className="sticky top-9 z-40 py-4 mb-4 border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar
                  searchQuery={searchQuery || filters.searchQuery}
                  onSearch={handleSearch}
                  className="w-full"
                />
              </div>
              <SortSelector
                onSort={handleSort}
                selectedOption={filters.sortBy}
                className="flex-shrink-0"
              />
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="md:hidden flex-shrink-0 p-3 bg-gray-100 border border-gray-200 rounded-full text-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <BrandRow
            brands={brands}
            onBrandSelect={handleBrandSelect}
            selectedBrands={filters.make}
          />

          <CategorySelector
            selectedCategories={filters.categories}
            onCategoryPress={handleCategoryPress}
          />

          {isLoading ? (
            <div className="flex justify-center mt-12">
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
                  <CarCard car={car} isDealer={false} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center mt-12 p-8 bg-gray-100 rounded-lg shadow-sm">
              <h3 className="text-gray-800 text-xl font-bold mb-2">
                No cars found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search query to find more results.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors rounded-lg text-white font-semibold"
              >
                Reset Filters
              </button>
            </div>
          )}

          {currentPage < totalPages && !isLoading && (
            <div className="flex justify-center mt-8 mb-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors rounded-lg text-white font-semibold disabled:bg-gray-300"
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

      {/* Filter Modal for Mobile */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
