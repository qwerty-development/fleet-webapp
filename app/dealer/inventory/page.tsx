"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  EyeIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

// Constants
const ITEMS_PER_PAGE = 12;
const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Available", value: "Available" },
  { label: "Pending", value: "Pending" },
  { label: "Sold", value: "Sold" },
];
const CONDITION_OPTIONS = [
  { label: "All", value: "" },
  { label: "New", value: "New" },
  { label: "Used", value: "Used" },
  { label: "Certified", value: "Certified" },
  { label: "Classic", value: "Classic" },
];
const TRANSMISSION_OPTIONS = [
  { label: "All", value: "" },
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
  { label: "Semi-Automatic", value: "Semi-Automatic" },
];
const SORT_OPTIONS = [
  { label: "Newest First", field: "listed_at", order: "desc" },
  { label: "Oldest First", field: "listed_at", order: "asc" },
  { label: "Price (High to Low)", field: "price", order: "desc" },
  { label: "Price (Low to High)", field: "price", order: "asc" },
  { label: "Most Viewed", field: "views", order: "desc" },
  { label: "Most Liked", field: "likes", order: "desc" },
];

export default function DealerInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  // State for data
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [dealership, setDealership] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // State for filtering, sorting, and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    condition: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    transmission: "",
  });
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  // State for modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [soldInfo, setSoldInfo] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0],
    buyer_name: "",
  });

  // Prevent background scrolling when the filter modal is open
  useEffect(() => {
    if (isFilterModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterModalOpen]);

  // Check subscription validity
  const isSubscriptionValid = useCallback(() => {
    if (!dealership || !dealership.subscription_end_date) return false;
    const endDate = new Date(dealership.subscription_end_date);
    return endDate > new Date();
  }, [dealership]);

  // Get days until subscription expiration
  const getDaysUntilExpiration = useCallback(() => {
    if (!dealership || !dealership.subscription_end_date) return 0;
    const endDate = new Date(dealership.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }, [dealership]);

  // Fetch dealership data
  useEffect(() => {
    async function fetchDealershipData() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setDealership(data);
      } catch (error) {
        console.error("Error fetching dealership data:", error);
      }
    }

    fetchDealershipData();
  }, [user, supabase]);

  // Fetch inventory data with filters, sorting, and pagination
  useEffect(() => {
    async function fetchInventory() {
      if (!dealership) return;

      setIsLoading(true);
      try {
        // Build query with filters
        let query = supabase
          .from("cars")
          .select("*", { count: "exact" })
          .eq("dealership_id", dealership.id);

        // Apply filters
        if (filters.status) {
          query = query.eq("status", filters.status);
        }
        if (filters.condition) {
          query = query.eq("condition", filters.condition);
        }
        if (filters.minPrice) {
          query = query.gte("price", parseInt(filters.minPrice));
        }
        if (filters.maxPrice) {
          query = query.lte("price", parseInt(filters.maxPrice));
        }
        if (filters.minYear) {
          query = query.gte("year", parseInt(filters.minYear));
        }
        if (filters.maxYear) {
          query = query.lte("year", parseInt(filters.maxYear));
        }
        if (filters.transmission) {
          query = query.eq("transmission", filters.transmission);
        }

        // Apply search query if provided
        if (searchQuery) {
          const cleanQuery = searchQuery.trim().toLowerCase();
          const searchTerms = cleanQuery.split(/\s+/);

          searchTerms.forEach((term) => {
            const numericTerm = parseInt(term);
            let searchConditions = [
              `make.ilike.%${term}%`,
              `model.ilike.%${term}%`,
              `description.ilike.%${term}%`,
            ];

            if (!isNaN(numericTerm)) {
              searchConditions = searchConditions.concat([
                `year::text.eq.${numericTerm}`,
                `price::text.ilike.%${numericTerm}%`,
                `mileage::text.ilike.%${numericTerm}%`,
              ]);
            }

            query = query.or(searchConditions.join(","));
          });
        }

        // Get count of filtered results
        const { count, error: countError } = await query;
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Apply sorting and pagination
        const { field, order } = sortOption;
        query = query
          .order(field, { ascending: order === "asc" })
          .range(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE - 1
          );

        // Execute query
        const { data, error } = await query;
        if (error) throw error;

        setInventory(data || []);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInventory();
  }, [dealership, filters, searchQuery, sortOption, currentPage, supabase]);

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on new filters
    setIsFilterModalOpen(false);
  };

  // Handle sort changes
  const handleSortChange = (option) => {
    setSortOption(option);
    setCurrentPage(1); // Reset to first page on new sort
  };

  // Handle page changes
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle edit car
  const handleEditCar = (car) => {
    if (!isSubscriptionValid()) {
      alert("Your subscription has expired. Please renew to edit listings.");
      return;
    }

    router.push(`/dealer/inventory/edit/${car.id}`);
  };

  // Handle view car details
  const handleViewCarDetails = (car) => {
    router.push(`/cars/${car.id}`);
  };

  // Handle add new listing
  const handleAddNewListing = () => {
    if (!isSubscriptionValid()) {
      alert("Your subscription has expired. Please renew to add new listings.");
      return;
    }

    router.push(`/dealer/inventory/add`);
  };

  // Handle delete car
  const handleDeleteCar = (car) => {
    if (!isSubscriptionValid()) {
      alert("Your subscription has expired. Please renew to delete listings.");
      return;
    }

    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedCar || !dealership) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", selectedCar.id)
        .eq("dealership_id", dealership.id);

      if (error) throw error;

      // Remove from local state
      setInventory((prev) => prev.filter((car) => car.id !== selectedCar.id));
      setTotalCount((prev) => prev - 1);

      setIsDeleteModalOpen(false);
      setSelectedCar(null);
    } catch (error) {
      console.error("Error deleting car:", error);
      alert("Failed to delete listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mark as sold
  const handleMarkAsSold = (car) => {
    if (!isSubscriptionValid()) {
      alert("Your subscription has expired. Please renew to update listings.");
      return;
    }

    setSelectedCar(car);
    setSoldInfo({
      price: car.price.toString(),
      date: new Date().toISOString().split("T")[0],
      buyer_name: "",
    });
    setIsSoldModalOpen(true);
  };

  // Handle confirm sold
  const handleConfirmSold = async () => {
    if (!selectedCar || !dealership) return;

    if (!soldInfo.price || !soldInfo.date || !soldInfo.buyer_name) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("cars")
        .update({
          status: "sold",
          sold_price: parseInt(soldInfo.price),
          date_sold: soldInfo.date,
          buyer_name: soldInfo.buyer_name,
        })
        .eq("id", selectedCar.id)
        .eq("dealership_id", dealership.id);

      if (error) throw error;

      // Update in local state
      setInventory((prev) =>
        prev.map((car) =>
          car.id === selectedCar.id
            ? {
                ...car,
                status: "sold",
                sold_price: parseInt(soldInfo.price),
                date_sold: soldInfo.date,
                buyer_name: soldInfo.buyer_name,
              }
            : car
        )
      );

      setIsSoldModalOpen(false);
      setSelectedCar(null);
    } catch (error) {
      console.error("Error marking car as sold:", error);
      alert("Failed to mark listing as sold. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-500 text-white font-bold border border-green-400";
      case "pending":
        return "bg-yellow-500 text-white font-bold border border-yellow-400";
      case "sold":
        return "bg-red-500 text-white font-bold border border-red-400";
      default:
        return "bg-gray-500/90 text-gray-400 border border-gray-500/30";
    }
  };

  const subscriptionExpired = !isSubscriptionValid();
  const daysUntilExpiration = getDaysUntilExpiration();
  const showWarning = daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  return (
    <div className="min-h-screen bg-white">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {/* Header with title and add button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Inventory Management
            </h1>
            <button
              onClick={handleAddNewListing}
              disabled={subscriptionExpired}
              className={`px-4 py-2 ${
                subscriptionExpired
                  ? "bg-gray-400"
                  : "bg-accent hover:bg-accent/90"
              } text-white rounded-lg flex items-center transition-colors`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add New Listing
            </button>
          </div>

          {/* Subscription warning/notice */}
          {(subscriptionExpired || showWarning) && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                subscriptionExpired
                  ? "bg-rose-500/10 border border-rose-500/30"
                  : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <div className="flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-gray-800" />
                <span className="text-gray-800 font-medium">
                  {subscriptionExpired
                    ? "Your subscription has expired. Please renew to manage listings."
                    : `Your subscription will expire in ${daysUntilExpiration} days. Please renew soon.`}
                </span>
              </div>
            </div>
          )}

          {/* Search and filter bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by make, model, year, price..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Filter button */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                disabled={subscriptionExpired}
                className={`flex items-center px-4 py-2 ${
                  subscriptionExpired
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200"
                } rounded-lg text-gray-800 border border-gray-200`}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                <span>Filter</span>
              </button>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={SORT_OPTIONS.findIndex(
                    (opt) =>
                      opt.field === sortOption.field &&
                      opt.order === sortOption.order
                  )}
                  onChange={(e) =>
                    handleSortChange(SORT_OPTIONS[e.target.value])
                  }
                  disabled={subscriptionExpired}
                  className={`appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-gray-800 ${
                    subscriptionExpired ? "cursor-not-allowed" : ""
                  } focus:outline-none focus:ring-2 focus:ring-accent`}
                >
                  {SORT_OPTIONS.map((option, index) => (
                    <option key={index} value={index}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active filter pills */}
            {Object.entries(filters).some(([key, value]) => value !== "") && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.status && (
                  <div className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm flex items-center">
                    <span>Status: {filters.status}</span>
                    <button
                      onClick={() =>
                        handleFilterChange({ ...filters, status: "" })
                      }
                      className="ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {filters.condition && (
                  <div className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm flex items-center">
                    <span>Condition: {filters.condition}</span>
                    <button
                      onClick={() =>
                        handleFilterChange({ ...filters, condition: "" })
                      }
                      className="ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <div className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm flex items-center">
                    <span>
                      Price:
                      {filters.minPrice ? ` $${filters.minPrice}` : " $0"}
                      {" - "}
                      {filters.maxPrice ? `$${filters.maxPrice}` : "Any"}
                    </span>
                    <button
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          minPrice: "",
                          maxPrice: "",
                        })
                      }
                      className="ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {(filters.minYear || filters.maxYear) && (
                  <div className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm flex items-center">
                    <span>
                      Year:
                      {filters.minYear || "Any"}
                      {" - "}
                      {filters.maxYear || "Any"}
                    </span>
                    <button
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          minYear: "",
                          maxYear: "",
                        })
                      }
                      className="ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {filters.transmission && (
                  <div className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm flex items-center">
                    <span>Transmission: {filters.transmission}</span>
                    <button
                      onClick={() =>
                        handleFilterChange({ ...filters, transmission: "" })
                      }
                      className="ml-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() =>
                    handleFilterChange({
                      status: "",
                      condition: "",
                      minPrice: "",
                      maxPrice: "",
                      minYear: "",
                      maxYear: "",
                      transmission: "",
                    })
                  }
                  className="bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-full px-3 py-1 text-sm"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Results count and pagination info */}
          {!isLoading && (
            <div className="text-gray-600 mb-4">
              Showing{" "}
              {inventory.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}
              {" - "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              {" of "}
              {totalCount} vehicles
            </div>
          )}

          {/* Inventory grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Vehicles Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || Object.values(filters).some((val) => val !== "")
                  ? "No vehicles match your search criteria. Try adjusting your filters."
                  : "Your dealership doesn't have any cars in inventory yet. Add your first car listing to get started."}
              </p>
              {!searchQuery &&
                !Object.values(filters).some((val) => val !== "") && (
                  <button
                    onClick={handleAddNewListing}
                    disabled={subscriptionExpired}
                    className={`px-4 py-2 ${
                      subscriptionExpired
                        ? "bg-gray-300"
                        : "bg-accent hover:bg-accent/90"
                    } rounded-lg text-white transition-colors`}
                  >
                    Add Your First Car
                  </button>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((car) => (
                <div
                  key={car.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
                >
                  <div className="h-48 overflow-hidden relative">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                        car.status
                      )}`}
                    >
                      {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-gray-800 text-lg font-semibold">
                      {car.make} {car.model}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {car.year} • {car.mileage?.toLocaleString() || 0} miles
                    </p>

                    <div className="flex justify-between items-center mt-3">
                      <p className="text-accent font-bold">
                        ${car.price?.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-gray-500 text-sm">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {car.views || 0}
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <HeartIcon className="h-4 w-4 mr-1" />
                          {car.likes || 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {/* Primary Actions */}
                      <div className="flex space-x-2">
                        {car.status !== "sold" && (
                          <button
                            onClick={() => handleEditCar(car)}
                            disabled={subscriptionExpired}
                            className={`flex-1 px-3 py-1.5 ${
                              subscriptionExpired
                                ? "bg-gray-300"
                                : "bg-accent hover:bg-accent/90"
                            } text-white text-sm rounded transition-colors flex items-center justify-center`}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleViewCarDetails(car)}
                          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded transition-colors flex items-center justify-center border border-gray-200"
                        >
                          <InformationCircleIcon className="h-4 w-4 mr-1" />
                          Details
                        </button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex space-x-2">
                        {car.status !== "sold" && (
                          <button
                            onClick={() => handleMarkAsSold(car)}
                            disabled={subscriptionExpired}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors flex items-center justify-center"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Sold
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCar(car)}
                          disabled={subscriptionExpired}
                          className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded transition-colors flex items-center justify-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalCount > ITEMS_PER_PAGE && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  First
                </button>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from(
                  {
                    length: Math.min(5, Math.ceil(totalCount / ITEMS_PER_PAGE)),
                  },
                  (_, i) => {
                    const pageToRender =
                      currentPage <= 3
                        ? i + 1
                        : currentPage >=
                          Math.ceil(totalCount / ITEMS_PER_PAGE) - 2
                        ? Math.ceil(totalCount / ITEMS_PER_PAGE) - 4 + i
                        : currentPage - 2 + i;

                    if (
                      pageToRender > 0 &&
                      pageToRender <= Math.ceil(totalCount / ITEMS_PER_PAGE)
                    ) {
                      return (
                        <button
                          key={pageToRender}
                          onClick={() => handlePageChange(pageToRender)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageToRender
                              ? "bg-accent text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                          }`}
                        >
                          {pageToRender}
                        </button>
                      );
                    }
                    return null;
                  }
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                  }
                  className={`px-3 py-1 rounded-md ${
                    currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Next
                </button>

                <button
                  onClick={() =>
                    handlePageChange(Math.ceil(totalCount / ITEMS_PER_PAGE))
                  }
                  disabled={
                    currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                  }
                  className={`px-3 py-1 rounded-md ${
                    currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Last
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsFilterModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Filters</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFilterChange(filters);
              }}
            >
              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) =>
                    setFilters({ ...filters, condition: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, minPrice: e.target.value })
                      }
                      placeholder="Min Price"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, maxPrice: e.target.value })
                      }
                      placeholder="Max Price"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Year Range */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Year Range
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={filters.minYear}
                      onChange={(e) =>
                        setFilters({ ...filters, minYear: e.target.value })
                      }
                      placeholder="Min Year"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={filters.maxYear}
                      onChange={(e) =>
                        setFilters({ ...filters, maxYear: e.target.value })
                      }
                      placeholder="Max Year"
                      className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Transmission */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Transmission
                </label>
                <select
                  value={filters.transmission}
                  onChange={(e) =>
                    setFilters({ ...filters, transmission: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {TRANSMISSION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({
                      status: "",
                      condition: "",
                      minPrice: "",
                      maxPrice: "",
                      minYear: "",
                      maxYear: "",
                      transmission: "",
                    })
                  }
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg py-2 border border-gray-300"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-lg py-2"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCar && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Delete Listing
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the listing for {selectedCar.make}{" "}
              {selectedCar.model} ({selectedCar.year})? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-2 border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Modal */}
      {isSoldModalOpen && selectedCar && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSoldModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Mark as Sold
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide the sale details for {selectedCar.make}{" "}
              {selectedCar.model} ({selectedCar.year}).
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmSold();
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Sold Price
                </label>
                <input
                  type="number"
                  value={soldInfo.price}
                  onChange={(e) =>
                    setSoldInfo({ ...soldInfo, price: e.target.value })
                  }
                  placeholder="Enter the sold price"
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Date Sold
                </label>
                <input
                  type="date"
                  value={soldInfo.date}
                  onChange={(e) =>
                    setSoldInfo({ ...soldInfo, date: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Buyer Name
                </label>
                <input
                  type="text"
                  value={soldInfo.buyer_name}
                  onChange={(e) =>
                    setSoldInfo({ ...soldInfo, buyer_name: e.target.value })
                  }
                  placeholder="Enter the buyer's name"
                  className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSoldModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-2 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
