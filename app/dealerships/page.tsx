"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/home/Navbar";
import SearchBar from "@/components/home/SearchBar";
import DealershipSortSelector from "@/components/dealerships/DealershipSortSelector";
import DealershipCard, {
  Dealership,
} from "@/components/dealerships/DealershipCard";
import { createClient } from "@/utils/supabase/client";

const ITEMS_PER_PAGE = 9;

export default function DealershipsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalDealershipCount, setTotalDealershipCount] = useState(0);

  const supabase = createClient();

  const fetchDealerships = useCallback(
    async (page = 1) => {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        let queryBuilder = supabase
          .from("dealerships")
          .select("*", { count: "exact" });

        // Apply search filter (search by name or location)
        if (searchQuery.trim() !== "") {
          const cleanQuery = searchQuery.trim().toLowerCase();
          queryBuilder = queryBuilder.or(
            `name.ilike.%${cleanQuery}%,location.ilike.%${cleanQuery}%`
          );
        }

        // Apply sorting if selected
        if (sortOption) {
          if (sortOption === "name_asc") {
            queryBuilder = queryBuilder.order("name", { ascending: true });
          } else if (sortOption === "name_desc") {
            queryBuilder = queryBuilder.order("name", { ascending: false });
          }
        }

        // Get total count for pagination
        const { count, error: countError } = await queryBuilder;
        if (countError) {
          console.error("Error getting count:", countError);
          throw countError;
        }

        if (!count) {
          setDealerships([]);
          setTotalPages(0);
          setCurrentPage(1);
          setTotalDealershipCount(0);
          return;
        }

        const totalItems = count;
        setTotalDealershipCount(totalItems);
        const totalPagesCalc = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const safePageNumber = Math.min(page, totalPagesCalc);
        const startRange = (safePageNumber - 1) * ITEMS_PER_PAGE;
        const endRange = Math.min(
          safePageNumber * ITEMS_PER_PAGE - 1,
          totalItems - 1
        );

        // Fetch data for the current page
        const { data, error } = await queryBuilder.range(startRange, endRange);
        if (error) {
          console.error("Error fetching dealerships:", error);
          throw error;
        }

        let fetchedDealerships: Dealership[] = data || [];

        // Fetch available cars from the "cars" table and count them by dealership_id
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("dealership_id")
          .eq("status", "available");

        if (carsError) {
          console.error("Error fetching available cars count:", carsError);
        }

        // Build a count map: { dealership_id: number }
        const countMap: Record<string | number, number> = {};
        carsData?.forEach((car: any) => {
          countMap[car.dealership_id] = (countMap[car.dealership_id] || 0) + 1;
        });

        // Merge the count into each dealership object
        fetchedDealerships = fetchedDealerships.map((dealer: any) => ({
          ...dealer,
          carsAvailable: countMap[dealer.id] || 0,
        }));

        // If no sort option is selected, randomize the results
        if (!sortOption && fetchedDealerships) {
          for (let i = fetchedDealerships.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fetchedDealerships[i], fetchedDealerships[j]] = [
              fetchedDealerships[j],
              fetchedDealerships[i],
            ];
          }
        }

        if (safePageNumber === 1) {
          setDealerships(fetchedDealerships);
        } else {
          setDealerships((prev) => [...prev, ...fetchedDealerships]);
        }
        setTotalPages(totalPagesCalc);
        setCurrentPage(safePageNumber);
      } catch (error) {
        console.error("Error in fetchDealerships:", error);
        setDealerships([]);
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
    [searchQuery, sortOption, supabase]
  );

  // Initial load and refetch on search/sort changes
  useEffect(() => {
    fetchDealerships(1);
  }, [fetchDealerships]);

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
      fetchDealerships(currentPage + 1);
    }
  };

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

  return (
    <div className="min-h-screen pb-10 flex flex-col bg-white">
      {/* Fixed Navbar */}
      <Navbar />
      <div className="flex flex-1 pt-20">
        <main className="flex-1 w-full max-w-7xl mx-auto">
          {/* Fixed Search and Sort Bar - Styled to match All Brands page */}
          <div className="sticky top-16 z-40 bg-white bg-opacity-90 backdrop-blur-md py-4 mb-6 border-b border-gray-200 shadow-md">
            <div className="flex justify-between items-center mb-4 px-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Dealerships
              </h1>
              <p className="text-gray-600 text-base">
                {totalDealershipCount}{" "}
                {totalDealershipCount === 1 ? "dealership" : "dealerships"}{" "}
                available
              </p>
            </div>
            <div className="flex items-center gap-2 px-6">
              <SearchBar
                searchQuery={searchQuery}
                onSearch={handleSearch}
                className="flex-1"
              />
              <DealershipSortSelector
                onSort={handleSort}
                selectedOption={sortOption}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : dealerships.length > 0 ? (
            <div className="flex justify-center">
              <motion.div
                className="grid w-11/12 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {dealerships.map((dealer) => (
                  <motion.div
                    key={dealer.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    className="cursor-pointer"
                  >
                    <DealershipCard dealership={dealer} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="text-center mt-12 p-8 bg-gray-100 rounded-2xl shadow-md">
              <h3 className="text-gray-900 text-xl font-bold mb-2">
                No dealerships found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search query to find more results.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors duration-300 ease-in-out rounded-full uppercase tracking-wide text-white font-semibold shadow-lg"
              >
                Reset Search
              </button>
            </div>
          )}

          {currentPage < totalPages && !isLoading && (
            <div className="flex justify-center mt-8 mb-12">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 bg-accent hover:bg-accent-dark transition-colors duration-300 ease-in-out rounded-full uppercase tracking-wide text-white font-semibold shadow-lg disabled:bg-gray-300 disabled:opacity-50"
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
