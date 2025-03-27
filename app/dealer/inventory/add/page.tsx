"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import DealerNavbar from "@/components/dealer/navbar";
import Image from "next/image";
import {
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

// Constants for selection options
const CONDITIONS = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Certified", label: "Certified" },
  { value: "Classic", label: "Classic" }
];

const TRANSMISSIONS = [
  { value: "Automatic", label: "Automatic" },
  { value: "Manual", label: "Manual" },
  { value: "Semi-Automatic", label: "Semi-Automatic" }
];

const DRIVETRAIN_OPTIONS = [
  { value: "FWD", label: "Front Wheel Drive" },
  { value: "RWD", label: "Rear Wheel Drive" },
  { value: "AWD", label: "All Wheel Drive" },
  { value: "4WD", label: "Four Wheel Drive" }
];

const VEHICLE_TYPES = [
  { value: "Benzine", label: "Gasoline" },
  { value: "Diesel", label: "Diesel" },
  { value: "Electric", label: "Electric" },
  { value: "Hybrid", label: "Hybrid" }
];

const CATEGORIES = [
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "Coupe", label: "Coupe" },
  { value: "Truck", label: "Truck" },
  { value: "Hatchback", label: "Hatchback" },
  { value: "Convertible", label: "Convertible" },
  { value: "Van", label: "Van" },
  { value: "Wagon", label: "Wagon" }
];

const SOURCE_OPTIONS = [
  { value: "Company", label: "Company Source" },
  { value: "GCC", label: "GCC" },
  { value: "USA", label: "US" },
  { value: "Canada", label: "Canada" },
  { value: "Europe", label: "Europe" }
];

const VEHICLE_FEATURES = [
  { id: 'heated_seats', label: 'Heated Seats', icon: 'temperature-high' },
  { id: 'keyless_entry', label: 'Keyless Entry', icon: 'key' },
  { id: 'keyless_start', label: 'Keyless Start', icon: 'power-off' },
  { id: 'power_mirrors', label: 'Power Mirrors', icon: 'car-side' },
  { id: 'power_steering', label: 'Power Steering', icon: 'steering-wheel' },
  { id: 'power_windows', label: 'Power Windows', icon: 'window-maximize' },
  { id: 'backup_camera', label: 'Backup Camera', icon: 'camera' },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth' },
  { id: 'cruise_control', label: 'Cruise Control', icon: 'tachometer-alt' },
  { id: 'navigation', label: 'Navigation System', icon: 'map-marker-alt' },
  { id: 'sunroof', label: 'Sunroof', icon: 'sun' },
  { id: 'leather_seats', label: 'Leather Seats', icon: 'couch' },
  { id: 'third_row_seats', label: 'Third Row Seats', icon: 'chair' },
  { id: 'parking_sensors', label: 'Parking Sensors', icon: 'parking' },
  { id: 'lane_assist', label: 'Lane Departure Warning', icon: 'road' },
  { id: 'blind_spot', label: 'Blind Spot Monitoring', icon: 'eye-slash' },
  { id: 'apple_carplay', label: 'Apple CarPlay', icon: 'apple' },
  { id: 'android_auto', label: 'Android Auto', icon: 'android' },
  { id: 'premium_audio', label: 'Premium Audio', icon: 'volume-up' },
  { id: 'remote_start', label: 'Remote Start', icon: 'key' }
];

// List of common car brands for the dropdown
const CAR_BRANDS = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti",
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Dodge", "Ferrari",
  "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar",
  "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus",
  "Maserati", "Maybach", "Mazda", "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan", "Pagani", "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce",
  "Saab", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

