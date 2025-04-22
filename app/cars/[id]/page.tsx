"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  CheckBadgeIcon,
  PhoneIcon,
  ShareIcon,
  TruckIcon,
  TagIcon,
  SwatchIcon,
  FlagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import DealershipCarsSection from "@/components/dealerships/DealershipCarsSection";
import FavoriteButton from "@/components/home/FavoriteButton";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";

// Updated Car interface to match your global types
export interface Car {
  id: string; // String instead of number
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  condition: string;
  color?: string;
  drivetrain?: string;
  category?: string;
  type?: string;
  origin?: string;
  source?: string;
  features?: string[];
  description?: string;
  images: string[];
  listed_at: string;
  dealership_id?: number,
  dealership_name?: string;
  dealership_logo?: string;
  dealership_phone?: string;
  dealership_location?: string;
  dealership_latitude?: number;
  dealership_longitude?: number;
  dealerships?: {
    id: number;
    name: string;
    logo: string;
    phone?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  };
  likes?: number;
  views?: number;
}

// Helper: Get the logo URL
export const getLogoUrl = (make: string, isLightMode: boolean) => {
  const formattedMake = make.toLowerCase().replace(/\s+/g, "-");
  switch (formattedMake) {
    case "range-rover":
      return isLightMode
        ? "https://www.carlogos.org/car-logos/land-rover-logo-2020-green.png"
        : "https://www.carlogos.org/car-logos/land-rover-logo.png";
    case "infiniti":
      return "https://www.carlogos.org/car-logos/infiniti-logo.png";
    case "jetour":
      return "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jetour_Logo.png?20230608073743";
    case "audi":
      return "https://www.freepnglogos.com/uploads/audi-logo-2.png";
    case "nissan":
      return "https://cdn.freebiesupply.com/logos/large/2x/nissan-6-logo-png-transparent.png";
    default:
      return `https://www.carlogos.org/car-logos/${formattedMake}-logo.png`;
  }
};

// Helper: Compute relative time from listed_at (simple version)
const getRelativeTime = (dateString: string) => {
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

// A simple SpecItem component for the technical data grid
interface SpecItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

const SpecItem: React.FC<SpecItemProps> = ({ icon, title, value }) => (
  <div className="flex items-center p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
    <div className="mr-2">{icon}</div>
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{title}</span>
      <span className="font-semibold text-white text-sm">{value}</span>
    </div>
  </div>
);

// Loading state component
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
  </div>
);

