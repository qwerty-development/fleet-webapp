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
  XMarkIcon,
  TagIcon,
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Car, Dealership } from "@/types";
import Navbar from "@/components/home/Navbar";
import { useDebounce } from "../add-listing/useDebounce";

import Link from "next/link";
import AdminNavbar from "@/components/admin/navbar";
import EditListingForm from "@/components/admin/EditListingForm";
import EditRentalListingForm from "@/components/admin/EditRentalListingForm";

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

const BOOST_FILTERS = [
  { label: "All Cars", value: "all" },
  { label: "Boosted Only", value: "boosted" },
  { label: "Non-Boosted Only", value: "non-boosted" },
];

const USER_LISTING_TYPES = [
  { label: "User Cars", value: "user_cars" },
  { label: "User Plates", value: "user_plates" },
];

const LISTING_TYPES = [
  { label: "Cars for Sale", value: "sale" },
  { label: "Cars for Rent", value: "rent" },
  { label: "User Listings", value: "user" },
  { label: "Number Plates", value: "plates" },
];

const ITEMS_PER_PAGE = 10;

interface ListingUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
}

// Trim Badge Component - Non-editable for display in listing cards
const TrimBadge: React.FC<{ trim: string }> = ({ trim }) => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
    {trim}
  </span>
);

// License Plate Component
const LicensePlate: React.FC<{ letter: string; digits: string }> = ({ letter, digits }) => {
  // Check if letter is "P" for public/red plate
  const isPublicPlate = (letter || "").toUpperCase() === 'P';
  const stripColor = isPublicPlate ? 'bg-[#C41E3A]' : 'bg-[#1e4a8d]'; // Red for P, Blue for others

  return (
    <div className="w-full aspect-[3.5/1] bg-white rounded-xl flex overflow-hidden border-2 border-slate-900 shadow-md transform transition-transform hover:scale-[1.02]">
      {/* Strip on the left with Lebanese details */}
      <div className={`${stripColor} w-[15%] h-full flex flex-col justify-between items-center py-2 select-none`}>
        {/* Lebanon (Arabic) */}
        <span className="text-white text-[10px] sm:text-xs font-bold font-arabic leading-none">لبنان</span>

        {/* Cedar tree symbol */}
        <div className="w-[70%] aspect-square relative flex items-center justify-center">
          <img
            src="/cedar.png"
            alt="Cedar"
            className="w-full h-full object-contain brightness-0 invert"
          />
        </div>

        {/* Private (Arabic) */}
        <span className="text-white text-[8px] sm:text-[10px] font-bold font-arabic leading-none">خصوصي</span>
      </div>

      {/* Plate content - Letter and Numbers */}
      <div className="flex-1 flex flex-row justify-center items-center gap-2 sm:gap-4 bg-white">
        <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-mono translate-y-[2px]">{letter}</span>
        <span className="text-3xl sm:text-4xl font-bold text-slate-900 font-mono tracking-widest translate-y-[2px]">{digits}</span>
      </div>
    </div>
  );
};

