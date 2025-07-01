"use client";

import React, { useState, useRef } from "react";
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

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

interface AutoClipReviewModalProps {
  clip: AutoClipReview;
  isVisible: boolean;
  onClose: () => void;
  onApprove: (clip: AutoClipReview, notes?: string) => Promise<boolean>;
  onReject: (clip: AutoClipReview, reason: string, notes?: string) => Promise<boolean>;
  onStatusChange: (clip: AutoClipReview, newStatus: string) => void;
  onRefresh: () => void;
}

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

export default function AutoClipReviewModal({
  clip,
  isVisible,
  onClose,
  onApprove,
  onReject,
  onStatusChange,
  onRefresh
}: AutoClipReviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(clip.review_notes || "");
  const [rejectionReason, setRejectionReason] = useState(clip.rejection_reason || "");
  const [customReason, setCustomReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const supabase = createClient();

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

              {/* Rejection Reason (only show when rejecting) */}
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