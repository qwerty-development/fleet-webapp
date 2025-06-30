"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import AutoClipReviewModal from "@/components/admin/AutoClipReviewModal";

// CRITICAL: Enhanced AutoClip interface for admin review
interface AutoClipReview {
  id: number;
  dealership_id: number;
  car_id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  status: 'under_review' | 'published' | 'rejected' | 'draft';
  created_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  review_notes?: string;
  dealership?: {
    id: number;
    name: string;
    logo: string;
    location: string;
  };
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

interface ReviewStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  total_reviewed: number;
  avg_review_time: number;
}

const STATUS_FILTERS = [
  { label: "Pending Review", value: "under_review", color: "amber" },
  { label: "Approved", value: "published", color: "emerald" },
  { label: "Rejected", value: "rejected", color: "red" },
  { label: "All Statuses", value: "all", color: "gray" },
];

const ITEMS_PER_PAGE = 12;

export default function AdminAutoClipReview() {
  // STATE: Core component state
  const [clips, setClips] = useState<AutoClipReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedClip, setSelectedClip] = useState<AutoClipReview | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState<boolean>(false);
  
  // STATE: Filtering and pagination
  const [statusFilter, setStatusFilter] = useState<string>("under_review");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // STATE: Statistics and metrics
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    total_reviewed: 0,
    avg_review_time: 0,
  });

  const supabase = createClient();

  // RULE: Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // RULE: Refresh data when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchClips();
    }
  }, [statusFilter, currentPage]);

  // METHOD: Initialize all required data
  const initializeData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchReviewStats(),
        fetchClips()
      ]);
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL: Fetch review statistics for dashboard
  const fetchReviewStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISOString = today.toISOString();

      // QUERY: Get pending count
      const { count: pendingCount } = await supabase
        .from('auto_clips')
        .select('id', { count: 'exact' })
        .eq('status', 'under_review');

      // QUERY: Get today's approved count
      const { count: approvedTodayCount } = await supabase
        .from('auto_clips')
        .select('id', { count: 'exact' })
        .eq('status', 'published')
        .gte('reviewed_at', todayISOString);

      // QUERY: Get today's rejected count
      const { count: rejectedTodayCount } = await supabase
        .from('auto_clips')
        .select('id', { count: 'exact' })
        .eq('status', 'rejected')
        .gte('reviewed_at', todayISOString);

      // QUERY: Get total reviewed count
      const { count: totalReviewedCount } = await supabase
        .from('auto_clips')
        .select('id', { count: 'exact' })
        .in('status', ['published', 'rejected'])
        .not('reviewed_at', 'is', null);

      setReviewStats({
        pending: pendingCount || 0,
        approved_today: approvedTodayCount || 0,
        rejected_today: rejectedTodayCount || 0,
        total_reviewed: totalReviewedCount || 0,
        avg_review_time: 0, // Would need additional calculation
      });

    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  // CRITICAL: Fetch clips with filtering and pagination
  const fetchClips = async () => {
    if (!isLoading) setIsRefreshing(true);
    
    try {
      // QUERY: Build base query with joins
      let query = supabase
        .from('auto_clips')
        .select(`
          *,
          dealership:dealerships(id, name, logo, location),
          car:cars(id, make, model, year, price)
        `, { count: 'exact' });

      // FILTER: Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // PAGINATION: Apply range and ordering
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setClips(data || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

    } catch (error:any) {
      console.error('Error fetching clips:', error);
      alert(`Failed to fetch AutoClips: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // CRITICAL: Handle clip approval
  const handleApprove = async (clip: AutoClipReview, notes?: string) => {
    try {
      const updateData = {
        status: 'published',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // Replace with actual admin user ID
        published_at: new Date().toISOString(),
        review_notes: notes || null
      };

      const { error } = await supabase
        .from('auto_clips')
        .update(updateData)
        .eq('id', clip.id);

      if (error) throw error;

      alert('AutoClip approved and published successfully!');
      await refreshData();

    } catch (error:any) {
      console.error('Error approving clip:', error);
      alert(`Failed to approve AutoClip: ${error.message}`);
    }
  };

  // CRITICAL: Handle clip rejection
  const handleReject = async (clip: AutoClipReview, reason: string, notes?: string) => {
    try {
      const updateData = {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // Replace with actual admin user ID
        rejection_reason: reason,
        review_notes: notes || null
      };

      const { error } = await supabase
        .from('auto_clips')
        .update(updateData)
        .eq('id', clip.id);

      if (error) throw error;

      alert('AutoClip rejected successfully. Dealer will be notified.');
      await refreshData();

    } catch (error:any) {
      console.error('Error rejecting clip:', error);
      alert(`Failed to reject AutoClip: ${error.message}`);
    }
  };

  // METHOD: Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchReviewStats(),
      fetchClips()
    ]);
  };

  // METHOD: Handle filter change
  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  // METHOD: Handle page navigation
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // METHOD: Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // METHOD: Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'under_review':
        return {
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: ClockIcon,
          label: 'Under Review'
        };
      case 'published':
        return {
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircleIcon,
          label: 'Published'
        };
      case 'rejected':
        return {
          color: 'bg-red-500/10 text-red-400 border-red-500/30',
          icon: XCircleIcon,
          label: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
          icon: ExclamationTriangleIcon,
          label: 'Unknown'
        };
    }
  };

  // COMPONENT: Statistics dashboard
  const StatsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
        <div className="flex justify-between items-start">
          <p className="text-gray-400 text-sm font-medium">Pending Review</p>
          <ClockIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="mt-2">
          <p className="text-white text-3xl font-bold">{reviewStats.pending}</p>
          <p className="text-amber-400 text-xs mt-1">Awaiting action</p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
        <div className="flex justify-between items-start">
          <p className="text-gray-400 text-sm font-medium">Approved Today</p>
          <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
        </div>
        <div className="mt-2">
          <p className="text-white text-3xl font-bold">{reviewStats.approved_today}</p>
          <p className="text-emerald-400 text-xs mt-1">Published clips</p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
        <div className="flex justify-between items-start">
          <p className="text-gray-400 text-sm font-medium">Rejected Today</p>
          <XCircleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="mt-2">
          <p className="text-white text-3xl font-bold">{reviewStats.rejected_today}</p>
          <p className="text-red-400 text-xs mt-1">Declined clips</p>
        </div>
      </div>

      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
        <div className="flex justify-between items-start">
          <p className="text-gray-400 text-sm font-medium">Total Reviewed</p>
          <EyeIcon className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="mt-2">
          <p className="text-white text-3xl font-bold">{reviewStats.total_reviewed}</p>
          <p className="text-indigo-400 text-xs mt-1">All time</p>
        </div>
      </div>
    </div>
  );

  // COMPONENT: Filter tabs
  const FilterTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {STATUS_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterChange(filter.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
            statusFilter === filter.value
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
          }`}
        >
          <FunnelIcon className="h-4 w-4" />
          <span>{filter.label}</span>
          {filter.value === 'under_review' && reviewStats.pending > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {reviewStats.pending}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // COMPONENT: AutoClip card
  const AutoClipCard = ({ clip }: { clip: AutoClipReview }) => {
    const statusConfig = getStatusConfig(clip.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div 
        className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/80 rounded-xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-900/20 hover:border-gray-600 cursor-pointer"
        onClick={() => {
          setSelectedClip(clip);
          setIsReviewModalVisible(true);
        }}
      >
        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-gray-900">
          <img
            src={clip.thumbnail_url || clip.video_url}
            alt={clip.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-video.jpg';
            }}
          />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
              <PlayIcon className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Status badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
          </div>

          {/* Priority indicator for pending reviews */}
          {clip.status === 'under_review' && clip.submitted_at && (
            <div className="absolute top-3 right-3">
              {new Date().getTime() - new Date(clip.submitted_at).getTime() > 24 * 60 * 60 * 1000 ? (
                <div className="bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                  URGENT
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and metrics */}
          <div className="mb-3">
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
              {clip.title}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-2">
              {clip.car?.year} {clip.car?.make} {clip.car?.model}
            </p>
          </div>

          {/* Dealership info */}
          <div className="flex items-center space-x-2 mb-3">
            <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
            {clip.dealership?.logo && (
              <img
                src={clip.dealership.logo}
                alt={clip.dealership.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <span className="text-gray-300 text-sm truncate">
              {clip.dealership?.name || 'Unknown Dealership'}
            </span>
          </div>

          {/* Metrics */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <EyeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">{clip.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <HeartIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">{clip.likes || 0}</span>
              </div>
            </div>
            {clip.car?.price && (
              <span className="text-indigo-400 font-bold">
                ${clip.car.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {clip.submitted_at ? `Submitted ${formatDate(clip.submitted_at)}` : `Created ${formatDate(clip.created_at)}`}
              </span>
            </div>
            {clip.reviewed_at && (
              <span>Reviewed {formatDate(clip.reviewed_at)}</span>
            )}
          </div>

          {/* Quick actions for pending reviews */}
          {clip.status === 'under_review' && (
            <div className="flex space-x-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(clip);
                }}
                className="flex-1 bg-emerald-600/90 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Quick Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClip(clip);
                  setIsReviewModalVisible(true);
                }}
                className="flex-1 bg-gray-600/90 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Review
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // RENDER: Main component
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              AutoClip Review Center
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-400">
                Review and manage AutoClip submissions
              </p>
              <button
                onClick={refreshData}
                className="flex items-center px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                disabled={isRefreshing}
              >
                <svg
                  className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
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
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Statistics Dashboard */}
              <StatsDashboard />

              {/* Filter Tabs */}
              <FilterTabs />

              {/* Loading indicator */}
              {isRefreshing && (
                <div className="flex justify-center items-center py-4 mb-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-indigo-500"></div>
                    <span>Loading clips...</span>
                  </div>
                </div>
              )}

              {/* AutoClips Grid */}
              {clips.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {clips.map((clip) => (
                      <AutoClipCard key={clip.id} clip={clip} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={goToPreviousPage}
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
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({totalItems} total clips)
                        </span>
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                          currentPage === totalPages
                            ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-800/60 rounded-xl p-8">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">
                      No AutoClips Found
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {statusFilter === 'under_review' 
                        ? 'No clips are currently pending review.'
                        : `No ${statusFilter === 'all' ? '' : statusFilter} clips found.`}
                    </p>
                    {statusFilter !== 'all' && (
                      <button
                        onClick={() => handleFilterChange('all')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        View All Clips
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedClip && (
        <AutoClipReviewModal
          clip={selectedClip}
          isVisible={isReviewModalVisible}
          onClose={() => {
            setIsReviewModalVisible(false);
            setSelectedClip(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}