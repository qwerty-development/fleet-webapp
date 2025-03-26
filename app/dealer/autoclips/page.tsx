"use client";

import React, { useState, useEffect, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  PlusIcon,
  VideoCameraIcon,
  EyeIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

// Constants
const ITEMS_PER_PAGE = 9; // Number of clips to show per page
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_VIDEO_DURATION = 60; // 60 seconds
const ALLOWED_VIDEO_TYPES = ["mp4", "mov"];

export default function DealerAutoClipsPage() {
  const supabase = createClient();
  const { user } = useAuth();

  // State for data
  const [isLoading, setIsLoading] = useState(true);
  const [autoClips, setAutoClips] = useState([]);
  const [dealershipId, setDealershipId] = useState(null);
  const [dealershipData, setDealershipData] = useState(null);
  const [cars, setCars] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const editModalRef=useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    carId: null,
    videoFile: null,
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchDealershipAndClips();
    }
  }, [user, currentPage]);

  // Fetch dealership and clips with pagination
  const fetchDealershipAndClips = async () => {
    try {
      setIsLoading(true);

      // Get the dealership info
      const { data: dealershipData, error: dealershipError } = await supabase
        .from("dealerships")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (dealershipError) throw dealershipError;

      setDealershipData(dealershipData);
      setDealershipId(dealershipData.id);

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("auto_clips")
        .select("id", { count: "exact" })
        .eq("dealership_id", dealershipData.id);

      if (countError) throw countError;

      const totalItems = count || 0;
      setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE));

      // Get paginated clips
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: clipsData, error: clipsError } = await supabase
        .from("auto_clips")
        .select("*, cars(make, model, year)")
        .eq("dealership_id", dealershipData.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (clipsError) throw clipsError;

      setAutoClips(clipsData || []);

      // Fetch available cars for creating new clips
      await fetchAvailableCars(dealershipData.id);

    } catch (error) {
      console.error("Error fetching data:", error);
      // We'll add more detailed error handling
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch cars that don't already have autoclips
  const fetchAvailableCars = async (dealershipId) => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          id,
          make,
          model,
          year,
          price,
          status,
          auto_clips(id)
        `)
        .eq("dealership_id", dealershipId)
        .eq("status", "available");

      if (error) throw error;

      // Filter out cars that already have autoclips
      // This is optional - depending on if you want to allow multiple clips per car
      const availableCars = data
        ?.filter(car => !car.auto_clips || car.auto_clips.length === 0)
        .map(({ auto_clips, ...car }) => car) || [];

      setCars(availableCars);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchDealershipAndClips();
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top would go here
    window.scrollTo(0, 0);
  };

  // Handle status toggle
  const toggleStatus = async (clip) => {
    const newStatus = clip.status === "published" ? "draft" : "published";
    try {
      const { error } = await supabase
        .from("auto_clips")
        .update({ status: newStatus })
        .eq("id", clip.id);

      if (error) throw error;

      // Update the local state to reflect the change
      setAutoClips(autoClips.map(c => {
        if (c.id === clip.id) {
          return { ...c, status: newStatus };
        }
        return c;
      }));

    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedClip) return;

    try {
      const { error } = await supabase
        .from("auto_clips")
        .delete()
        .eq("id", selectedClip.id);

      if (error) throw error;

      // Close modal and refresh the list
      setIsDeleteConfirmOpen(false);
      setSelectedClip(null);

      // Remove the deleted clip from the local state
      setAutoClips(autoClips.filter(clip => clip.id !== selectedClip.id));

      alert("AutoClip deleted successfully");
    } catch (error) {
      console.error("Error deleting clip:", error);
      alert("Failed to delete AutoClip. Please try again.");
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      title: "",
      description: "",
      carId: null,
      videoFile: null,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (clip) => {
    setSelectedClip(clip);
    setFormData({
      title: clip.title || "",
      description: clip.description || "",
      carId: clip.car_id,
      videoFile: null, // Existing video
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Form validation
  const validateForm = (data, isEdit = false) => {
    const errors = {};

    if (!data.title.trim()) {
      errors.title = "Title is required";
    } else if (data.title.length < 3) {
      errors.title = "Title must be at least 3 characters long";
    }

    if (data.description && data.description.length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    if (!data.carId) {
      errors.carId = "Please select a car";
    }

    if (!isEdit && !data.videoFile) {
      errors.videoFile = "Please select a video file";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle video file selection
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error
    setFormErrors(prev => ({ ...prev, videoFile: null }));

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      setFormErrors(prev => ({
        ...prev,
        videoFile: `File is too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`
      }));
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_VIDEO_TYPES.includes(fileExtension)) {
      setFormErrors(prev => ({
        ...prev,
        videoFile: "Invalid file format. Please use MP4 or MOV files"
      }));
      return;
    }

    // Set the file to form data
    setFormData(prev => ({ ...prev, videoFile: file }));
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear the error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle car selection
  const handleCarSelect = (carId) => {
    setFormData(prev => ({ ...prev, carId }));

    // Clear the error
    if (formErrors.carId) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.carId;
        return newErrors;
      });
    }
  };

  // Handle form submission for create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // Validate the form
    if (!validateForm(formData)) return;

    try {
      setIsUploading(true);

      // Check if car already has an autoclip
      const { data: existingClip, error: checkError } = await supabase
        .from("auto_clips")
        .select("id")
        .eq("car_id", formData.carId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingClip) {
        alert("This car already has an AutoClip.");
        return;
      }

      // File naming and path setup
      const fileExtension = formData.videoFile.name.split('.').pop().toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${dealershipId}/${fileName}`;

      // Create form data for upload
      const fileFormData = new FormData();
      fileFormData.append('file', formData.videoFile);

      // Upload video to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('autoclips')
        .upload(filePath, formData.videoFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          }
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('autoclips')
        .getPublicUrl(filePath);

      // Create database entry
      const { error: dbError } = await supabase.from('auto_clips').insert({
        dealership_id: dealershipId,
        car_id: formData.carId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: publicUrl,
        thumbnail_url: publicUrl, // Same URL for thumbnail
        status: 'published',
        views: 0,
        likes: 0,
        viewed_users: [],
        liked_users: []
      });

      if (dbError) throw dbError;

      // Success! Close modal and refresh the list
      setIsCreateModalOpen(false);
      fetchDealershipAndClips();
      alert("AutoClip created successfully");

    } catch (error) {
      console.error("Error creating clip:", error);
      alert(`Failed to create AutoClip: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle form submission for edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Validate the form (passing true for isEdit parameter)
    if (!validateForm(formData, true)) return;

    try {
      setIsUploading(true);

      let videoUrl = selectedClip.video_url;

      // If a new video was uploaded, process it
      if (formData.videoFile) {
        // File naming and path setup
        const fileExtension = formData.videoFile.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
        const filePath = `${dealershipId}/${fileName}`;

        // Upload new video to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('autoclips')
          .upload(filePath, formData.videoFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setUploadProgress(percent);
            }
          });

        if (uploadError) throw uploadError;

        // Get public URL for the new video
        const { data: { publicUrl } } = supabase.storage
          .from('autoclips')
          .getPublicUrl(filePath);

        videoUrl = publicUrl;
      }

      // Update database entry
      const { error: dbError } = await supabase
        .from('auto_clips')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          car_id: formData.carId,
          video_url: videoUrl,
          thumbnail_url: videoUrl, // Same URL for thumbnail
        })
        .eq('id', selectedClip.id);

      if (dbError) throw dbError;

      // Success! Close modal and refresh the list
      setIsEditModalOpen(false);
      setSelectedClip(null);
      fetchDealershipAndClips();
      alert("AutoClip updated successfully");

    } catch (error) {
      console.error("Error updating clip:", error);
      alert(`Failed to update AutoClip: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // UI Components

  // Pagination controls component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center px-4 py-2 bg-gray-800 rounded-md text-white">
          Page {currentPage} of {totalPages}
        </div>

        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    );
  };

  // Create Modal component
