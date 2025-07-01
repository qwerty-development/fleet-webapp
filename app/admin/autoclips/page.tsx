"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ArrowPathIcon,
  TrashIcon,
  DocumentTextIcon,
  UserIcon,
  VideoCameraIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PhotoIcon,
  TruckIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";

// Enhanced AutoClip interface for admin review
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
  published_at?: string;
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
  draft: number;
}

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  dealership_id: number;
}

interface Dealership {
  id: number;
  name: string;
  logo: string;
  location: string;
}

const STATUS_FILTERS = [
  { label: "Pending Review", value: "under_review", color: "amber", icon: ClockIcon },
  { label: "Published", value: "published", color: "emerald", icon: CheckCircleIcon },
  { label: "Rejected", value: "rejected", color: "red", icon: XCircleIcon },
  { label: "Draft", value: "draft", color: "gray", icon: DocumentTextIcon },
  { label: "All Statuses", value: "all", color: "indigo", icon: FunnelIcon },
];

const REJECTION_REASONS = [
  "Inappropriate content",
  "Poor video quality",
  "Misleading information",
  "Copyright violation",
  "Spam or promotional",
  "Technical issues",
  "Does not match car listing",
  "Violates community guidelines",
  "Other (specify in notes)"
];

const ITEMS_PER_PAGE = 12;