// Thumbnail component for the image gallery
const ImageThumbnail: React.FC<{
  src: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ src, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer relative mt- rounded-md overflow-hidden transition-all ${
      isActive ? "ring-2 ring-accent" : "opacity-70"
    }`}
  >
    <img
      src={src}
      alt="Car thumbnail"
      className="w-16 h-16 object-cover"
    />
  </div>
);

// App Redirect component for mobile devices
const AppRedirectOverlay = ({
  carId,
  onClose,
  make,
  model,
  year
}: {
  carId: string;
  onClose: () => void;
  make: string;
  model: string;
  year: number;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "unknown">("unknown");

  const deepLink = `fleet://cars/${carId}`;
  const appStoreLink = "https://apps.apple.com/app/6742141291"; // Replace with your app's App Store ID
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.qwertyapp.clerkexpoquickstart";

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

        <h2 className="text-xl font-bold text-white mb-2">Opening in Fleet App</h2>
        <p className="text-gray-300 mb-4">
          {year} {make} {model}
        </p>

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

// Main component for the car details page
export default function CarDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
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

  // Track car view
  const trackCarView = useCallback(async (carId: string) => {
    if (viewTracked.current) return;

    try {
      const userId = isGuest ? `guest_${guestId}` : (user?.id || 'anonymous');

      const { data, error } = await supabase.rpc("track_car_view", {
        car_id: parseInt(carId),
        user_id: userId,
      });

      if (error) {
        console.error("Error tracking car view:", error);
        return;
      }

      if (data !== null && car) {
        // Update car state with new view count
        setCar(prevCar => prevCar ? {...prevCar, views: data} : null);
      }

      viewTracked.current = true;
    } catch (error) {
      console.error("Error in trackCarView:", error);
    }
  }, [isGuest, guestId, user, supabase, car]);

  // Track call button clicks
  const trackCallClick = useCallback(async (carId: string) => {
    try {
      const userId = isGuest ? `guest_${guestId}` : (user?.id || 'anonymous');

      const { data, error } = await supabase.rpc("track_car_call", {
        car_id: parseInt(carId),
        user_id: userId,
      });

      if (error) {
        console.error("Error tracking call click:", error);
        return;
      }

      console.log(`Call count updated: ${data}`);
    } catch (error) {
      console.error("Error tracking call click:", error);
    }
  }, [isGuest, guestId, user, supabase]);

  // Track WhatsApp button clicks
  const trackWhatsAppClick = useCallback(async (carId: string) => {
    try {
      const userId = isGuest ? `guest_${guestId}` : (user?.id || 'anonymous');

      const { data, error } = await supabase.rpc("track_car_whatsapp", {
        car_id: parseInt(carId),
        user_id: userId,
      });

      if (error) {
        console.error("Error tracking WhatsApp click:", error);
        return;
      }

      console.log(`WhatsApp count updated: ${data}`);
    } catch (error) {
      console.error("Error tracking WhatsApp click:", error);
    }
  }, [isGuest, guestId, user, supabase]);

  // Fetch car data
  useEffect(() => {
    const fetchCarData = async () => {
      try {
        setIsLoading(true);

        // Fetch car details
        const { data: carData, error: carError } = await supabase
          .from("cars")
          .select(
            `
            *,
            dealerships (
              id, name, logo, phone, location, latitude, longitude
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (carError) {
          console.error("Error fetching car:", carError);
          throw carError;
        }

        if (!carData) {
          console.error("Car not found");
          router.push("/not-found"); // Redirect to not found page
          return;
        }

        // Process images
        let images = [];
        try {
          if (typeof carData.images === "string") {
            images = JSON.parse(carData.images);
          } else if (Array.isArray(carData.images)) {
            images = carData.images;
          }
        } catch (e) {
          console.error("Error parsing images:", e);
          images = [];
        }

        // Process features
        let features = [];
        try {
          if (typeof carData.features === "string") {
            features = JSON.parse(carData.features);
          } else if (Array.isArray(carData.features)) {
            features = carData.features;
          }
        } catch (e) {
          console.error("Error parsing features:", e);
          features = [];
        }

        // Format the car data
        const formattedCar: Car = {
          ...carData,
          id: String(carData.id), // Ensure id is a string
          images: images,
          features: features,
          // Add dealership info from the joined table
          dealership_id: carData.dealerships?.id,
          dealership_name: carData.dealerships?.name,
          dealership_logo: carData.dealerships?.logo,
          dealership_phone: carData.dealerships?.phone,
          dealership_location: carData.dealerships?.location,
          dealership_latitude: carData.dealerships?.latitude,
          dealership_longitude: carData.dealerships?.longitude,
        };

        setCar(formattedCar);
      } catch (error) {
        console.error("Error in fetchCarData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCarData();
    }
  }, [params.id, router, supabase]);

  // Track car view when the page loads and car data is available
  useEffect(() => {
    if (car && !viewTracked.current) {
      trackCarView(car.id);
    }
  }, [car, trackCarView]);

  // Navigation controls for the carousel
  const navigateCarousel = (direction: "prev" | "next") => {
    if (!car || !car.images || car.images.length <= 1) return;

    let newIndex;
    if (direction === "prev") {
      newIndex =
        activeImageIndex === 0 ? car.images.length - 1 : activeImageIndex - 1;
    } else {
      newIndex =
        activeImageIndex === car.images.length - 1 ? 0 : activeImageIndex + 1;
    }

    setActiveImageIndex(newIndex);

    // Scroll to the new image
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: newIndex * carouselRef.current.clientWidth,
        behavior: "smooth",
      });
    }

    // Ensure the active thumbnail is visible
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[newIndex] as HTMLElement;
      if (thumbnail) {
        thumbnailsRef.current.scrollTo({
          left: thumbnail.offsetLeft - thumbnailsRef.current.clientWidth / 2 + thumbnail.clientWidth / 2,
          behavior: "smooth",
        });
      }
    }
  };

  // Set the active image directly by clicking a thumbnail
  const setActiveImage = (index: number) => {
    setActiveImageIndex(index);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  // Handle carousel scroll
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const scrollPosition = carouselRef.current.scrollLeft;
      const itemWidth = carouselRef.current.clientWidth;
      const index = Math.round(scrollPosition / itemWidth);

      if (index !== activeImageIndex) {
        setActiveImageIndex(index);

        // Also scroll the thumbnail into view
        if (thumbnailsRef.current) {
          const thumbnail = thumbnailsRef.current.children[index] as HTMLElement;
          if (thumbnail) {
            thumbnailsRef.current.scrollTo({
              left: thumbnail.offsetLeft - thumbnailsRef.current.clientWidth / 2 + thumbnail.clientWidth / 2,
              behavior: "smooth",
            });
          }
        }
      }
    }
  };

  // Handler for likes update
  const handleLikesUpdate = (newLikes: number) => {
    if (car) {
      setCar(prev => prev ? ({ ...prev, likes: newLikes }) : null);
    }
  };

  // Action handlers
  const handleCall = () => {
    if (!car) return;

    // Track the call click
    trackCallClick(car.id);

    const phone = car.dealerships?.phone || car.dealership_phone;
    if (phone) {
      window.open(`tel:${phone}`);
    }
  };

  const handleShare = async () => {
    if (!car) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${car.year} ${car.make} ${car.model}`,
          text: `Check out this ${car.year} ${car.make} ${
            car.model
          } for $${car.price.toLocaleString()}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      // Create a temporary input to copy URL
      const input = document.createElement('input');
      input.value = `Check out this ${car.year} ${car.make} ${
        car.model
      } for $${car.price.toLocaleString()}! ${window.location.href}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert("Link copied to clipboard!");
    }
  };

  const handleWhatsApp = () => {
    if (!car) return;

    // Track the WhatsApp click
    trackWhatsAppClick(car.id);

    const phone = car.dealerships?.phone || car.dealership_phone;
    if (phone) {
      const message = `Hi, I'm interested in the ${car.year} ${car.make} ${
        car.model
      } listed for $${car.price.toLocaleString()}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  // Show loading state if data is not yet available
  if (isLoading || !car) {
    return <LoadingState />;
  }

  // Get dealership info, checking both possible structures
  const dealershipName =
    car.dealerships?.name || car.dealership_name || "Unknown Dealership";
  const dealershipLogo =
    car.dealerships?.logo || car.dealership_logo || getLogoUrl(car.make, true);
  const dealershipLocation =
    car.dealerships?.location ||
    car.dealership_location ||
    "Location not available";
  const dealershipLatitude =
    car.dealerships?.latitude || car.dealership_latitude;
  const dealershipLongitude =
    car.dealerships?.longitude || car.dealership_longitude;
  const dealershipPhone = car.dealerships?.phone || car.dealership_phone;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* App Redirect Modal for Mobile Devices */}
      {showAppRedirect && car && (
        <AppRedirectOverlay
          carId={car.id}
          onClose={handleCloseRedirect}
          make={car.make}
          model={car.model}
          year={car.year}
        />
      )}

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
      >
        ← Back
      </button>

      {/* Improved Image Carousel - Only render if images exist */}
      {car.images && car.images.length > 0 ? (
        <div className="relative bg-black">
          {/* Main large image carousel */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-64 sm:h-80 md:h-96 lg:h-[500px]"
            style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
          >
            {car.images.map((img, index) => (
              <div
                key={index}
                className="w-screen flex-shrink-0 h-full snap-center relative"
              >
                <img
                  src={img}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </div>

          {/* Thumbnail gallery at the bottom */}
          {car.images.length > 1 && (
            <div
              ref={thumbnailsRef}
              className="flex gap-2 overflow-x-auto py-2 px-4 bg-gray-900 scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {car.images.map((img, index) => (
                <ImageThumbnail
                  key={index}
                  src={img}
                  isActive={index === activeImageIndex}
                  onClick={() => setActiveImage(index)}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {car.images.length > 1 && (
            <>
              <button
                onClick={() => navigateCarousel("prev")}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => navigateCarousel("next")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Favorite Button - Top Right */}
          <div className="absolute top-4 right-16 z-10">
            <FavoriteButton
              carId={Number(car.id)}
              initialLikes={car.likes || 0}
              onLikesUpdate={handleLikesUpdate}
              size="lg"
            />
          </div>

          {/* View Count Badge */}
          <div className="absolute top-4 left-16 bg-black/70 px-3 py-1 rounded-full text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {car.views || 0}
          </div>

          {/* Image counter */}
          <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full text-sm">
            {activeImageIndex + 1} / {car.images.length}
          </div>
        </div>
      ) : (
        <div className="relative h-64 md:h-96 bg-gray-800 flex items-center justify-center">
          <p className="text-gray-400">No images available</p>
        </div>
      )}

      {/* Price Badge - Positioned to overlap the image and content */}
      <div className="relative z-10 flex px-4 -top-24">
        <div className="bg-accent px-6 py-1 rounded-full shadow-lg inline-block mx-auto">
          <span className="text-white text-xl font-bold">
            ${car.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Car Information Section */}
      <div className="p-4 space-y-6">
        {/* Main Info - Always left-aligned on mobile */}
        <div className="flex items-start space-x-4 mt-4 md:mt-0">
          <div className=" h-14 md:w-16 md:h-16 flex-shrink-0">
            <img
              src={getLogoUrl(car.make, true)}
              alt={car.make}
              className=" h-10  rounded-full"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold">
              {car.make} {car.model}
            </h1>
            <p className="text-lg">{car.year}</p>
            <p className="text-sm text-gray-400">
              Posted {getRelativeTime(car.listed_at)}
            </p>
          </div>
        </div>

        {/* Technical Data Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <SpecItem
            icon={<CalendarIcon className="h-5 w-5 text-accent" />}
            title="Year"
            value={car.year}
          />
          <SpecItem
            icon={<ClockIcon className="h-5 w-5 text-accent" />}
            title="Mileage"
            value={
              car.mileage > 0 ? `${(car.mileage / 1000).toFixed(1)}k km` : "New"
            }
          />
          <SpecItem
            icon={<Cog6ToothIcon className="h-5 w-5 text-accent" />}
            title="Transmission"
            value={car.transmission || "N/A"}
          />
          {car.drivetrain && (
            <SpecItem
              icon={<TruckIcon className="h-5 w-5 text-accent" />}
              title="Drivetrain"
              value={car.drivetrain}
            />
          )}
          <SpecItem
            icon={<CheckBadgeIcon className="h-5 w-5 text-accent" />}
            title="Condition"
            value={car.condition || "N/A"}
          />
          {car.type && (
            <SpecItem
              icon={<TagIcon className="h-5 w-5 text-accent" />}
              title="Type"
              value={car.type}
            />
          )}
          {car.color && (
            <SpecItem
              icon={<SwatchIcon className="h-5 w-5 text-accent" />}
              title="Color"
              value={car.color}
            />
          )}
          {car.source && (
            <SpecItem
              icon={<FlagIcon className="h-5 w-5 text-accent" />}
              title="Source"
              value={car.source}
            />
          )}
        </div>

        {/* Description */}
        {car.description && (
          <div>
            <h2 className="text-xl font-bold">Description</h2>
            <p className="mt-2 text-gray-300">{car.description}</p>
          </div>
        )}

        {/* Features */}
        {car.features && car.features.length > 0 && (
          <div>
            <h2 className="text-xl font-bold">Features</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {car.features.map((feature, index) => (
                <span
                  key={index}
                  className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dealership Section with Contact Buttons */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Dealership</h2>
          <div className="flex items-center justify-between">
            {/* Dealership Info */}
            <div className="flex items-center">
              <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                <img
                  src={dealershipLogo}
                  alt={dealershipName}
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold">{dealershipName}</h3>
                <p className="text-sm text-gray-400">{dealershipLocation}</p>
              </div>
            </div>

            {/* Contact Buttons - Icons only */}
            {dealershipPhone && (
              <div className="flex space-x-3">
                <button
                  onClick={handleCall}
                  className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
                  aria-label="Call"
                >
                  <PhoneIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="p-3 bg-green-600 rounded-full hover:bg-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg
                    viewBox="0 0 32 32"
                    className="h-5 w-5 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M16.004 0h-.008c-8.837 0-16 7.163-16 16 0 3.497 1.126 6.741 3.038 9.377L1.01 31l5.724-1.846c2.532 1.682 5.549 2.66 8.784 2.66h.008c8.837 0 16-7.163 16-16s-7.163-16-16-16zm0 29.156h-.007c-2.699 0-5.347-.724-7.663-2.091l-.53-.324-5.477 1.766 1.797-5.368-.345-.546c-1.487-2.365-2.272-5.096-2.272-7.93C1.507 8.386 7.893 2 16.004 2c3.934 0 7.621 1.528 10.403 4.31s4.31 6.47 4.31 10.4-1.528 7.621-4.31 10.403c-2.782 2.783-6.469 4.043-10.403 4.043zm5.737-7.346l-.332-.186c-.538-.301-3.184-1.576-3.682-1.754-.498-.179-.86-.268-1.223.269-.361.537-1.403 1.754-1.718 2.114-.316.36-.632.404-1.17.134-.539-.268-2.273-.837-4.326-2.667-1.599-1.425-2.677-3.183-2.993-3.72-.317-.537-.034-.827.238-1.095.244-.243.539-.634.807-.951.27-.317.359-.537.539-.896.179-.36.09-.673-.045-.95-.135-.274-1.218-2.94-1.67-4.028-.44-1.058-.887-.914-1.22-.93-.312-.015-.673-.018-1.035-.018s-.944.134-1.442.672c-.497.537-1.903 1.859-1.903 4.533s1.947 5.258 2.218 5.618c.269.36 3.8 5.801 9.21 8.136 1.286.556 2.29.889 3.074 1.139 1.292.4 2.47.344 3.398.209.75-.101 2.92-1.139 3.33-2.24.41-1.097.41-2.042.286-2.24-.121-.197-.482-.315-1.022-.583z" />
                  </svg>
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  aria-label="Share"
                >
                  <ShareIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          {dealershipLatitude && dealershipLongitude && (
            <div className="mt-4">
              <iframe
                width="100%"
                height="250"
                frameBorder="0"
                className="rounded-lg"
                src={`https://www.google.com/maps?q=${dealershipLatitude},${dealershipLongitude}&hl=es;z=14&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>

        {/* More Cars from this Dealership Section */}
        <DealershipCarsSection dealershipID={car.dealership_id} currentCarId={params.id} />
      </div>

      {/* Padding at the bottom for spacing */}
      <div className="h-8"></div>

      {/* Mobile app banner for non-mobile devices (optional) */}
      {!isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between z-50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <img src="/logo.png" alt="Fleet App" className="w-6 h-6" />
            </div>
            <div className="ml-3">
              <h3 className="text-white font-medium">Fleet App</h3>
              <p className="text-gray-300 text-xs">Get a better experience on our mobile app</p>
            </div>
          </div>
          <a
            href="https://fleetapp.me"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Get the App
          </a>
        </div>
      )}

      {/* Hide scrollbar */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
}