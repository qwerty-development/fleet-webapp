"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { Car, Dealership } from "@/types";
import Navbar from "@/components/home/Navbar";

import Link from "next/link";
import AdminNavbar from "@/components/admin/navbar";
import EditListingForm from "@/components/admin/EditListingForm";

// Define filter and sort options
const SORT_OPTIONS = [
  { label: "Newest", value: "listed_at_desc" },
  { label: "Oldest", value: "listed_at_asc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "views_desc" },
  { label: "Most Liked", value: "likes_desc" },
];

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Pending", value: "pending" },
  { label: "Sold", value: "sold" },
];

const ITEMS_PER_PAGE = 10;

export default function AdminBrowseScreen() {
  // State variables
  const [listings, setListings] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("listed_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isListingModalVisible, setIsListingModalVisible] =
    useState<boolean>(false);
  const [selectedListing, setSelectedListing] = useState<Car | null>(null);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [selectedDealership, setSelectedDealership] =
    useState<Dealership | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<
    Record<string, number>
  >({});

  const supabase = createClient();

  // Fetch dealerships on component mount
  useEffect(() => {
    fetchDealerships();
  }, []);

  // Fetch listings when any filter, sort, or pagination changes
  useEffect(() => {
    fetchListings();
  }, [
    sortBy,
    sortOrder,
    filterStatus,
    selectedDealership,
    currentPage,
    searchQuery,
  ]);

  // Function to fetch dealerships from Supabase
  const fetchDealerships = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("dealerships").select("*");
      if (error) throw error;
      setDealerships(data || []);
    } catch (error: any) {
      console.error("Error fetching dealerships:", error);
      alert(`Failed to fetch dealerships: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch car listings with filters and pagination
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("cars")
        .select("*, dealerships(id, name, logo, location)", { count: "exact" })
        .order(sortBy, { ascending: sortOrder === "asc" });

      // Apply dealership filter if selected
      if (selectedDealership) {
        query = query.eq("dealership_id", selectedDealership.id);
      }

      // Apply status filter if not "all"
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      // Apply search filter if query exists
      if (searchQuery.trim()) {
        query = query.or(
          `make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,color.ilike.%${searchQuery}%`
        );
      }

      // Calculate range for pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      setListings(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      alert(`Failed to fetch listings: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handler for deleting a listing
  const handleDeleteListing = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        supabase
          .from("cars")
          .delete()
          .eq("id", id)
          .then(({ error }) => {
            if (error) throw error;
            fetchListings();
            alert("Listing deleted successfully");
          });
      } catch (error: any) {
        console.error("Error deleting listing:", error);
        alert(`Failed to delete listing: ${error.message}`);
      }
    }
  }, []);

  // Handler for editing a listing
  const handleEditListing = useCallback((listing: Car) => {
    setSelectedListing(listing);
    setIsListingModalVisible(true);
  }, []);

  // Handler for form submission when editing
  const handleSubmitListing = useCallback(
    async (formData: any) => {
      if (!selectedListing) return;

      try {
        const { error } = await supabase
          .from("cars")
          .update(formData)
          .eq("id", selectedListing.id);

        if (error) throw error;

        fetchListings();
        setIsListingModalVisible(false);
        setSelectedListing(null);
        alert("Listing updated successfully");
      } catch (error: any) {
        console.error("Error updating listing:", error);
        alert(`Failed to update listing: ${error.message}`);
      }
    },
    [selectedListing]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchListings();
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const [newSortBy, newSortOrder] = value.split("_");
      setSortBy(newSortBy === "date" ? "listed_at" : newSortBy);
      setSortOrder(newSortOrder);
      setCurrentPage(1);
    },
    []
  );

  // Handle status filter change
  const handleStatusFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterStatus(e.target.value);
      setCurrentPage(1);
    },
    []
  );

  // Handle dealership filter change
  const handleDealershipChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dealershipId = e.target.value;
      if (dealershipId === "all") {
        setSelectedDealership(null);
      } else {
        const dealership = dealerships.find((d) => d.id === dealershipId);
        setSelectedDealership(dealership || null);
      }
      setCurrentPage(1);
    },
    [dealerships]
  );

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchListings();
  }, []);

  // Pagination handlers
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Listings</h1>
            <p className="text-gray-400">
              Manage all your listings, delete and change status
            </p>
          </div>

          {/* Filters and Search */}
          <div className="my-6 space-y-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search listings..."
                className="w-full px-4 py-3 bg-gray-800/60 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </form>

            {/* Dealership Dropdown */}
            <div className="w-full">
              <select
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                value={selectedDealership?.id || "all"}
                onChange={handleDealershipChange}
              >
                <option value="all">All Dealerships</option>
                {dealerships.map((dealership) => (
                  <option key={dealership.id} value={dealership.id}>
                    {dealership.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <select
                  className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={filterStatus}
                  onChange={handleStatusFilterChange}
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex-1">
                <select
                  className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={`${sortBy}_${sortOrder}`}
                  onChange={handleSortChange}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm shadow-sm"
              disabled={isRefreshing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Listings */}
          {isLoading && !isRefreshing ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {listings.map((car) => (
                <div
                  key={car.id}
                  className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/80 rounded-xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-900/20 hover:border-gray-600"
                >
                  <div className="relative">
                    {/* Car Image Gallery with Navigation Arrows */}
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-900">
                      {/* Image */}
                      <div className="w-full h-full">
                        {car.images && car.images.length > 0 ? (
                          <img
                            src={
                              car.images[currentImageIndexes[car.id] || 0] ||
                              "/placeholder-car.jpg"
                            }
                            alt={`${car.year} ${car.make} ${car.model}`}
                            className="w-full h-full object-cover transition-opacity duration-300"
                          />
                        ) : (
                          <img
                            src="/placeholder-car.jpg"
                            alt={`${car.year} ${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Navigation arrows - only shown if multiple images */}
                      {car.images && car.images.length > 1 && (
                        <>
                          {/* Left arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const maxImages = car.images?.length || 1;
                              setCurrentImageIndexes((prev) => {
                                const currentIndex = prev[car.id] || 0;
                                const newIndex =
                                  (currentIndex - 1 + maxImages) % maxImages;
                                return { ...prev, [car.id]: newIndex };
                              });
                            }}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
                            aria-label="Previous image"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>

                          {/* Right arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const maxImages = car.images?.length || 1;
                              setCurrentImageIndexes((prev) => {
                                const currentIndex = prev[car.id] || 0;
                                const newIndex = (currentIndex + 1) % maxImages;
                                return { ...prev, [car.id]: newIndex };
                              });
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
                            aria-label="Next image"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Image count indicator */}
                      {car.images && car.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded-md text-sm backdrop-blur-sm">
                          {(currentImageIndexes[car.id] || 0) + 1} /{" "}
                          {car.images.length}
                        </div>
                      )}

                      {/* Title overlay with gradient */}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-start">
                        <h3 className="text-white font-bold text-lg">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-white bg-accent rounded-full px-4 font-bold text-lg">
                          ${car.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 bg-gray-800/80 backdrop-blur-sm">
                      {/* Status and Metrics Row */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          {/* Status Tag - Different colors based on status */}
                          <div
                            className={`
                          px-3 py-1 rounded-full flex items-center backdrop-blur-sm
                          ${
                            car.status === "available"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : car.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }
                        `}
                          >
                            {/* Check icon instead of truck */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="capitalize font-medium">
                              {car.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <EyeIcon className="h-5 w-5 text-gray-300 mr-1" />
                            <span className="text-gray-300">
                              {car.views || 0}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <HeartIcon className="h-5 w-5 text-gray-300 mr-1" />
                            <span className="text-gray-300">
                              {car.likes || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-accent mb-4 line-clamp-2 text-m">
                        By {car.dealership_name}
                      </p>
                      <p className="text-gray-300 mb-4 line-clamp-2 text-sm">
                        {car.description || "No description available"}
                      </p>

                      {/* Action Buttons - Now with Status Change Button */}
                      <div className="space-y-3">
                        {/* Change Status Button - Full Width */}
                        <button
                          onClick={() => {
                            const newStatus =
                              car.status === "available"
                                ? "pending"
                                : "available";

                            // Confirm before changing status
                            if (
                              confirm(
                                `Change status from ${car.status} to ${newStatus}?`
                              )
                            ) {
                              // Update status in database
                              supabase
                                .from("cars")
                                .update({ status: newStatus })
                                .eq("id", car.id)
                                .then(({ error }) => {
                                  if (error) {
                                    alert(
                                      `Error changing status: ${error.message}`
                                    );
                                  } else {
                                    fetchListings();
                                    alert(
                                      `Status changed to ${newStatus} successfully`
                                    );
                                  }
                                });
                            }
                          }}
                          className={`
                          w-full flex items-center justify-center px-4 py-2.5 
                          ${
                            car.status === "sold"
                              ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                              : car.status === "available"
                              ? "bg-amber-600/90 hover:bg-amber-600 text-white"
                              : "bg-emerald-600/90 hover:bg-emerald-600 text-white"
                          } 
                          rounded-lg transition-colors font-medium text-sm
                        `}
                          disabled={car.status === "sold"}
                        >
                          {car.status === "sold" ? (
                            "Status Locked (Sold)"
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                              </svg>
                              {car.status === "available"
                                ? "Mark as Pending"
                                : "Mark as Available"}
                            </>
                          )}
                        </button>

                        {/* Edit and Delete Buttons - Two columns */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleEditListing(car)}
                            className="flex items-center justify-center px-3 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <PencilIcon className="h-4 w-4 mr-1.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteListing(car.id)}
                            className="flex items-center justify-center px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center my-12 p-8 bg-gray-800 rounded-lg">
              <h3 className="text-white text-xl font-bold mb-2">
                No listings found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your filters or search query to find more results.
              </p>
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setSelectedDealership(null);
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="px-6 py-3 bg-accent hover:bg-accent/80 transition-colors rounded-lg text-white font-semibold"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {listings.length > 0 && (
            <div className="flex justify-between items-center py-6 mb-12">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${
                  currentPage === 1
                    ? "bg-gray-700/80 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600/90 hover:bg-indigo-600 text-white"
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>
              <span className="text-gray-300 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-700/80 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600/90 hover:bg-indigo-600 text-white"
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Modal for editing listing would go here */}
        {isListingModalVisible && selectedListing && (
          <EditListingForm
            listing={selectedListing}
            onClose={() => {
              setIsListingModalVisible(false);
              setSelectedListing(null);
            }}
            onSubmit={handleSubmitListing}
          />
        )}
      </div>
    </div>
  );
}
