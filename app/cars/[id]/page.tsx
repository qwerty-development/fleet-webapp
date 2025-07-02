"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { detectPlatform, attemptAndroidAppLaunch, getDeepLink, DEEP_LINK_CONFIG } from "@/utils/androidDeepLinkUtils"
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
import DealershipCarsSection from "@/components/dealerships/DealershipCarsSection";
import FavoriteButton from "@/components/home/FavoriteButton";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdBluetooth,
  MdMap,
  MdCamera,
  MdApps,
  MdAndroid,
  MdSpeaker,
  MdSettingsRemote,
  MdKey,
  MdPower,
  MdTurnSlightRight,
  MdVisibilityOff,
  MdLocalParking,
  MdSpeed,
  MdAirlineSeatReclineExtra,
  MdAirlineSeatReclineNormal,
  MdPerson,
  MdWbSunny,
  MdDirectionsCar,
  MdSettings,
  MdWindow,
  MdInfo,
  MdLightbulb,
  MdTireRepair,
  MdFlipToFront,
  MdSensors,
  MdRoofing,
  MdOpacity,
  MdChair,
  MdLightMode,
  MdStorage,
  MdShoppingBag,
  MdEngineering,
  MdElectricCar,
  MdModeStandby,
  MdTune,
} from "react-icons/md";
import Navbar from "@/components/home/Navbar";
import MobileAppBanner from "@/components/MobileBanner";