const CreateAutoClipModal = () => {
  if (!isCreateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsCreateModalOpen(false)}></div>

      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle bg-gray-800 shadow-xl rounded-2xl relative">
          <h3 className="text-lg font-medium leading-6 text-white mb-4">
            Create New AutoClip
          </h3>

          <form onSubmit={handleCreateSubmit}>
            {/* Video Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Upload*
              </label>
              {formData.videoFile ? (
                <div className="relative rounded-lg overflow-hidden h-40 bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayIcon className="h-12 w-12 text-white" />
                  </div>
                  <p className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    {formData.videoFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                    className="absolute top-2 right-2 bg-gray-900/60 p-1 rounded-full"
                  >
                    <XCircleIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 cursor-pointer hover:border-indigo-500 transition-colors">
                  <label className="cursor-pointer flex flex-col items-center">
                    <VideoCameraIcon className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-400">
                      Click to select a video
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={handleVideoSelect}
                    />
                  </label>
                </div>
              )}
              {formErrors.videoFile && (
                <p className="mt-1 text-sm text-red-500">{formErrors.videoFile}</p>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter a title for your clip"
                  maxLength={50}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your clip"
                  rows={3}
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
            </div>

            {/* Car Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Car*
              </label>

              {cars.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      onClick={() => handleCarSelect(car.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.carId === car.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{car.make} {car.model}</div>
                      <div className="text-sm opacity-80">{car.year}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center text-gray-300">
                  No cars available for new AutoClips. All cars already have associated clips.
                </div>
              )}

              {formErrors.carId && (
                <p className="mt-1 text-sm text-red-500">{formErrors.carId}</p>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Uploading</span>
                  <span className="text-sm text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || cars.length === 0}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md transition-colors ${
                  isUploading || cars.length === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Create AutoClip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const EditAutoClipModal = () => {
  if (!isEditModalOpen || !selectedClip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsEditModalOpen(false)}></div>

      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle bg-gray-800 shadow-xl rounded-2xl relative">
          <h3 className="text-lg font-medium leading-6 text-white mb-4">
            Edit AutoClip
          </h3>

          <form onSubmit={handleEditSubmit}>
            {/* Video Preview/Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video
              </label>

              {formData.videoFile ? (
                <div className="relative rounded-lg overflow-hidden h-40 bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayIcon className="h-12 w-12 text-white" />
                  </div>
                  <p className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    {formData.videoFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                    className="absolute top-2 right-2 bg-gray-900/60 p-1 rounded-full"
                  >
                    <XCircleIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden h-40 bg-gray-700">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayIcon className="h-12 w-12 text-white" />
                  </div>
                  <p className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    Current video
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="cursor-pointer px-3 py-1.5 bg-gray-900/70 rounded-md text-white text-sm hover:bg-gray-800 transition-colors">
                      Replace Video
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        className="hidden"
                        onChange={handleVideoSelect}
                      />
                    </label>
                  </div>
                </div>
              )}

              {formErrors.videoFile && (
                <p className="mt-1 text-sm text-red-500">{formErrors.videoFile}</p>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter a title for your clip"
                  maxLength={50}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your clip"
                  rows={3}
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
            </div>

            {/* Car Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Car*
              </label>

              {cars.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {/* Include the current car in the list even if it already has a clip (since we're editing) */}
                  {[
                    ...cars,
                    // Include the current car if it's not already in the list
                    ...(cars.some(c => c.id === selectedClip.car_id) ? [] : [{
                      id: selectedClip.car_id,
                      make: selectedClip.cars?.make || "Unknown",
                      model: selectedClip.cars?.model || "Car",
                      year: selectedClip.cars?.year || ""
                    }])
                  ].map((car) => (
                    <div
                      key={car.id}
                      onClick={() => handleCarSelect(car.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.carId === car.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{car.make} {car.model}</div>
                      <div className="text-sm opacity-80">{car.year}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center text-gray-300">
                  No cars available. Please add cars to your inventory first.
                </div>
              )}

              {formErrors.carId && (
                <p className="mt-1 text-sm text-red-500">{formErrors.carId}</p>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Uploading</span>
                  <span className="text-sm text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-md transition-colors ${
                  isUploading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

  // View/Preview Modal component
const ViewAutoClipModal = () => {
  if (!isViewModalOpen || !selectedClip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-60" onClick={() => {
        setIsViewModalOpen(false);
        setSelectedClip(null);
      }}></div>

      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle bg-gray-800 shadow-xl rounded-2xl relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium leading-6 text-white">
              {selectedClip.title}
            </h3>

            <button
              type="button"
              onClick={() => {
                setIsViewModalOpen(false);
                setSelectedClip(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Video Player */}
          <div className="rounded-lg overflow-hidden bg-black mb-4">
            <video
              src={selectedClip.video_url}
              controls
              className="w-full h-auto max-h-[50vh]"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Clip Details */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">
                {selectedClip.cars && (
                  <span>
                    {selectedClip.cars.make} {selectedClip.cars.model} {selectedClip.cars.year}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="flex items-center text-gray-400 text-sm">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {selectedClip.views || 0}
                </span>
                <span className="flex items-center text-gray-400 text-sm">
                  <HeartIcon className="h-4 w-4 mr-1" />
                  {selectedClip.likes || 0}
                </span>
              </div>
            </div>

            {selectedClip.description && (
              <p className="text-gray-300 mt-2">{selectedClip.description}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-2">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedClip.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {selectedClip.status}
                  </span>
                </div>

                <div className="text-sm text-gray-400">
                  Created: {new Date(selectedClip.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => toggleStatus(selectedClip)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedClip.status === 'published'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {selectedClip.status === 'published' ? 'Set as Draft' : 'Publish'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsViewModalOpen(false);
                openEditModal(selectedClip);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                setIsViewModalOpen(false);
                setIsDeleteConfirmOpen(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Delete Confirmation Modal
const DeleteConfirmationModal = () => {
  if (!isDeleteConfirmOpen || !selectedClip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsDeleteConfirmOpen(false)}></div>

      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-gray-800 shadow-xl rounded-2xl relative">
          <h3 className="text-lg font-medium leading-6 text-white mb-4">
            Confirm Deletion
          </h3>

          <div className="mt-2">
            <p className="text-gray-300">
              Are you sure you want to delete this AutoClip?
              <span className="block mt-2 font-semibold">{selectedClip.title}</span>
            </p>

            <p className="mt-3 text-sm text-gray-400">
              This action cannot be undone.
            </p>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Main component return
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Auto Clips
            </h1>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Clip
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : autoClips.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <VideoCameraIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Auto Clips Found</h3>
              <p className="text-gray-400 mb-6">You haven't created any auto clips yet. Create video content to showcase your vehicles.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Create Your First Clip
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {autoClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300"
                  >
                    <div className="h-48 overflow-hidden relative">
                      {clip.thumbnail_url ? (
                        <img
                          src={clip.thumbnail_url}
                          alt={clip.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <VideoCameraIcon className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${
                          clip.status === 'published'
                            ? 'bg-emerald-500/80'
                            : 'bg-amber-500/80'
                        }`}
                      >
                        {clip.status}
                      </div>
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedClip(clip);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <button className="p-3 bg-indigo-600 rounded-full">
                          <PlayIcon className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-white text-lg font-semibold truncate">{clip.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {clip.cars && `${clip.cars.make} ${clip.cars.model} ${clip.cars.year}`}
                      </p>

                      <div className="flex justify-between items-center mt-3">
                        <p className="text-gray-400 text-xs">
                          {new Date(clip.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-gray-400 text-sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            {clip.views || 0}
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <HeartIcon className="h-4 w-4 mr-1" />
                            {clip.likes || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => openEditModal(clip)}
                          className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClip(clip);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <PaginationControls />
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAutoClipModal />
      <ViewAutoClipModal />
      <EditAutoClipModal />
      <DeleteConfirmationModal />
    </div>
  );
}