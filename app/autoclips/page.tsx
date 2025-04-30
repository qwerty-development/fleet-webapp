"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Navbar from "@/components/home/Navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import AutoClipCard from "@/components/autoclips/AutoClipCard";
import { useSearchParams, useRouter } from 'next/navigation';

interface AutoClip {
  id: number;
  dealership_id: number;
  car_id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  status: string;
  created_at: string;
  published_at: string;
  liked_users?: string[];
  viewed_users?: string[];
  dealership_name?: string;
  dealership_logo?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  car_price?: number;
}

// Loading fallback component
const AutoClipsLoadingFallback = () => (
  <div className="h-screen bg-black flex flex-col">
    <Navbar />
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  </div>
);

// Inner component that uses useSearchParams
const AutoClipsContent = () => {
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const clipContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const viewedClips = useRef<Set<number>>(new Set());
  const searchParams = useSearchParams();

  // Auth integration
  const { user, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();

  const supabase = createClient();

  // Fetch auto clips data
  const fetchClips = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: clipsData, error: clipsError } = await supabase
        .from("auto_clips")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (clipsError) throw clipsError;

      if (clipsData) {
        // Fetch additional data for each clip (dealership and car info)
        const enrichedClips = await Promise.all(clipsData.map(async (clip) => {
          // Get dealership info
          const { data: dealershipData } = await supabase
            .from("dealerships")
            .select("name, logo")
            .eq("id", clip.dealership_id)
            .single();

          // Get car info
          const { data: carData } = await supabase
            .from("cars")
            .select("make, model, year, price")
            .eq("id", clip.car_id)
            .single();

          // Safely parse liked_users and viewed_users arrays
          let likedUsers: string[] = [];
          let viewedUsers: string[] = [];

          try {
            if (Array.isArray(clip.liked_users)) {
              likedUsers = clip.liked_users;
            } else if (typeof clip.liked_users === 'string' && clip.liked_users.trim() !== '') {
              likedUsers = JSON.parse(clip.liked_users);
            }
          } catch (e) {
            console.warn(`Error parsing liked_users for clip ${clip.id}:`, e);
          }

          try {
            if (Array.isArray(clip.viewed_users)) {
              viewedUsers = clip.viewed_users;
            } else if (typeof clip.viewed_users === 'string' && clip.viewed_users.trim() !== '') {
              viewedUsers = JSON.parse(clip.viewed_users);
            }
          } catch (e) {
            console.warn(`Error parsing viewed_users for clip ${clip.id}:`, e);
          }

          return {
            ...clip,
            dealership_name: dealershipData?.name || "Unknown Dealership",
            dealership_logo: dealershipData?.logo,
            car_make: carData?.make || "Unknown",
            car_model: carData?.model || "Model",
            car_year: carData?.year || null,
            car_price: carData?.price || null,
            liked_users: likedUsers,
            viewed_users: viewedUsers,
          };
        }));

        setClips(enrichedClips);

        // Check if there's a specific clip ID in the URL
        const clipId = searchParams.get('clip');
        if (clipId) {
          const clipIndex = enrichedClips.findIndex(clip => clip.id.toString() === clipId);
          if (clipIndex !== -1) {
            setCurrentClipIndex(clipIndex);

            // Need to wait for the DOM to update before scrolling
            setTimeout(() => {
              if (clipContainerRefs.current[clipIndex]) {
                clipContainerRefs.current[clipIndex]?.scrollIntoView({
                  behavior: 'auto',
                  block: 'center'
                });
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching clips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, searchParams]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  // Track view count for a clip using RPC
  const trackClipView = useCallback(async (clipId: number) => {
    // Skip if clip has already been viewed in this session
    if (viewedClips.current.has(clipId)) return;

    // Get appropriate user ID
    const userId = isGuest
      ? `guest_${guestId}`
      : (user?.id || null);

    // Skip if no user ID is available
    if (!userId) return;

    try {
      // Call the RPC function
      const { error } = await supabase.rpc('track_autoclip_view', {
        clip_id: clipId,
        user_id: userId
      });

      if (error) throw error;

      // Mark clip as viewed in this session
      viewedClips.current.add(clipId);

      // Update the view count in the state
      setClips(prev =>
        prev.map(clip =>
          clip.id === clipId
            ? { ...clip, views: (clip.views || 0) + 1 }
            : clip
        )
      );
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [isGuest, guestId, user, supabase]);

  // Set up Intersection Observer to detect which clip is in view
  useEffect(() => {
    // Initialize an array of refs for each clip
    clipContainerRefs.current = clipContainerRefs.current.slice(0, clips.length);

    // Set up intersection observer
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentClipIndex(index);

            // Track view when clip becomes visible
            const clipId = clips[index]?.id;
            if (clipId) {
              trackClipView(clipId);
            }
          }
        });
      },
      { threshold: 0.6 } // Clip is considered in view when 60% visible
    );

    // Start observing all clip containers
    clipContainerRefs.current.forEach((ref, index) => {
      if (ref && observer.current) {
        observer.current.observe(ref);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [clips.length, trackClipView]);



  // State for auth modal
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  // Handle like/unlike clip using RPC
  const toggleLike = useCallback(async (clipId: number) => {
    // Check if user is signed in (not a guest)
    if (isGuest || !isSignedIn) {
      // Show auth modal instead of liking
      setIsAuthModalVisible(true);
      return;
    }

    // Get user ID for authenticated user
    const userId = user?.id;

    // Skip if no user ID is available
    if (!userId) return;

    try {
      // Call the RPC function that handles the toggle
      const { data: newLikesCount, error } = await supabase.rpc(
        'toggle_autoclip_like',
        {
          clip_id: clipId,
          user_id: userId
        }
      );

      if (error) throw error;

      // Update the clip in state with new likes count and liked_users
      setClips(prev =>
        prev.map(clip => {
          if (clip.id === clipId) {
            const isCurrentlyLiked = clip.liked_users?.includes(userId);
            const updatedLikedUsers = isCurrentlyLiked
              ? (clip.liked_users || []).filter(id => id !== userId)
              : [...(clip.liked_users || []), userId];

            return {
              ...clip,
              likes: newLikesCount as number,
              liked_users: updatedLikedUsers
            };
          }
          return clip;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [isGuest, isSignedIn, user, supabase]);

  // Check if a clip is liked by the current user
  const isClipLiked = useCallback((clip: AutoClip) => {
    // Guests can't like clips, so always return false for guests
    if (isGuest || !isSignedIn) return false;

    const userId = user?.id;

    if (!userId || !clip.liked_users) return false;
    return clip.liked_users.includes(userId);
  }, [isGuest, isSignedIn, user]);

  // Navigate to previous clip
  const goToPrevClip = () => {
    if (currentClipIndex > 0) {
      setCurrentClipIndex(currentClipIndex - 1);
      clipContainerRefs.current[currentClipIndex - 1]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Navigate to next clip
  const goToNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex(currentClipIndex + 1);
      clipContainerRefs.current[currentClipIndex + 1]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Get the navbar height to adjust clip height
  const [navbarHeight, setNavbarHeight] = useState(64); // Default navbar height

  useEffect(() => {
    // Function to get actual navbar height
    const getNavbarHeight = () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    // Get height after component mounts
    getNavbarHeight();

    // Update on window resize
    window.addEventListener('resize', getNavbarHeight);
    return () => window.removeEventListener('resize', getNavbarHeight);
  }, []);

  // Navigation for sign in functionality
  const router = useRouter();
  const handleSignIn = useCallback(() => {
    // Close the modal
    setIsAuthModalVisible(false);

    // Navigate to sign in page
    router.push('/auth/signin');
  }, [router]);

  // Handler for closing the modal
  const handleCloseModal = () => {
    setIsAuthModalVisible(false);
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-neutral-900 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Adjusted to take full height minus navbar */}
      <div className="flex-1 flex flex-col items-center" style={{ height: `calc(100vh - ${navbarHeight}px)` }}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : clips.length > 0 ? (
          <>
            {/* Responsive Clips Container - Full height */}
            <div className="w-full h-full relative mx-auto md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
              {/* Individual Clips */}
              <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
                {clips.map((clip, index) => (
                  <div
                    key={clip.id}
                    ref={(el) => { clipContainerRefs.current[index] = el; }}
                    data-index={index}
                    className="w-full h-full snap-start snap-always flex items-center justify-center overflow-hidden bg-black"
                  >
                    <AutoClipCard
                      clip={clip}
                      isActive={index === currentClipIndex}
                      isFullscreen={true}
                      onLikeToggle={() => toggleLike(clip.id)}
                      isLiked={isClipLiked(clip)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 bg-gray-900 rounded-lg max-w-md">
              <h3 className="text-white text-xl font-bold mb-2">No clips found</h3>
              <p className="text-gray-400 mb-4">
                There are no auto clips available at the moment. Check back later!
              </p>
            </div>
          </div>
        )}

        {/* Authentication Required Modal */}
        {isAuthModalVisible && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 m-4 max-w-sm w-full shadow-2xl animate-fade-in">
              <div className="flex flex-col items-center text-center">
                {/* Lock Icon */}
                <div className="bg-accent/10 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
                <p className="text-gray-400 mb-6">
                  Please sign in to like autoclips and track your favorites.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleSignIn}
                    className="flex-1 bg-accent hover:bg-accent-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden scrollbar styles */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        /* Ensure body and html take full height */
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* Animation for modal fade-in */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Main component that wraps the content with Suspense
export default function AutoClipsPage() {
  return (
    <Suspense fallback={<AutoClipsLoadingFallback />}>
      <AutoClipsContent />
    </Suspense>
  );
}