// [Previous VEHICLE_FEATURES and other constants remain the same...]
const VEHICLE_FEATURES = {
  tech: [
    {
      id: "bluetooth",
      label: "Bluetooth",
      icon: <MdBluetooth className="w-4 h-4 mr-1" />,
    },
    {
      id: "navigation",
      label: "Navigation System",
      icon: <MdMap className="w-4 h-4 mr-1" />,
    },
    {
      id: "backup_camera",
      label: "Backup Camera",
      icon: <MdCamera className="w-4 h-4 mr-1" />,
    },
    {
      id: "apple_carplay",
      label: "Apple CarPlay",
      icon: <MdApps className="w-4 h-4 mr-1" />,
    },
    {
      id: "android_auto",
      label: "Android Auto",
      icon: <MdAndroid className="w-4 h-4 mr-1" />,
    },
    {
      id: "premium_audio",
      label: "Premium Audio",
      icon: <MdSpeaker className="w-4 h-4 mr-1" />,
    },
    {
      id: "remote_start",
      label: "Remote Start",
      icon: <MdSettingsRemote className="w-4 h-4 mr-1" />,
    },
    {
      id: "keyless_entry",
      label: "Keyless Entry",
      icon: <MdKey className="w-4 h-4 mr-1" />,
    },
    {
      id: "keyless_start",
      label: "Keyless Start",
      icon: <MdPower className="w-4 h-4 mr-1" />,
    },
  ],
  safety: [
    {
      id: "lane_assist",
      label: "Lane Departure Warning",
      icon: <MdTurnSlightRight className="w-4 h-4 mr-1" />,
    },
    {
      id: "blind_spot",
      label: "Blind Spot Monitoring",
      icon: <MdVisibilityOff className="w-4 h-4 mr-1" />,
    },
    {
      id: "parking_sensors",
      label: "Parking Sensors",
      icon: <MdLocalParking className="w-4 h-4 mr-1" />,
    },
    {
      id: "backup_camera",
      label: "Backup Camera",
      icon: <MdCamera className="w-4 h-4 mr-1" />,
    },
    {
      id: "cruise_control",
      label: "Cruise Control",
      icon: <MdSpeed className="w-4 h-4 mr-1" />,
    },
  ],
  comfort: [
    {
      id: "heated_seats",
      label: "Heated Seats",
      icon: <MdAirlineSeatReclineExtra className="w-4 h-4 mr-1" />,
    },
    {
      id: "leather_seats",
      label: "Leather Seats",
      icon: <MdAirlineSeatReclineNormal className="w-4 h-4 mr-1" />,
    },
    {
      id: "third_row_seats",
      label: "Third Row Seats",
      icon: <MdPerson className="w-4 h-4 mr-1" />,
    },
    {
      id: "sunroof",
      label: "Sunroof",
      icon: <MdWbSunny className="w-4 h-4 mr-1" />,
    },
    {
      id: "power_mirrors",
      label: "Power Mirrors",
      icon: <MdDirectionsCar className="w-4 h-4 mr-1" />,
    },
    {
      id: "power_steering",
      label: "Power Steering",
      icon: <MdSettings className="w-4 h-4 mr-1" />,
    },
    {
      id: "power_windows",
      label: "Power Windows",
      icon: <MdWindow className="w-4 h-4 mr-1" />,
    },
  ],
  exterior: [
    {
      id: "light",
      label: "Lights",
      icon: <MdLightbulb className="w-4 h-4 mr-1" />,
    },
    {
      id: "wheel",
      label: "Wheels",
      icon: <MdTireRepair className="w-4 h-4 mr-1" />,
    },
    {
      id: "mirror",
      label: "Mirrors",
      icon: <MdFlipToFront className="w-4 h-4 mr-1" />,
    },
    {
      id: "sensor",
      label: "Sensors",
      icon: <MdSensors className="w-4 h-4 mr-1" />,
    },
    {
      id: "camera",
      label: "Camera",
      icon: <MdCamera className="w-4 h-4 mr-1" />,
    },
    {
      id: "exterior",
      label: "Exterior",
      icon: <MdDirectionsCar className="w-4 h-4 mr-1" />,
    },
    { id: "roof", label: "Roof", icon: <MdRoofing className="w-4 h-4 mr-1" /> },
    { id: "tint", label: "Tint", icon: <MdOpacity className="w-4 h-4 mr-1" /> },
  ],
  interior: [
    {
      id: "interior",
      label: "Interior",
      icon: <MdChair className="w-4 h-4 mr-1" />,
    },
    {
      id: "cabin",
      label: "Cabin",
      icon: <MdDirectionsCar className="w-4 h-4 mr-1" />,
    },
    {
      id: "storage",
      label: "Storage",
      icon: <MdStorage className="w-4 h-4 mr-1" />,
    },
    {
      id: "cargo",
      label: "Cargo",
      icon: <MdShoppingBag className="w-4 h-4 mr-1" />,
    },
    {
      id: "trunk",
      label: "Trunk",
      icon: <MdShoppingBag className="w-4 h-4 mr-1" />,
    },
    {
      id: "ambient",
      label: "Ambient",
      icon: <MdLightMode className="w-4 h-4 mr-1" />,
    },
    {
      id: "lighting",
      label: "Lighting",
      icon: <MdLightbulb className="w-4 h-4 mr-1" />,
    },
  ],
  performance: [
    {
      id: "engine",
      label: "Engine",
      icon: <MdEngineering className="w-4 h-4 mr-1" />,
    },
    {
      id: "power",
      label: "Power",
      icon: <MdElectricCar className="w-4 h-4 mr-1" />,
    },
    {
      id: "drive",
      label: "Drive",
      icon: <MdDirectionsCar className="w-4 h-4 mr-1" />,
    },
    {
      id: "sport",
      label: "Sport",
      icon: <MdSpeed className="w-4 h-4 mr-1" />,
    },
    {
      id: "eco",
      label: "Eco",
      icon: <MdElectricCar className="w-4 h-4 mr-1" />,
    },
    {
      id: "mode",
      label: "Mode",
      icon: <MdModeStandby className="w-4 h-4 mr-1" />,
    },
    {
      id: "transmission",
      label: "Transmission",
      icon: <MdSettings className="w-4 h-4 mr-1" />,
    },
    {
      id: "suspension",
      label: "Suspension",
      icon: <MdTune className="w-4 h-4 mr-1" />,
    },
  ],
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// [Previous helper functions remain the same...]
const getFeatureIcon = (feature: string) => {
  const normalizedFeature = feature.toLowerCase().replace(/\s+/g, "_");

  for (const category in VEHICLE_FEATURES) {
    const found = VEHICLE_FEATURES[
      category as keyof typeof VEHICLE_FEATURES
    ].find(
      (item) =>
        item.id === normalizedFeature ||
        item.label.toLowerCase() === feature.toLowerCase()
    );
    if (found) return found.icon;
  }

  return <MdInfo className="w-4 h-4 mr-1" />;
};

export interface Car {
  id: string;
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
  dealership_id?: number;
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

interface SpecItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

const SpecItem: React.FC<SpecItemProps> = ({ icon, title, value }) => (
  <div className="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
    <div className="mr-2">{icon}</div>
    <div className="flex flex-col">
      <span className="text-gray-500">{title}</span>
      <span className="font-semibold text-gray-900 text-sm">{value}</span>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
  </div>
);

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
    <img src={src} alt="Car thumbnail" className="w-16 h-16 object-cover" />
  </div>
);

// Simplified App Redirect Overlay for Android
const AppRedirectOverlay = ({
  carId,
  onClose,
  make,
  model,
  year,
}: {
  carId: string;
  onClose: () => void;
  make: string;
  model: string;
  year: number;
}) => {
  const [countdown, setCountdown] = useState(3);
  const [redirectStatus, setRedirectStatus] = useState<"waiting" | "attempting" | "failed">("waiting");
  const attemptedRef = useRef(false);
  const { platform, isMobile } = detectPlatform();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!attemptedRef.current) {
      attemptedRef.current = true;
      handleAppLaunch();
    }
  }, [countdown]);

  const handleAppLaunch = async () => {
    setRedirectStatus("attempting");
    const deepLink = getDeepLink('car', carId);
    
    if (platform === 'android') {
      const success = await attemptAndroidAppLaunch(deepLink);
      setRedirectStatus(success ? "attempting" : "failed");
    } else if (platform === 'ios') {
      // iOS handling
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => {
        document.body.removeChild(iframe);
        setRedirectStatus("failed");
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl max-w-md w-full p-6 text-center relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-xl"
        >
          ×
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <img src="/logo-dark.png" alt="Fleet App" className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Opening in Fleet App
        </h2>
        <p className="text-gray-600 mb-4">
          {year} {make} {model}
        </p>

        <div className="mb-6">
          {redirectStatus === "waiting" && countdown > 0 && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500">Redirecting in {countdown}...</p>
            </>
          )}
          
          {redirectStatus === "attempting" && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500">Opening Fleet App...</p>
            </>
          )}
          
          {redirectStatus === "failed" && (
            <p className="text-gray-500">
              App not installed? Download Fleet to view this car.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={getDeepLink('car', carId)}
            className="block w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium"
          >
            Open in Fleet App
          </a>

          <a
            href={platform === 'android' ? DEEP_LINK_CONFIG.playStoreUrl : DEEP_LINK_CONFIG.appStoreUrl}
            className="block w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
          >
            Download Fleet App
          </a>

          <button
            onClick={onClose}
            className="block w-full py-3 bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg font-medium"
          >
            Continue to Website
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component
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

  const handleCloseRedirect = () => {
    setShowAppRedirect(false);
    // Set cookie to remember preference for 7 days
    document.cookie = "preferWeb=true; max-age=604800; path=/";
  };

  // [Rest of the component remains the same...]
  const trackCarView = useCallback(
    async (carId: string) => {
      if (viewTracked.current) return;

      try {
        const userId = isGuest ? `guest_${guestId}` : user?.id || "anonymous";

        const { data, error } = await supabase.rpc("track_car_view", {
          car_id: parseInt(carId),
          user_id: userId,
        });

        if (error) {
          console.error("Error tracking car view:", error);
          return;
        }

        if (data !== null && car) {
          setCar((prevCar) => (prevCar ? { ...prevCar, views: data } : null));
        }

        viewTracked.current = true;
      } catch (error) {
        console.error("Error in trackCarView:", error);
      }
    },
    [isGuest, guestId, user, supabase, car]
  );

  const trackCallClick = useCallback(
    async (carId: string) => {
      try {
        const userId = isGuest ? `guest_${guestId}` : user?.id || "anonymous";

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
    },
    [isGuest, guestId, user, supabase]
  );

  const trackWhatsAppClick = useCallback(
    async (carId: string) => {
      try {
        const userId = isGuest ? `guest_${guestId}` : user?.id || "anonymous";

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
    },
    [isGuest, guestId, user, supabase]
  );

  useEffect(() => {
    const fetchCarData = async () => {
      try {
        setIsLoading(true);

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
          router.push("/not-found");
          return;
        }

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

        const formattedCar: Car = {
          ...carData,
          id: String(carData.id),
          images: images,
          features: features,
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

  useEffect(() => {
    if (car && !viewTracked.current) {
      trackCarView(car.id);
    }
  }, [car, trackCarView]);

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

    if (carouselRef.current) {
      const scrollTarget = newIndex * carouselRef.current.clientWidth;

      try {
        carouselRef.current.scrollTo({
          left: scrollTarget,
          behavior: "smooth",
        });
      } catch (error) {
        carouselRef.current.scrollLeft = scrollTarget;
      }
    }

    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[newIndex] as HTMLElement;
      if (thumbnail) {
        try {
          thumbnailsRef.current.scrollTo({
            left:
              thumbnail.offsetLeft -
              thumbnailsRef.current.clientWidth / 2 +
              thumbnail.clientWidth / 2,
            behavior: "smooth",
          });
        } catch (error) {
          thumbnailsRef.current.scrollLeft = thumbnail.offsetLeft;
        }
      }
    }
  };

  const setActiveImage = (index: number) => {
    setActiveImageIndex(index);
    if (carouselRef.current) {
      const scrollTarget = index * carouselRef.current.clientWidth;

      try {
        carouselRef.current.scrollTo({
          left: scrollTarget,
          behavior: "smooth",
        });
      } catch (error) {
        carouselRef.current.scrollLeft = scrollTarget;
      }
    }
  };

  const handleCarouselScroll = useCallback(() => {
    if (carouselRef.current) {
      requestAnimationFrame(() => {
        if (carouselRef.current) {
          const scrollPosition = carouselRef.current.scrollLeft;
          const itemWidth = carouselRef.current.clientWidth;

          const index = Math.round(scrollPosition / itemWidth);

          const clampedIndex = Math.max(
            0,
            Math.min(index, (car?.images?.length || 1) - 1)
          );

          if (clampedIndex !== activeImageIndex) {
            setActiveImageIndex(clampedIndex);

            if (thumbnailsRef.current) {
              const thumbnail = thumbnailsRef.current.children[
                clampedIndex
              ] as HTMLElement;
              if (thumbnail) {
                try {
                  thumbnailsRef.current.scrollTo({
                    left:
                      thumbnail.offsetLeft -
                      thumbnailsRef.current.clientWidth / 2 +
                      thumbnail.clientWidth / 2,
                    behavior: "smooth",
                  });
                } catch (error) {
                  thumbnailsRef.current.scrollLeft = thumbnail.offsetLeft;
                }
              }
            }
          }
        }
      });
    }
  }, [activeImageIndex, car?.images?.length]);

  const handleLikesUpdate = (newLikes: number) => {
    if (car) {
      setCar((prev) => (prev ? { ...prev, likes: newLikes } : null));
    }
  };

  const handleCall = () => {
    if (!car) return;

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
      const input = document.createElement("input");
      input.value = `Check out this ${car.year} ${car.make} ${
        car.model
      } for $${car.price.toLocaleString()}! ${window.location.href}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("Link copied to clipboard!");
    }
  };

  const handleWhatsApp = () => {
    if (!car) return;

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

  if (isLoading || !car) {
    return <LoadingState />;
  }

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

  const googleMapsUrl =
    dealershipLatitude && dealershipLongitude
      ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${dealershipLatitude},${dealershipLongitude}`
      : `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
          dealershipLocation || dealershipName
        )}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      <Head>
        <title>
          {car.year} {car.make} {car.model} | Fleet
        </title>
        <meta
          name="description"
          content={`${car.year} ${car.make} ${car.model} for $${car.price.toLocaleString()} at ${dealershipName}`}
        />

        {/* Android App Links */}
        <link rel="alternate" href={`android-app://com.qwertyapp.clerkexpoquickstart/fleet/cars/${car.id}`} />
        
        {/* Universal Links for iOS */}
        <meta property="al:ios:url" content={getDeepLink('car', car.id)} />
        <meta property="al:ios:app_store_id" content="6742141291" />
        <meta property="al:ios:app_name" content="Fleet" />
        
        {/* App Links for Android */}
        <meta property="al:android:url" content={getDeepLink('car', car.id)} />
        <meta property="al:android:package" content="com.qwertyapp.clerkexpoquickstart" />
        <meta property="al:android:app_name" content="Fleet" />
        
        <meta property="og:title" content={`${car.year} ${car.make} ${car.model} | Fleet`} />
        <meta property="og:description" content={`${car.year} ${car.make} ${car.model} for $${car.price.toLocaleString()} at ${dealershipName}`} />
        <meta property="og:url" content={`https://www.fleetapp.me/cars/${car.id}`} />
      </Head>

      <Navbar />

      {showAppRedirect && car && (
        <AppRedirectOverlay
          carId={car.id}
          onClose={handleCloseRedirect}
          make={car.make}
          model={car.model}
          year={car.year}
        />
      )}

      <div className="pt-16">
        {car.images && car.images.length > 0 ? (
          <div className="relative bg-white carousel-container">
            <div id="test-div">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-64 sm:h-80 md:h-96 lg:h-[550px] carousel-height"
                style={
                  {
                    scrollBehavior: "smooth",
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  } as React.CSSProperties
                }
              >
                {car.images.map((img, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 h-full snap-start relative carousel-item"
                    style={{
                      maxWidth: "100%",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <img
                      src={img}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover object-center carousel-image"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            {car.images.length > 1 && (
              <div className="hidden bg-gray-100 md:justify-center">
                <div
                  ref={thumbnailsRef}
                  className="flex gap-2 overflow-x-auto py-2 pl-1 scrollbar-hide"
                  style={
                    {
                      scrollBehavior: "smooth",
                      WebkitOverflowScrolling: "touch",
                    } as React.CSSProperties
                  }
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
              </div>
            )}

            {car.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateCarousel("prev")}
                  className="absolute left-1 sm:left-5 xl:left-20 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-3 transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-3 w-3 sm:h-6 sm:w-6 text-white" />
                </button>
                <button
                  onClick={() => navigateCarousel("next")}
                  className="absolute right-5 xl:right-20 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-3 transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-3 w-3 sm:h-6 sm:w-6 text-white" />
                </button>
              </>
            )}

            <div className="absolute top-5 right-5 gap-1 z-10 flex flex-row">
              <FavoriteButton
                carId={Number(car.id)}
                initialLikes={car.likes || 0}
                onLikesUpdate={handleLikesUpdate}
                size="md"
              />
            </div>
          </div>
        ) : (
          <div className="relative h-64 md:h-96 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        )}

        <div className="relative z-10 flex px-4 transform translate-y-[-50%]">
          <div className="bg-accent px-4 py-2 rounded-full shadow-lg inline-block mx-auto">
            <span className="text-white text-xl font-bold">
              ${car.price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="p-4 3xl:w-9/12 xl:w-11/12 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="h-14 md:w-16 md:h-16 flex-shrink-0">
                <img
                  src={getLogoUrl(car.make, true)}
                  alt={car.make}
                  className="h-10 rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold">
                  {car.make} {car.model}
                </h1>
                <p className="text-lg">{car.year}</p>

                <p className="text-sm text-gray-500">
                  Posted {getRelativeTime(car.listed_at)}
                </p>
                <div className=" flex text-sm items-center text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {car.views || 0}
                </div>
              </div>
            </div>

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
                  car.mileage > 0
                    ? `${(car.mileage / 1000).toFixed(1)}k km`
                    : "New"
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

            {car.description && (
              <div className="p-1">
                <h2 className="text-xl font-bold">Description</h2>
                <p className="mt-2 p-2 text-gray-700">{car.description}</p>
              </div>
            )}

            {car.features && car.features.length > 0 && (
              <div className="p-1">
                <h2 className="text-xl font-bold mb-6">Features</h2>

                <div className="space-y-6 p-2">
                  {Object.entries(VEHICLE_FEATURES).map(
                    ([category, featuresArray]) => {
                      const matchingFeatures = car.features?.filter(
                        (feature) => {
                          if (typeof feature !== "string") return false;

                          return featuresArray.some(
                            (predefinedFeature) =>
                              feature
                                .toLowerCase()
                                .includes(predefinedFeature.id.toLowerCase()) ||
                              feature
                                .toLowerCase()
                                .includes(predefinedFeature.label.toLowerCase())
                          );
                        }
                      );

                      if (!matchingFeatures || matchingFeatures.length === 0)
                        return null;

                      return (
                        <div key={category} className="mb-5 last:mb-0">
                          <div className="relative pb-1 mb-3">
                            <h3 className="capitalize text-base font-bold">
                              {category}
                            </h3>
                            <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-accent"></div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {matchingFeatures.map(
                              (feature: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-gray-200 flex items-center mb-1"
                                >
                                  <span className="text-accent mr-1.5">
                                    {getFeatureIcon(feature)}
                                  </span>
                                  {feature
                                    .replace(/_/g, " ")
                                    .split(" ")
                                    .map(
                                      (word: string) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase()
                                    )
                                    .join(" ")}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {(() => {
                    const allPredefinedIds = Object.values(VEHICLE_FEATURES)
                      .flat()
                      .map((f) => f.id.toLowerCase());
                    const allPredefinedLabels = Object.values(VEHICLE_FEATURES)
                      .flat()
                      .map((f) => f.label.toLowerCase());

                    const uncategorizedFeatures = car.features?.filter(
                      (feature) => {
                        if (typeof feature !== "string") return false;
                        const lowerFeature = feature.toLowerCase();

                        return (
                          !allPredefinedIds.some((id) =>
                            lowerFeature.includes(id)
                          ) &&
                          !allPredefinedLabels.some((label) =>
                            lowerFeature.includes(label)
                          )
                        );
                      }
                    );

                    if (
                      !uncategorizedFeatures ||
                      uncategorizedFeatures.length === 0
                    )
                      return null;

                    return (
                      <div className="mb-5 last:mb-0">
                        <div className="relative pb-1 mb-3">
                          <h3 className="text-base font-bold">
                            Other Features
                          </h3>
                          <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-accent"></div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {uncategorizedFeatures.map(
                            (feature: string, index: number) => (
                              <span
                                key={index}
                                className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-3 py-1.5 rounded-full border border-gray-200 flex items-center mb-1"
                              >
                                <span className="text-accent mr-1.5">
                                  {getFeatureIcon(feature)}
                                </span>
                                {feature
                                  .replace(/_/g, " ")
                                  .split(" ")
                                  .map(
                                    (word: string) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1).toLowerCase()
                                  )
                                  .join(" ")}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            <h2 className="text-xl font-bold p-1 mb-5">Dealership</h2>
            <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
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
                    <p className="text-sm text-gray-500">
                      {dealershipLocation}
                    </p>
                  </div>
                </div>

                {dealershipPhone && (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCall}
                      className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
                      aria-label="Call"
                    >
                      <PhoneIcon className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="p-3 bg-green-600 rounded-full hover:bg-green-500 transition-colors"
                      aria-label="WhatsApp"
                    >
                      <FaWhatsapp className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"
                      aria-label="Share"
                    >
                      <ShareIcon className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                )}
              </div>

              {dealershipLatitude && dealershipLongitude && (
                <div className="mt-10 4">
                  <iframe
                    width="100%"
                    height="550%"
                    style={{ border: 0, borderRadius: "4px" }}
                    loading="lazy"
                    allowFullScreen
                    src={googleMapsUrl}
                  ></iframe>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold mb-5">
              More from {dealershipName}
            </h2>
            <DealershipCarsSection
              dealershipID={car.dealership_id}
              currentCarId={params.id}
            />
          </div>
        </div>

        <MobileAppBanner />

        <style jsx global>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          @supports (-webkit-overflow-scrolling: touch) {
            .scrollbar-hide {
              -webkit-overflow-scrolling: touch;
              scroll-behavior: smooth;
            }
          }

          .snap-x {
            scroll-snap-type: x mandatory;
            -webkit-scroll-snap-type: x mandatory;
            touch-action: pan-x;
          }

          .snap-start {
            scroll-snap-align: start;
            -webkit-scroll-snap-align: start;
          }

          .carousel-container {
            position: relative;
            overflow: hidden;
            touch-action: manipulation;
          }

          .carousel-image {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
            pointer-events: none;
          }

          .carousel-item {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            touch-action: pan-x;
          }

          @media only screen and (max-width: 428px) and (-webkit-min-device-pixel-ratio: 2) {
            .carousel-height {
              height: 85vh !important;
              max-height: 500px !important;
            }
          }

          @media only screen and (min-width: 390px) and (max-width: 428px) and (-webkit-min-device-pixel-ratio: 3) {
            .carousel-height {
              height: 80vh !important;
              max-height: 600px !important;
            }
          }

          @media only screen and (max-width: 389px) and (-webkit-min-device-pixel-ratio: 2) {
            .carousel-height {
              height: 75vh !important;
              max-height: 400px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}