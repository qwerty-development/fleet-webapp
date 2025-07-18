"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { detectPlatform, getDeepLink, DEEP_LINK_CONFIG } from "@/utils/androidDeepLinkUtils";
import { AppRedirectOverlay } from "@/components/AppRedirectOverlay";
import Navbar from "@/components/home/Navbar";
import MobileAppBanner from "@/components/MobileBanner";
import { getLogoUrl } from "@/utils/getLogoUrl";
import {
  ChevronLeftIcon,
  PlayIcon,
  ShareIcon,
  EyeIcon,
  HeartIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { FaWhatsapp } from "react-icons/fa";

interface AutoClip {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  status: "published" | "draft";
  car_id: number;
  dealership_id: number;
  created_at: Date | string;
  views?: number;
  likes?: number;
  liked_users?: string[];
  viewed_users?: string[];
  cars?: {
    id: string;
    year: number;
    make: string;
    model: string;
    price?: number;
    mileage?: number;
    condition?: string;
    color?: string;
    images?: string;
  };
  dealerships?: {
    id: number;
    name: string;
    logo: string;
    phone?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  };
}

// Format relative time
const getRelativeTime = (dateString: string | Date) => {
  if (!dateString) return "Recently";

  try {
    const now = new Date();
    const postedDate = new Date(dateString);
    const seconds = Math.floor((now.getTime() - postedDate.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval > 1 ? "s" : ""} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval > 1 ? "s" : ""} ago`;
    interval = Math.floor(seconds / 604800);
    if (interval >= 1) return `${interval} week${interval > 1 ? "s" : ""} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval > 1 ? "s" : ""} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval > 1 ? "s" : ""} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1)
      return `${interval} minute${interval > 1 ? "s" : ""} ago`;
    return `${seconds} seconds ago`;
  } catch (error) {
    console.error("Date parsing error:", error);
    return "Recently";
  }
};

// Loading state component
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
  </div>
);

const SpecItem: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
  <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="mr-3 text-accent">{icon}</div>
    <div className="flex flex-col">
      <span className="text-gray-500 text-sm">{title}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  </div>
);

