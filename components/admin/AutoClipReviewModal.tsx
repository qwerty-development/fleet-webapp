import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  EyeIcon,
  HeartIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// CRITICAL: AutoClip interface matching the main component
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

interface AutoClipReviewModalProps {
  clip: AutoClipReview;
  isVisible: boolean;
  onClose: () => void;
  onApprove: (clip: AutoClipReview, notes?: string) => Promise<void>;
  onReject: (clip: AutoClipReview, reason: string, notes?: string) => Promise<void>;
}

// PREDEFINED: Common rejection reasons for quick selection
const REJECTION_REASONS = [
  "Inappropriate content",
  "Poor video quality",
  "Misleading information",
  "Copyright violation",
  "Technical issues",
  "Incomplete information",
  "Violates community guidelines",
  "Other (specify in notes)"
];

const AutoClipReviewModal: React.FC<AutoClipReviewModalProps> = ({
  clip,
  isVisible,
  onClose,
  onApprove,
  onReject,
}) => {
  // STATE: Video player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STATE: Review form data
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // STATE: Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REFS: Video element reference
  const videoRef = useRef<HTMLVideoElement>(null);

  // RULE: Reset state when modal opens/closes
  useEffect(() => {
    if (isVisible && clip) {
      setReviewNotes(clip.review_notes || "");
      setSelectedRejectionReason(clip.rejection_reason || "");
      setCustomRejectionReason("");
      setShowRejectionForm(false);
      setErrors({});
      setIsPlaying(false);
      setIsMuted(true);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isVisible, clip]);

  // RULE: Pause video when modal closes
  useEffect(() => {
    if (!isVisible && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  // METHOD: Handle video play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // METHOD: Handle video mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // METHOD: Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // METHOD: Handle video duration loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // METHOD: Handle video seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // METHOD: Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // METHOD: Validate approval form
  const validateApproval = () => {
    const newErrors: Record<string, string> = {};
    // Approval can proceed with or without notes
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // METHOD: Validate rejection form
  const validateRejection = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRejectionReason) {
      newErrors.reason = "Please select a rejection reason";
    }

    if (selectedRejectionReason === "Other (specify in notes)" && !customRejectionReason.trim()) {
      newErrors.customReason = "Please specify the custom rejection reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // METHOD: Handle approval
  const handleApprove = async () => {
    if (!validateApproval()) return;

    try {
      setIsSubmitting(true);
      await onApprove(clip, reviewNotes);
      onClose();
    } catch (error) {
      console.error("Error approving clip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // METHOD: Handle rejection
  const handleReject = async () => {
    if (!validateRejection()) return;

    try {
      setIsSubmitting(true);
      const finalReason = selectedRejectionReason === "Other (specify in notes)"
        ? customRejectionReason.trim()
        : selectedRejectionReason;
      
      await onReject(clip, finalReason, reviewNotes);
      onClose();
    } catch (error) {
      console.error("Error rejecting clip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // GUARD: Don't render if not visible
  if (!isVisible) return null;

  const statusConfig = getStatusConfig(clip.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        
        {/* HEADER: Modal header */}
        <div className="sticky top-0 bg-gray-800 z-10 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">AutoClip Review</h2>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Video player */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="relative aspect-video">
                  <video
                    ref={videoRef}
                    src={clip.video_url}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    poster={clip.thumbnail_url}
                    preload="metadata"
                  />
                  
                  {/* Video controls overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={togglePlayPause}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <PauseIcon className="h-8 w-8 text-white" />
                        ) : (
                          <PlayIcon className="h-8 w-8 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {/* Progress bar */}
                      <div className="mb-2">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={togglePlayPause}
                            className="text-white hover:text-gray-300 transition-colors"
                          >
                            {isPlaying ? (
                              <PauseIcon className="h-5 w-5" />
                            ) : (
                              <PlayIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={toggleMute}
                            className="text-white hover:text-gray-300 transition-colors"
                          >
                            {isMuted ? (
                              <SpeakerXMarkIcon className="h-5 w-5" />
                            ) : (
                              <SpeakerWaveIcon className="h-5 w-5" />
                            )}
                          </button>
                          <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video information */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-white font-bold text-lg mb-2">{clip.title}</h3>
                {clip.description && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {clip.description}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Clip details and review interface */}
            <div className="space-y-6">
              
              {/* Vehicle information */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Vehicle Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="text-white font-medium">
                      {clip.car?.year} {clip.car?.make} {clip.car?.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-bold">
                      ${clip.car?.price?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Car ID:</span>
                    <span className="text-gray-300">#{clip.car_id}</span>
                  </div>
                </div>
              </div>

              {/* Dealership information */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <BuildingOffice2Icon className="h-5 w-5 mr-2 text-indigo-400" />
                  Dealership
                </h4>
                <div className="flex items-center space-x-3">
                  {clip.dealership?.logo && (
                    <img
                      src={clip.dealership.logo}
                      alt={clip.dealership.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      {clip.dealership?.name || 'Unknown Dealership'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {clip.dealership?.location || 'Location not specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics and timeline */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-indigo-400" />
                  Metrics & Timeline
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-white font-bold">{clip.views || 0}</span>
                    </div>
                    <div className="text-gray-400 text-xs">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <HeartIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-white font-bold">{clip.likes || 0}</span>
                    </div>
                    <div className="text-gray-400 text-xs">Likes</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-300">{formatDate(clip.created_at)}</span>
                  </div>
                  {clip.submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Submitted:</span>
                      <span className="text-gray-300">{formatDate(clip.submitted_at)}</span>
                    </div>
                  )}
                  {clip.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed:</span>
                      <span className="text-gray-300">{formatDate(clip.reviewed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous review information */}
              {(clip.status === 'published' || clip.status === 'rejected') && clip.reviewed_at && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-400" />
                    Review History
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={clip.status === 'published' ? 'text-emerald-400' : 'text-red-400'}>
                        {clip.status === 'published' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewed by:</span>
                      <span className="text-gray-300">{clip.reviewed_by || 'Unknown'}</span>
                    </div>
                    {clip.review_notes && (
                      <div>
                        <span className="text-gray-400">Notes:</span>
                        <p className="text-gray-300 mt-1 p-2 bg-gray-800 rounded">
                          {clip.review_notes}
                        </p>
                      </div>
                    )}
                    {clip.rejection_reason && (
                      <div>
                        <span className="text-red-400">Rejection Reason:</span>
                        <p className="text-red-300 mt-1 p-2 bg-red-900/20 rounded">
                          {clip.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review interface - only show for pending clips */}
              {clip.status === 'under_review' && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">Review Decision</h4>
                  
                  {/* Review notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add any notes about this review..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                    />
                  </div>

                  {/* Rejection form - only show when rejecting */}
                  {showRejectionForm && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <h5 className="text-red-400 font-medium mb-3">Rejection Details</h5>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Rejection Reason *
                        </label>
                        <select
                          value={selectedRejectionReason}
                          onChange={(e) => setSelectedRejectionReason(e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-700 border ${
                            errors.reason ? 'border-red-500' : 'border-gray-600'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-sm`}
                        >
                          <option value="">Select a reason...</option>
                          {REJECTION_REASONS.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                        {errors.reason && (
                          <p className="mt-1 text-sm text-red-400">{errors.reason}</p>
                        )}
                      </div>

                      {selectedRejectionReason === "Other (specify in notes)" && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Custom Rejection Reason *
                          </label>
                          <textarea
                            value={customRejectionReason}
                            onChange={(e) => setCustomRejectionReason(e.target.value)}
                            placeholder="Please specify the rejection reason..."
                            rows={2}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                              errors.customReason ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white text-sm`}
                          />
                          {errors.customReason && (
                            <p className="mt-1 text-sm text-red-400">{errors.customReason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    {!showRejectionForm ? (
                      <>
                        <button
                          onClick={handleApprove}
                          disabled={isSubmitting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          {isSubmitting ? 'Approving...' : 'Approve & Publish'}
                        </button>
                        <button
                          onClick={() => setShowRejectionForm(true)}
                          disabled={isSubmitting}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectionForm(false);
                            setSelectedRejectionReason("");
                            setCustomRejectionReason("");
                            setErrors({});
                          }}
                          disabled={isSubmitting}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for video slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default AutoClipReviewModal;