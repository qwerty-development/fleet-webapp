"use client";

import React, { useState, useEffect } from "react";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  UserIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  CameraIcon
} from "@heroicons/react/24/outline";

export default function DealerProfilePage() {
  const supabase = createClient();
  const { user, profile } = useAuth();
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
  const [isSaving, setIsSaving] = useState(false);

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
        setFormData({
          name: data.name || '',
          location: data.location || '',
          phone: data.phone?.toString() || '',
          longitude: data.longitude?.toString() || '',
          latitude: data.latitude?.toString() || '',
        });
      } catch (error) {
        console.error("Error fetching dealership data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDealershipData();
  }, [user, supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!dealership) return;

    setIsSaving(true);

    try {
      let logoUrl = dealership.logo;

      // Upload new logo if there is one
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${dealership.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrlData.publicUrl;
      }

      // Update dealership info
      const { error } = await supabase
        .from('dealerships')
        .update({
          name: formData.name,
          location: formData.location,
          phone: formData.phone ? parseInt(formData.phone) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          logo: logoUrl
        })
        .eq('id', dealership.id);

      if (error) throw error;

      // Update local state
      setDealership((prev: any) => ({
        ...prev,
        name: formData.name,
        location: formData.location,
        phone: formData.phone ? parseInt(formData.phone) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        logo: logoUrl
      }));

      setIsEditing(false);
      setLogoFile(null);

    } catch (error) {
      console.error("Error updating dealership:", error);
      alert("Failed to update dealership information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days until subscription end
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">
            Dealership Profile
          </h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : dealership ? (
            <div className="space-y-6">
              {/* Subscription Status Card */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Subscription Status</h2>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    getDaysRemaining(dealership.subscription_end_date) <= 0
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : getDaysRemaining(dealership.subscription_end_date) <= 30
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {getDaysRemaining(dealership.subscription_end_date) <= 0
                      ? "Expired"
                      : getDaysRemaining(dealership.subscription_end_date) <= 30
                      ? "Expiring Soon"
                      : "Active"}
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    {getDaysRemaining(dealership.subscription_end_date) <= 0
                      ? `Expired on ${formatDate(dealership.subscription_end_date)}`
                      : `Valid until ${formatDate(dealership.subscription_end_date)} (${getDaysRemaining(dealership.subscription_end_date)} days remaining)`}
                  </span>
                </div>

                {getDaysRemaining(dealership.subscription_end_date) <= 30 && (
                  <div className="mt-4">
                    <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                      Contact Support to Extend Subscription
                    </button>
                  </div>
                )}
              </div>

              {/* Dealership Details Card */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Dealership Details</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
                    >
                      Edit Details
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving
                          </>
                        ) : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Logo Section */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg bg-gray-700 overflow-hidden mb-3">
                      {isEditing && logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : dealership.logo ? (
                        <img src={dealership.logo} alt={dealership.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BuildingStorefrontIcon className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <label className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg cursor-pointer">
                        <CameraIcon className="h-4 w-4 inline mr-1" />
                        Change Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </label>
                    )}
                  </div>

                  {/* Details Form/Info */}
                  <div className="flex-1 space-y-4">
                    {!isEditing ? (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                          <div className="text-white">{dealership.name}</div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Location</label>
                          <div className="flex items-center text-white">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {dealership.location}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                          <div className="flex items-center text-white">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {dealership.phone}
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
                      <>
                        <div>
                          <label htmlFor="name" className="block text-sm text-gray-400 mb-1">Company Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="location" className="block text-sm text-gray-400 mb-1">Location</label>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              id="location"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="w-full pl-9 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm text-gray-400 mb-1">Phone Number</label>
                          <div className="relative">
                            <PhoneIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full pl-9 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="latitude" className="block text-sm text-gray-400 mb-1">Latitude</label>
                            <input
                              type="text"
                              id="latitude"
                              name="latitude"
                              value={formData.latitude}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="longitude" className="block text-sm text-gray-400 mb-1">Longitude</label>
                            <input
                              type="text"
                              id="longitude"
                              name="longitude"
                              value={formData.longitude}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* User Account Section */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                <h2 className="text-xl font-semibold text-white mb-4">User Account</h2>

                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-4">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{profile?.name}</div>
                    <div className="text-gray-400 text-sm">{profile?.email}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg flex-1">
                    Change Password
                  </button>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex-1">
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <BuildingStorefrontIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Dealership Found</h3>
              <p className="text-gray-400 mb-6">We couldn't find dealership information linked to your account. Please contact support for assistance.</p>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors">
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}