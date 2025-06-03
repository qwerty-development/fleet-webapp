"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PhotoIcon,
  SquaresPlusIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import Image from "next/image";
import AdminNavbar from "@/components/admin/navbar";

// Circular progress chart
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

// Define interfaces
interface Dealership {
  id: number;
  name: string;
  location: string;
  phone: string;
  subscription_end_date: string;
  cars_listed?: number;
  total_sales?: number;
  longitude?: number;
  latitude?: number;
  logo?: string;
  user_id?: string;
}

// Constants
const ITEMS_PER_PAGE = 10;

export default function AdminDealershipsPage() {
  const supabase = createClient();

  // State variables
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [allDealerships, setAllDealerships] = useState<Dealership[]>([]);
  const [expiredDealerships, setExpiredDealerships] = useState<Dealership[]>([]);
  const [nearExpiringDealerships, setNearExpiringDealerships] = useState<Dealership[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [isDealershipModalOpen, setIsDealershipModalOpen] = useState(false);

  const [selectedDealerships, setSelectedDealerships] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subscriptionStats, setSubscriptionStats] = useState({
    active: 0,
    expiring: 0,
    expired: 0
  });

  const [dealershipFormData, setDealershipFormData] = useState<any>({
    name: '',
    location: '',
    phone: '',
    longitude: '',
    latitude: '',
    subscription_end_date: '',
    logo: ''
  });

  const [file, setFile] = useState<File | null>(null);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);

  const updateDealershipSubscriptionStatus = async (
    dealershipId: number, 
    isExtending: boolean
  ): Promise<void> => {
    try {
      // Determine the new statuses based on action
      const newCarStatus = isExtending ? 'available' : 'pending';
      const currentCarStatus = isExtending ? 'pending' : 'available';
      const newClipStatus = isExtending ? 'published' : 'archived';
      const currentClipStatus = isExtending ? 'archived' : 'published';
      
      // Update car statuses
      const { error: carsError } = await supabase
        .from('cars')
        .update({ status: newCarStatus })
        .eq('dealership_id', dealershipId)
        .eq('status', currentCarStatus);
      
      if (carsError) throw carsError;
      
      // Update autoclip statuses
      const { error: clipsError } = await supabase
        .from('auto_clips')
        .update({ status: newClipStatus })
        .eq('dealership_id', dealershipId)
        .eq('status', currentClipStatus);
      
      if (clipsError) throw clipsError;
      
      console.log(`Successfully updated dealership #${dealershipId} statuses. Action: ${isExtending ? 'Extend' : 'Expire'}`);
    } catch (err: any) {
      console.error(`Error updating dealership ${dealershipId} statuses:`, err);
      throw err;
    }
  };

  // Fetch all dealerships for stats and overview
  const fetchAllDealerships = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('dealerships')
        .select('*, cars(id)');

      if (error) throw error;

      // Process data to count cars per dealership
      const dealershipsWithCarCount = data?.map(d => ({
        ...d,
        cars_listed: d.cars ? d.cars.length : 0
      })) || [];

      setAllDealerships(dealershipsWithCarCount);

      // Calculate subscription stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const stats = dealershipsWithCarCount.reduce(
        (acc, d) => {
          const endDate = new Date(d.subscription_end_date);
          if (endDate < now) acc.expired++;
          else if (endDate <= thirtyDaysFromNow) acc.expiring++;
          else acc.active++;
          return acc;
        },
        { active: 0, expiring: 0, expired: 0 }
      );

      setSubscriptionStats(stats);

      // Set expired and near-expiring dealerships
      setExpiredDealerships(
        dealershipsWithCarCount.filter(d => new Date(d.subscription_end_date) < now)
      );

      setNearExpiringDealerships(
        dealershipsWithCarCount.filter(d => {
          const endDate = new Date(d.subscription_end_date);
          return endDate >= now && endDate <= thirtyDaysFromNow;
        })
      );
    } catch (err: any) {
      console.error('Error fetching all dealerships:', err);
      setError('Failed to fetch dealership overview data.');
    }
  }, []);

  // Fetch dealerships with pagination and filtering
  const fetchDealerships = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);

      let query = supabase
        .from('dealerships')
        .select('*, cars(id)', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply search filter if exists
      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        );
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Process data to count cars per dealership
      const dealershipsWithCarCount = data?.map(d => ({
        ...d,
        cars_listed: d.cars ? d.cars.length : 0
      })) || [];

      setDealerships(dealershipsWithCarCount);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error('Error fetching dealerships:', err);
      setError('Failed to fetch dealerships. Please check your network connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchAllDealerships();
  }, [fetchAllDealerships]);

  useEffect(() => {
    fetchDealerships();
  }, [fetchDealerships]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    setSortBy(column);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDealerships();
  }, [fetchDealerships]);

  // Get subscription status
  const getSubscriptionStatus = useCallback((endDate: string) => {
    const now = new Date();
    const subscriptionEnd = new Date(endDate);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (subscriptionEnd < now) {
      return { status: 'Expired', colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
    } else if (subscriptionEnd <= thirtyDaysFromNow) {
      return { status: 'Expiring Soon', colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    } else {
      return { status: 'Active', colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    }
  }, []);

  // Format subscription end date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Open dealership edit modal
  const openDealershipModal = useCallback((dealership: Dealership) => {
    setSelectedDealership(dealership);
    setDealershipFormData({
      name: dealership.name,
      location: dealership.location,
      phone: dealership.phone,
      longitude: dealership.longitude || '',
      latitude: dealership.latitude || '',
      subscription_end_date: dealership.subscription_end_date,
      logo: dealership.logo || ''
    });
    setIsDealershipModalOpen(true);
  }, []);

  const executeBulkAction = async () => {
    if (!bulkAction || selectedDealerships.length === 0) return;
  
    setIsActionLoading(true);
    setShowBulkActionConfirm(false);
  
    try {
      const currentDate = new Date();
      const updatePromises = selectedDealerships.map(async id => {
        const dealership = allDealerships.find(d => d.id === id);
        if (!dealership) return;
  
        let updateData: any = {};
        const isExtending = bulkAction === 'extend';
  
        if (isExtending) {
          const subscriptionEndDate = new Date(dealership.subscription_end_date);
          const newEndDate = new Date(
            Math.max(currentDate.getTime(), subscriptionEndDate.getTime())
          );
          newEndDate.setMonth(newEndDate.getMonth() + extendMonths);
          updateData.subscription_end_date = newEndDate.toISOString().split('T')[0];
        } else if (bulkAction === 'end') {
          updateData.subscription_end_date = currentDate.toISOString().split('T')[0];
        }
  
        // Update dealership
        const { error: dealershipError } = await supabase
          .from('dealerships')
          .update(updateData)
          .eq('id', id);
  
        if (dealershipError) throw dealershipError;
  
        // Update car and autoclip statuses
        await updateDealershipSubscriptionStatus(id, isExtending);
      });
  
      await Promise.all(updatePromises);
  
      // Refresh data
      await fetchDealerships();
      await fetchAllDealerships();
  
      // Reset selections
      setSelectedDealerships([]);
      setBulkAction(null);
      setIsBulkDrawerOpen(false);
  
      // Show success message
      alert(`Subscription ${bulkAction === 'extend' ? 'extended' : 'ended'} for selected dealerships and relevant items updated!`);
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
      alert(`Failed to perform bulk action: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  /**
   * Individual dealership update handler 
   * Includes logic to detect subscription status changes
   */
  const handleUpdateDealership = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!selectedDealership) return;
  
    setIsActionLoading(true);
  
    try {
      // If there's a new logo file, upload it first
      let logoUrl = dealershipFormData.logo;
  
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${selectedDealership.id}/${fileName}`;
  
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, file);
  
        if (uploadError) throw uploadError;
  
        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);
  
        logoUrl = publicUrlData.publicUrl;
      }
  
      // Determine if this is a subscription extension or expiration
      const oldEndDate = new Date(selectedDealership.subscription_end_date);
      const newEndDate = new Date(dealershipFormData.subscription_end_date);
      const currentDate = new Date();
      const wasExpired = oldEndDate < currentDate;
      const isExtending = wasExpired && newEndDate > currentDate;
      const isExpiring = !wasExpired && newEndDate < currentDate;
  
      // Update dealership record
      const { error: updateError } = await supabase
        .from('dealerships')
        .update({
          name: dealershipFormData.name,
          location: dealershipFormData.location,
          phone: dealershipFormData.phone,
          longitude: dealershipFormData.longitude ? parseFloat(dealershipFormData.longitude) : null,
          latitude: dealershipFormData.latitude ? parseFloat(dealershipFormData.latitude) : null,
          subscription_end_date: dealershipFormData.subscription_end_date,
          logo: logoUrl
        })
        .eq('id', selectedDealership.id);
  
      if (updateError) throw updateError;
  
      // If the subscription status is changing, update car and autoclip statuses
      if (isExtending) {
        await updateDealershipSubscriptionStatus(selectedDealership.id, true);
      } else if (isExpiring) {
        await updateDealershipSubscriptionStatus(selectedDealership.id, false);
      }
  
      // Refresh data
      await fetchDealerships();
      await fetchAllDealerships();
  
      // Reset form and close modal
      setIsDealershipModalOpen(false);
      setSelectedDealership(null);
      setFile(null);
  
      // Show success message
      alert('Dealership updated successfully!');
    } catch (err: any) {
      console.error('Error updating dealership:', err);
      alert(`Failed to update dealership: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle selection of a dealership
  const toggleDealershipSelection = (id: number) => {
    setSelectedDealerships(prev =>
      prev.includes(id)
        ? prev.filter(dealershipId => dealershipId !== id)
        : [...prev, id]
    );
  };

  // Reset bulk action form
  const resetBulkActionForm = () => {
    setBulkAction(null);
    setExtendMonths(1);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Subscription stats chart data
  const chartData = {
    labels: ['Active', 'Expiring Soon', 'Expired'],
    datasets: [
      {
        data: [
          subscriptionStats.active,
          subscriptionStats.expiring,
          subscriptionStats.expired
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)', // emerald for active
          'rgba(251, 191, 36, 0.8)', // amber for expiring
          'rgba(239, 68, 68, 0.8)'   // rose for expired
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your platform, monitor activity, and make data-driven
              decisions
            </p>
          </div>

            <div className="mt-4 md:mt-0 flex items-center gap-2">
              {selectedDealerships.length > 0 && (
                <button
                  onClick={() => setIsBulkDrawerOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1.5" />
                  Bulk Actions ({selectedDealerships.length})
                </button>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Subscription Chart */}
            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Subscription Overview</h3>
              <div className="h-64">
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total Dealerships</p>
                    <p className="text-white text-xl font-semibold">{allDealerships.length}</p>
                  </div>
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    <BuildingOffice2Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Expired Subscriptions</p>
                    <p className="text-rose-500 text-xl font-semibold">{subscriptionStats.expired}</p>
                  </div>
                  <div className="p-2 bg-rose-500/20 rounded-lg">
                    <XCircleIcon className="h-5 w-5 text-rose-500" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Expiring Soon</p>
                    <p className="text-amber-500 text-xl font-semibold">{subscriptionStats.expiring}</p>
                  </div>
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expired Dealerships */}
          {expiredDealerships.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Expired Subscriptions</h3>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4">
                  {expiredDealerships.map(dealership => (
                    <div
                      key={`expired-${dealership.id}`}
                      className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 min-w-[300px] flex-shrink-0 cursor-pointer hover:border-gray-600 transition-all"
                      onClick={() => openDealershipModal(dealership)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-2 flex-shrink-0">
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                              checked={selectedDealerships.includes(dealership.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleDealershipSelection(dealership.id);
                              }}
                            />
                          </div>
                          <h4 className="text-lg font-semibold text-white">{dealership.name}</h4>
                        </div>
                        <div className="bg-rose-500/80 text-white text-xs px-2 py-1 rounded-full">
                          {dealership.cars_listed} cars
                        </div>
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center text-gray-300">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{dealership.location}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{dealership.phone}</span>
                        </div>
                        <div className="flex items-center text-rose-400">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Ended: {formatDate(dealership.subscription_end_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="px-2 py-1 rounded-full text-xs border bg-rose-500/10 text-rose-400 border-rose-500/30">
                            Expired
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expiring Soon Dealerships */}
          {nearExpiringDealerships.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Expiring Soon</h3>
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4">
                  {nearExpiringDealerships.map(dealership => (
                    <div
                      key={`expiring-${dealership.id}`}
                      className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 min-w-[300px] flex-shrink-0 cursor-pointer hover:border-gray-600 transition-all"
                      onClick={() => openDealershipModal(dealership)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-2 flex-shrink-0">
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                              checked={selectedDealerships.includes(dealership.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleDealershipSelection(dealership.id);
                              }}
                            />
                          </div>
                          <h4 className="text-lg font-semibold text-white">{dealership.name}</h4>
                        </div>
                        <div className="bg-amber-500/80 text-white text-xs px-2 py-1 rounded-full">
                          {dealership.cars_listed} cars
                        </div>
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center text-gray-300">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{dealership.location}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{dealership.phone}</span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Ends: {formatDate(dealership.subscription_end_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="px-2 py-1 rounded-full text-xs border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            Expiring Soon
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                placeholder="Search dealerships by name or location..."
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
                onClick={() => handleSort('name')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'name'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('location')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'location'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Location
                {sortBy === 'location' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('subscription_end_date')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'subscription_end_date'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Subscription Date
                {sortBy === 'subscription_end_date' && (
                 sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('cars_listed')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'cars_listed'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Cars Listed
                {sortBy === 'cars_listed' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Dealerships List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <XCircleIcon className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Dealerships</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchDealerships()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : dealerships.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Dealerships Found</h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "No dealerships match your search criteria. Try a different search term."
                  : "No dealerships available. Try adding a new dealership."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dealerships.map(dealership => {
                const { status, colorClass } = getSubscriptionStatus(dealership.subscription_end_date);

                return (
                  <div
                    key={dealership.id}
                    className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300 cursor-pointer"
                    onClick={() => openDealershipModal(dealership)}
                  >
                    <div className="p-5">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 mr-3 flex-shrink-0">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                            checked={selectedDealerships.includes(dealership.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDealershipSelection(dealership.id);
                            }}
                          />
                        </div>

                        {dealership.logo ? (
                          <img
                            src={dealership.logo}
                            alt={dealership.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}

                        <div className="ml-3 min-w-0 flex-1">
                          <h3 className="text-white font-semibold text-lg">{dealership.name}</h3>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="text-gray-400 text-sm truncate">{dealership.location}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="bg-indigo-500/80 px-2 py-1 rounded-full text-xs text-white mb-2">
                            {dealership.cars_listed} cars
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs border ${colorClass}`}>
                            {status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center text-gray-300">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{dealership.phone}</span>
                        </div>

                        <div className="flex items-center text-gray-300">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">Ends: {formatDate(dealership.subscription_end_date)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDealershipModal(dealership);
                          }}
                          className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <PencilIcon className="h-3.5 w-3.5 mr-1" />
                          Edit Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex justify-between items-center py-4">
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
            </div>
          )}
        </div>
      </div>

      {/* Dealership Edit Modal */}
      <Transition appear show={isDealershipModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDealershipModalOpen(false)}>
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
                    Edit Dealership
                  </Dialog.Title>

                  {selectedDealership && (
                    <form onSubmit={handleUpdateDealership} className="space-y-4">
                      {/* Logo Upload */}
                      <div className="flex flex-col items-center justify-center mb-4">
                        <div className="relative w-24 h-24 mb-2">
                          {file ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="New logo"
                              className="w-24 h-24 rounded-full object-cover"
                            />
                          ) : dealershipFormData.logo ? (
                            <img
                              src={dealershipFormData.logo}
                              alt={dealershipFormData.name}
                              className="w-24 h-24 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <label className="flex items-center justify-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                          <PhotoIcon className="h-5 w-5 mr-2" />
                          Change Logo
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>
                      </div>

                      {/* Dealership Name */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={dealershipFormData.name}
                          onChange={(e) => setDealershipFormData({...dealershipFormData, name: e.target.value})}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                          required
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-1">
                          Location
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPinIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <input
                            type="text"
                            id="location"
                            value={dealershipFormData.location}
                            onChange={(e) => setDealershipFormData({...dealershipFormData, location: e.target.value})}
                            className="w-full pl-10 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhoneIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <input
                            type="tel"
                            id="phone"
                            value={dealershipFormData.phone}
                            onChange={(e) => setDealershipFormData({...dealershipFormData, phone: e.target.value})}
                            className="w-full pl-10 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="longitude" className="block text-sm font-medium text-gray-400 mb-1">
                            Longitude
                          </label>
                          <input
                            type="text"
                            id="longitude"
                            value={dealershipFormData.longitude}
                            onChange={(e) => setDealershipFormData({...dealershipFormData, longitude: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="latitude" className="block text-sm font-medium text-gray-400 mb-1">
                            Latitude
                          </label>
                          <input
                            type="text"
                            id="latitude"
                            value={dealershipFormData.latitude}
                            onChange={(e) => setDealershipFormData({...dealershipFormData, latitude: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                          />
                        </div>
                      </div>

                      {/* Subscription End Date */}
                      <div>
                        <label htmlFor="subscription_end_date" className="block text-sm font-medium text-gray-400 mb-1">
                          Subscription End Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CalendarIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <input
                            type="date"
                            id="subscription_end_date"
                            value={dealershipFormData.subscription_end_date}
                            onChange={(e) => setDealershipFormData({...dealershipFormData, subscription_end_date: e.target.value})}
                            className="w-full pl-10 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Submit and Cancel Buttons */}
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => setIsDealershipModalOpen(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
                        >
                          {isActionLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>Update Dealership</>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Bulk Action Slide Over */}
      <Transition appear show={isBulkDrawerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsBulkDrawerOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-gray-800 py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-semibold text-white">
                            Bulk Actions
                            <span className="ml-2 bg-indigo-500/30 text-indigo-300 text-xs py-1 px-2 rounded-full">
                              {selectedDealerships.length} selected
                            </span>
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-gray-700 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onClick={() => setIsBulkDrawerOpen(false)}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        <div className="space-y-6">
                          <div>
                            <label htmlFor="bulk-action" className="block text-sm font-medium text-gray-400 mb-2">
                              Select Action
                            </label>
                            <select
                              id="bulk-action"
                              value={bulkAction || ''}
                              onChange={(e) => setBulkAction(e.target.value || null)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            >
                              <option value="">Select an action</option>
                              <option value="extend">Extend Subscription</option>
                              <option value="end">End Subscription</option>
                            </select>
                          </div>

                          {bulkAction === 'extend' && (
                            <div>
                              <label htmlFor="extend-months" className="block text-sm font-medium text-gray-400 mb-2">
                                Extend by (months)
                              </label>
                              <input
                                type="number"
                                id="extend-months"
                                min="1"
                                max="60"
                                value={extendMonths}
                                onChange={(e) => setExtendMonths(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                              />
                            </div>
                          )}

                          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                            <h4 className="text-white font-medium mb-2">Selected Dealerships</h4>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {selectedDealerships.map(id => {
                                const dealership = allDealerships.find(d => d.id === id);
                                if (!dealership) return null;

                                return (
                                  <div key={id} className="flex justify-between items-center">
                                    <div className="text-gray-300">{dealership.name}</div>
                                    <button
                                      onClick={() => toggleDealershipSelection(id)}
                                      className="text-rose-400 hover:text-rose-300"
                                    >
                                      <XMarkIcon className="h-5 w-5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-between space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDealerships([]);
                                resetBulkActionForm();
                                setIsBulkDrawerOpen(false);
                              }}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex-1"
                            >
                              Clear Selection
                            </button>

                            <button
                              type="button"
                              disabled={!bulkAction || selectedDealerships.length === 0 || isActionLoading}
                              onClick={() => setShowBulkActionConfirm(true)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex-1 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                'Apply Action'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Bulk Action Confirmation Dialog */}
      <Transition appear show={showBulkActionConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowBulkActionConfirm(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>

                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-white text-center"
                  >
                    Confirm Action
                  </Dialog.Title>

                  <div className="mt-3">
                    <p className="text-sm text-gray-300 text-center">
                      {bulkAction === 'extend' ? (
                        `You're about to extend the subscription for ${selectedDealerships.length} dealership(s) by ${extendMonths} month(s).`
                      ) : (
                        `You're about to end the subscription for ${selectedDealerships.length} dealership(s).`
                      )}
                    </p>

                    <p className="text-sm text-amber-400 mt-2 text-center">
                      This will also change the status of their cars to {bulkAction === 'extend' ? 'available' : 'pending'}.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      onClick={() => setShowBulkActionConfirm(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                      onClick={executeBulkAction}
                    >
                      Confirm
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

// Build a component for making a single tag with icon and text
function StatusTag({ status, colorClass, icon }: { status: string; colorClass: string; icon?: React.ReactNode }) {
  return (
    <div className={`px-2 py-1 rounded-full text-xs border ${colorClass} inline-flex items-center`}>
      {icon && <span className="mr-1">{icon}</span>}
      <span>{status}</span>
    </div>
  );
}

// Component for dealership card in lists
export function DealershipCard({
  dealership,
  isSelected,
  onSelect,
  onClick,
  getSubscriptionStatus
}: {
  dealership: Dealership;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onClick: (dealership: Dealership) => void;
  getSubscriptionStatus: (date: string) => { status: string; colorClass: string };
}) {
  const { status, colorClass } = getSubscriptionStatus(dealership.subscription_end_date);

  // Format date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div
      className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl min-w-[300px] flex-shrink-0 hover:border-gray-600 transition-all duration-200 cursor-pointer"
      onClick={() => onClick(dealership)}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(dealership.id);
              }}
              className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
            />
            <h3 className="text-white font-semibold text-lg ml-2">{dealership.name}</h3>
          </div>
          <div className="bg-indigo-500/80 text-white text-xs px-2 py-1 rounded-full">
            {dealership.cars_listed} cars
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-300 text-sm">{dealership.location}</span>
          </div>

          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-300 text-sm">{dealership.phone}</span>
          </div>

          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
            <span className={`text-sm ${status === 'Expired' ? 'text-rose-400' : status === 'Expiring Soon' ? 'text-amber-400' : 'text-gray-300'}`}>
              {status === 'Expired' ? 'Ended: ' : 'Ends: '}
              {formatDate(dealership.subscription_end_date)}
            </span>
          </div>

          <div className="flex items-center">
            <StatusTag
              status={status}
              colorClass={colorClass}
              icon={
                status === 'Active' ? (
                  <CheckCircleIcon className="h-3 w-3" />
                ) : status === 'Expiring Soon' ? (
                  <ClockIcon className="h-3 w-3" />
                ) : (
                  <XCircleIcon className="h-3 w-3" />
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export function SubscriptionManager({
  dealership,
  onUpdate
}: {
  dealership: Dealership;
  onUpdate: (dealership: Dealership, newEndDate: string, isExtending: boolean) => Promise<void>;
}) {
  const [months, setMonths] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const extendSubscription = async () => {
    if (months < 1) return;

    setIsProcessing(true);
    try {
      const currentEndDate = new Date(dealership.subscription_end_date);
      const now = new Date();
      const wasExpired = currentEndDate < now;

      // If subscription has expired, start from today, otherwise extend from current end date
      const startDate = currentEndDate < now ? now : currentEndDate;

      // Add the specified number of months
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      await onUpdate(dealership, newEndDate.toISOString().split('T')[0], wasExpired);

      // Reset after success
      setMonths(1);
    } catch (error) {
      console.error("Error extending subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const endSubscription = async () => {
    if (!confirm("Are you sure you want to end this subscription immediately? This will set all available cars to pending and all published autoclips to archived.")) return;

    setIsProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await onUpdate(dealership, today, false);
    } catch (error) {
      console.error("Error ending subscription:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <h3 className="text-white font-medium mb-3">Subscription Management</h3>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-300 text-sm">
            Current End Date: {new Date(dealership.subscription_end_date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center">
          <StatusTag
            status={
              new Date(dealership.subscription_end_date) < new Date()
                ? "Expired"
                : new Date(dealership.subscription_end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ? "Expiring Soon"
                : "Active"
            }
            colorClass={
              new Date(dealership.subscription_end_date) < new Date()
                ? "text-rose-500 bg-rose-500/10 border-rose-500/30"
                : new Date(dealership.subscription_end_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                : "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
            }
          />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex">
          <input
            type="number"
            min="1"
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
            className="w-full rounded-l-lg bg-gray-700 border-gray-600 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Months"
          />
          <button
            onClick={extendSubscription}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Extending...
              </span>
            ) : (
              "Extend"
            )}
          </button>
        </div>

        <button
          onClick={endSubscription}
          disabled={isProcessing || new Date(dealership.subscription_end_date) < new Date()}
          className="bg-rose-600/80 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            "End Subscription"
          )}
        </button>
      </div>
    </div>
  );
}