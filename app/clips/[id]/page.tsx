"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

// AutoClip interface that matches your database structure
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

// Format relative time (reusing function from car page)
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

// App Redirect component for mobile devices
const AppRedirectOverlay = ({
  clipId,
  onClose,
  clip,
}: {
  clipId: string;
  onClose: () => void;
  clip: AutoClip | null;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "unknown">(
    "unknown"
  );

  const deepLink = `fleet://clips/${clipId}`;
  const appStoreLink = "https://apps.apple.com/app/6742141291";
  const playStoreLink =
    "https://play.google.com/store/apps/details?id=com.qwertyapp.clerkexpoquickstart";

  useEffect(() => {
    if (platform && countdown === 0) {
      // Create hidden iframe for iOS to prevent history disruption
      if (platform === "ios") {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      } else {
        // Direct redirection for Android
        window.location.href = deepLink;
      }
    }
  }, [countdown, platform, deepLink]);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform("ios");
    } else if (/android/i.test(userAgent)) {
      setPlatform("android");
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Attempt to open app when countdown reaches zero
          window.location.href = deepLink;
          setRedirectAttempted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deepLink]);

  // Get appropriate store link
  const getStoreLink = () => {
    if (platform === "ios") return appStoreLink;
    if (platform === "android") return playStoreLink;
    return playStoreLink; // Default to Play Store
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ×
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
          <img src="/logo.png" alt="Fleet App" className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Opening Video in Fleet App
        </h2>
        {clip?.car && (
          <p className="text-gray-300 mb-4">
            {clip.car.year} {clip.car.make} {clip.car.model}
          </p>
        )}

        {countdown > 0 ? (
          <div className="mb-6">
            <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-400">Redirecting in {countdown}...</p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-400">
              {redirectAttempted
                ? "Couldn't open the app automatically."
                : "Opening app..."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href={deepLink}
            className="block w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium"
          >
            Open in Fleet App
          </a>

          <a
            href={getStoreLink()}
            className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
          >
            Download Fleet App
          </a>

          <button
            onClick={onClose}
            className="block w-full py-3 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg font-medium"
          >
            Continue to Website
          </button>
        </div>
      </div>
    </div>
  );
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

  // App redirect state
  const [showAppRedirect, setShowAppRedirect] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const redirectChecked = useRef(false);

  // Check if it's a mobile device
  useEffect(() => {
    if (typeof window !== "undefined" && !redirectChecked.current) {
      redirectChecked.current = true;

      // Check if this is a mobile device
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);

      // Show redirect for mobile users
      if (isMobileDevice) {
        // Check if the user has a cookie indicating they prefer the web version
        const preferWeb = document.cookie.includes("preferWeb=true");
        if (!preferWeb) {
          // Add a slight delay to ensure the page has loaded
          setTimeout(() => setShowAppRedirect(true), 1000);
        }
      }
    }
  }, []);

  // Handle closing the redirect and setting preference
  const handleCloseRedirect = () => {
    setShowAppRedirect(false);
    // Set a cookie to remember the preference for 24 hours
    document.cookie = "preferWeb=true; max-age=86400; path=/";
  };

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
        // Update clip state with new view count
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

        // Fetch clip details with related car and dealership data
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
          router.push("/not-found"); // Redirect to not found page
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

  // Track clip view when the page loads and clip data is available
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
        // Fallback for browsers that don't support navigator.share
        const text = clip.car 
          ? `Check out this video of a ${clip.car.year} ${clip.car.make} ${clip.car.model} on Fleet!` 
          : `Check out this video on Fleet!`;
        
        const shareText = `${text}${clip.description ? `\n\n${clip.description}` : ''}\n\n${window.location.href}`;
        
        // Create a temporary input to copy URL
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

  // Show loading state if data is not yet available
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
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

        {/* App link meta tags */}
        <meta property="al:ios:url" content={`fleet://clips/${clip.id}`} />
        <meta property="al:ios:app_store_id" content="6742141291" />
        <meta property="al:ios:app_name" content="Fleet" />

        <meta property="al:android:url" content={`fleet://clips/${clip.id}`} />
        <meta
          property="al:android:package"
          content="com.qwertyapp.clerkexpoquickstart"
        />
        <meta property="al:android:app_name" content="Fleet" />
        <link rel="alternate" href={`https://www.fleetapp.me/clips/${clip.id}`} />
        <meta
          name="apple-itunes-app"
          content={`app-id=6742141291, app-argument=https://www.fleetapp.me/clips/${clip.id}`}
        />

        {/* Open Graph tags */}
        <meta
          property="og:title"
          content={
            clip.car
              ? `${clip.car.year} ${clip.car.make} ${clip.car.model} - Video | Fleet`
              : clip.title || "Video | Fleet"
          }
        />
        <meta
          property="og:description"
          content={
            clip.description ||
            (clip.car
              ? `Video of ${clip.car.year} ${clip.car.make} ${clip.car.model}`
              : "Watch this video on Fleet")
          }
        />
        <meta
          property="og:url"
          content={`https://www.fleetapp.me/clips/${clip.id}`}
        />
        <meta property="og:type" content="video.other" />
        {clip.video_url && (
          <meta property="og:video" content={clip.video_url} />
        )}
      </Head>

      <div className="min-h-screen bg-gray-900 text-white relative">
        {/* App Redirect Modal for Mobile Devices */}
        {showAppRedirect && (
          <AppRedirectOverlay
            clipId={clip.id.toString()}
            onClose={handleCloseRedirect}
            clip={clip}
          />
        )}

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        {/* Main content */}
        <div className="container mx-auto px-4 pt-16 pb-20">
          {/* Video preview - this is a fallback since we can't play the actual video */}
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
            
            {/* Optional: Display a thumbnail if available or gradient background */}
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
            <button
              onClick={() => {
                window.location.href = `fleet://clips/${clip.id}`;
                setTimeout(() => {
                  setShowAppRedirect(true);
                }, 1000);
              }}
              className="px-6 py-3 bg-accent rounded-lg font-semibold hover:bg-accent/90 transition-colors flex-1"
            >
              Open in App
            </button>
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
                    href="https://apps.apple.com/app/6742141291"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.qwertyapp.clerkexpoquickstart"
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
      </div>
    </>
  );
}