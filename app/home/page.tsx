import React, { Suspense } from "react";
import Navbar from "@/components/home/Navbar";
import HomePage from "./HomeClient";

// Define constants and default filters here if needed by FilterPanel or globally
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

export const DEFAULT_FILTERS: FilterState = {
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

// This remains the main Page component (can be server or client, doesn't matter now)
export default function Page() {
  return (
    <Suspense fallback={<HomePageLoadingSkeleton />}>
      <HomePage />
    </Suspense>
  );
}

// Optional: A loading skeleton component for the fallback
function HomePageLoadingSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="sticky top-16 z-40 py-4 mb-4 border-b border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="md:hidden h-10 w-10 bg-gray-100 rounded-full"></div>
        </div>
      </div>
      {/* BrandRow skeleton */}
      <div className="h-16 bg-gray-100 rounded mb-4 animate-pulse"></div>
      {/* CategorySelector skeleton */}
      <div className="h-10 bg-gray-100 rounded mb-8 animate-pulse"></div>
      {/* Car grid skeleton */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

import { FilterState } from "@/types";
