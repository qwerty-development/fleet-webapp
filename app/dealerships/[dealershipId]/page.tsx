"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneIcon,
  ShareIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import DealershipCarsSection from "@/components/dealerships/DealershipCarsSection";

interface Dealership {
  id: number;
  name: string;
  logo: string;
  phone: string;
  location: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  carsAvailable?: number;
}

// Helper: Compute relative time from created_at
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

// A simple InfoItem component for the dealership data grid
interface InfoItemProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, title, value }) => (
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

// Main component for the dealership details page
export default function DealershipDetailsPage({ params }: { params: { dealershipId: string } }) {
  const router = useRouter();
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [carsCount, setCarsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch dealership data
  useEffect(() => {
    const fetchDealershipData = async () => {
      if (!params?.dealershipId) {
        console.error("No dealership ID provided");
        setError("No dealership ID provided");
        setIsLoading(false);
        return;
      }
      
      console.log("Dealership ID from params:", params.dealershipId);

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching dealership with ID:', params.dealershipId);
        const supabase = createClient();

        // Fetch dealership details - use exact ID as provided in params, don't convert
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("id", params.dealershipId)
          .single();

        if (dealershipError) {
          console.error("Error fetching dealership:", dealershipError);
          setError(dealershipError.message);
          setIsLoading(false);
          return;
        }

        if (!dealershipData) {
          console.log('No dealership found for ID:', params.dealershipId);
          setError("Dealership not found");
          setIsLoading(false);
          return;
        }

        console.log("Found dealership:", dealershipData);

        // Get count of available cars for this dealership
        try {
          // Ensure we're passing the right ID format
          const dealershipIdForQuery = dealershipData.id;
          console.log("Using dealership ID for cars query:", dealershipIdForQuery);
          
          const { count, error: carsError } = await supabase
            .from("cars")
            .select("*", { count: "exact" })
            .eq("dealership_id", dealershipIdForQuery)
            .eq("status", "available");

          if (carsError) {
            console.error("Error counting cars:", carsError);
          } else {
            const availableCarsCount = count || 0;
            setCarsCount(availableCarsCount);
            
            // Set the dealership data with the car count
            setDealership({
              ...dealershipData,
              carsAvailable: availableCarsCount
            });
          }
        } catch (carCountError) {
          console.error("Exception when counting cars:", carCountError);
          // Still set the dealership data even if car count fails
          setDealership(dealershipData);
        }
        
      } catch (error) {
        console.error("Exception in fetchDealershipData:", error);
        setError("An unexpected error occurred");
      } finally {
        // Always set loading to false, regardless of success or failure
        setIsLoading(false);
      }
    };

    if (params.dealershipId) {
      fetchDealershipData();
    } else {
      setIsLoading(false);
      setError("No dealership ID provided");
    }
  }, [params.dealershipId]);

  // Action handlers
  const handleCall = () => {
    if (!dealership?.phone) return;
    window.open(`tel:${dealership.phone}`);
  };

  const handleShare = async () => {
    if (!dealership) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: dealership.name,
          text: `Check out ${dealership.name} located at ${dealership.location}`,
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
    if (!dealership?.phone) return;
    const message = `Hi, I'm interested in your dealership ${dealership.name} located at ${dealership.location}`;
    const whatsappUrl = `https://wa.me/${dealership.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Show loading state if data is not yet available
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state if there was an error
  if (error || !dealership) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">
              {error === "Dealership not found" ? "Dealership not found" : "Something went wrong"}
            </h2>
            <p className="text-gray-300 mb-6">
              {error === "Dealership not found" 
                ? "The dealership you're looking for doesn't exist or has been removed."
                : `We encountered an error while trying to load this dealership: ${error || "Unknown error"}`}
            </p>
            <button
              onClick={() => router.push("/dealerships")}
              className="px-4 py-2 bg-accent hover:bg-accent/80 transition-colors rounded-lg text-white font-semibold"
            >
              Browse Dealerships
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
      >
        ← Back
      </button>

      {/* Header Image - Dealership Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-r from-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg className="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFFFFF" d="M41.9,-71.9C53.5,-64.7,61.9,-52.6,69.5,-39.7C77.2,-26.9,84.1,-13.5,84.1,0C84.1,13.5,77.2,26.9,69.5,39.7C61.9,52.6,53.5,64.7,41.9,71.9C30.4,79.2,15.2,81.6,0.3,81.1C-14.6,80.7,-29.2,77.4,-40.2,69.5C-51.3,61.7,-58.9,49.2,-67.1,36.4C-75.4,23.6,-84.3,10.8,-84.4,-2.1C-84.5,-15,-75.8,-30,-66.3,-44.2C-56.7,-58.4,-46.2,-71.7,-33.7,-78.2C-21.1,-84.7,-10.6,-84.4,1.3,-86.7C13.2,-89,26.3,-93.9,41.9,-91.9" transform="translate(100 100)" />
          </svg>
        </div>
        
        {/* Centered Logo - With fallback for missing logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-32 h-32 sm:w-36 sm:h-36 relative mb-4">
            <img
              src={dealership.logo || "https://via.placeholder.com/150?text=No+Logo"}
              alt={`${dealership.name} Logo`}
              className="w-full h-full object-cover rounded-full border-4 border-gray-700 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Logo";
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white drop-shadow-lg">
            {dealership.name}
          </h1>
          <div className="flex items-center mt-2">
            <MapPinIcon className="h-5 w-5 text-accent mr-1" />
            <p className="text-gray-300">{dealership.location}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Positioned to overlap the header and content */}
      <div className="relative z-10 flex justify-center px-4 -mt-6">
        <div className="bg-gray-800 px-4 py-3 rounded-full shadow-lg flex space-x-3">
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
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.1-.472-.148-.672.15-.198.297-.768.967-.942 1.166-.173.2-.347.213-.644.068-.297-.146-1.255-.463-2.134-1.312-.788-.702-1.319-1.562-1.477-1.86-.157-.297-.017-.458.118-.606.12-.12.283-.303.424-.455.14-.15.187-.258.28-.431.093-.174.047-.326-.024-.475-.07-.149-.61-1.478-.834-2.017-.219-.524-.443-.453-.612-.461-.158-.009-.34-.012-.522-.012-.18 0-.472.068-.72.34-.248.272-.94.919-.94 2.24s.96 2.6 1.092 2.788c.133.187 1.87 2.853 4.525 3.993.633.273 1.127.435 1.512.556.635.203 1.213.175 1.67.107.509-.076 1.758-.718 2.006-1.413.248-.695.248-1.29.173-1.413-.075-.123-.273-.187-.57-.336" />
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
      </div>

      {/* Dealership Information Section */}
      <div className="p-4 space-y-6 mt-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <InfoItem
            icon={<BuildingStorefrontIcon className="h-5 w-5 text-accent" />}
            title="Business"
            value={dealership.name}
          />
          <InfoItem
            icon={<PhoneIcon className="h-5 w-5 text-accent" />}
            title="Contact"
            value={dealership.phone}
          />
          <InfoItem
            icon={<MapPinIcon className="h-5 w-5 text-accent" />}
            title="Location"
            value={dealership.location}
          />
          <InfoItem
            icon={<CalendarIcon className="h-5 w-5 text-accent" />}
            title="Joined"
            value={getRelativeTime(dealership.created_at || "")}
          />
          <InfoItem
            icon={<ClockIcon className="h-5 w-5 text-accent" />}
            title="Status"
            value="Active"
          />
          <InfoItem
            icon={<UserGroupIcon className="h-5 w-5 text-accent" />}
            title="Cars Available"
            value={carsCount}
          />
        </div>

        {/* Map Section */}
        {dealership.latitude && dealership.longitude && (
          <div className="bg-gray-800 rounded-xl overflow-hidden mt-8">
            <h2 className="text-xl font-bold p-4 border-b border-gray-700">Dealership Location</h2>
            <div className="p-4">
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                className="rounded-lg"
                src={`https://www.google.com/maps?q=${dealership.latitude},${dealership.longitude}&hl=es;z=14&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Available Cars Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Available Cars</h2>
          {/* Ensure we pass the ID as expected by the database */}
          {dealership && 
            <DealershipCarsSection dealershipID={dealership.id} />
          }
        </div>
      </div>

      {/* Padding at the bottom for spacing */}
      <div className="h-8"></div>
    </div>
  );
}