// Helper function to normalize trim data - only returns single trim
const normalizeSingleTrim = (trim: any): string | null => {
  if (!trim) return null;

  // If it's already an array, return the first valid trim
  if (Array.isArray(trim)) {
    const validTrims = trim.filter(t => typeof t === 'string' && t.trim().length > 0);
    return validTrims.length > 0 ? validTrims[0] : null;
  }

  // If it's a string, try to parse as JSON first
  if (typeof trim === 'string') {
    try {
      const parsed = JSON.parse(trim);
      if (Array.isArray(parsed)) {
        const validTrims = parsed.filter(t => typeof t === 'string' && t.trim().length > 0);
        return validTrims.length > 0 ? validTrims[0] : null;
      }
    } catch (e) {
      // If JSON parsing fails, treat as comma-separated string and take first
      const trimArray = trim.split(',').map(t => t.trim()).filter(t => t.length > 0);
      return trimArray.length > 0 ? trimArray[0] : null;
    }
  }

  return null;
};

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
  const [selectedDealershipId, setSelectedDealershipId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<
    Record<string, number>
  >({});
  const [listingType, setListingType] = useState<string>("sale"); // "sale" or "rent"
  const [filterBoost, setFilterBoost] = useState<string>("all"); // "all", "boosted", "non-boosted"
  const [userListingType, setUserListingType] = useState<string>("user_cars"); // "user_cars" or "user_plates"

  const [isTransferModalVisible, setIsTransferModalVisible] = useState<boolean>(false);
  const [transferListing, setTransferListing] = useState<Car | null>(null);
  const [transferOwnerType, setTransferOwnerType] = useState<"dealership" | "user">("dealership");
  const [transferDealershipId, setTransferDealershipId] = useState<string>("");
  const [transferUserId, setTransferUserId] = useState<string>("");
  const [transferUserSearch, setTransferUserSearch] = useState<string>("");
  const debouncedTransferUserSearch = useDebounce(transferUserSearch, 400);
  const [transferUsers, setTransferUsers] = useState<ListingUser[]>([]);
  const [isLoadingTransferUsers, setIsLoadingTransferUsers] = useState<boolean>(false);
  const [transferUserSearchError, setTransferUserSearchError] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferFeedback, setTransferFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

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
    selectedDealershipId,
    currentPage,
    searchQuery,
    listingType,
    filterBoost,
    userListingType,
  ]);

  useEffect(() => {
    if (listingType === "rent" && transferOwnerType === "user") {
      setTransferOwnerType("dealership");
      setTransferUserId("");
    }
  }, [listingType, transferOwnerType]);

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

  const getListingTableName = useCallback(() => {
    if (listingType === "user") {
      return userListingType === "user_cars" ? "cars" : "number_plates";
    }

    return listingType === "sale" ? "cars" : listingType === "rent" ? "cars_rent" : "number_plates";
  }, [listingType, userListingType]);

  const handleOpenTransferModal = useCallback(
    (listing: Car) => {
      setTransferListing(listing);
      setIsTransferModalVisible(true);
      setTransferFeedback(null);
      setTransferUserId("");
      setTransferDealershipId("");
      setTransferOwnerType(listingType === "rent" ? "dealership" : "dealership");
      setTransferUserSearch("");
      setTransferUsers([]);
    },
    [listingType]
  );

  const handleCloseTransferModal = useCallback(() => {
    setIsTransferModalVisible(false);
    setTransferListing(null);
    setTransferFeedback(null);
    setTransferUserId("");
    setTransferDealershipId("");
  }, []);

  const fetchTransferUsers = useCallback(async (query: string) => {
    setIsLoadingTransferUsers(true);
    setTransferUserSearchError("");

    try {
      const params = new URLSearchParams();
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }
      params.set("limit", "50");
      params.set("offset", "0");

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Failed to fetch users");
      }

      const payload = await response.json();
      setTransferUsers(payload.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setTransferUserSearchError(error.message || "Failed to load users");
      setTransferUsers([]);
    } finally {
      setIsLoadingTransferUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!isTransferModalVisible || transferOwnerType !== "user") return;
    fetchTransferUsers(debouncedTransferUserSearch);
  }, [isTransferModalVisible, transferOwnerType, debouncedTransferUserSearch, fetchTransferUsers]);

  // Helper function to apply filters to query
  const applyFiltersToQuery = useCallback((query: any) => {
    let filteredQuery = query;

    // ALways exclude deleted listings
    filteredQuery = filteredQuery.neq("status", "deleted");

    // Apply owner type filter based on listing type
    if (listingType === "user") {
      // User listings: only show cars with user_id
      filteredQuery = filteredQuery.not("user_id", "is", null);
    } else {
      // Dealer listings (sale/rent/plates): only show items with dealership_id
      filteredQuery = filteredQuery.not("dealership_id", "is", null);
    }

    // Apply dealership filter if selected (only for dealer listings)
    if (selectedDealershipId !== "all" && listingType !== "user") {
      const dealershipIdNumber = parseInt(selectedDealershipId, 10);
      if (!isNaN(dealershipIdNumber)) {
        filteredQuery = filteredQuery.eq("dealership_id", dealershipIdNumber);
      } else {
        console.error("Invalid dealership ID:", selectedDealershipId);
      }
    }

    // Apply status filter if not "all"
    if (filterStatus !== "all") {
      filteredQuery = filteredQuery.eq("status", filterStatus);
    }

    // Apply boost filter if not "all" (only for car listings, not plates)
    if (listingType !== "plates" && filterBoost === "boosted") {
      filteredQuery = filteredQuery.eq("is_boosted", true);
    } else if (listingType !== "plates" && filterBoost === "non-boosted") {
      filteredQuery = filteredQuery.eq("is_boosted", false);
    }

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const isNumberPlateListing =
        listingType === "plates" ||
        (listingType === "user" && userListingType === "user_plates");

      // Different search fields based on listing type
      if (isNumberPlateListing) {
        // Search by letter and digits for number plates
        filteredQuery = filteredQuery.or(
          `letter.ilike.%${searchQuery}%,digits.ilike.%${searchQuery}%`
        );
      } else {
        // Search by car fields for cars (sale, rent, and user)
        filteredQuery = filteredQuery.or(
          `make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,color.ilike.%${searchQuery}%`
        );
      }
    }

    return filteredQuery;
  }, [selectedDealershipId, filterStatus, filterBoost, searchQuery, listingType, userListingType]);

  // Function to fetch car listings with filters and pagination
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Determine which table to query based on listing type
      let tableName = "";
      let isUserListing = false;

      if (listingType === "user") {
        // User listings - check sub-filter
        isUserListing = true;
        tableName = userListingType === "user_cars" ? "cars" : "number_plates";
      } else {
        // Dealer listings
        tableName =
          listingType === "sale" ? "cars" :
            listingType === "rent" ? "cars_rent" :
              "number_plates";
      }

      // Adjust sort field based on table - number_plates uses created_at instead of listed_at
      let adjustedSortBy = sortBy;
      if (tableName === "number_plates") {
        if (sortBy === "listed_at") {
          adjustedSortBy = "created_at";
        } else if (sortBy === "views" || sortBy === "likes") {
          // Number plates don't have views/likes, default to created_at
          adjustedSortBy = "created_at";
        }
      }

      // Build query with appropriate joins
      let selectQuery = "*, dealerships(id, name, logo, location)";

      let query = supabase
        .from(tableName)
        .select(selectQuery, { count: "exact" })
        .order(adjustedSortBy, { ascending: sortOrder === "asc" });

      // Apply all filters
      query = applyFiltersToQuery(query);

      // Calculate range for pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      // If user listings, fetch user data for each listing
      if (isUserListing && data && data.length > 0) {
        const userIds = data.map((car: any) => car.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, name, email")
            .in("id", userIds);

          if (usersError) {
            console.error("Error fetching users:", usersError);
          }

          // Attach user data to each car/plate
          if (usersData) {
            data.forEach((car: any) => {
              car.users = usersData.find((user: any) => user.id === car.user_id);
            });
          }
        }
      }

      setListings(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      alert(`Failed to fetch listings: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    sortBy,
    sortOrder,
    currentPage,
    listingType,
    userListingType,
    applyFiltersToQuery,
    supabase,
  ]);

  // Handler for deleting a listing
  const handleDeleteListing = useCallback(async (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      try {
        const tableName = getListingTableName();

        console.log(`Attempting to soft delete (update status to 'deleted') from table: ${tableName}, id: ${id}`);

        // Soft delete: update status to 'deleted'
        const response = await supabase
          .from(tableName)
          .update({ status: "deleted" })
          .eq("id", id);

        console.log("Supabase soft delete response:", response);

        const { error } = response;

        if (error) {
          console.error("Supabase soft delete error:", error);
          throw error;
        }

        fetchListings();
        alert("Listing deleted successfully");
      } catch (error: any) {
        console.error("Error deleting listing:", error);
        alert(`Failed to delete listing: ${error.message}`);
      }
    }
  }, [getListingTableName, fetchListings, supabase]);

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
        const tableName = getListingTableName();
        const { error } = await supabase
          .from(tableName)
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
    [selectedListing, getListingTableName, fetchListings, supabase]
  );

  const handleTransferOwnership = useCallback(async () => {
    if (!transferListing) {
      setTransferFeedback({ type: "error", message: "Select a listing to transfer." });
      return;
    }

    const tableName = getListingTableName();

    if (tableName === "cars_rent" && transferOwnerType === "user") {
      setTransferFeedback({ type: "error", message: "Rental listings can only belong to dealerships." });
      return;
    }

    let updatePayload: Record<string, any> = {};

    if (transferOwnerType === "dealership") {
      const dealershipId = Number(transferDealershipId);
      if (Number.isNaN(dealershipId)) {
        setTransferFeedback({ type: "error", message: "Select a valid dealership." });
        return;
      }

      if ((transferListing as any).dealership_id === dealershipId) {
        setTransferFeedback({ type: "error", message: "Listing already belongs to this dealership." });
        return;
      }

      updatePayload = {
        dealership_id: dealershipId,
        ...(tableName !== "cars_rent" ? { user_id: null } : {}),
      };
    } else {
      if (!transferUserId) {
        setTransferFeedback({ type: "error", message: "Select a valid user." });
        return;
      }

      if ((transferListing as any).user_id === transferUserId) {
        setTransferFeedback({ type: "error", message: "Listing already belongs to this user." });
        return;
      }

      updatePayload = {
        dealership_id: null,
        user_id: transferUserId,
      };
    }

    try {
      setIsTransferring(true);
      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq("id", transferListing.id);

      if (error) throw error;

      setTransferFeedback({ type: "success", message: "Ownership transferred successfully." });
      fetchListings();
      setTimeout(() => {
        handleCloseTransferModal();
      }, 600);
    } catch (error: any) {
      console.error("Error transferring ownership:", error);
      setTransferFeedback({ type: "error", message: error.message || "Transfer failed." });
    } finally {
      setIsTransferring(false);
    }
  }, [
    transferListing,
    transferOwnerType,
    transferDealershipId,
    transferUserId,
    getListingTableName,
    supabase,
    fetchListings,
    handleCloseTransferModal,
  ]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchListings();
  }, [fetchListings]);

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

  // Handle boost filter change
  const handleBoostFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterBoost(e.target.value);
      setCurrentPage(1);
    },
    []
  );

  // Handle dealership filter change - FIXED: Store ID as string, convert when querying
  const handleDealershipChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dealershipId = e.target.value;
      setSelectedDealershipId(dealershipId);
      setCurrentPage(1);
    },
    []
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
  }, [fetchListings]);

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
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Listings</h1>
              <p className="text-gray-400">
                Manage all your listings, delete and change status
              </p>
            </div>
          </div>

          {/* Listing Type Toggle */}
          <div className="mb-6 bg-gray-800/60 rounded-xl p-1 inline-flex">
            {LISTING_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setListingType(type.value);
                  setCurrentPage(1); // Reset to first page when switching
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${listingType === type.value
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {type.label}
              </button>
            ))}
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

            {/* Dealership Dropdown - FIXED: Use selectedDealershipId state, hide for user listings */}
            {listingType !== "user" && (
              <div className="w-full">
                <select
                  className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  value={selectedDealershipId}
                  onChange={handleDealershipChange}
                >
                  <option value="all">All Dealerships</option>
                  {dealerships.map((dealership) => (
                    <option key={dealership.id} value={dealership.id.toString()}>
                      {dealership.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* User Listing Type Filter - Only show for user listings */}
              {listingType === "user" && (
                <div className="flex-1">
                  <select
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    value={userListingType}
                    onChange={(e) => {
                      setUserListingType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {USER_LISTING_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Boost Filter - Only show for car listings (not plates) */}
              {listingType !== "plates" && !(listingType === "user" && userListingType === "user_plates") && (
                <div className="flex-1">
                  <select
                    className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    value={filterBoost}
                    onChange={handleBoostFilterChange}
                  >
                    {BOOST_FILTERS.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
              {listings.map((car) => {
                // Check listing type
                const isNumberPlate = (listingType === "user" && userListingType === "user_plates") || listingType === "plates";
                const isUserListing = listingType === "user";
                const item = car as any;

                return (
                  <div
                    key={car.id}
                    className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/80 rounded-xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-900/20 hover:border-gray-600"
                  >
                    {/* Boosted Banner - Only show for boosted cars */}
                    {!isNumberPlate && (car as any).is_boosted && (
                      <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white mr-2 animate-pulse"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white font-bold text-sm uppercase tracking-wider">
                            🚀 Boosted Listing
                          </span>
                        </div>
                        {(car as any).boost_end_date && (
                          <span className="text-white text-xs opacity-90">
                            Until {new Date((car as any).boost_end_date).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="relative">
                      {/* Image Gallery (Car or Number Plate) */}
                      <div className="relative aspect-square w-full overflow-hidden bg-gray-900">
                        {/* Image */}
                        <div className="w-full h-full">
                          {isNumberPlate ? (
                            // Number Plate Component
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 p-4">
                              <LicensePlate letter={item.letter} digits={item.digits} />
                            </div>
                          ) : (
                            // Car Images with gallery support
                            car.images && car.images.length > 0 ? (
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
                            )
                          )}
                        </div>

                        {/* Navigation arrows - only shown if multiple images and not number plate */}
                        {!isNumberPlate && car.images && car.images.length > 1 && (
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

                        {/* Image count indicator - only for cars with multiple images */}
                        {!isNumberPlate && car.images && car.images.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2 py-1 rounded-md text-sm backdrop-blur-sm">
                            {(currentImageIndexes[car.id] || 0) + 1} /{" "}
                            {car.images.length}
                          </div>
                        )}

                        {/* Title overlay with gradient */}
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent p-4 flex justify-between items-start">
                          <h3 className="text-white font-bold text-lg">
                            {!isNumberPlate && `${car.year} ${car.make} ${car.model}`}
                          </h3>
                          <div className="text-right">
                            <p className="text-white bg-accent rounded-full px-4 font-bold text-lg">
                              ${car.price.toLocaleString()}
                            </p>
                            {listingType === "rent" && item.rental_period && (
                              <p className="text-white text-xs mt-1 opacity-90">
                                per {item.rental_period === 'daily' ? 'day' : 
                                     item.rental_period === 'weekly' ? 'week' : 
                                     item.rental_period === 'monthly' ? 'month' : 
                                     item.rental_period}
                              </p>
                            )}
                          </div>
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
                          ${car.status === "available"
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
                          {/* Only show views and likes for cars, not number plates */}
                          {!isNumberPlate && (
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
                          )}
                        </div>

                        {/* Dealership/User Info */}
                        {isUserListing ? (
                          // User Listing Info (always show for user tab)
                          <div className="text-white mb-4 text-m flex items-center">
                            <div className="w-9 h-9 rounded-full mr-2 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold line-clamp-1">
                                {item.users?.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {item.users?.email || "No email"}
                              </p>
                            </div>
                            <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                              User
                            </span>
                          </div>
                        ) : (
                          // Dealership Info (for all dealer tabs)
                          <p className="text-white mb-4 line-clamp-2 text-m flex items-center">
                            <img
                              src={car.dealerships?.logo || "/placeholder-logo.png"}
                              alt={car.dealerships?.name}
                              className="w-9 h-9 rounded-full mr-2 object-cover"
                            />
                            {car.dealerships?.name}
                          </p>
                        )}

                        {/* Description or Number Plate Details */}
                        {isNumberPlate ? (
                          <div className="mb-4 space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">Letter:</span>
                              <span className="text-white font-semibold text-lg">{item.letter}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400 text-sm">Digits:</span>
                              <span className="text-white font-semibold text-lg">{item.digits}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 mb-4 line-clamp-1 text-sm">
                            {car.description || "No description available"}
                          </p>
                        )}

                        {/* Rental Period - Only shown for rental cars */}
                        {listingType === "rent" && item.rental_period && (
                          <div className="mb-4 flex items-center space-x-2">
                            <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30 flex items-center">
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
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="capitalize font-medium">
                                {item.rental_period} Rental
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Trim Display - Single trim only (for cars) */}
                        {!isNumberPlate && (() => {
                          const singleTrim = normalizeSingleTrim(car.trim);
                          return singleTrim && (
                            <div className="mb-4">
                              <div className="flex items-center mb-2">
                                <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-gray-400 text-sm font-medium">Trim:</span>
                              </div>
                              <div>
                                <TrimBadge trim={singleTrim} />
                              </div>
                            </div>
                          );
                        })()}

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
                                // Update status in database - use correct table based on listing type
                                let tableName = "";
                                if (listingType === "user") {
                                  tableName = userListingType === "user_cars" ? "cars" : "number_plates";
                                } else {
                                  tableName =
                                    listingType === "sale" ? "cars" :
                                      listingType === "rent" ? "cars_rent" :
                                        "number_plates";
                                }
                                supabase
                                  .from(tableName)
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
                          ${car.status === "sold"
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

                          {/* Edit, Transfer, and Delete Buttons */}
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() => handleEditListing(car)}
                              className="flex items-center justify-center px-3 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <PencilIcon className="h-4 w-4 mr-1.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenTransferModal(car)}
                              className="flex items-center justify-center px-3 py-2 bg-slate-600/90 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <ArrowsRightLeftIcon className="h-4 w-4 mr-1.5" />
                              Transfer
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
                );
              })}
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
                  setSelectedDealershipId("all");
                  setSearchQuery("");
                  setFilterBoost("all");
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
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${currentPage === 1
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
                className={`flex items-center px-4 py-2 rounded-lg text-sm shadow-sm ${currentPage === totalPages || totalPages === 0
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

        {isTransferModalVisible && transferListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div>
                  <h2 className="text-xl font-semibold text-white">Transfer Ownership</h2>
                  <p className="text-sm text-gray-400">Move this listing to a new owner without changing status.</p>
                </div>
                <button
                  onClick={handleCloseTransferModal}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {transferFeedback && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      transferFeedback.type === "error"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    }`}
                  >
                    {transferFeedback.type === "error" ? (
                      <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 mt-0.5" />
                    )}
                    <span>{transferFeedback.message}</span>
                  </div>
                )}

                <div className="bg-gray-950/40 rounded-lg border border-gray-800 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Listing</p>
                  <p className="text-white font-medium mt-1">
                    {(listingType === "user" && userListingType === "user_plates") || listingType === "plates"
                      ? `Plate ${(transferListing as any).letter || ""}${(transferListing as any).digits || ""}`
                      : `${(transferListing as any).year || ""} ${(transferListing as any).make || ""} ${(transferListing as any).model || ""}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Status: {transferListing.status || "unknown"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Current Owner</p>
                  {listingType === "user" ? (
                    <p className="text-sm text-gray-200 mt-1">
                      User: {(transferListing as any).users?.name || (transferListing as any).users?.email || "Unknown User"}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-200 mt-1">
                      Dealership: {(transferListing as any).dealerships?.name || "Unknown Dealership"}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Target Owner Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferOwnerType("dealership")}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                          transferOwnerType === "dealership"
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                            : "border-gray-700 text-gray-400 hover:text-white"
                        }`}
                      >
                        <BuildingOffice2Icon className="h-4 w-4" />
                        Dealership
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferOwnerType("user")}
                        disabled={listingType === "rent"}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                          transferOwnerType === "user"
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                            : "border-gray-700 text-gray-400 hover:text-white"
                        } ${listingType === "rent" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <UsersIcon className="h-4 w-4" />
                        User
                      </button>
                    </div>
                    {listingType === "rent" && (
                      <p className="text-xs text-gray-500 mt-2">Rental listings can only belong to dealerships.</p>
                    )}
                  </div>

                  {transferOwnerType === "dealership" ? (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Dealership</label>
                      <select
                        value={transferDealershipId}
                        onChange={(event) => setTransferDealershipId(event.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select dealership</option>
                        {dealerships.map((dealership) => (
                          <option key={dealership.id} value={dealership.id.toString()}>
                            {dealership.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">User</label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 absolute left-3 top-2.5" />
                        <input
                          value={transferUserSearch}
                          onChange={(event) => setTransferUserSearch(event.target.value)}
                          placeholder="Search by name, email, phone"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {transferUserSearchError && (
                        <p className="text-xs text-rose-400 mt-2">{transferUserSearchError}</p>
                      )}
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-800">
                        {isLoadingTransferUsers ? (
                          <div className="p-3 text-sm text-gray-400">Loading users...</div>
                        ) : transferUsers.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No users found.</div>
                        ) : (
                          transferUsers.map((user) => (
                            <button
                              type="button"
                              key={user.id}
                              onClick={() => setTransferUserId(user.id)}
                              className={`w-full text-left px-3 py-2 text-sm border-b border-gray-800 last:border-b-0 hover:bg-gray-800/70 ${
                                transferUserId === user.id ? "bg-indigo-500/20 text-indigo-100" : "text-gray-300"
                              }`}
                            >
                              <p className="font-medium">{user.name || user.email || "User"}</p>
                              <p className="text-xs text-gray-500">
                                {user.email || "No email"}
                                {user.phone_number ? ` • ${user.phone_number}` : ""}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseTransferModal}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferOwnership}
                  disabled={isTransferring}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {isTransferring ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for editing listing - use appropriate form based on listing type */}
        {isListingModalVisible && selectedListing && (
          (listingType === "sale" || (listingType === "user" && userListingType === "user_cars")) ? (
            // Use regular sale form for dealer sales and user cars
            <EditListingForm
              listing={selectedListing}
              onClose={() => {
                setIsListingModalVisible(false);
                setSelectedListing(null);
              }}
              onSubmit={handleSubmitListing}
            />
          ) : listingType === "rent" ? (
            <EditRentalListingForm
              listing={selectedListing}
              onClose={() => {
                setIsListingModalVisible(false);
                setSelectedListing(null);
              }}
              onSubmit={handleSubmitListing}
            />
          ) : (
            /* Number Plate Edit Modal - Simple inline form */
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Edit Number Plate</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSubmitListing({
                    letter: formData.get('letter'),
                    digits: formData.get('digits'),
                    price: parseFloat(formData.get('price') as string),
                    status: formData.get('status'),
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-2">Letter</label>
                      <input
                        type="text"
                        name="letter"
                        defaultValue={(selectedListing as any).letter}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Digits</label>
                      <input
                        type="text"
                        name="digits"
                        defaultValue={(selectedListing as any).digits}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Price</label>
                      <input
                        type="number"
                        name="price"
                        step="0.01"
                        defaultValue={selectedListing.price}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2">Status</label>
                      <select
                        name="status"
                        defaultValue={selectedListing.status}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsListingModalVisible(false);
                        setSelectedListing(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}