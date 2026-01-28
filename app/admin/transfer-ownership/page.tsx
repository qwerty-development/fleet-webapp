"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminNavbar from "@/components/admin/navbar";
import { createClient } from "@/utils/supabase/client";
import { useDebounce } from "../add-listing/useDebounce";
import {
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type ListingTable = "cars" | "cars_rent" | "number_plates";

type OwnerType = "dealership" | "user";

interface Dealership {
  id: number;
  name: string;
  location?: string | null;
  phone?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
}

interface ListingBase {
  id: number;
  status?: string | null;
  dealership_id?: number | null;
  user_id?: string | null;
  price?: number | null;
}

interface CarListing extends ListingBase {
  make?: string | null;
  model?: string | null;
  year?: number | null;
}

interface PlateListing extends ListingBase {
  letter?: string | null;
  digits?: string | null;
}

const TABLE_OPTIONS: { value: ListingTable; label: string; description: string }[] = [
  {
    value: "cars",
    label: "Car Sales",
    description: "cars table",
  },
  {
    value: "cars_rent",
    label: "Car Rentals",
    description: "cars_rent table",
  },
  {
    value: "number_plates",
    label: "Number Plates",
    description: "number_plates table",
  },
];

const TransferOwnershipPage: React.FC = () => {
  const supabase = createClient();

  const [listingTable, setListingTable] = useState<ListingTable>("cars");
  const [listingId, setListingId] = useState<string>("");
  const [listing, setListing] = useState<CarListing | PlateListing | null>(null);
  const [currentOwner, setCurrentOwner] = useState<
    | {
        type: OwnerType;
        id: string | number;
        name: string;
        extra?: string | null;
      }
    | null
  >(null);

  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoadingDealerships, setIsLoadingDealerships] = useState<boolean>(true);

  const [targetOwnerType, setTargetOwnerType] = useState<OwnerType>("dealership");
  const [targetDealershipId, setTargetDealershipId] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");

  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>("");
  const debouncedUserSearch = useDebounce(userSearch, 400);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userSearchError, setUserSearchError] = useState<string>("");

  const [isFetchingListing, setIsFetchingListing] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const isRentalTable = listingTable === "cars_rent";

  useEffect(() => {
    async function fetchDealerships() {
      try {
        const { data, error } = await supabase
          .from("dealerships")
          .select("id, name, location, phone")
          .order("name");

        if (error) throw error;
        setDealerships(data || []);
      } catch (error) {
        console.error("Error fetching dealerships:", error);
        setErrorMessage("Failed to load dealerships.");
      } finally {
        setIsLoadingDealerships(false);
      }
    }

    fetchDealerships();
  }, [supabase]);

  const fetchUsers = useCallback(async (query: string) => {
    setIsLoadingUsers(true);
    setUserSearchError("");

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
      setUsers(payload.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setUserSearchError(error.message || "Failed to load users");
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (targetOwnerType !== "user") return;
    fetchUsers(debouncedUserSearch);
  }, [targetOwnerType, debouncedUserSearch, fetchUsers]);

  useEffect(() => {
    if (isRentalTable) {
      setTargetOwnerType("dealership");
      setTargetUserId("");
    }
  }, [isRentalTable]);

  const listingFields = useMemo(() => {
    if (listingTable === "number_plates") {
      return "id, status, dealership_id, user_id, price, letter, digits";
    }
    if (listingTable === "cars_rent") {
      return "id, status, dealership_id, price, make, model, year";
    }
    return "id, status, dealership_id, user_id, price, make, model, year";
  }, [listingTable]);

  const normalizeListingId = useCallback(() => {
    const trimmed = listingId.trim();
    if (!trimmed) return null;
    const numericId = Number(trimmed);
    if (Number.isNaN(numericId)) return null;
    return numericId;
  }, [listingId]);

  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const loadListingById = useCallback(
    async (id: number) => {
      resetFeedback();
      setIsFetchingListing(true);
      try {
        const { data, error } = await supabase
          .from(listingTable)
          .select(listingFields)
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data?.status === "deleted") {
          setListing(null);
          setCurrentOwner(null);
          setErrorMessage("Deleted listings are not available for transfer.");
          return;
        }

        setListing(data as CarListing | PlateListing);

        let ownerType: OwnerType | null = null;
        let ownerId: string | number | null = null;

        if (data?.dealership_id) {
          ownerType = "dealership";
          ownerId = data.dealership_id;
        } else if (data?.user_id) {
          ownerType = "user";
          ownerId = data.user_id;
        }

        if (!ownerType || !ownerId) {
          setCurrentOwner(null);
        } else if (ownerType === "dealership") {
          const { data: dealershipData, error: dealershipError } = await supabase
            .from("dealerships")
            .select("id, name")
            .eq("id", ownerId)
            .single();

          if (dealershipError) throw dealershipError;

          setCurrentOwner({
            type: "dealership",
            id: dealershipData.id,
            name: dealershipData.name,
          });
        } else {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, name, email")
            .eq("id", ownerId)
            .single();

          if (userError) throw userError;

          setCurrentOwner({
            type: "user",
            id: userData.id,
            name: userData.name || userData.email || "User",
            extra: userData.email,
          });
        }
      } catch (error: any) {
        console.error("Error fetching listing:", error);
        setListing(null);
        setCurrentOwner(null);
        setErrorMessage(error.message || "Failed to load listing");
      } finally {
        setIsFetchingListing(false);
      }
    },
    [listingFields, listingTable, supabase]
  );

  const handleFetchListing = useCallback(async () => {
    resetFeedback();
    const numericId = normalizeListingId();
    if (!numericId) {
      setErrorMessage("Enter a valid numeric listing ID.");
      return;
    }
    await loadListingById(numericId);
  }, [normalizeListingId, loadListingById]);

  const handleTransfer = useCallback(async () => {
    resetFeedback();
    if (!listing) {
      setErrorMessage("Load a listing before transferring.");
      return;
    }

    if (listingTable === "cars_rent" && targetOwnerType === "user") {
      setErrorMessage("Rental listings can only be assigned to a dealership.");
      return;
    }

    let updatePayload: Record<string, any> = {};

    if (targetOwnerType === "dealership") {
      const dealershipId = Number(targetDealershipId);
      if (Number.isNaN(dealershipId)) {
        setErrorMessage("Select a valid dealership.");
        return;
      }

      if (listing.dealership_id && listing.dealership_id === dealershipId) {
        setErrorMessage("Listing is already owned by this dealership.");
        return;
      }

      updatePayload = {
        dealership_id: dealershipId,
      };

      if (listingTable !== "cars_rent") {
        updatePayload.user_id = null;
      }
    } else {
      if (!targetUserId) {
        setErrorMessage("Select a valid user.");
        return;
      }

      if (listing.user_id && listing.user_id === targetUserId) {
        setErrorMessage("Listing is already owned by this user.");
        return;
      }

      updatePayload = {
        dealership_id: null,
        user_id: targetUserId,
      };
    }

    setIsTransferring(true);
    try {
      const { error } = await supabase
        .from(listingTable)
        .update(updatePayload)
        .eq("id", listing.id);

      if (error) throw error;

      setSuccessMessage("Ownership transferred successfully.");
      const numericId = normalizeListingId();
      if (numericId) {
        await loadListingById(numericId);
      }
    } catch (error: any) {
      console.error("Error transferring ownership:", error);
      setErrorMessage(error.message || "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  }, [
    listing,
    listingTable,
    targetOwnerType,
    targetDealershipId,
    targetUserId,
    supabase,
    loadListingById,
    normalizeListingId,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <AdminNavbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <ArrowsRightLeftIcon className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Transfer Listing Ownership</h1>
            <p className="text-gray-400">Move a listing between dealerships and users without changing its status.</p>
          </div>
        </div>

        {(errorMessage || successMessage) && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm flex items-start gap-2 ${
              errorMessage
                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {errorMessage ? (
              <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 mt-0.5" />
            )}
            <span>{errorMessage || successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-gray-900/70 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Listing Selection</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Listing Type</label>
                  <select
                    value={listingTable}
                    onChange={(event) => {
                      setListingTable(event.target.value as ListingTable);
                      setListing(null);
                      setCurrentOwner(null);
                      setSuccessMessage("");
                      setErrorMessage("");
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TABLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {TABLE_OPTIONS.find((option) => option.value === listingTable)?.description}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Listing ID</label>
                  <div className="flex gap-2">
                    <input
                      value={listingId}
                      onChange={(event) => setListingId(event.target.value)}
                      placeholder="Enter numeric ID"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleFetchListing}
                      disabled={isFetchingListing}
                      className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium disabled:opacity-60"
                    >
                      {isFetchingListing ? "Loading..." : "Load"}
                    </button>
                  </div>
                </div>
              </div>

              {listing && (
                <div className="mt-6 bg-gray-950/40 border border-gray-800 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Listing Summary</p>
                      <p className="text-base font-medium text-white">
                        {listingTable === "number_plates"
                          ? `Plate ${"letter" in listing ? listing.letter : ""}${"digits" in listing ? listing.digits : ""}`
                          : `${"make" in listing ? listing.make : ""} ${"model" in listing ? listing.model : ""}`} (ID #{listing.id})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Status: {listing.status || "unknown"}</p>
                    </div>
                    <div className="text-sm text-gray-400">
                      Price: {listing.price ? `$${listing.price.toLocaleString()}` : "N/A"}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Current Owner</p>
                    {currentOwner ? (
                      <p className="text-sm text-gray-200 mt-1">
                        {currentOwner.type === "dealership" ? "Dealership" : "User"}: {currentOwner.name}
                        {currentOwner.extra ? ` • ${currentOwner.extra}` : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">No owner assigned.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-gray-900/70 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Target Owner</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">Owner Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetOwnerType("dealership")}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                        targetOwnerType === "dealership"
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                          : "border-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      <BuildingOffice2Icon className="h-4 w-4" />
                      Dealership
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetOwnerType("user")}
                      disabled={isRentalTable}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                        targetOwnerType === "user"
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-100"
                          : "border-gray-700 text-gray-400 hover:text-white"
                      } ${isRentalTable ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <UsersIcon className="h-4 w-4" />
                      User
                    </button>
                  </div>
                  {isRentalTable && (
                    <p className="text-xs text-gray-500 mt-2">Rental listings can only belong to dealerships.</p>
                  )}
                </div>

                {targetOwnerType === "dealership" ? (
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Dealership</label>
                    <select
                      value={targetDealershipId}
                      onChange={(event) => setTargetDealershipId(event.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoadingDealerships}
                    >
                      <option value="">Select dealership</option>
                      {dealerships.map((dealership) => (
                        <option key={dealership.id} value={dealership.id}>
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
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        placeholder="Search by name, email, phone"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {userSearchError && <p className="text-xs text-rose-400 mt-2">{userSearchError}</p>}
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-800">
                      {isLoadingUsers ? (
                        <div className="p-3 text-sm text-gray-400">Loading users...</div>
                      ) : users.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No users found.</div>
                      ) : (
                        users.map((user) => (
                          <button
                            type="button"
                            key={user.id}
                            onClick={() => setTargetUserId(user.id)}
                            className={`w-full text-left px-3 py-2 text-sm border-b border-gray-800 last:border-b-0 hover:bg-gray-800/70 ${
                              targetUserId === user.id ? "bg-indigo-500/20 text-indigo-100" : "text-gray-300"
                            }`}
                          >
                            <p className="font-medium">{user.name || user.email}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Transfer Summary</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Listing</span>
                  <span className="text-gray-100">{listing ? `#${listing.id}` : "Not loaded"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Owner</span>
                  <span className="text-gray-100">
                    {currentOwner ? `${currentOwner.type}: ${currentOwner.name}` : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Target Owner</span>
                  <span className="text-gray-100">
                    {targetOwnerType === "dealership"
                      ? targetDealershipId
                        ? `dealership #${targetDealershipId}`
                        : "Not selected"
                      : targetUserId
                        ? `user ${targetUserId.slice(0, 8)}...`
                        : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-gray-100">{listing?.status || "unchanged"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={isTransferring || !listing}
                className="mt-5 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold disabled:opacity-60"
              >
                {isTransferring ? "Transferring..." : "Transfer Ownership"}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Listing status remains unchanged. Soft-deleted listings are not available.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default TransferOwnershipPage;