// Basic models for popular brands - you would expand this in production
const CAR_MODELS = {
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X7", "Z4", "i3", "i8"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "AMG GT"],
  "Toyota": ["Corolla", "Camry", "Avalon", "RAV4", "Highlander", "4Runner", "Tacoma", "Tundra", "Sienna", "Prius"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Ridgeline", "Fit"],
  "Ford": ["F-150", "Ranger", "Explorer", "Edge", "Escape", "Mustang", "Focus", "Bronco"],
  // Add more brands and models as needed
};

export default function AddInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealership, setDealership] = useState<any>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [models, setModels] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<any>({
    make: "",
    model: "",
    price: "",
    year: new Date().getFullYear(),
    description: "",
    condition: "",
    transmission: "",
    color: "",
    mileage: 0,
    drivetrain: "",
    type: "",
    category: "",
    status: "pending",
    source: "",
    bought_price: "",
    date_bought: new Date().toISOString().split("T")[0],
    seller_name: "",
    features: []
  });

  // Fetch dealer information on load
  useEffect(() => {
    async function fetchDealershipData() {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (dealershipError) throw dealershipError;

        setDealership(dealershipData);

        // Check subscription status
        const endDate = new Date(dealershipData.subscription_end_date);
        const now = new Date();
        if (endDate < now) {
          alert("Your subscription has expired. Please renew to add new listings.");
          router.push("/dealer/profile");
        }
      } catch (error) {
        console.error("Error fetching dealership:", error);
        alert("Could not fetch dealership information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDealershipData();
  }, [user, supabase, router]);

  // Update available models when make changes
  useEffect(() => {
    if (formData.make && CAR_MODELS[formData.make]) {
      setModels(CAR_MODELS[formData.make]);
    } else {
      setModels([]);
    }
  }, [formData.make]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "mileage" || name === "year" || name === "bought_price"
        ? value === "" ? "" : parseInt(value)
        : value
    }));
  };

  // Handle feature selection
  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => {
      const features = [...(prev.features || [])];
      const index = features.indexOf(featureId);

      if (index === -1) {
        features.push(featureId);
      } else {
        features.splice(index, 1);
      }

      return {
        ...prev,
        features
      };
    });
  };

  // Handle image uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !dealership) return;

    try {
      setUploadLoading(true);

      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${dealership.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('cars')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Remove image
  const handleRemoveImage = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const storageUrl = supabase.storageUrl || "";
      const relativePath = urlToRemove.replace(`${storageUrl}/object/public/cars/`, "");

      // Remove from storage
      await supabase.storage
        .from('cars')
        .remove([relativePath]);

      // Update state
      setUploadedImages(prev => prev.filter(url => url !== urlToRemove));
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove image. Please try again.");
    }
  };

  // Reorder images
  const handleReorderImages = (sourceIndex: number, destinationIndex: number) => {
    const newOrder = [...uploadedImages];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destinationIndex, 0, removed);
    setUploadedImages(newOrder);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Required fields
    const requiredFields = [
      { key: 'make', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'price', label: 'Price' },
      { key: 'year', label: 'Year' },
      { key: 'condition', label: 'Condition' },
      { key: 'transmission', label: 'Transmission' },
      { key: 'mileage', label: 'Mileage' },
      { key: 'drivetrain', label: 'Drivetrain' },
      { key: 'type', label: 'Fuel Type' },
      { key: 'category', label: 'Category' }
    ];

    requiredFields.forEach(field => {
      if (!formData[field.key] && formData[field.key] !== 0) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    // Image validation
    if (uploadedImages.length === 0) {
      newErrors.images = "At least one image is required";
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (formData.year && (formData.year < 1900 || formData.year > currentYear + 1)) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }

    // Price validation
    if (formData.price && formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    // Mileage validation
    if (formData.mileage < 0) {
      newErrors.mileage = "Mileage cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealership) {
      alert("Dealership information not found. Please try again.");
      return;
    }

    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstError);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSubmitting(true);

      const carData = {
        ...formData,
        images: uploadedImages,
        dealership_id: dealership.id,
        date_bought: formData.date_bought || new Date().toISOString().split("T")[0],
        bought_price: formData.bought_price || null,
        views: 0,
        likes: 0,
        viewed_users: [],
        liked_users: []
      };

      const { data, error } = await supabase
        .from('cars')
        .insert(carData)
        .select();

      if (error) throw error;

      alert("Listing created successfully!");
      router.push('/dealer/inventory');
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (uploadedImages.length > 0) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push('/dealer/inventory');
      }
    } else {
      router.push('/dealer/inventory');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        <DealerNavbar />
        <div className="pt-16 lg:pt-0 lg:pl-64">
          <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={handleCancel}
              className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Add New Vehicle</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Images */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Vehicle Images</h2>
              <p className="text-gray-400 mb-4">Upload high-quality photos of your vehicle (up to 10)</p>

              {errors.images && (
                <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                  {errors.images}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {/* Image gallery */}
                {uploadedImages.map((url, index) => (
                  <div key={url} className="relative group h-40 bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5 text-white" />
                      </button>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleReorderImages(index, index - 1)}
                          className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
                        >
                          <ArrowsUpDownIcon className="h-5 w-5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Upload button */}
                {uploadedImages.length < 10 && (
                  <label className="h-40 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                    {uploadLoading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    ) : (
                      <>
                        <PlusIcon className="h-10 w-10 text-gray-400" />
                        <span className="text-gray-400 mt-2">Add Images</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadLoading}
                    />
                  </label>
                )}
              </div>

              <p className="text-sm text-gray-400">
                {uploadedImages.length}/10 images uploaded. The first image will be used as the main listing image.
              </p>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Make/Brand */}
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                    Brand/Make <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.make ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  >
                    <option value="">Select Brand</option>
                    {CAR_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {errors.make && <p className="mt-1 text-sm text-red-500">{errors.make}</p>}
                </div>

                {/* Model */}
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  {formData.make && models.length > 0 ? (
                    <select
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 bg-gray-700 border ${
                        errors.model ? "border-red-500" : "border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    >
                      <option value="">Select Model</option>
                      {models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Enter model"
                      className={`w-full px-4 py-2.5 bg-gray-700 border ${
                        errors.model ? "border-red-500" : "border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    />
                  )}
                  {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="Enter year"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.year ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  />
                  {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    min="0"
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.price ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="Enter color"
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.color ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  />
                  {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter vehicle description"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
            </div>

            {/* Vehicle Classifications */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Vehicle Classifications</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Condition */}
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.condition ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.condition && <p className="mt-1 text-sm text-red-500">{errors.condition}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.category ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>

              {/* Source */}
              <div className="mb-6">
                <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-1">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value="">Select source</option>
                  {SOURCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div className="mb-6">
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-gray-700 border ${
                    errors.type ? "border-red-500" : "border-gray-600"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                >
                  <option value="">Select fuel type</option>
                  {VEHICLE_TYPES.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Technical Specifications</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Mileage */}
                <div>
                  <label htmlFor="mileage" className="block text-sm font-medium text-gray-300 mb-1">
                    Mileage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="mileage"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter mileage"
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.mileage ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  />
                  {errors.mileage && <p className="mt-1 text-sm text-red-500">{errors.mileage}</p>}
                </div>

                {/* Transmission */}
                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-gray-300 mb-1">
                    Transmission <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="transmission"
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.transmission ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  >
                    <option value="">Select transmission</option>
                    {TRANSMISSIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.transmission && <p className="mt-1 text-sm text-red-500">{errors.transmission}</p>}
                </div>

                {/* Drivetrain */}
                <div>
                  <label htmlFor="drivetrain" className="block text-sm font-medium text-gray-300 mb-1">
                    Drivetrain <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="drivetrain"
                    name="drivetrain"
                    value={formData.drivetrain}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-gray-700 border ${
                      errors.drivetrain ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                  >
                    <option value="">Select drivetrain</option>
                    {DRIVETRAIN_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.drivetrain && <p className="mt-1 text-sm text-red-500">{errors.drivetrain}</p>}
                </div>
              </div>
            </div>

            {/* Vehicle Features */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Vehicle Features</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {VEHICLE_FEATURES.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`feature-${feature.id}`}
                      checked={formData.features.includes(feature.id)}
                      onChange={() => handleFeatureToggle(feature.id)}
                      className="w-5 h-5 text-indigo-600 rounded border-gray-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    />
                    <label
                      htmlFor={`feature-${feature.id}`}
                      className="text-gray-300 cursor-pointer"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Purchase Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Purchase Price */}
                <div>
                  <label htmlFor="bought_price" className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    id="bought_price"
                    name="bought_price"
                    value={formData.bought_price}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter purchase price"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label htmlFor="date_bought" className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="date_bought"
                    name="date_bought"
                    value={formData.date_bought}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>

                {/* Seller */}
                <div>
                  <label htmlFor="seller_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Bought From
                  </label>
                  <input
                    type="text"
                    id="seller_name"
                    name="seller_name"
                    value={formData.seller_name}
                    onChange={handleChange}
                    placeholder="Enter seller name"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center transition-colors"
                disabled={isSubmitting}
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Add Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}