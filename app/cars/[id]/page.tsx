// app/cars/[id]/page.tsx
'use client';
// The page component must be a server component initially
export default function CarPage({ params }: { params: { id: string } }) {
  return <CarDetailsClient id={params.id} />;
}

// Then use a separate client component for all the interactive functionality


import React, { useState, useEffect, useRef } from "react";
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
  MapPinIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import DealershipCarsSection from "@/components/dealerships/DealershipCarsSection";

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

// Main component for the car details page
function CarDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch car data
  useEffect(() => {
    const fetchCarData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

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
          .eq("id", id)
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

    if (id) {
      fetchCarData();
    }
  }, [id, router]);

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
  };

  // Handle carousel scroll
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const index = Math.round(
        carouselRef.current.scrollLeft / carouselRef.current.clientWidth
      );
      setActiveImageIndex(index);
    }
  };

  // Action handlers
  const handleCall = () => {
    if (!car) return;
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
      alert("Sharing not supported on this browser.");
    }
  };

  const handleWhatsApp = () => {
    if (!car) return;
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
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700"
      >
        ← Back
      </button>

      {/* Image Carousel - Only render if images exist */}
      {car.images && car.images.length > 0 ? (
        <div className="relative h-64 sm:h-80 md:h-96  overflow-hidden">
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
            style={{ scrollBehavior: "smooth" }}
          >
            {car.images.map((img, index) => (
              <div
                key={index}
                className="w-full snap-center relative flex-shrink-0 h-full"
              >
                <img
                  src={img}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-contain bg-gray-800"
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {car.images.length > 1 && (
            <>
              <button
                onClick={() => navigateCarousel("prev")}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => navigateCarousel("next")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-6 w-6 text-white" />
              </button>
            </>
          )}

          {/* Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {car.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === activeImageIndex ? "bg-accent" : "bg-gray-500"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative h-64 md:h-96 bg-gray-800 flex items-center justify-center">
          <p className="text-gray-400">No images available</p>
        </div>
      )}

      {/* Price Badge - Positioned to overlap the image and content */}
      <div className="relative z-10 flex  px-4 -mt-3">
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
              className="w-full h-full rounded-full"
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

            {/* Contact Buttons - Circular on mobile */}
            {dealershipPhone && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCall}
                  className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
                  aria-label="Call"
                >
                  <PhoneIcon className="h-5 w-5" />
                  <span className="hidden md:inline ml-1">Call</span>
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="p-3 bg-green-600 rounded-full hover:bg-green-500 transition-colors"
                  aria-label="WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.1-.472-.148-.672.15-.198.297-.768.967-.942 1.166-.173.2-.347.213-.644.068-.297-.146-1.255-.463-2.134-1.312-.788-.702-1.319-1.562-1.477-1.86-.157-.297-.017-.458.118-.606.12-.12.283-.303.424-.455.14-.15.187-.258.28-.431.093-.174.047-.326-.024-.475-.07-.149-.61-1.478-.834-2.017-.219-.524-.443-.453-.612-.461-.158-.009-.34-.012-.522-.012-.18 0-.472.068-.72.34-.248.272-.94.919-.94 2.24s.96 2.6 1.092 2.788c.133.187 1.87 2.853 4.525 3.993.633.273 1.127.435 1.512.556.635.203 1.213.175 1.67.107.509-.076 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.075-.123-.273-.187-.57-.336" />
                  </svg>
                  <span className="hidden md:inline ml-1">WhatsApp</span>
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  aria-label="Share"
                >
                  <ShareIcon className="h-5 w-5" />
                  <span className="hidden md:inline ml-1">Share</span>
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
        <DealershipCarsSection dealershipID={car.dealership_id} currentCarId={id} />

      </div>


      {/* Padding at the bottom for spacing */}
      <div className="h-8"></div>
    </div>
  );
}