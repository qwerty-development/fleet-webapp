"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Navbar from "@/components/home/Navbar";
import { createClient } from "@/utils/supabase/client";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import AutoClipCard from "@/components/autoclips/AutoClipCard";
import { useSearchParams } from 'next/navigation';

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
  const [likedClips, setLikedClips] = useState<number[]>([]);
  const clipContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const searchParams = useSearchParams();

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

          // Safely parse JSON fields with error handling
          let likedUsers = [];
          let viewedUsers = [];

          try {
            if (clip.liked_users && typeof clip.liked_users === 'string' && clip.liked_users.trim() !== '') {
              likedUsers = JSON.parse(clip.liked_users);
            }
          } catch (e) {
            console.warn(`Error parsing liked_users for clip ${clip.id}:`, e);
          }

          try {
            if (clip.viewed_users && typeof clip.viewed_users === 'string' && clip.viewed_users.trim() !== '') {
              viewedUsers = JSON.parse(clip.viewed_users);
            }
          } catch (e) {
            console.warn(`Error parsing viewed_users for clip ${clip.id}:`, e);
          }

          return {
            ...clip,
            dealership_id: clip.dealership_id,
            dealership_name: dealershipData?.name || "Unknown Dealership",
            dealership_logo: dealershipData?.logo || "/placeholder-logo.png",
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

            // Update view count when a clip becomes visible
            updateViewCount(index);
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
  }, [clips.length]);

  // Update view count for a clip
  const updateViewCount = async (index: number) => {
    const clip = clips[index];
    if (!clip) return;

    try {
      // In a real app, you would check if the user has already viewed the clip
      // For demo purposes, we'll just increment the view count

      // Update in state
      const updatedClips = [...clips];
      updatedClips[index] = {
        ...updatedClips[index],
        views: updatedClips[index].views + 1
      };
      setClips(updatedClips);

      // Update in database (would include user tracking in a real app)
      await supabase
        .from("auto_clips")
        .update({ views: clip.views + 1 })
        .eq("id", clip.id);
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  // Handle like/unlike clip
  const toggleLike = async (clipId: number) => {
    try {
      if (likedClips.includes(clipId)) {
        // Unlike
        setLikedClips(likedClips.filter(id => id !== clipId));

        // Update clip in state to show decreased like count
        setClips(prevClips =>
          prevClips.map(clip =>
            clip.id === clipId ? { ...clip, likes: clip.likes - 1 } : clip
          )
        );

        // Update in database (would include user tracking in a real app)
        await supabase
          .from("auto_clips")
          .update({ likes: clips.find(c => c.id === clipId)!.likes - 1 })
          .eq("id", clipId);
      } else {
        // Like
        setLikedClips([...likedClips, clipId]);

        // Update clip in state to show increased like count
        setClips(prevClips =>
          prevClips.map(clip =>
            clip.id === clipId ? { ...clip, likes: clip.likes + 1 } : clip
          )
        );

        // Update in database (would include user tracking in a real app)
        await supabase
          .from("auto_clips")
          .update({ likes: clips.find(c => c.id === clipId)!.likes + 1 })
          .eq("id", clipId);
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

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

  return (
    <div className="h-screen bg-black flex flex-col">
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
                      onLikeToggle={toggleLike}
                      isLiked={likedClips.includes(clip.id)}
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