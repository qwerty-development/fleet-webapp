"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import DateTimeInput from '@/components/ui/DateTimeInput';
import {
  calculateBannerStatus,
  getBannerDateRangeText,
  getBannerStatusColor,
  getBannerStatusLabel,
  validateBannerDates,
  localDateTimeToUTC,
  utcToLocalDateTime,
 isBannerActive,
} from '@/utils/bannerDateUtils';
import { Banner as BannerType } from '@/types';

// Define interfaces
interface Banner extends BannerType {
  // Extends the base Banner type from types/index.ts
}

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  listed_at: string;
}

interface Dealership {
  id: number;
  name: string;
  location: string;
}

// Constants
const ITEMS_PER_PAGE = 10;

export default function AdminBannersPage() {
  const supabase = createClient();

  // State variables
  const [banners, setBanners] = useState<Banner[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [isLoadingDealerships, setIsLoadingDealerships] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'active' | 'expired'>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    image_url: '',
    redirect_to: '',
    redirect_type: 'none' as 'car' | 'dealership' | 'none',
    start_date: '',
    end_date: '',
    active: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Search states for dropdowns
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [dealershipSearchQuery, setDealershipSearchQuery] = useState('');
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [filteredDealerships, setFilteredDealerships] = useState<Dealership[]>([]);

  // Fetch banners with pagination and filtering
  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);

      let query = supabase
        .from('banners')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Note: No search filter since we removed title and description

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setBanners(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError('Failed to fetch banners. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  // Fetch cars for redirect selection
  const fetchCars = useCallback(async () => {
    try {
      setIsLoadingCars(true);
      console.log('Fetching cars for banner redirect...');
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, status, listed_at')
        .eq('status', 'available')
        .order('listed_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching cars:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('Cars fetched successfully:', data?.length || 0, 'cars');
      console.log('Sample car data:', data?.[0]);
      setCars(data || []);
    } catch (err: any) {
      console.error('Error fetching cars:', err);
      console.error('Error details:', err.message, err.details, err.hint);
    } finally {
      setIsLoadingCars(false);
    }
  }, []);

  // Fetch dealerships for redirect selection
  const fetchDealerships = useCallback(async () => {
    try {
      setIsLoadingDealerships(true);
      const { data, error } = await supabase
        .from('dealerships')
        .select('id, name, location')
        .order('name', { ascending: true });

      if (error) throw error;
      setDealerships(data || []);
    } catch (err: any) {
      console.error('Error fetching dealerships:', err);
    } finally {
      setIsLoadingDealerships(false);
    }
  }, []);

  // Filter cars based on search query
  useEffect(() => {
    if (carSearchQuery) {
      const filtered = cars.filter(car => 
        `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(carSearchQuery.toLowerCase()) ||
        car.id.toString().includes(carSearchQuery)
      );
      setFilteredCars(filtered);
    } else {
      setFilteredCars(cars);
    }
  }, [cars, carSearchQuery]);

  // Filter dealerships based on search query
  useEffect(() => {
    if (dealershipSearchQuery) {
      const filtered = dealerships.filter(dealership => 
        dealership.name.toLowerCase().includes(dealershipSearchQuery.toLowerCase()) ||
        dealership.location.toLowerCase().includes(dealershipSearchQuery.toLowerCase())
      );
      setFilteredDealerships(filtered);
    } else {
      setFilteredDealerships(dealerships);
    }
  }, [dealerships, dealershipSearchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchBanners();
    fetchCars();
    fetchDealerships();
  }, [fetchBanners, fetchCars, fetchDealerships]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    setSortBy(column);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBanners();
  }, [fetchBanners]);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get redirect display text
  const getRedirectDisplay = (banner: Banner) => {
    if (!banner.redirect_to) {
      return 'No redirect';
    }
    
    if (banner.redirect_to.startsWith('fleet://car/')) {
      const carId = parseInt(banner.redirect_to.replace('fleet://car/', ''));
      const car = cars.find(c => c.id === carId);
      return car ? `${car.year} ${car.make} ${car.model}` : 'Car not found';
    } else if (banner.redirect_to.startsWith('fleet://dealership/')) {
      const dealershipId = parseInt(banner.redirect_to.replace('fleet://dealership/', ''));
      const dealership = dealerships.find(d => d.id === dealershipId);
      return dealership ? dealership.name : 'Dealership not found';
    }
    return 'Unknown redirect';
  };

  // Get redirect URL (just returns the stored URL)
  const getRedirectUrl = (banner: Banner) => {
    return banner.redirect_to;
  };

  // Open add modal
  const openAddModal = () => {
    // Check if we've reached the maximum number of banners
    if (banners.length >= 5) {
      alert('Maximum of 5 banners allowed. Please delete a banner before adding a new one.');
      return;
    }
    
    setFormData({
      image_url: '',
      redirect_to: '',
      redirect_type: 'none',
      start_date: '',
      end_date: '',
      active: true,
    });
    setFile(null);
    setCarSearchQuery('');
    setDealershipSearchQuery('');
    setDateError(null);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    
    // Extract type and ID from stored URL
    let redirectType: 'car' | 'dealership' | 'none' = 'none';
    let redirectId = '';
    
    if (banner.redirect_to && banner.redirect_to.startsWith('fleet://car/')) {
      redirectType = 'car';
      redirectId = banner.redirect_to.replace('fleet://car/', '');
    } else if (banner.redirect_to && banner.redirect_to.startsWith('fleet://dealership/')) {
      redirectType = 'dealership';
      redirectId = banner.redirect_to.replace('fleet://dealership/', '');
    } else {
      redirectType = 'none';
      redirectId = '';
    }
    
    setFormData({
      image_url: banner.image_url,
      redirect_to: redirectId,
      redirect_type: redirectType,
      start_date: utcToLocalDateTime(banner.start_date),
      end_date: utcToLocalDateTime(banner.end_date),
      active: banner.active,
    });
    setFile(null);
    setCarSearchQuery('');
    setDealershipSearchQuery('');
    setDateError(null);
    setIsEditModalOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    setDateError(null);

    try {
      // Validate form
      if (!formData.image_url && !file) {
        alert('Please upload an image or provide an image URL');
        setIsActionLoading(false);
        return;
      }

      // If redirect type is car or dealership, ensure redirect_to is selected
      if (formData.redirect_type !== 'none' && !formData.redirect_to) {
        alert(`Please select a ${formData.redirect_type}`);
        setIsActionLoading(false);
        return;
      }

      // Validate date range
      const startDateUTC = formData.start_date ? localDateTimeToUTC(formData.start_date) : null;
      const endDateUTC = formData.end_date ? localDateTimeToUTC(formData.end_date) : null;
      
      const dateValidationError = validateBannerDates(startDateUTC, endDateUTC);
      if (dateValidationError) {
        setDateError(dateValidationError);
        setIsActionLoading(false);
        return;
      }

      let imageUrl = formData.image_url;

      // Upload new file if selected
      if (file) {
        imageUrl = await handleFileUpload(file);
      }

      // Generate the redirect URL based on selected type
      let redirectUrl = null;
      if (formData.redirect_type === 'car') {
        redirectUrl = `fleet://car/${formData.redirect_to}`;
      } else if (formData.redirect_type === 'dealership') {
        redirectUrl = `fleet://dealership/${formData.redirect_to}`;
      }
      // If redirect_type is 'none', redirectUrl stays null

      const bannerData = {
        image_url: imageUrl,
        redirect_to: redirectUrl,
        start_date: startDateUTC,
        end_date: endDateUTC,
        active: formData.active,
      };

      if (isEditModalOpen && selectedBanner) {
        // Update existing banner
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', selectedBanner.id);

        if (error) throw error;
        alert('Banner updated successfully!');
      } else {
        // Create new banner
        const { error } = await supabase
          .from('banners')
          .insert(bannerData);

        if (error) throw error;
        alert('Banner created successfully!');
      }

      // Refresh data and close modal
      await fetchBanners();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedBanner(null);
      setFile(null);
      setDateError(null);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      alert(`Failed to save banner: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Banner deleted successfully!');
      await fetchBanners();
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      alert(`Failed to delete banner: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle toggle active/inactive
  const handleToggleActive = async (banner: Banner) => {
    const newActiveState = !banner.active;
    const action = newActiveState ? 'activate' : 'pause';
    
    if (!confirm(`Are you sure you want to ${action} this banner?`)) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('banners')
        .update({ 
          active: newActiveState,
          manually_deactivated_at: newActiveState ? null : new Date().toISOString()
        })
        .eq('id', banner.id);

      if (error) throw error;

      alert(`Banner ${action}d successfully!`);
      await fetchBanners();
    } catch (err: any) {
      console.error(`Error ${action}ing banner:`, err);
      alert(`Failed to ${action} banner: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Banners</h1>
              <p className="text-gray-400">
                Manage promotional banners and their redirect destinations
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {banners.length}/5 banners used
              </p>
            </div>
          </div>

          {/* Add Banner Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={openAddModal}
              disabled={banners.length >= 5}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                banners.length >= 5
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {banners.length >= 5 ? 'Max Banners (5)' : 'Add Banner'}
            </button>
          </div>

          {/* Banner Limit Warning */}
          {banners.length >= 5 && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-400">
                    <strong>Banner limit reached:</strong> You have reached the maximum of 5 banners. Delete a banner to add a new one.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                placeholder="Search banners..."
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

            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => handleSort('created_at')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'created_at'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Date Created
                {sortBy === 'created_at' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as 'all' | 'scheduled' | 'active' | 'expired');
                  setCurrentPage(1);
                }}
                className="bg-gray-800/60 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Banners</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>

            </div>
          </div>

          {/* Banners List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Banners</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchBanners()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Banners Found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? "No banners match your search criteria. Try a different search term."
                  : "No banners available. Create your first banner to get started."}
              </p>
              <button
                onClick={openAddModal}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors"
              >
                Add First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300"
                >
                  {/* Banner Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <h3 className="text-white font-semibold text-sm truncate">
                        Banner
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getBannerStatusColor(calculateBannerStatus(banner))}`}>
                        {getBannerStatusLabel(calculateBannerStatus(banner))}
                      </span>
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Date Range - Show if dates exist */}
                      {(banner.start_date || banner.end_date) && (
                        <div className="text-xs text-gray-400">
                          {getBannerDateRangeText(banner.start_date, banner.end_date)}
                        </div>
                      )}
                      
                      {/* Redirect Info */}
                      <div className="flex items-center text-gray-300">
                        <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm truncate">
                          {getRedirectDisplay(banner)}
                        </span>
                      </div>

                      {/* Redirect URL - Only show if there's a redirect */}
                      {banner.redirect_to && (
                        <div className="flex items-center text-gray-400">
                          <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                            {getRedirectUrl(banner)}
                          </span>
                        </div>
                      )}

                      {/* Redirect Type Badge */}
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          !banner.redirect_to
                            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            : banner.redirect_to.startsWith('fleet://car/')
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {!banner.redirect_to 
                            ? 'No Redirect' 
                            : banner.redirect_to.startsWith('fleet://car/') 
                            ? 'Car' 
                            : 'Dealership'
                          }
                        </span>
                      </div>


                      {/* Created Date */}
                      <p className="text-gray-500 text-xs">
                        Created: {formatDate(banner.created_at)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 mt-4">
                      {/* Toggle Active/Pause Button */}
                      <button
                        onClick={() => handleToggleActive(banner)}
                        disabled={isActionLoading}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          banner.active
                            ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
                            : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {banner.active ? (
                          <>
                            <PauseIcon className="h-3.5 w-3.5 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-3.5 w-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(banner)}
                        className="flex items-center px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors"
                      >
                        <PencilIcon className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="flex items-center px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors"
                      >
                        <TrashIcon className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {banners.length > 0 && totalPages > 1 && (
            <div className="flex justify-between items-center py-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                  currentPage === 1
                    ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>

              <span className="text-gray-300 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                }`}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Banner Modal */}
      <Transition appear show={isAddModalOpen || isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}>
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
                    {isAddModalOpen ? 'Add New Banner' : 'Edit Banner'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-48 h-32 mb-4 border-2 border-dashed border-gray-600 rounded-lg overflow-hidden">
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <label className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                        <PhotoIcon className="h-5 w-5 mr-2" />
                        {file ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>


                    {/* Redirect Type */}
                    <div>
                      <label htmlFor="redirect_type" className="block text-sm font-medium text-gray-400 mb-1">
                        Redirect To
                      </label>
                    <select
                      id="redirect_type"
                      value={formData.redirect_type}
                      onChange={(e) => {
                        setFormData({...formData, redirect_type: e.target.value as 'car' | 'dealership' | 'none', redirect_to: ''});
                        setCarSearchQuery('');
                        setDealershipSearchQuery('');
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    >
                      <option value="none">No Redirect</option>
                      <option value="car">Car</option>
                      <option value="dealership">Dealership</option>
                    </select>
                    </div>

                    {/* Redirect Selection - Only show if redirect type is not 'none' */}
                    {formData.redirect_type !== 'none' && (
                    <div>
                      <label htmlFor="redirect_to" className="block text-sm font-medium text-gray-400 mb-1">
                        Select {formData.redirect_type === 'car' ? 'Car' : 'Dealership'}
                      </label>
                      
                      {/* Search Input */}
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder={`Search ${formData.redirect_type}s...`}
                          value={formData.redirect_type === 'car' ? carSearchQuery : dealershipSearchQuery}
                          onChange={(e) => {
                            if (formData.redirect_type === 'car') {
                              setCarSearchQuery(e.target.value);
                            } else {
                              setDealershipSearchQuery(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                        />
                      </div>

                      {/* Dropdown */}
                      <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700">
                        {formData.redirect_type === 'car' ? (
                          isLoadingCars ? (
                            <div className="px-3 py-4 text-center text-gray-400 text-sm">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                              Loading cars...
                            </div>
                          ) : filteredCars.length > 0 ? (
                            filteredCars.map((car) => (
                              <div
                                key={car.id}
                                onClick={() => setFormData({...formData, redirect_to: car.id.toString()})}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0 ${
                                  formData.redirect_to === car.id.toString() ? 'bg-indigo-600' : ''
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{car.year} {car.make} {car.model}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-400 font-semibold">
                                      ${car.price.toLocaleString()}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      car.status === 'available' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : car.status === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {car.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-400 text-sm">
                              {carSearchQuery ? 'No cars found matching your search' : 'No cars available'}
                            </div>
                          )
                        ) : (
                          isLoadingDealerships ? (
                            <div className="px-3 py-4 text-center text-gray-400 text-sm">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                              Loading dealerships...
                            </div>
                          ) : filteredDealerships.length > 0 ? (
                            filteredDealerships.map((dealership) => (
                              <div
                                key={dealership.id}
                                onClick={() => setFormData({...formData, redirect_to: dealership.id.toString()})}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-600 text-white text-sm border-b border-gray-600 last:border-b-0 ${
                                  formData.redirect_to === dealership.id.toString() ? 'bg-indigo-600' : ''
                                }`}
                              >
                                <div>
                                  <div className="font-medium">{dealership.name}</div>
                                  <div className="text-gray-300 text-xs">{dealership.location}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-400 text-sm">
                              {dealershipSearchQuery ? 'No dealerships found matching your search' : 'No dealerships available'}
                            </div>
                          )
                        )}
                      </div>
                      
                      {/* Selected item display */}
                      {formData.redirect_to && (
                        <div className="mt-2 p-2 bg-gray-600 rounded text-sm text-white">
                          Selected: {
                            formData.redirect_type === 'car' 
                              ? (() => {
                                  const selectedCar = cars.find(c => c.id.toString() === formData.redirect_to);
                                  return selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : 'Unknown car';
                                })()
                              : (() => {
                                  const selectedDealership = dealerships.find(d => d.id.toString() === formData.redirect_to);
                                  return selectedDealership ? selectedDealership.name : 'Unknown dealership';
                                })()
                          }
                        </div>
                      )}

                      {/* Debug info - remove in production */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
                          <div>Total cars: {cars.length}</div>
                          <div>Filtered cars: {filteredCars.length}</div>
                          <div>Loading cars: {isLoadingCars ? 'Yes' : 'No'}</div>
                          <div>Search query: "{carSearchQuery}"</div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Schedule Section */}
                    <div className="border-t border-gray-700 pt-6 mt-6">
                      <h4 className="text-white font-medium mb-4">Schedule (Optional)</h4>
                      
                      {/* Active Toggle */}
                      <div className="mb-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({...formData, active: e.target.checked})}
                            className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-300">
                            Active {!formData.active && "(Banner will be paused)"}
                          </span>
                        </label>
                      </div>

                      {/* Start Date */}
                      <div className="mb-4">
                        <DateTimeInput
                          id="start_date"
                          label="Start Date & Time"
                          value={formData.start_date}
                          onChange={(value) => setFormData({...formData, start_date: value})}
                          helperText="Leave empty for immediate activation"
                        />
                      </div>

                      {/* End Date */}
                      <div className="mb-4">
                        <DateTimeInput
                          id="end_date"
                          label="End Date & Time"
                          value={formData.end_date}
                          onChange={(value) => setFormData({...formData, end_date: value})}
                          min={formData.start_date || undefined}
                          error={formData.dateError}
                          helperText="Leave empty for no expiration"
                        />
                      </div>
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
                        disabled={isActionLoading || (formData.redirect_type !== 'none' && !formData.redirect_to)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {isActionLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            {isAddModalOpen ? 'Creating...' : 'Updating...'}
                          </>
                        ) : (
                          isAddModalOpen ? 'Create Banner' : 'Update Banner'
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

      {/* Loading Overlay */}
      {isActionLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-white">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
