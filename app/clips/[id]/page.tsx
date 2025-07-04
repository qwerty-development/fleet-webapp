"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { detectPlatform, attemptAndroidAppLaunch, getDeepLink, DEEP_LINK_CONFIG } from "@/utils/androidDeepLinkUtils";
import { AppRedirectOverlay } from "@/components/AppRedirectOverlay";

interface AutoClip {
  id: number;
  title: string;
  description: string;
  video_url: string;
  status: "published" | "draft";
  car_id: number;
  dealership_id: number;
  created_at: Date | string;
  views?: number;
  likes?: number;
  liked_users?: string[];
  viewed_users?: string[];
  car?: {
    id: string;
    year: number;
    make: string;
    model: string;
  };
  dealership?: {
    id: number;
    name: string;
    logo: string;
    phone?: string;
    location?: string;
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
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
  </div>
);



export default function ClipDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const [clip, setClip] = useState<AutoClip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    // Set cookie to remember preference for 7 days
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
            car:car_id (id, make, model, year),
            dealership:dealership_id (id, name, logo, phone, location)
          `)
          .eq("id", params.id)
          .eq("status", "published")
          .single();

        if (clipError) {
          console.error("Error fetching clip:", clipError);
          setError("Clip not found or unavailable");
          throw clipError;
        }

        if (!clipData) {
          console.error("Clip not found");
          setError("Clip not found");
          router.push("/not-found");
          return;
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
          title: clip.car 
            ? `${clip.car.year} ${clip.car.make} ${clip.car.model} - Video`
            : clip.title || "Video on Fleet",
          text: `Check out this video${clip.car 
            ? ` of a ${clip.car.year} ${clip.car.make} ${clip.car.model}` 
            : ''} on Fleet!${clip.description ? `\n\n${clip.description}` : ''}`,
          url: window.location.href,
        });
      } else {
        const text = clip.car 
          ? `Check out this video of a ${clip.car.year} ${clip.car.make} ${clip.car.model} on Fleet!` 
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
    if (clip?.car) {
      router.push(`/cars/${clip.car.id}`);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !clip) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Content Not Available</h1>
        <p className="text-gray-400 mb-6">{error || "This clip cannot be displayed"}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {clip.car
            ? `${clip.car.year} ${clip.car.make} ${clip.car.model} - Video | Fleet`
            : clip.title || "Video | Fleet"}
        </title>
        <meta
          name="description"
          content={
            clip.description ||
            (clip.car
              ? `Video of ${clip.car.year} ${clip.car.make} ${clip.car.model}`
              : "Watch this video on Fleet")
          }
        />

        {/* Android App Links */}
        <link rel="alternate" href={`android-app://com.qwertyapp.clerkexpoquickstart/fleet/clips/${clip.id}`} />
        
        {/* Universal Links for iOS */}
        <meta property="al:ios:url" content={getDeepLink('clip', clip.id.toString())} />
        <meta property="al:ios:app_store_id" content="6742141291" />
        <meta property="al:ios:app_name" content="Fleet" />
        
        {/* App Links for Android */}
        <meta property="al:android:url" content={getDeepLink('clip', clip.id.toString())} />
        <meta property="al:android:package" content="com.qwertyapp.clerkexpoquickstart" />
        <meta property="al:android:app_name" content="Fleet" />
        
        <meta property="og:title" content={
          clip.car
            ? `${clip.car.year} ${clip.car.make} ${clip.car.model} - Video | Fleet`
            : clip.title || "Video | Fleet"
        } />
        <meta property="og:description" content={
          clip.description ||
          (clip.car
            ? `Video of ${clip.car.year} ${clip.car.make} ${clip.car.model}`
            : "Watch this video on Fleet")
        } />
        <meta property="og:url" content={`https://www.fleetapp.me/clips/${clip.id}`} />
        <meta property="og:type" content="video.other" />
        {clip.video_url && <meta property="og:video" content={clip.video_url} />}
      </Head>

      <div className="min-h-screen bg-gray-900 text-white relative">



        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="container mx-auto px-4 pt-16 pb-20">
          {/* Video preview */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l7-5-7-5z"></path>
                </svg>
              </div>
              <p className="mt-4 text-gray-300 text-center max-w-md">
                This video is available in the Fleet mobile app.
                <br />
                <span className="text-accent">Open in app to watch.</span>
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-0"></div>
          </div>

          {/* Title and metadata */}
          <div className="mb-6">
            {clip.car && (
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {clip.car.year} {clip.car.make} {clip.car.model}
              </h1>
            )}
            {clip.title && (
              <h2 className="text-xl font-semibold text-gray-300 mb-2">
                {clip.title}
              </h2>
            )}
            <div className="flex items-center text-sm text-gray-400">
              <span>{getRelativeTime(clip.created_at)}</span>
              <span className="mx-2">•</span>
              <span>{clip.views || 0} views</span>
              <span className="mx-2">•</span>
              <span>{clip.likes || 0} likes</span>
            </div>
          </div>

          {/* Dealership info */}
          {clip.dealership && (
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800">
                {clip.dealership.logo && (
                  <img
                    src={clip.dealership.logo}
                    alt={clip.dealership.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{clip.dealership.name}</h3>
                {clip.dealership.location && (
                  <p className="text-sm text-gray-400">
                    {clip.dealership.location}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {clip.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300 whitespace-pre-line">
                {clip.description}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <a
              href={getDeepLink('clip', clip.id.toString())}
              className="px-6 py-3 bg-accent rounded-lg font-semibold hover:bg-accent/90 transition-colors flex-1 text-center"
            >
              Open in App
            </a>
            {clip.car && (
              <button
                onClick={viewCarDetails}
                className="px-6 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex-1"
              >
                View Car Details
              </button>
            )}
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex-1"
            >
              Share
            </button>
          </div>

          {/* Download app CTA */}
          <div className="bg-gray-800 rounded-xl p-6 mt-8">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center">
                  <img src="/logo.png" alt="Fleet Logo" className="w-10 h-10" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Watch in the Fleet App</h3>
                <p className="text-gray-300 mb-4">
                  Get the full experience with our mobile app. Watch videos, browse cars, and more!
                </p>
                <div className="flex space-x-4">
                  <a
                    href={DEEP_LINK_CONFIG.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    App Store
                  </a>
                  <a
                    href={DEEP_LINK_CONFIG.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Google Play
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AppRedirectOverlay
   itemId={clip.id.toString()}
 itemType="clip"
 onClose={handleCloseRedirect}
 title={clip.car ? `${clip.car.year} ${clip.car.make} ${clip.car.model}` : clip.title || "Video"}
 subtitle="Watch this video in the app"
 />
      </div>
    </>
  );
}