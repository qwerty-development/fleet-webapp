"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  HeartIcon,
  ShareIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Link from "next/link";

interface AutoClipCardProps {
  clip: {
    id: number;
    car_id: number;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    views: number;
    likes: number;
    dealership_id?: number;
    dealership_name?: string;
    dealership_logo?: string;
    car_make?: string;
    car_model?: string;
    car_year?: number;
    car_price?: number;
  };
  isActive: boolean;
  isFullscreen?: boolean;
  onLikeToggle: (clipId: number) => void;
  isLiked: boolean;
  onVideoClick?: () => void;
}

const AutoClipCard: React.FC<AutoClipCardProps> = ({
  clip,
  isActive,
  isFullscreen = false,
  onLikeToggle,
  isLiked,
  onVideoClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoHeight, setVideoHeight] = useState("100%");
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Handle video playback based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Calculate video dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        // Adjust video to fill available space while maintaining aspect ratio
        const videoElement = videoRef.current;
        const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        if (viewportWidth / viewportHeight < aspectRatio) {
          // The video is wider than the viewport
          setVideoHeight("auto");
        } else {
          // The video is taller than the viewport
          setVideoHeight("100%");
        }
      }
    };

    // Initial calculation
    if (videoRef.current && videoRef.current.readyState >= 1) {
      updateDimensions();
    } else {
      videoRef.current?.addEventListener("loadedmetadata", updateDimensions);
    }

    // Update dimensions on window resize
    window.addEventListener("resize", updateDimensions);

    return () => {
      videoRef.current?.removeEventListener("loadedmetadata", updateDimensions);
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Toggle video play/pause
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => console.error("Error playing video:", error));
      }
    }

    if (onVideoClick) {
      onVideoClick();
    }
  };

  // Show controls temporarily when interacting with the video
  const showControlsTemporarily = () => {
    setShowControls(true);

    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    setControlsTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Share clip
  const shareClip = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video click

    try {
      if (navigator.share) {
        await navigator.share({
          title: clip.title,
          text: `Check out this ${clip.car_year} ${clip.car_make} ${clip.car_model}!`,
          url: `${window.location.origin}/autoclips?clip=${clip.id}`,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(
          `${window.location.origin}/autoclips?clip=${clip.id}`
        );
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing clip:", error);
    }
  };

  // Handle like toggle
  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video click
    onLikeToggle(clip.id);
  };

  // Toggle mute/unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers

    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }

    // Show controls temporarily when toggling mute
    showControlsTemporarily();
  };

  // Toggle info expanded state
  const toggleInfoExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoExpanded(!infoExpanded);
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
      onMouseEnter={showControlsTemporarily}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={clip.video_url}
        poster={clip.thumbnail_url}
        loop
        muted={isMuted}
        autoPlay
        playsInline
        onClick={togglePlayPause}
        className="w-full h-full object-cover"
        style={{ height: "100%", width: "100%", objectFit: "cover" }}
      />

      {/* Play/Pause Controls - Center of screen */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Play/Pause button in center */}
        <div
          onClick={togglePlayPause}
          className="cursor-pointer pointer-events-auto"
        >
          {!isPlaying && (
            <div className="rounded-full bg-black/50 p-4">
              <PlayIcon className="h-10 w-10 text-white" />
            </div>
          )}

          {isPlaying && showControls && (
            <div className="rounded-full bg-black/50 p-4">
              <PauseIcon className="h-10 w-10 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Side action buttons - Instagram-style - Centered on right side */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
        {/* Sound control */}
        <button onClick={toggleMute} className="flex flex-col items-center">
          <div className="rounded-full bg-black/40 p-2">
            {isMuted ? (
              <SpeakerXMarkIcon className="h-7 w-7 text-white" />
            ) : (
              <SpeakerWaveIcon className="h-7 w-7 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1">Sound</span>
        </button>

        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          className="flex flex-col items-center"
        >
          <div className="rounded-full bg-black/40 p-2">
            {isLiked ? (
              <HeartIconSolid className="h-7 w-7 text-red-500" />
            ) : (
              <HeartIcon className="h-7 w-7 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1">{clip.likes}</span>
        </button>

        {/* Views count */}
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-black/40 p-2">
            <EyeIcon className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs mt-1">{clip.views}</span>
        </div>

        {/* Share Button */}
        <button onClick={shareClip} className="flex flex-col items-center">
          <div className="rounded-full bg-black/40 p-2">
            <ShareIcon className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-xs mt-1">Share</span>
        </button>
      </div>

      {/* Clip Info and Actions - Bottom black overlay */}
      <div
        className={`absolute left-0  right-0 bottom-0 pt-8 pb-4 px-4 text-white transition-all duration-300 ${
          infoExpanded ? "h-auto max-h-96" : "max-h-32"
        }`}
      >
        {/* Expand/collapse indicator */}
        <div
          className="w-full flex justify-center items-center py-2 cursor-pointer"
          onClick={toggleInfoExpanded}
        >
          <div className="w-24 h-3 bg-accent rounded-full"></div>
        </div>

        {/* Expandable Content */}
        <div
          className={`overflow-hidden bg-black/10 rounded-xl p-1  transition-all duration-300 ${
            infoExpanded ? "max-h-80" : "max-h-0"
          }`}
        >
          <p className="text-3xl font-extrabold text-accent  transition-colors">
            {clip.title}
          </p>
          <p className="text-s text-gray-300 hover:text-accent transition-colors">
            {clip.description}
          </p>
          {/* Car and Dealership Info */}
          <div className="flex items-center my-3">
            <Link
              href={`/dealerships/${clip.dealership_id}`}
              className="flex items-center"
              onClick={(e) => e.stopPropagation()} // Prevent video click
            >
              <div className="w-10 h-10 mr-3 flex-shrink-0">
                <img
                  src={clip.dealership_logo}
                  alt={clip.dealership_name}
                  className="w-full h-full rounded-full object-cover border border-gray-700"
                  onError={(e) =>
                    (e.currentTarget.src = '')
                  }
                />
              </div>
              <div>
                <p className="font-bold text-white hover:text-accent transition-colors">
                  {clip.dealership_name}
                </p>
                <p className="text-sm text-gray-200">
                  {clip.car_year} {clip.car_make} {clip.car_model}
                </p>
              </div>
            </Link>
            {clip.car_price && (
              <div className="ml-auto bg-accent px-3 py-1 rounded-full">
                <span className="text-sm font-bold">
                  ${clip.car_price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <Link
            href={`/cars/${clip.car_id}`}
            className="block w-full mt-3 bg-accent hover:bg-accent/90 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            View Car Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AutoClipCard;
