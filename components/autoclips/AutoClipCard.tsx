'use client';

import React, { useRef, useState, useEffect } from 'react';
import { HeartIcon, ShareIcon, EyeIcon, PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

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
  onVideoClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle video playback based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing video:', error);
            setIsPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Toggle video play/pause
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => console.error('Error playing video:', error));
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
        navigator.clipboard.writeText(`${window.location.origin}/autoclips?clip=${clip.id}`);
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

  return (
    <div 
      className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full aspect-[9/16] max-w-md mx-auto'}`}
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
        muted
        playsInline
        onClick={togglePlayPause}
        className="w-full h-full object-contain bg-black rounded-lg"
      />
      
      {/* Play/Pause Controls */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Play/Pause button in center */}
        <div
          onClick={togglePlayPause}
          className="cursor-pointer"
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
      
      {/* Always visible mute/unmute button in bottom-left corner */}
      <div className="absolute bottom-64 right-4 z-10">
        <button
          onClick={toggleMute}
          className="rounded-full bg-black/50 p-2 hover:bg-black/70 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="h-6 w-6 text-white" />
          ) : (
            <SpeakerWaveIcon className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
      
      {/* Clip Info and Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        {/* Car and Dealership Info */}
        <div className="flex bg-neutral-900 rounded-full p-2  items-center mb-2">
          <Link 
            href={`/dealerships/${clip.dealership_id}`}
            className="flex items-center"
            onClick={(e) => e.stopPropagation()} // Prevent video click
          >
            <div className="w-8 h-8 mr-3 flex-shrink-0">
              <img 
                src={clip.dealership_logo} 
                alt={clip.dealership_name} 
                className="w-full h-full rounded-full object-cover border border-gray-700"
                onError={(e) => (e.currentTarget.src = '/placeholder-logo.png')}
              />
            </div>
            <div>
              <p className="font-bold text-white hover:text-accent transition-colors">{clip.dealership_name}</p>
              <p className="text-sm">{clip.car_year} {clip.car_make} {clip.car_model}</p>
            </div>
          </Link>
          {clip.car_price && (
            <div className="ml-auto bg-accent px-3 py-1 rounded-full">
              <span className="text-sm font-bold">${clip.car_price.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {/* Clip Title and Description */}
        <h3 className="text-lg font-semibold mb-1">{clip.title}</h3>
        <p className="text-sm text-gray-300 mb-2 line-clamp-2">{clip.description}</p>
        
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <button 
              onClick={handleLikeToggle}
              className="flex items-center space-x-1"
            >
              {isLiked ? (
                <HeartIconSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-white" />
              )}
              <span>{clip.likes}</span>
            </button>
            
            {/* Views */}
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-6 w-6 text-white" />
              <span>{clip.views}</span>
            </div>
          </div>
          
          {/* Share Button */}
          <button 
            onClick={shareClip}
            className="bg-gray-800 p-2 rounded-full"
          >
            <ShareIcon className="h-5 w-5 text-white" />
          </button>
        </div>
        
        {/* View Car Button */}
        <Link 
          href={`/cars/${clip.car_id}`} 
          className="block w-full mt-3 bg-accent hover:bg-accent/90 text-white text-center py-2 px-4 rounded-lg font-semibold transition-colors"
        >
          View Car Details
        </Link>
      </div>
    </div>
  );
};

export default AutoClipCard;