"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/home/Navbar";
import SearchBar from "@/components/home/SearchBar";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getLogoUrl } from "@/utils/getLogoUrl";

interface Brand {
  name: string;
  logoUrl: string;
  carCount: number;
}

export default function AllBrandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();


  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '';
  };

  // Fetch all brands and count available cars
  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("make")
        .eq("status", "available")
        .order("make");

      if (error) throw error;

      // Count cars by brand
      const counts: Record<string, number> = {};
      data.forEach((car) => {
        counts[car.make] = (counts[car.make] || 0) + 1;
      });

      // Create unique brand list ith count and logo
      const uniqueBrands = Array.from(new Set(data.map((item) => item.make)));
      const brandsData: Brand[] = uniqueBrands.map((make) => ({
        name: make,
        logoUrl: getLogoUrl(make, true),
        carCount: counts[make] || 0
      }));

      // Sort by car count (most cars first)
      brandsData.sort((a, b) => b.carCount - a.carCount);

      setBrands(brandsData);
      setFilteredBrands(brandsData);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Initial data load
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredBrands(brands);
      return;
    }

    const filtered = brands.filter(brand =>
      brand.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 pt-20">
        <main className="flex-1 p-4 w-full max-w-7xl mx-auto">
          {/* Search bar */}
          <div className="sticky top-16 z-40 bg-white py-4 mb-6 border-b border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Car Brands</h1>
            </div>
            <SearchBar
              searchQuery={searchQuery}
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          {/* Brands grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : filteredBrands.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredBrands.map((brand) => (
                <motion.div key={brand.name} variants={itemVariants}>
                  <Link href={`/allbrands/${encodeURIComponent(brand.name.toLowerCase())}`}>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-accent hover:shadow-md transition-all duration-300 flex flex-col items-center p-4">
                      <div className="w-20 h-20 p-2 bg-gray-100 rounded-full mb-3 flex items-center justify-center shadow-sm">
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-center">{brand.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{brand.carCount} {brand.carCount === 1 ? 'car' : 'cars'}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center mt-12 p-8 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-gray-900 text-xl font-bold mb-2">No brands found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search query.
              </p>
              <button
                onClick={() => handleSearch("")}
                className="px-6 py-3 bg-accent hover:bg-accent/90 transition-colors rounded-lg text-white font-semibold"
              >
                Reset Search
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}