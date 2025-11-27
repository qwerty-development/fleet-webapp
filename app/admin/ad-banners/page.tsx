"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowUpIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

// Define interfaces
interface AdBanner {
  id: number;
  created_at: string;
  image_url: string | null;
  redirect_to: string | null;
  active: boolean;
}

// Constants
const ITEMS_PER_PAGE = 10;

export default function AdminAdBannersPage() {
  const supabase = createClient();

  // State variables
  const [adBanners, setAdBanners] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<AdBanner | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    image_url: "",
    redirect_to: "",
    active: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("upload");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch ad banners with pagination and filtering
  const fetchAdBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);

      let query = supabase
        .from("ad_banners")
        .select("*", { count: "exact" })
        .order(sortBy, { ascending: sortOrder === "asc" });

      // Filter by active status
      if (filterActive === "active") {
        query = query.eq("active", true);
      } else if (filterActive === "inactive") {
        query = query.eq("active", false);
      }

      // Search by redirect_to URL
      if (searchQuery) {
        query = query.ilike("redirect_to", `%${searchQuery}%`);
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setAdBanners(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error("Error fetching ad banners:", err);
      setError("Failed to fetch ad banners. Please check your network connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery, filterActive]);

  // Initial data fetch
  useEffect(() => {
    fetchAdBanners();
  }, [fetchAdBanners]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    setSortBy(column);
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setCurrentPage(1);
      fetchAdBanners();
    },
    [fetchAdBanners]
  );

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      image_url: "",
      redirect_to: "",
      active: true,
    });
    setFile(null);
    setImageInputMode("upload");
    setUploadProgress(0);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (banner: AdBanner) => {
    setSelectedBanner(banner);
    setFormData({
      image_url: banner.image_url || "",
      redirect_to: banner.redirect_to || "",
      active: banner.active,
    });
    setFile(null);
    setImageInputMode(banner.image_url ? "url" : "upload");
    setUploadProgress(0);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (banner: AdBanner) => {
    setSelectedBanner(banner);
    setIsDeleteModalOpen(true);
  };

  // Handle file upload to Supabase storage
  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploadProgress(10);

    const { error: uploadError } = await supabase.storage
      .from("ad_banners")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploadProgress(80);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("ad_banners")
      .getPublicUrl(filePath);

    setUploadProgress(100);

    return publicUrlData.publicUrl;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);

    try {
      // Validate form
      if (imageInputMode === "url" && !formData.image_url) {
        alert("Please provide an image URL");
        setIsActionLoading(false);
        return;
      }

      if (imageInputMode === "upload" && !file && !formData.image_url) {
        alert("Please upload an image");
        setIsActionLoading(false);
        return;
      }

      let imageUrl = formData.image_url;

      // Upload new file if selected
      if (imageInputMode === "upload" && file) {
        imageUrl = await handleFileUpload(file);
      }

      const bannerData = {
        image_url: imageUrl,
        redirect_to: formData.redirect_to || null,
        active: formData.active,
      };

      if (isEditModalOpen && selectedBanner) {
        // Update existing banner
        const { error } = await supabase
          .from("ad_banners")
          .update(bannerData)
          .eq("id", selectedBanner.id);

        if (error) throw error;
        alert("Ad banner updated successfully!");
      } else {
        // Create new banner
        const { error } = await supabase.from("ad_banners").insert(bannerData);

        if (error) throw error;
        alert("Ad banner created successfully!");
      }

      // Refresh data and close modal
      await fetchAdBanners();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedBanner(null);
      setFile(null);
      setUploadProgress(0);
    } catch (err: any) {
      console.error("Error saving ad banner:", err);
      alert(`Failed to save ad banner: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedBanner) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("ad_banners")
        .delete()
        .eq("id", selectedBanner.id);

      if (error) throw error;

      alert("Ad banner deleted successfully!");
      await fetchAdBanners();
      setIsDeleteModalOpen(false);
      setSelectedBanner(null);
    } catch (err: any) {
      console.error("Error deleting ad banner:", err);
      alert(`Failed to delete ad banner: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (banner: AdBanner) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from("ad_banners")
        .update({ active: !banner.active })
        .eq("id", banner.id);

      if (error) throw error;

      await fetchAdBanners();
    } catch (err: any) {
      console.error("Error updating ad banner status:", err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Ad Banners</h1>
              <p className="text-gray-400">
                Manage advertisement banners for the mobile app
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} total ad banner{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Add Banner Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 rounded-lg transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Ad Banner
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by redirect URL..."
                className="block w-full pl-10 pr-10 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </form>

            {/* Filter and Sort Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Active Filter */}
              <select
                value={filterActive}
                onChange={(e) => {
                  setFilterActive(e.target.value as "all" | "active" | "inactive");
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-800/60 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              {/* Sort by Date */}
              <button
                onClick={() => handleSort("created_at")}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === "created_at"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Date Created
                {sortBy === "created_at" &&
                  (sortOrder === "asc" ? (
                    <ChevronUpIcon className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 ml-1" />
                  ))}
              </button>

              {/* Sort by Active Status */}
              <button
                onClick={() => handleSort("active")}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === "active"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Status
                {sortBy === "active" &&
                  (sortOrder === "asc" ? (
                    <ChevronUpIcon className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 ml-1" />
                  ))}
              </button>
            </div>
          </div>

          {/* Ad Banners List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Error Loading Ad Banners
              </h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchAdBanners()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : adBanners.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Ad Banners Found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || filterActive !== "all"
                  ? "No ad banners match your search criteria. Try a different filter."
                  : "No ad banners available. Create your first ad banner to get started."}
              </p>
              <button
                onClick={openAddModal}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors"
              >
                Add First Ad Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adBanners.map((banner) => (
                <div
                  key={banner.id}
                  className={`bg-gray-800/80 backdrop-blur-sm border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                    banner.active
                      ? "border-gray-700/50 hover:border-gray-600"
                      : "border-gray-700/30 opacity-60"
                  }`}
                >
                  {/* Banner Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={`Ad Banner ${banner.id}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-16 w-16 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    {/* Active Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          banner.active
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {banner.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* ID Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-1 bg-black/60 rounded text-xs text-white">
                        ID: {banner.id}
                      </span>
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Redirect URL */}
                      <div className="flex items-start text-gray-300">
                        <LinkIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {banner.redirect_to || "No redirect URL"}
                        </span>
                      </div>

                      {/* Created Date */}
                      <p className="text-gray-500 text-xs">
                        Created: {formatDate(banner.created_at)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center mt-4">
                      {/* Toggle Active Button */}
                      <button
                        onClick={() => handleToggleActive(banner)}
                        disabled={isActionLoading}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          banner.active
                            ? "bg-amber-600/80 hover:bg-amber-600 text-white"
                            : "bg-emerald-600/80 hover:bg-emerald-600 text-white"
                        }`}
                      >
                        {banner.active ? (
                          <>
                            <XCircleIcon className="h-3.5 w-3.5 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </button>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(banner)}
                          className="flex items-center px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors"
                        >
                          <PencilIcon className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(banner)}
                          className="flex items-center px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
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
          {adBanners.length > 0 && totalPages > 1 && (
            <div className="flex justify-between items-center py-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg text-sm ${
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
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center px-4 py-2 rounded-lg text-sm ${
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
      </div>

      {/* Add/Edit Ad Banner Modal */}
      <Transition appear show={isAddModalOpen || isEditModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-white text-center mb-6"
                  >
                    {isAddModalOpen ? "Add New Ad Banner" : "Edit Ad Banner"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Input Mode Toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Image Source
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setImageInputMode("upload")}
                          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                            imageInputMode === "upload"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                          Upload Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode("url")}
                          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                            imageInputMode === "url"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          <GlobeAltIcon className="h-5 w-5 mr-2" />
                          Image URL
                        </button>
                      </div>
                    </div>

                    {/* Image Upload or URL Input */}
                    {imageInputMode === "upload" ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-full aspect-video mb-4 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
                          {file ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                            />
                          ) : formData.image_url ? (
                            <img
                              src={formData.image_url}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
                              <PhotoIcon className="h-16 w-16 text-gray-400 mb-2" />
                              <p className="text-gray-400 text-sm">
                                Click below to upload an image
                              </p>
                            </div>
                          )}
                        </div>

                        <label className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                          {file ? "Change Image" : "Upload Image"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>

                        {file && (
                          <p className="text-gray-400 text-sm mt-2">
                            Selected: {file.name}
                          </p>
                        )}

                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="w-full mt-3">
                            <div className="bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-gray-400 text-xs mt-1 text-center">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="image_url"
                          className="block text-sm font-medium text-gray-400 mb-1"
                        >
                          Image URL
                        </label>
                        <input
                          type="url"
                          id="image_url"
                          value={formData.image_url}
                          onChange={(e) =>
                            setFormData({ ...formData, image_url: e.target.value })
                          }
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                        />

                        {/* Preview */}
                        {formData.image_url && (
                          <div className="mt-4 aspect-video w-full border border-gray-600 rounded-lg overflow-hidden">
                            <img
                              src={formData.image_url}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Redirect URL */}
                    <div>
                      <label
                        htmlFor="redirect_to"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Redirect URL (Optional)
                      </label>
                      <input
                        type="text"
                        id="redirect_to"
                        value={formData.redirect_to}
                        onChange={(e) =>
                          setFormData({ ...formData, redirect_to: e.target.value })
                        }
                        placeholder="https://example.com or fleet://car/123"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        Where users will be redirected when they tap the banner
                      </p>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-white">
                          Active Status
                        </label>
                        <p className="text-gray-400 text-xs">
                          Only active banners are shown in the app
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, active: !formData.active })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.active ? "bg-emerald-500" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Submit and Cancel Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          setIsEditModalOpen(false);
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {isActionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            {isAddModalOpen ? "Creating..." : "Updating..."}
                          </>
                        ) : isAddModalOpen ? (
                          "Create Ad Banner"
                        ) : (
                          "Update Ad Banner"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-white text-center mb-4"
                  >
                    Delete Ad Banner
                  </Dialog.Title>

                  <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-500/20 mb-4">
                      <TrashIcon className="h-6 w-6 text-rose-400" />
                    </div>
                    <p className="text-gray-300">
                      Are you sure you want to delete this ad banner?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isActionLoading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {isActionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Loading Overlay */}
      {isActionLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-white">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