export default function ClipDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const [clip, setClip] = useState<AutoClip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carImages, setCarImages] = useState<string[]>([]);
  const viewTracked = useRef<boolean>(false);
  const supabase = createClient();

  const [showAppRedirect, setShowAppRedirect] = useState(false);
  const redirectChecked = useRef(false);

  // Auto-redirect for mobile devices
  useEffect(() => {
    if (!redirectChecked.current && typeof window !== "undefined") {
      redirectChecked.current = true;
      const { isMobile } = detectPlatform();
      
      if (isMobile) {
        const preferWeb = document.cookie.includes("preferWeb=true");
        if (!preferWeb) {
          setTimeout(() => setShowAppRedirect(true), 1000);
        }
      }
    }
  }, []);

  const handleCloseRedirect = useCallback(() => {
    setShowAppRedirect(false);
    document.cookie = "preferWeb=true; max-age=604800; path=/";
  }, []);

  // Track clip view
  const trackClipView = useCallback(async (clipId: string) => {
    if (viewTracked.current) return;

    try {
      const userId = isGuest ? `guest_${guestId}` : (user?.id || 'anonymous');

      const { data, error } = await supabase.rpc("track_autoclip_view", {
        clip_id: parseInt(clipId),
        user_id: userId,
      });

      if (error) {
        console.error("Error tracking clip view:", error);
        return;
      }

      if (data !== null && clip) {
        setClip(prevClip => prevClip ? {...prevClip, views: data} : null);
      }

      viewTracked.current = true;
    } catch (error) {
      console.error("Error in trackClipView:", error);
    }
  }, [isGuest, guestId, user, supabase, clip]);

  // Fetch clip data
  useEffect(() => {
    const fetchClipData = async () => {
      try {
        setIsLoading(true);

        const { data: clipData, error: clipError } = await supabase
          .from("auto_clips")
          .select(`
            *,
            cars!car_id (
              id, make, model, year, price, mileage, condition, color, images
            ),
            dealerships!dealership_id (
              id, name, logo, phone, location, latitude, longitude
            )
          `)
          .eq("id", params.id)
          .eq("status", "published")
          .single();

        if (clipError) {
          console.error("Error fetching clip:", clipError);
          setError("Video not found or unavailable");
          throw clipError;
        }

        if (!clipData) {
          console.error("Clip not found");
          setError("Video not found");
          router.push("/not-found");
          return;
        }

        // Process car images
        if (clipData.cars?.images) {
          try {
            let images = [];
            if (typeof clipData.cars.images === "string") {
              images = JSON.parse(clipData.cars.images);
            } else if (Array.isArray(clipData.cars.images)) {
              images = clipData.cars.images;
            }
            setCarImages(images);
          } catch (e) {
            console.error("Error parsing car images:", e);
            setCarImages([]);
          }
        }

        setClip(clipData);
      } catch (error) {
        console.error("Error in fetchClipData:", error);
        setError("An error occurred while loading the content");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchClipData();
    }
  }, [params.id, router, supabase]);

  // Track clip view when data is available
  useEffect(() => {
    if (clip && !viewTracked.current) {
      trackClipView(clip.id.toString());
    }
  }, [clip, trackClipView]);

  // Handle share functionality
  const handleShare = async () => {
    if (!clip) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: clip.cars 
            ? `${clip.cars.year} ${clip.cars.make} ${clip.cars.model} - Video`
            : clip.title || "Video on Fleet",
          text: `Check out this video${clip.cars 
            ? ` of a ${clip.cars.year} ${clip.cars.make} ${clip.cars.model}` 
            : ''} on Fleet!${clip.description ? `\n\n${clip.description}` : ''}`,
          url: window.location.href,
        });
      } else {
        const text = clip.cars 
          ? `Check out this video of a ${clip.cars.year} ${clip.cars.make} ${clip.cars.model} on Fleet!` 
          : `Check out this video on Fleet!`;
        
        const shareText = `${text}${clip.description ? `\n\n${clip.description}` : ''}\n\n${window.location.href}`;
        
        const input = document.createElement('input');
        input.value = shareText;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  // View car details
  const viewCarDetails = () => {
    if (clip?.cars) {
      router.push(`/cars/${clip.cars.id}`);
    }
  };

  // Contact handlers
  const handleCall = () => {
    if (clip?.dealerships?.phone) {
      window.open(`tel:${clip.dealerships.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (clip?.dealerships?.phone) {
      const message = clip.cars 
        ? `Hi, I'm interested in the ${clip.cars.year} ${clip.cars.make} ${clip.cars.model} from your video`
        : `Hi, I saw your video and I'm interested in learning more`;
      const whatsappUrl = `https://wa.me/${clip.dealerships.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !clip) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="pt-20 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Content Not Available</h1>
          <p className="text-gray-600 mb-6">{error || "This video cannot be displayed"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const dealershipName = clip.dealerships?.name || "Unknown Dealership";
  const dealershipLogo = clip.dealerships?.logo || (clip.cars ? getLogoUrl(clip.cars.make, true) : "/default-logo.png");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      
      <div className="pt-16">
        {/* Hero Section with Video/Car Image */}
        <div className="relative">
          {/* Main visual - car image or video thumbnail */}
          <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] bg-gray-100 overflow-hidden">
            {carImages.length > 0 ? (
              <img
                src={carImages[0]}
                alt={clip.cars ? `${clip.cars.year} ${clip.cars.make} ${clip.cars.model}` : "Vehicle"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <PlayIcon className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-gray-600">Video Preview</p>
                </div>
              </div>
            )}
            
            {/* Overlay with play button */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-accent/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
                  <PlayIcon className="w-10 h-10 text-white ml-1" />
                </div>
                <p className="text-white text-lg font-semibold">
                  Watch in Fleet App
                </p>
                <p className="text-white/90 text-sm mt-1">
                  Full video experience available in mobile app
                </p>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
            >
              <ShareIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Price tag if available */}
          {clip.cars?.price && (
            <div className="absolute bottom-4 left-4 bg-accent px-4 py-2 rounded-full shadow-lg">
              <span className="text-white text-lg font-bold">
                ${clip.cars.price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Video/Car Title and Metadata */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {clip.cars && (
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {clip.cars.year} {clip.cars.make} {clip.cars.model}
                  </h1>
                )}
                {clip.title && (
                  <h2 className="text-xl text-gray-600 mb-3">
                    {clip.title}
                  </h2>
                )}
                
                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {getRelativeTime(clip.created_at)}
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {clip.views || 0} views
                  </div>
                  <div className="flex items-center">
                    <HeartIcon className="h-4 w-4 mr-1" />
                    {clip.likes || 0} likes
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="ml-4">
                <img
                  src={clip.cars ? getLogoUrl(clip.cars.make, true) : "/default-logo.png"}
                  alt={clip.cars?.make || "Vehicle"}
                  className="h-12 w-12 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Car Specifications */}
              {clip.cars && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SpecItem
                      icon={<CalendarIcon className="h-5 w-5" />}
                      title="Year"
                      value={clip.cars.year}
                    />
                    {clip.cars.mileage !== undefined && (
                      <SpecItem
                        icon={<ClockIcon className="h-5 w-5" />}
                        title="Mileage"
                        value={
                          clip.cars.mileage > 0
                            ? `${(clip.cars.mileage / 1000).toFixed(1)}k km`
                            : "New"
                        }
                      />
                    )}
                    {clip.cars.condition && (
                      <SpecItem
                        icon={<TagIcon className="h-5 w-5" />}
                        title="Condition"
                        value={clip.cars.condition}
                      />
                    )}
                    {clip.cars.color && (
                      <SpecItem
                        icon={<div className="w-5 h-5 rounded-full border-2 border-gray-300" style={{ backgroundColor: clip.cars.color.toLowerCase() }} />}
                        title="Color"
                        value={clip.cars.color}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {clip.description && (
                <div>
                  <h3 className="text-xl font-bold mb-4">About This Video</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {clip.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <a
                  href={getDeepLink('clip', clip.id.toString())}
                  className="flex-1 min-w-[200px] px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark transition-colors text-center flex items-center justify-center"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Watch in App
                </a>
                
                {clip.cars && (
                  <button
                    onClick={viewCarDetails}
                    className="flex-1 min-w-[200px] px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center flex items-center justify-center"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                    View Car Details
                  </button>
                )}
              </div>

              {/* Additional car images */}
              {carImages.length > 1 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">More Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {carImages.slice(1, 7).map((image, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${clip.cars?.make} ${clip.cars?.model} - Image ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dealership Info */}
            <div className="space-y-6">
              {/* Dealership Card */}
              {clip.dealerships && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Dealership</h3>
                  
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-gray-200">
                      <img
                        src={dealershipLogo}
                        alt={dealershipName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-lg">{dealershipName}</h4>
                      {clip.dealerships.location && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {clip.dealerships.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact buttons */}
                  {clip.dealerships.phone && (
                    <div className="space-y-3">
                      <button
                        onClick={handleCall}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PhoneIcon className="h-5 w-5 mr-2" />
                        Call Dealer
                      </button>
                      
                      <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaWhatsapp className="h-5 w-5 mr-2" />
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* App Download CTA */}
              <div className="bg-accent/10 rounded-xl p-6 border border-accent/20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-xl flex items-center justify-center">
                    <img src="/logo.png" alt="Fleet Logo" className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Get the Fleet App</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Watch full videos, browse cars, and get the complete marketplace experience
                  </p>
                  <div className="flex flex-col space-y-2">
                    <a
                      href={DEEP_LINK_CONFIG.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm text-center"
                    >
                      Download for iOS
                    </a>
                    <a
                      href={DEEP_LINK_CONFIG.playStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm text-center"
                    >
                      Download for Android
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppRedirectOverlay
        itemId={clip.id.toString()}
        itemType="clip"
        onClose={handleCloseRedirect}
        title={clip.cars ? `${clip.cars.year} ${clip.cars.make} ${clip.cars.model}` : clip.title || "Video"}
        subtitle="Watch this video in the app"
      />

      <MobileAppBanner />
    </div>
  );
}