// AutoClip Review Modal Component
function AutoClipReviewModal({
  clip,
  isVisible,
  onClose,
  onApprove,
  onReject,
  onStatusChange,
  onRefresh
}: {
  clip: AutoClipReview;
  isVisible: boolean;
  onClose: () => void;
  onApprove: (clip: AutoClipReview, notes?: string) => Promise<boolean>;
  onReject: (clip: AutoClipReview, reason: string, notes?: string) => Promise<boolean>;
  onStatusChange: (clip: AutoClipReview, newStatus: string) => void;
  onRefresh: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(clip.review_notes || "");
  const [rejectionReason, setRejectionReason] = useState(clip.rejection_reason || "");
  const [customReason, setCustomReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) return null;

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const success = await onApprove(clip, reviewNotes);
      if (success) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error approving clip:', error);
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    const finalReason = rejectionReason === "Other (specify in notes)" ? customReason : rejectionReason;
    
    if (!finalReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await onReject(clip, finalReason, reviewNotes);
      if (success) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('Error rejecting clip:', error);
    }
    setIsProcessing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      await onStatusChange(clip, newStatus);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error changing status:', error);
    }
    setIsProcessing(false);
  };

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'under_review':
        return { color: 'text-amber-400', icon: ClockIcon, label: 'Under Review' };
      case 'published':
        return { color: 'text-emerald-400', icon: CheckCircleIcon, label: 'Published' };
      case 'rejected':
        return { color: 'text-red-400', icon: XCircleIcon, label: 'Rejected' };
      case 'draft':
        return { color: 'text-gray-400', icon: DocumentTextIcon, label: 'Draft' };
      default:
        return { color: 'text-gray-400', icon: ExclamationTriangleIcon, label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(clip.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">Review AutoClip</h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-800 border ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{statusConfig.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Video and Basic Info */}
            <div className="space-y-6">
              {/* Video Player */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={clip.video_url}
                  poster={clip.thumbnail_url}
                  className="w-full aspect-video object-cover"
                  onEnded={handleVideoEnded}
                  onError={(e) => {
                    console.error('Video error:', e);
                  }}
                />
                
                {/* Video Controls */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <button
                    onClick={handleVideoPlay}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-4 backdrop-blur-sm transition-colors"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-8 w-8 text-white" />
                    ) : (
                      <PlayIcon className="h-8 w-8 text-white" />
                    )}
                  </button>
                </div>

                {/* Mute Button */}
                <button
                  onClick={handleVideoMute}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm transition-colors"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="h-5 w-5 text-white" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5 text-white" />
                  )}
                </button>
              </div>

              {/* Basic Info */}
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{clip.title}</h3>
                  <div className="text-gray-300">
                    <p className={showFullDescription ? '' : 'line-clamp-3'}>
                      {clip.description || 'No description provided'}
                    </p>
                    {clip.description && clip.description.length > 150 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm mt-2"
                      >
                        {showFullDescription ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white font-medium">{clip.views || 0}</span>
                    <span className="text-gray-400 text-sm">views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HeartIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-white font-medium">{clip.likes || 0}</span>
                    <span className="text-gray-400 text-sm">likes</span>
                  </div>
                </div>
              </div>

              {/* Car Information */}
              {clip.car && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Car Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Make & Model:</span>
                      <p className="text-white font-medium">{clip.car.make} {clip.car.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Year:</span>
                      <p className="text-white font-medium">{clip.car.year}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Price:</span>
                      <p className="text-emerald-400 font-bold text-lg">${clip.car.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Review Details and Actions */}
            <div className="space-y-6">
              {/* Dealership Information */}
              {clip.dealership && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Dealership Information</h4>
                  <div className="flex items-center space-x-4">
                    {clip.dealership.logo && (
                      <img
                        src={clip.dealership.logo}
                        alt={clip.dealership.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">{clip.dealership.name}</p>
                      <p className="text-gray-400 text-sm">{clip.dealership.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Timeline</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{formatDate(clip.created_at)}</span>
                  </div>
                  {clip.submitted_at && (
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-4 w-4 text-amber-400" />
                      <span className="text-gray-400">Submitted:</span>
                      <span className="text-white">{formatDate(clip.submitted_at)}</span>
                    </div>
                  )}
                  {clip.reviewed_at && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-4 w-4 text-indigo-400" />
                      <span className="text-gray-400">Reviewed:</span>
                      <span className="text-white">{formatDate(clip.reviewed_at)}</span>
                    </div>
                  )}
                  {clip.published_at && (
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                      <span className="text-gray-400">Published:</span>
                      <span className="text-white">{formatDate(clip.published_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Review Information */}
              {(clip.review_notes || clip.rejection_reason) && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Previous Review</h4>
                  {clip.rejection_reason && (
                    <div className="mb-3">
                      <span className="text-red-400 text-sm font-medium">Rejection Reason:</span>
                      <p className="text-white mt-1">{clip.rejection_reason}</p>
                    </div>
                  )}
                  {clip.review_notes && (
                    <div>
                      <span className="text-gray-400 text-sm font-medium">Review Notes:</span>
                      <p className="text-white mt-1">{clip.review_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Notes */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Review Notes</h4>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review notes..."
                  className="w-full h-24 px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Rejection Reason */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Rejection Reason</h4>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                >
                  <option value="">Select a reason...</option>
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                
                {rejectionReason === "Other (specify in notes)" && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify custom reason..."
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Processing...' : 'Approve & Publish'}
                  </button>
                  
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason}
                    className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg font-medium transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                </div>

                {/* Status Change Actions */}
                <div className="border-t border-gray-700 pt-4">
                  <h5 className="text-white font-medium mb-3">Change Status To:</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {clip.status !== 'under_review' && (
                      <button
                        onClick={() => handleStatusChange('under_review')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg text-sm transition-colors border border-amber-600/30"
                      >
                        Mark for Review
                      </button>
                    )}
                    {clip.status !== 'draft' && (
                      <button
                        onClick={() => handleStatusChange('draft')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-lg text-sm transition-colors border border-gray-600/30"
                      >
                        Move to Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AutoClip Edit Modal Component
function AutoClipEditModal({
  clip,
  isVisible,
  onClose,
  onSave
}: {
  clip: AutoClipReview;
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    title: clip.title,
    description: clip.description || '',
    video_url: clip.video_url,
    thumbnail_url: clip.thumbnail_url || '',
    dealership_id: clip.dealership_id,
    car_id: clip.car_id,
    status: clip.status
  });

  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [availableDealerships, setAvailableDealerships] = useState<Dealership[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewVideo, setPreviewVideo] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isVisible) {
      fetchDealerships();
      fetchCars();
    }
  }, [isVisible]);

  useEffect(() => {
    if (formData.dealership_id) {
      fetchCarsByDealership(formData.dealership_id);
    }
  }, [formData.dealership_id]);

  const fetchDealerships = async () => {
    try {
      const { data, error } = await supabase
        .from('dealerships')
        .select('id, name, logo, location')
        .order('name');

      if (error) throw error;
      setAvailableDealerships(data || []);
    } catch (error) {
      console.error('Error fetching dealerships:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, dealership_id')
        .order('year', { ascending: false });

      if (error) throw error;
      setAvailableCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchCarsByDealership = async (dealershipId: number) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, dealership_id')
        .eq('dealership_id', dealershipId)
        .order('year', { ascending: false });

      if (error) throw error;
      setAvailableCars(data || []);
    } catch (error) {
      console.error('Error fetching cars by dealership:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.video_url.trim()) {
      newErrors.video_url = 'Video URL is required';
    } else if (!isValidUrl(formData.video_url)) {
      newErrors.video_url = 'Please enter a valid URL';
    }

    if (formData.thumbnail_url && !isValidUrl(formData.thumbnail_url)) {
      newErrors.thumbnail_url = 'Please enter a valid URL';
    }

    if (!formData.dealership_id) {
      newErrors.dealership_id = 'Dealership is required';
    }

    if (!formData.car_id) {
      newErrors.car_id = 'Car is required';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('auto_clips')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          video_url: formData.video_url.trim(),
          thumbnail_url: formData.thumbnail_url.trim() || null,
          dealership_id: formData.dealership_id,
          car_id: formData.car_id,
          status: formData.status
        })
        .eq('id', clip.id);

      if (error) throw error;

      alert('AutoClip updated successfully!');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating AutoClip:', error);
      alert(`Failed to update AutoClip: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCar = () => {
    return availableCars.find(car => car.id === formData.car_id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Edit AutoClip</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter clip title..."
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter clip description..."
                    rows={4}
                    maxLength={1000}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                Media URLs
              </h3>
              
              <div className="space-y-4">
                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => handleInputChange('video_url', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.video_url ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="https://example.com/video.mp4"
                  />
                  {errors.video_url && (
                    <p className="text-red-400 text-sm mt-1">{errors.video_url}</p>
                  )}
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.thumbnail_url ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  {errors.thumbnail_url && (
                    <p className="text-red-400 text-sm mt-1">{errors.thumbnail_url}</p>
                  )}
                </div>

                {/* Preview buttons */}
                <div className="flex space-x-3">
                  {formData.video_url && isValidUrl(formData.video_url) && (
                    <button
                      onClick={() => setPreviewVideo(!previewVideo)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                    >
                      {previewVideo ? 'Hide' : 'Preview'} Video
                    </button>
                  )}
                </div>

                {/* Video Preview */}
                {previewVideo && formData.video_url && isValidUrl(formData.video_url) && (
                  <div className="mt-4">
                    <video
                      src={formData.video_url}
                      poster={formData.thumbnail_url}
                      controls
                      className="w-full max-w-md rounded-lg"
                      onError={() => {
                        alert('Error loading video. Please check the URL.');
                        setPreviewVideo(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dealership and Car Selection */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BuildingOffice2Icon className="h-5 w-5 mr-2" />
                Dealership & Car
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dealership */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dealership *
                  </label>
                  <select
                    value={formData.dealership_id}
                    onChange={(e) => handleInputChange('dealership_id', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.dealership_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select dealership...</option>
                    {availableDealerships.map((dealership) => (
                      <option key={dealership.id} value={dealership.id}>
                        {dealership.name} - {dealership.location}
                      </option>
                    ))}
                  </select>
                  {errors.dealership_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.dealership_id}</p>
                  )}
                </div>

                {/* Car */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Car *
                  </label>
                  <select
                    value={formData.car_id}
                    onChange={(e) => handleInputChange('car_id', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.car_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                    disabled={!formData.dealership_id}
                  >
                    <option value="">
                      {formData.dealership_id ? 'Select car...' : 'Select dealership first'}
                    </option>
                    {availableCars
                      .filter(car => car.dealership_id === formData.dealership_id)
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.year} {car.make} {car.model} - ${car.price?.toLocaleString()}
                        </option>
                      ))}
                  </select>
                  {errors.car_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.car_id}</p>
                  )}
                </div>
              </div>

              {/* Selected car preview */}
              {getSelectedCar() && (
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Selected Car:</h4>
                  <div className="flex items-center space-x-4">
                    <TruckIcon className="h-8 w-8 text-indigo-400" />
                    <div>
                      <p className="text-white font-medium">
                        {getSelectedCar()?.year} {getSelectedCar()?.make} {getSelectedCar()?.model}
                      </p>
                      <p className="text-emerald-400 font-semibold">
                        ${getSelectedCar()?.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || Object.keys(errors).length > 0}
                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Admin AutoClips Page
export default function AdminAutoClipReview() {
  // Core state
  const [clips, setClips] = useState<AutoClipReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedClip, setSelectedClip] = useState<AutoClipReview | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  
  // Filtering and pagination
  const [statusFilter, setStatusFilter] = useState<string>("under_review");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Statistics
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    total_reviewed: 0,
    draft: 0,
  });

  // Selected clips for bulk actions
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set());

  const supabase = createClient();

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchClips();
    }
  }, [statusFilter, currentPage, searchQuery]);

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

  const fetchReviewStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISOString = today.toISOString();

      // Get all counts in parallel
      const [
        { count: pendingCount },
        { count: approvedTodayCount },
        { count: rejectedTodayCount },
        { count: totalReviewedCount },
        { count: draftCount }
      ] = await Promise.all([
        supabase.from('auto_clips').select('id', { count: 'exact' }).eq('status', 'under_review'),
        supabase.from('auto_clips').select('id', { count: 'exact' }).eq('status', 'published').gte('reviewed_at', todayISOString),
        supabase.from('auto_clips').select('id', { count: 'exact' }).eq('status', 'rejected').gte('reviewed_at', todayISOString),
        supabase.from('auto_clips').select('id', { count: 'exact' }).in('status', ['published', 'rejected']).not('reviewed_at', 'is', null),
        supabase.from('auto_clips').select('id', { count: 'exact' }).eq('status', 'draft')
      ]);

      setReviewStats({
        pending: pendingCount || 0,
        approved_today: approvedTodayCount || 0,
        rejected_today: rejectedTodayCount || 0,
        total_reviewed: totalReviewedCount || 0,
        draft: draftCount || 0,
      });

    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const fetchClips = async () => {
    if (!isLoading) setIsRefreshing(true);
    
    try {
      let query = supabase
        .from('auto_clips')
        .select(`
          *,
          dealership:dealerships(id, name, logo, location),
          car:cars(id, make, model, year, price)
        `, { count: 'exact' });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      // Pagination and ordering
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

    } catch (error: any) {
      console.error('Error fetching clips:', error);
      alert(`Failed to fetch AutoClips: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateClipStatus = async (clipId: number, newStatus: string, additionalData: any = {}) => {
    try {
      const updateData = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // Replace with actual admin user ID from auth context
        ...additionalData
      };

      // Add published_at for published status
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('auto_clips')
        .update(updateData)
        .eq('id', clipId);

      if (error) throw error;

      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error updating clip status:', error);
      alert(`Failed to update status: ${error.message}`);
      return false;
    }
  };

  const handleQuickApprove = async (clip: AutoClipReview) => {
    const success = await updateClipStatus(clip.id, 'published', {
      review_notes: 'Quick approved by admin'
    });
    if (success) {
      alert('AutoClip approved and published successfully!');
    }
  };

  const handleQuickReject = async (clip: AutoClipReview) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const success = await updateClipStatus(clip.id, 'rejected', {
      rejection_reason: reason,
      review_notes: reason
    });
    if (success) {
      alert('AutoClip rejected successfully.');
    }
  };

  const handleStatusChange = async (clip: AutoClipReview, newStatus: string) => {
    let additionalData: any = {};
    
    if (newStatus === 'rejected') {
      const reason = prompt('Enter rejection reason:');
      if (!reason) return;
      additionalData.rejection_reason = reason;
      additionalData.review_notes = reason;
    } else if (newStatus === 'published') {
      additionalData.review_notes = 'Approved by admin';
    }

    const success = await updateClipStatus(clip.id, newStatus, additionalData);
    if (success) {
      alert(`Status changed to ${newStatus} successfully!`);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedClips.size === 0) {
      alert('Please select clips first');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedClips.size} clips?`;
    if (!confirm(confirmMessage)) return;

    try {
      const promises = Array.from(selectedClips).map(clipId => {
        if (action === 'approve') {
          return updateClipStatus(clipId, 'published', { review_notes: 'Bulk approved' });
        } else if (action === 'reject') {
          const reason = 'Bulk rejected by admin';
          return updateClipStatus(clipId, 'rejected', { rejection_reason: reason, review_notes: reason });
        }
        return Promise.resolve(false);
      });

      await Promise.all(promises);
      setSelectedClips(new Set());
      alert(`Bulk ${action} completed successfully!`);
    } catch (error) {
      console.error('Error in bulk action:', error);
      alert('Some operations failed. Please try again.');
    }
  };

  const handleDeleteClip = async (clipId: number) => {
    if (!confirm('Are you sure you want to permanently delete this AutoClip?')) return;

    try {
      const { error } = await supabase
        .from('auto_clips')
        .delete()
        .eq('id', clipId);

      if (error) throw error;

      alert('AutoClip deleted successfully');
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting clip:', error);
      alert(`Failed to delete clip: ${error.message}`);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchReviewStats(),
      fetchClips()
    ]);
  };

  const handleFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
    setSelectedClips(new Set());
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSelectedClips(new Set());
  };

  const toggleClipSelection = (clipId: number) => {
    const newSelected = new Set(selectedClips);
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId);
    } else {
      newSelected.add(clipId);
    }
    setSelectedClips(newSelected);
  };

  const selectAllVisibleClips = () => {
    const allVisible = new Set(clips.map(clip => clip.id));
    setSelectedClips(allVisible);
  };

  const clearSelection = () => {
    setSelectedClips(new Set());
  };

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
      case 'draft':
        return {
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
          icon: DocumentTextIcon,
          label: 'Draft'
        };
      default:
        return {
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
          icon: ExclamationTriangleIcon,
          label: 'Unknown'
        };
    }
  };

  // Statistics Dashboard Component
  const StatsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
          <p className="text-gray-400 text-sm font-medium">Drafts</p>
          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-2">
          <p className="text-white text-3xl font-bold">{reviewStats.draft}</p>
          <p className="text-gray-400 text-xs mt-1">Unpublished</p>
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

  // Filter Tabs Component
  const FilterTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {STATUS_FILTERS.map((filter) => {
        const IconComponent = filter.icon;
        const count = filter.value === 'under_review' ? reviewStats.pending : 
                     filter.value === 'draft' ? reviewStats.draft : null;
        
        return (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              statusFilter === filter.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            <IconComponent className="h-4 w-4" />
            <span>{filter.label}</span>
            {count !== null && count > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // AutoClip Card Component
  const AutoClipCard = ({ clip }: any) => {
    const statusConfig = getStatusConfig(clip.status);
    const StatusIcon = statusConfig.icon;
    const isSelected = selectedClips.has(clip.id);

    return (
      <div className={`bg-gray-800/90 backdrop-blur-sm border rounded-xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-900/20 ${
        isSelected ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700/80 hover:border-gray-600'
      }`}>
        {/* Selection checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleClipSelection(clip.id)}
            className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
          />
        </div>

        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-gray-900 cursor-pointer" onClick={() => {
          setSelectedClip(clip);
          setIsReviewModalVisible(true);
        }}>
          <img
            src={clip.thumbnail_url || '/placeholder-video.jpg'}
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
          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
          </div>

          {/* Priority indicator */}
          {clip.status === 'under_review' && clip.submitted_at && (
            <div className="absolute bottom-3 right-3">
              {new Date().getTime() - new Date(clip.submitted_at).getTime() > 24 * 60 * 60 * 1000 && (
                <div className="bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                  URGENT
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and car info */}
          <div className="mb-3">
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
              {clip.title}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-1">
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
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
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

          {/* Dates and review info */}
          <div className="text-xs text-gray-400 mb-3 space-y-1">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {clip.submitted_at ? `Submitted ${formatDate(clip.submitted_at)}` : `Created ${formatDate(clip.created_at)}`}
              </span>
            </div>
            {clip.reviewed_at && (
              <div className="flex items-center space-x-1">
                <UserIcon className="h-3 w-3" />
                <span>Reviewed {formatDate(clip.reviewed_at)}</span>
              </div>
            )}
            {clip.rejection_reason && (
              <div className="text-red-400">
                <span>Reason: {clip.rejection_reason}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Status change buttons */}
            <div className="grid grid-cols-2 gap-2">
              {clip.status !== 'published' && (
                <button
                  onClick={() => handleQuickApprove(clip)}
                  className="flex items-center justify-center px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve
                </button>
              )}
              
              {clip.status !== 'rejected' && (
                <button
                  onClick={() => handleQuickReject(clip)}
                  className="flex items-center justify-center px-3 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Reject
                </button>
              )}
            </div>

            {/* Management buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSelectedClip(clip);
                  setIsReviewModalVisible(true);
                }}
                className="flex items-center justify-center px-2 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                Review
              </button>
              
              <button
                onClick={() => {
                  setSelectedClip(clip);
                  setIsEditModalVisible(true);
                }}
                className="flex items-center justify-center px-2 py-1.5 bg-gray-600/90 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </button>
              
              <button
                onClick={() => handleDeleteClip(clip.id)}
                className="flex items-center justify-center px-2 py-1.5 bg-red-700/90 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Delete
              </button>
            </div>

            {/* Status change dropdown for published/rejected clips */}
            {(clip.status === 'published' || clip.status === 'rejected') && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleStatusChange(clip, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-2 py-1.5 bg-gray-700 text-white text-xs rounded-lg border border-gray-600"
                defaultValue=""
              >
                <option value="">Change Status...</option>
                {clip.status !== 'under_review' && <option value="under_review">Mark for Review</option>}
                {clip.status !== 'published' && <option value="published">Publish</option>}
                {clip.status !== 'rejected' && <option value="rejected">Reject</option>}
                {clip.status !== 'draft' && <option value="draft">Move to Draft</option>}
              </select>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                AutoClip Review Center
              </h1>
              <p className="text-gray-400">
                Review, manage, and moderate AutoClip submissions
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button
                onClick={refreshData}
                className="flex items-center px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                disabled={isRefreshing}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
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

              {/* Search and Filters */}
              <div className="mb-6">
                <form onSubmit={handleSearchSubmit} className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search by title or description..."
                    className="w-full px-4 py-3 pl-10 bg-gray-800/60 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    Search
                  </button>
                </form>
                
                <FilterTabs />
              </div>

              {/* Bulk actions */}
              {selectedClips.size > 0 && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white">
                      {selectedClips.size} clip{selectedClips.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                      >
                        Bulk Approve
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        Bulk Reject
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Select all button */}
              {clips.length > 0 && selectedClips.size === 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={selectAllVisibleClips}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  >
                    Select All Visible
                  </button>
                </div>
              )}

              {/* Loading indicator */}
              {isRefreshing && (
                <div className="flex justify-center items-center py-4 mb-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
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
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({totalItems} total clips)
                        </span>
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
                    <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-xl font-bold mb-2">
                      No AutoClips Found
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {statusFilter === 'under_review' 
                        ? 'No clips are currently pending review.'
                        : searchQuery
                        ? `No clips match your search "${searchQuery}".`
                        : `No ${statusFilter === 'all' ? '' : statusFilter} clips found.`}
                    </p>
                    <div className="flex justify-center space-x-4">
                      {statusFilter !== 'all' && (
                        <button
                          onClick={() => handleFilterChange('all')}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                          View All Clips
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedClip && isReviewModalVisible && (
        <AutoClipReviewModal
          clip={selectedClip}
          isVisible={isReviewModalVisible}
          onClose={() => {
            setIsReviewModalVisible(false);
            setSelectedClip(null);
          }}
          onApprove={async (clip, notes) => {
            const success = await updateClipStatus(clip.id, 'published', { review_notes: notes });
            return success;
          }}
          onReject={async (clip, reason, notes) => {
            const success = await updateClipStatus(clip.id, 'rejected', { rejection_reason: reason, review_notes: notes });
            return success;
          }}
          onStatusChange={handleStatusChange}
          onRefresh={refreshData}
        />
      )}

      {/* Edit Modal */}
      {selectedClip && isEditModalVisible && (
        <AutoClipEditModal
          clip={selectedClip}
          isVisible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedClip(null);
          }}
          onSave={refreshData}
        />
      )}
    </div>
  );
}