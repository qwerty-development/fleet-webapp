"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

// AutoClip interface (unchanged)
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

// ANDROID FIX 1: Enhanced platform detection with comprehensive user agent parsing
const detectPlatform = (): { platform: "ios" | "android" | "unknown"; isMobile: boolean } => {
  if (typeof window === "undefined") {
    return { platform: "unknown", isMobile: false };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Enhanced iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  
  // Enhanced Android detection with specific browser patterns
  const isAndroid = /android/i.test(userAgent) || 
                   /Android/.test(userAgent) ||
                   /Mobile/.test(userAgent) && /Android/.test(userAgent);
  
  // Comprehensive mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent) ||
                   /Mobi|Android/i.test(userAgent) ||
                   window.innerWidth <= 768;

  let platform: "ios" | "android" | "unknown" = "unknown";
  if (isIOS) platform = "ios";
  else if (isAndroid) platform = "android";

  console.log("[PlatformDetection]", { platform, isMobile, userAgent: userAgent.substring(0, 100) });
  
  return { platform, isMobile };
};

// ANDROID FIX 2: Enhanced app launch utility with proper Android handling
const attemptAppLaunch = (deepLink: string, platform: "ios" | "android" | "unknown"): Promise<boolean> => {
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = platform === "android" ? 3000 : 2000; // Longer timeout for Android
    
    console.log(`[AppLaunch] Attempting launch for ${platform}: ${deepLink}`);
    
    // ANDROID FIX: Platform-specific launch strategies
    if (platform === "android") {
      // Android Strategy 1: Direct navigation with immediate detection
      const startTime = Date.now();
      
      // Visibility change detection for Android
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log("[AppLaunch] ANDROID: App likely opened (visibility change)");
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
      };
      
      // Blur detection for Android (secondary method)
      const handleBlur = () => {
        console.log("[AppLaunch] ANDROID: App likely opened (window blur)");
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
        window.removeEventListener("blur", handleBlur);
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      
      // Android: Direct window location change
      try {
        window.location.href = deepLink;
        
        // Android-specific timeout check
        setTimeout(() => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("blur", handleBlur);
          
          if (!resolved) {
            // Check if we're still focused - if yes, app didn't open
            const timeElapsed = Date.now() - startTime;
            const appLikelyOpened = document.hidden || timeElapsed > 2500;
            
            console.log(`[AppLaunch] ANDROID: Timeout check - elapsed: ${timeElapsed}ms, hidden: ${document.hidden}`);
            resolved = true;
            resolve(appLikelyOpened);
          }
        }, timeout);
        
      } catch (error) {
        console.error("[AppLaunch] ANDROID: Error during launch:", error);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }
      
    } else if (platform === "ios") {
      // iOS Strategy: Hidden iframe method (unchanged but enhanced)
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.style.position = "absolute";
      iframe.style.top = "-1000px";
      iframe.style.left = "-1000px";
      
      // iOS blur detection
      const handleBlur = () => {
        console.log("[AppLaunch] iOS: App opened (blur detection)");
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
        window.removeEventListener("blur", handleBlur);
      };
      
      window.addEventListener("blur", handleBlur);
      
      try {
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {
            console.warn("[AppLaunch] iOS: Error removing iframe:", e);
          }
          window.removeEventListener("blur", handleBlur);
          
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, timeout);
        
      } catch (error) {
        console.error("[AppLaunch] iOS: Error during launch:", error);
        window.removeEventListener("blur", handleBlur);
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }
      
    } else {
      // Unknown platform: Try direct navigation
      try {
        window.location.href = deepLink;
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }, timeout);
      } catch (error) {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }
    }
  });
};

