"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  PlusIcon,
  VideoCameraIcon,
  XCircleIcon,
  PlayIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";

// Constants
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_VIDEO_DURATION = 60; // 60 seconds
const ALLOWED_VIDEO_TYPES = ["mp4", "mov"];

interface Dealership {
  id: number;
  name: string;
  logo: string;
  location: string;
}

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  dealership_id: number;
}

export default function AdminCreateAutoClipsPage() {
  const supabase = createClient();

  // State for data
  const [isLoading, setIsLoading] = useState(true);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);

  // Form state
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoFile: null as File | null,
  });

  // UI state
  const [isDealershipDropdownOpen, setIsDealershipDropdownOpen] = useState(false);
  const [dealershipSearchQuery, setDealershipSearchQuery] = useState("");
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const dealershipDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchDealerships();
  }, []);

  // Fetch cars when dealership is selected
  useEffect(() => {
    if (selectedDealership) {
      fetchCarsForDealership(selectedDealership.id);
    } else {
      setCars([]);
      setFilteredCars([]);
    }
  }, [selectedDealership]);

  // Filter cars based on search query
  useEffect(() => {
    if (!carSearchQuery.trim()) {
      setFilteredCars(cars);
    } else {
      const filtered = cars.filter(car =>
        `${car.make} ${car.model} ${car.year}`.toLowerCase().includes(carSearchQuery.toLowerCase())
      );
      setFilteredCars(filtered);
    }
  }, [cars, carSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dealershipDropdownRef.current && !dealershipDropdownRef.current.contains(event.target as Node)) {
        setIsDealershipDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDealerships = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("dealerships")
        .select("id, name, logo, location")
        .order("name");

      if (error) throw error;
      setDealerships(data || []);
    } catch (error) {
      console.error("Error fetching dealerships:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCarsForDealership = async (dealershipId: number) => {
    try {
      // Fetch cars that don't already have autoclips
      const { data, error } = await supabase
        .from("cars")
        .select(`
          id,
          make,
          model,
          year,
          price,
          images,
          dealership_id,
          auto_clips(id)
        `)
        .eq("dealership_id", dealershipId)
        .eq("status", "available");

      if (error) throw error;

      // Filter out cars that already have autoclips
      const availableCars = data
        ?.filter((car: any) => !car.auto_clips || car.auto_clips.length === 0)
        .map(({ auto_clips, ...car }) => car) || [];

      setCars(availableCars);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const handleDealershipSelect = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setSelectedCar(null);
    setIsDealershipDropdownOpen(false);
    setDealershipSearchQuery("");
    
    // Clear dealership-related errors
    if (formErrors.dealership) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.dealership;
        return newErrors;
      });
    }
  };

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
    
    // Clear car-related errors
    if (formErrors.car) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.car;
        return newErrors;
      });
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setFormErrors(prev => ({ ...prev, videoFile: "" }));

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      setFormErrors(prev => ({
        ...prev,
        videoFile: `File is too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
      }));
      return;
    }

    // Validate file type
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_VIDEO_TYPES.includes(fileExtension)) {
      setFormErrors(prev => ({
        ...prev,
        videoFile: "Invalid file format. Please use MP4 or MOV files",
      }));
      return;
    }

    setFormData(prev => ({ ...prev, videoFile: file }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!selectedDealership) {
      errors.dealership = "Please select a dealership";
    }

    if (!selectedCar) {
      errors.car = "Please select a car";
    }

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters long";
    }

    if (formData.description && formData.description.length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    if (!formData.videoFile) {
      errors.videoFile = "Please select a video file";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsUploading(true);

      // Check if car already has an autoclip (double-check)
      const { data: existingClip, error: checkError } = await supabase
        .from("auto_clips")
        .select("id")
        .eq("car_id", selectedCar!.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingClip) {
        alert("This car already has an AutoClip.");
        return;
      }

      // File naming and path setup
      const fileExtension = formData.videoFile!.name.split(".").pop()!.toLowerCase();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${selectedDealership!.id}/${fileName}`;

      // Upload video to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("autoclips")
        .upload(filePath, formData.videoFile!, {
          cacheControl: "3600",
          upsert: false,
         
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("autoclips").getPublicUrl(filePath);

      // Create database entry
      const { error: dbError } = await supabase.from("auto_clips").insert({
        dealership_id: selectedDealership!.id,
        car_id: selectedCar!.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: publicUrl,
        thumbnail_url: publicUrl,
        status: "published",
        views: 0,
        likes: 0,
        viewed_users: [],
        liked_users: [],
      });

      if (dbError) throw dbError;

      // Success! Reset form
      setFormData({
        title: "",
        description: "",
        videoFile: null,
      });
      setSelectedDealership(null);
      setSelectedCar(null);
      alert("AutoClip created successfully!");
    } catch (error: any) {
      console.error("Error creating clip:", error);
      alert(`Failed to create AutoClip: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Filter dealerships based on search
  const filteredDealerships = dealerships.filter(dealership =>
    dealership.name.toLowerCase().includes(dealershipSearchQuery.toLowerCase()) ||
    dealership.location.toLowerCase().includes(dealershipSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create AutoClip</h1>
            <p className="text-gray-400">Create video content for any dealership's vehicles</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Dealership Selection */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Dealership*
                </label>

                <div className="relative" ref={dealershipDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDealershipDropdownOpen(!isDealershipDropdownOpen)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between ${
                      formErrors.dealership ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      {selectedDealership ? (
                        <>
                          {selectedDealership.logo && (
                            <img
                              src={selectedDealership.logo}
                              alt={selectedDealership.name}
                              className="w-6 h-6 rounded-full object-cover mr-3"
                            />
                          )}
                          <div className="text-left">
                            <div className="font-medium">{selectedDealership.name}</div>
                            <div className="text-sm text-gray-400">{selectedDealership.location}</div>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Choose a dealership...</span>
                      )}
                    </div>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  </button>

                  {isDealershipDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                      <div className="p-3 border-b border-gray-600">
                        <div className="relative">
                          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search dealerships..."
                            value={dealershipSearchQuery}
                            onChange={(e) => setDealershipSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-gray-600 text-white border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto">
                        {filteredDealerships.length > 0 ? (
                          filteredDealerships.map((dealership) => (
                            <button
                              key={dealership.id}
                              type="button"
                              onClick={() => handleDealershipSelect(dealership)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-600 flex items-center transition-colors"
                            >
                              {dealership.logo && (
                                <img
                                  src={dealership.logo}
                                  alt={dealership.name}
                                  className="w-8 h-8 rounded-full object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="font-medium text-white">{dealership.name}</div>
                                <div className="text-sm text-gray-400">{dealership.location}</div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-400 text-center">
                            No dealerships found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {formErrors.dealership && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.dealership}</p>
                )}
              </div>

              {/* Car Selection */}
              {selectedDealership && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select Car*
                  </label>

                  {cars.length > 0 ? (
                    <>
                      <div className="mb-4">
                        <div className="relative">
                          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search cars..."
                            value={carSearchQuery}
                            onChange={(e) => setCarSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {filteredCars.map((car) => (
                          <div
                            key={car.id}
                            onClick={() => handleCarSelect(car)}
                            className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                              selectedCar?.id === car.id
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {car.images && car.images.length > 0 && (
                                <img
                                  src={car.images[0]}
                                  alt={`${car.make} ${car.model}`}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">
                                  {car.make} {car.model}
                                </div>
                                <div className="text-sm opacity-80">{car.year}</div>
                                <div className="text-sm font-bold">
                                  ${car.price?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-gray-700 rounded-lg text-center text-gray-400">
                      No cars available for AutoClips. All cars from this dealership already have associated clips or no cars are listed.
                    </div>
                  )}

                  {formErrors.car && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.car}</p>
                  )}
                </div>
              )}

              {/* Video Upload Section */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Video Upload*
                </label>
                {formData.videoFile ? (
                  <div className="relative rounded-lg overflow-hidden h-40 bg-gray-700">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon className="h-12 w-12 text-gray-400" />
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
                  <div className="flex items-center justify-center h-40 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:border-indigo-500 transition-colors">
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
                  <p className="mt-1 text-sm text-red-400">{formErrors.videoFile}</p>
                )}
              </div>

              {/* Title and Description */}
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.title ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter a title for your clip"
                    maxLength={50}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
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
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.description ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Describe your clip"
                    rows={3}
                    maxLength={500}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.description}</p>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Uploading
                    </span>
                    <span className="text-sm text-gray-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center ${
                    isUploading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-indigo-700"
                  }`}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {isUploading ? "Creating..." : "Create AutoClip"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
