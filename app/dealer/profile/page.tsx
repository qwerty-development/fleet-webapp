"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  UserIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  CameraIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { MapPinIcon as MapPinIconSolid, PhoneIcon as PhoneIconSolid } from "@heroicons/react/24/solid";

export default function DealerProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, signOut } = useAuth();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [dealership, setDealership] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    longitude: '',
    latitude: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Password change states
  const [isChangePasswordMode, setIsChangePasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch dealership data
  useEffect(() => {
    async function fetchDealershipData() {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching dealership data:", error);
          return;
        }

        setDealership(data);
        setFormData({
          name: data.name || '',
          location: data.location || '',
          phone: data.phone?.toString() || '',
          longitude: data.longitude?.toString() || '',
          latitude: data.latitude?.toString() || '',
        });
      } catch (error) {
        console.error("Error in fetchDealershipData:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDealershipData();
  }, [user, supabase]);

  // Reset alerts after delay
  useEffect(() => {
    if (saveSuccess || saveFailed) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
        setSaveFailed(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, saveFailed]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Dealership name is required";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }

    // Validate phone (if provided)
    if (formData.phone && !/^\d{7,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate coordinates (if provided)
    if (formData.latitude && (isNaN(parseFloat(formData.latitude)) ||
        parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }

    if (formData.longitude && (isNaN(parseFloat(formData.longitude)) ||
        parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180)) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user changes it
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP)");
        return;
      }

      if (file.size > maxSize) {
        alert("File is too large. Maximum size is 5MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (dealership) {
      setFormData({
        name: dealership.name || '',
        location: dealership.location || '',
        phone: dealership.phone?.toString() || '',
        longitude: dealership.longitude?.toString() || '',
        latitude: dealership.latitude?.toString() || '',
      });
    }

    // Clear logo file and preview
    setLogoFile(null);
    setLogoPreview(null);

    // Clear errors
    setErrors({});

    // Exit editing mode
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!dealership || !validateForm()) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveFailed(false);

    try {
      let logoUrl = dealership.logo;

      // Upload new logo if there is one
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `${dealership.id}/${fileName}`;

        // Simulate progress (we can't get real progress from Supabase storage yet)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 300);

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadError) {
          console.error("Error uploading logo:", uploadError);
          throw new Error("Failed to upload logo");
        }

        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrlData.publicUrl;
      }

      // Prepare update data with proper type conversion
      const updateData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        phone: formData.phone ? parseInt(formData.phone.replace(/\D/g, '')) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        logo: logoUrl
      };

      // Update dealership info
      const { error: updateError } = await supabase
        .from('dealerships')
        .update(updateData)
        .eq('id', dealership.id);

      if (updateError) {
        console.error("Error updating dealership:", updateError);
        throw new Error("Failed to update dealership information");
      }

      // Update local state
      setDealership({
        ...dealership,
        ...updateData
      });

      setIsEditing(false);
      setLogoFile(null);
      setUploadProgress(0);
      setSaveSuccess(true);

      // Small delay before reset
      setTimeout(() => {
        setLogoPreview(null);
      }, 1000);

    } catch (error) {
      console.error("Error in handleSave:", error);
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Password change handler
  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setIsPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        email: user.email
      });

      if (error) throw error;

      setPasswordSuccess("Password updated successfully.");
      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Ensure loading state is reset before closing password form
      setIsPasswordLoading(false);

      // Auto-close password form after a short delay
      setTimeout(() => {
        setIsChangePasswordMode(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      console.error("Error in handleChangePassword:", error);
      setPasswordError(
        error.message ||
        (error.error?.message) ||
        "Failed to change password. Please try again."
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
    else if (field === 'new') setShowNewPassword(!showNewPassword);
    else if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string | number | null) => {
    if (!phoneNumber) return '';

    // Convert to string and remove non-digits
    const phoneStr = phoneNumber.toString().replace(/\D/g, '');

    // Format based on length (assuming a standard format, adjust as needed)
    if (phoneStr.length === 8) {
      return `${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5)}`;
    } else if (phoneStr.length > 10) {
      return `+${phoneStr.slice(0, phoneStr.length-8)} ${phoneStr.slice(-8, -5)} ${phoneStr.slice(-5, -2)} ${phoneStr.slice(-2)}`;
    } else {
      return phoneStr;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Calculate days until subscription end
  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get subscription status class
  const getSubscriptionStatusClass = () => {
    if (!dealership?.subscription_end_date) return "bg-gray-500/10 text-gray-400 border border-gray-500/30";

    const daysRemaining = getDaysRemaining(dealership.subscription_end_date);

    if (daysRemaining <= 0) {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    }
    if (daysRemaining <= 30) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
  };

  // Handle contact support for subscription
  const handleContactSupport = () => {
    // Open email client with pre-filled subject
    window.location.href = `mailto:support@fleetapp.com?subject=Subscription Extension Request - Dealership ID: ${dealership?.id}`;
  };

  // Icon button for edit mode toggle
  const EditButton = () => (
    <button
      onClick={() => setIsEditing(true)}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      <span>Edit Details</span>
    </button>
  );

  // Password input field component
  const PasswordInput = ({
    id,
    placeholder,
    value,
    onChange,
    showPassword,
    toggleVisibility
  }: {
    id: string,
    placeholder: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    showPassword: boolean,
    toggleVisibility: () => void
  }) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
      >
        {showPassword ? (
          <EyeSlashIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">
            Dealership Profile
          </h1>

          {/* Status Alerts */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveFailed && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center">
              <XCircleIcon className="h-5 w-5 mr-2" />
              <span>Failed to update profile. Please try again.</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : dealership ? (
            <div className="space-y-6">
              {/* Subscription Status Card */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Subscription Status</h2>
                  <div className={`px-3 py-1 rounded-full text-sm ${getSubscriptionStatusClass()}`}>
                    {!dealership.subscription_end_date
                      ? "Unknown"
                      : getDaysRemaining(dealership.subscription_end_date) <= 0
                      ? "Expired"
                      : getDaysRemaining(dealership.subscription_end_date) <= 30
                      ? "Expiring Soon"
                      : "Active"}
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    {!dealership.subscription_end_date
                      ? "Subscription information not available"
                      : getDaysRemaining(dealership.subscription_end_date) <= 0
                      ? `Expired on ${formatDate(dealership.subscription_end_date)}`
                      : `Valid until ${formatDate(dealership.subscription_end_date)} (${getDaysRemaining(dealership.subscription_end_date)} days remaining)`}
                  </span>
                </div>

                {/* {dealership.subscription_end_date && (
                  getDaysRemaining(dealership.subscription_end_date) <= 30 && (
                    <div className="mt-4">
                      <button
                        onClick={handleContactSupport}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        Contact Support to Extend Subscription
                      </button>
                    </div>
                  )
                )} */}
              </div>

              {/* Dealership Details Card */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm relative">
                {/* Edit/Save Controls */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Dealership Details</h2>
                  {!isEditing ? (
                    <EditButton />
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-1.5" />
                            <span>Saving...</span>
                          </>
                        ) : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Logo Section */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg bg-gray-700 overflow-hidden mb-3 relative">
                      {isEditing && logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : dealership.logo ? (
                        <img src={dealership.logo} alt={dealership.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BuildingStorefrontIcon className="h-12 w-12 text-gray-500" />
                        </div>
                      )}

                      {/* Upload Progress Overlay */}
                      {isEditing && logoFile && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                          <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs mt-1">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex flex-col items-center">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg cursor-pointer transition-colors flex items-center"
                        >
                          <CameraIcon className="h-4 w-4 mr-1.5" />
                          {dealership.logo ? "Change Logo" : "Add Logo"}
                        </button>

                        {logoPreview && (
                          <button
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview(null);
                            }}
                            className="mt-2 text-xs text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Details Form/Info */}
                  <div className="flex-1 space-y-4">
                    {!isEditing ? (
                      /* View Mode */
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                          <div className="text-white font-medium">
                            {dealership.name || "Not specified"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Location</label>
                          <div className="flex items-center text-white">
                            <MapPinIconSolid className="h-4 w-4 text-indigo-400 mr-2" />
                            {dealership.location || "Not specified"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                          <div className="flex items-center text-white">
                            <PhoneIconSolid className="h-4 w-4 text-indigo-400 mr-2" />
                            {dealership.phone ? formatPhoneNumber(dealership.phone) : "Not specified"}
                          </div>
                        </div>

                        {(dealership.longitude || dealership.latitude) && (
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Coordinates</label>
                            <div className="text-white">
                              {dealership.latitude}, {dealership.longitude}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Edit Mode */
                      <>
                        <div>
                          <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
                            Company Name*
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 bg-gray-700 border ${errors.name ? 'border-rose-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-colors`}
                            placeholder="Enter company name"
                          />
                          {errors.name && (
                            <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="location" className="block text-sm text-gray-400 mb-1">
                            Location*
                          </label>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className={`w-full pl-9 px-3 py-2 bg-gray-700 border ${errors.location ? 'border-rose-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-colors`}
                              placeholder="Enter your business address"
                            />
                          </div>
                          {errors.location && (
                            <p className="mt-1 text-xs text-rose-500">{errors.location}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm text-gray-400 mb-1">
                            Phone Number
                          </label>
                          <div className="relative">
                            <PhoneIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`w-full pl-9 px-3 py-2 bg-gray-700 border ${errors.phone ? 'border-rose-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-colors`}
                              placeholder="Enter phone number"
                            />
                          </div>
                          {errors.phone && (
                            <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="latitude" className="block text-sm text-gray-400 mb-1">
                              Latitude
                            </label>
                            <input
                              type="text"
                              id="latitude"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 bg-gray-700 border ${errors.latitude ? 'border-rose-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-colors`}
                              placeholder="e.g. 33.8814"
                            />
                            {errors.latitude && (
                              <p className="mt-1 text-xs text-rose-500">{errors.latitude}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="longitude" className="block text-sm text-gray-400 mb-1">
                              Longitude
                            </label>
                            <input
                              type="text"
                              id="longitude"
                              name="longitude"
                              value={formData.longitude}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 bg-gray-700 border ${errors.longitude ? 'border-rose-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-colors`}
                              placeholder="e.g. 35.5497"
                            />
                            {errors.longitude && (
                              <p className="mt-1 text-xs text-rose-500">{errors.longitude}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* User Account Section with Password Reset */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Account Security</h2>
                  {!isChangePasswordMode && (
                    <button
                      onClick={() => setIsChangePasswordMode(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {!isChangePasswordMode ? (
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-4">
                      <UserIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{profile?.name || user?.email}</div>
                      <div className="text-gray-400 text-sm">{profile?.email || user?.email}</div>
                    </div>
                  </div>
                ) : (
                  /* Password Change Form */
                  <div className="space-y-4">
                    {passwordSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex items-center text-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 flex items-center text-sm">
                        <XCircleIcon className="h-5 w-5 mr-2" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div>
                      <label htmlFor="current-password" className="block text-sm text-gray-400 mb-1">
                        Current Password
                      </label>
                      <PasswordInput
                        id="current-password"
                        placeholder="Enter your current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        showPassword={showCurrentPassword}
                        toggleVisibility={() => togglePasswordVisibility('current')}
                      />
                    </div>

                    <div>
                      <label htmlFor="new-password" className="block text-sm text-gray-400 mb-1">
                        New Password
                      </label>
                      <PasswordInput
                        id="new-password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        showPassword={showNewPassword}
                        toggleVisibility={() => togglePasswordVisibility('new')}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm text-gray-400 mb-1">
                        Confirm New Password
                      </label>
                      <PasswordInput
                        id="confirm-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        showPassword={showConfirmPassword}
                        toggleVisibility={() => togglePasswordVisibility('confirm')}
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setIsChangePasswordMode(false);
                          setPasswordError('');
                          setPasswordSuccess('');
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={isPasswordLoading}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex-1 flex justify-center items-center"
                      >
                        {isPasswordLoading ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-1.5" />
                            <span>Updating...</span>
                          </>
                        ) : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No Dealership Found State */
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <BuildingStorefrontIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Dealership Found</h3>
              <p className="text-gray-400 mb-6">We couldn't find dealership information linked to your account. Please contact support for assistance.</p>
              <button
                onClick={handleContactSupport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}