// ANDROID FIX 3: Enhanced App Redirect Overlay with improved Android handling
const AppRedirectOverlay = ({
  clipId,
  onClose,
  clip,
}: {
  clipId: string;
  onClose: () => void;
  clip: AutoClip | null;
}) => {
  const [countdown, setCountdown] = useState(5); // Increased from 3 to 5 for Android
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [appLaunchStatus, setAppLaunchStatus] = useState<"waiting" | "attempting" | "success" | "failed">("waiting");
  const { platform, isMobile } = detectPlatform();
  const attemptedRef = useRef(false);

  const deepLink = `fleet://clips/${clipId}`;
  const appStoreLink = "https://apps.apple.com/app/6742141291";
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.qwertyapp.clerkexpoquickstart";

  // ANDROID FIX 4: Enhanced countdown and launch logic
  useEffect(() => {
    if (countdown <= 0 && !attemptedRef.current) {
      attemptedRef.current = true;
      setAppLaunchStatus("attempting");
      setRedirectAttempted(true);
      
      console.log(`[AppRedirect] Starting app launch for ${platform}`);
      
      attemptAppLaunch(deepLink, platform)
        .then((success) => {
          console.log(`[AppRedirect] App launch result: ${success}`);
          setAppLaunchStatus(success ? "success" : "failed");
          
          // ANDROID FIX: If app launch failed on Android, show more prominent options
          if (!success && platform === "android") {
            setTimeout(() => {
              setAppLaunchStatus("failed");
            }, 1000);
          }
        })
        .catch((error) => {
          console.error("[AppRedirect] App launch error:", error);
          setAppLaunchStatus("failed");
        });
    }
  }, [countdown, platform, deepLink]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Get appropriate store link
  const getStoreLink = () => {
    if (platform === "ios") return appStoreLink;
    if (platform === "android") return playStoreLink;
    return playStoreLink; // Default to Play Store
  };

  // ANDROID FIX 5: Manual app launch handler with enhanced error handling
  const handleManualAppLaunch = async () => {
    if (attemptedRef.current) {
      console.log("[AppRedirect] Manual launch - resetting attempt");
      attemptedRef.current = false;
    }
    
    setAppLaunchStatus("attempting");
    
    try {
      const success = await attemptAppLaunch(deepLink, platform);
      setAppLaunchStatus(success ? "success" : "failed");
      
      if (!success) {
        console.log("[AppRedirect] Manual launch failed, showing store options");
      }
    } catch (error) {
      console.error("[AppRedirect] Manual launch error:", error);
      setAppLaunchStatus("failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
          <img src="/logo.png" alt="Fleet App" className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {appLaunchStatus === "success" ? "Opening Fleet App..." : "Watch in Fleet App"}
        </h2>
        
        {clip?.car && (
          <p className="text-gray-300 mb-4">
            {clip.car.year} {clip.car.make} {clip.car.model}
          </p>
        )}

        {/* ANDROID FIX 6: Enhanced status display with platform-specific messaging */}
        <div className="mb-6">
          {appLaunchStatus === "waiting" && countdown > 0 && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">
                Opening app in {countdown}...
                {platform === "android" && (
                  <span className="block text-sm mt-1">Android detected</span>
                )}
              </p>
            </>
          )}
          
          {appLaunchStatus === "attempting" && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">
                {platform === "android" ? "Launching Fleet App..." : "Opening Fleet App..."}
              </p>
            </>
          )}
          
          {appLaunchStatus === "success" && (
            <>
              <div className="h-10 w-10 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400">App opened successfully!</p>
            </>
          )}
          
          {appLaunchStatus === "failed" && (
            <>
              <div className="h-10 w-10 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-400">
                {platform === "android" 
                  ? "App not installed or couldn't open automatically."
                  : "Couldn't open the app automatically."
                }
              </p>
            </>
          )}
        </div>

        {/* ANDROID FIX 7: Platform-specific button layout */}
        <div className="space-y-3">
          {(appLaunchStatus === "failed" || appLaunchStatus === "waiting") && (
            <button
              onClick={handleManualAppLaunch}
              className="block w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium"
            >
              {appLaunchStatus === "failed" ? "Try Again" : "Open Fleet App"}
            </button>
          )}

          {(appLaunchStatus === "failed" || redirectAttempted) && (
            <a
              href={getStoreLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
            >
              {platform === "android" ? "Get from Play Store" : "Download from App Store"}
            </a>
          )}

          <button
            onClick={onClose}
            className="block w-full py-3 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg font-medium"
          >
            Continue on Website
          </button>
        </div>

        {/* ANDROID FIX 8: Platform-specific help text */}
        {platform === "android" && appLaunchStatus === "failed" && (
          <p className="text-xs text-gray-500 mt-4">
            If the app doesn't open, make sure Fleet is installed and try the "Get from Play Store" link above.
          </p>
        )}
      </div>
    </div>
  );
};

// Format relative time (unchanged)
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

// Loading state component (unchanged)
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

  // ANDROID FIX 9: Enhanced app redirect state management
  const [showAppRedirect, setShowAppRedirect] = useState(false);
  const [platformInfo, setPlatformInfo] = useState<any>({ platform: "unknown" as const, isMobile: false });
  const redirectChecked = useRef(false);
  const pageLoadTime = useRef(Date.now());

  // ANDROID FIX 10: Enhanced mobile detection and redirect logic
  useEffect(() => {
    if (typeof window !== "undefined" && !redirectChecked.current) {
      redirectChecked.current = true;
      
      const detectedPlatform:any = detectPlatform();
      setPlatformInfo(detectedPlatform);
      
      console.log("[ClipPage] Platform detection:", detectedPlatform);

      // Show redirect for mobile users with platform-specific timing
      if (detectedPlatform.isMobile) {
        // Check preference cookie
        const preferWeb = document.cookie.includes("preferWeb=true");
        
        if (!preferWeb) {
          // ANDROID FIX: Platform-specific delays
          const delay = detectedPlatform.platform === "android" ? 2000 : 1500;
          
          setTimeout(() => {
            const timeElapsed = Date.now() - pageLoadTime.current;
            console.log(`[ClipPage] Showing redirect after ${timeElapsed}ms for ${detectedPlatform.platform}`);
            setShowAppRedirect(true);
          }, delay);
        } else {
          console.log("[ClipPage] User prefers web, skipping redirect");
        }
      }
    }
  }, []);

  // Handle closing the redirect and setting preference
  const handleCloseRedirect = useCallback(() => {
    setShowAppRedirect(false);
    // Set cookie with longer duration for Android users
    const maxAge = platformInfo.platform === "android" ? 604800 : 86400; // 7 days for Android, 1 day for others
    document.cookie = `preferWeb=true; max-age=${maxAge}; path=/`;
    console.log(`[ClipPage] Set preferWeb cookie for ${maxAge} seconds`);
  }, [platformInfo.platform]);

  // Track clip view (unchanged)
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

  // Fetch clip data (unchanged)
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

  // Track clip view when the page loads and clip data is available
  useEffect(() => {
    if (clip && !viewTracked.current) {
      trackClipView(clip.id.toString());
    }
  }, [clip, trackClipView]);

  // Handle share functionality (unchanged)
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

  // ANDROID FIX 11: Enhanced app launch handler for action buttons
  const handleAppLaunch = useCallback(async () => {
    if (!clip) return;
    
    const deepLink = `fleet://clips/${clip.id}`;
    console.log(`[ActionButton] Launching app for ${platformInfo.platform}: ${deepLink}`);
    
    try {
      const success = await attemptAppLaunch(deepLink, platformInfo.platform);
      
      if (!success) {
        console.log("[ActionButton] App launch failed, showing redirect modal");
        // If app launch fails, show the redirect modal as fallback
        setTimeout(() => {
          setShowAppRedirect(true);
        }, 1000);
      } else {
        console.log("[ActionButton] App launch successful");
      }
    } catch (error) {
      console.error("[ActionButton] App launch error:", error);
      // Show redirect modal on error
      setShowAppRedirect(true);
    }
  }, [clip, platformInfo.platform]);

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

        {/* ANDROID FIX 12: Enhanced app link meta tags with additional Android-specific tags */}
        <meta property="al:ios:url" content={`fleet://clips/${clip.id}`} />
        <meta property="al:ios:app_store_id" content="6742141291" />
        <meta property="al:ios:app_name" content="Fleet" />

        <meta property="al:android:url" content={`fleet://clips/${clip.id}`} />
        <meta property="al:android:package" content="com.qwertyapp.clerkexpoquickstart" />
        <meta property="al:android:app_name" content="Fleet" />
        
        {/* Additional Android-specific meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="android-app://com.qwertyapp.clerkexpoquickstart/fleet/clips" content={clip.id.toString()} />
        
        <link rel="alternate" href={`https://www.fleetapp.me/clips/${clip.id}`} />
        <meta
          name="apple-itunes-app"
          content={`app-id=6742141291, app-argument=https://www.fleetapp.me/clips/${clip.id}`}
        />

        {/* Enhanced Open Graph tags */}
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
        <meta property="og:url" content={`https://www.fleetapp.me/clips/${clip.id}`} />
        <meta property="og:type" content="video.other" />
        {clip.video_url && <meta property="og:video" content={clip.video_url} />}
      </Head>

      <div className="min-h-screen bg-gray-900 text-white relative">
        {/* Enhanced App Redirect Modal for Mobile Devices */}
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

          {/* ANDROID FIX 13: Enhanced action buttons with improved app launch handling */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleAppLaunch}
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