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
import { FaWhatsapp } from "react-icons/fa";
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
  <div className="flex items-center p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl group hover:from-gray-800 hover:to-accent-dark/5 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg">
    <div className="mr-5 text-accent group-hover:text-white transition-colors">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-gray-400 group-hover:text-white transition-colors">
        {title}
      </span>
      <span className="mt-1 font-semibold text-white text-lg">{value}</span>
    </div>
  </div>
);

// Loading state component
const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-4 border-accent border-t-transparent"></div>
  </div>
);

// Main component for the dealership details page
export default function DealershipDetailsPage({
  params,
}: {
  params: { dealershipId: string };
}) {
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
        console.log("Fetching dealership with ID:", params.dealershipId);
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
          console.log("No dealership found for ID:", params.dealershipId);
          setError("Dealership not found");
          setIsLoading(false);
          return;
        }

        console.log("Found dealership:", dealershipData);

        // Get count of available cars for this dealership
        try {
          // Ensure we're passing the right ID format
          const dealershipIdForQuery = dealershipData.id;
          console.log(
            "Using dealership ID for cars query:",
            dealershipIdForQuery
          );

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
              carsAvailable: availableCarsCount,
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
    const whatsappUrl = `https://wa.me/${
      dealership.phone
    }?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Show loading state if data is not yet available
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state if there was an error
  if (error || !dealership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <div className="relative bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 max-w-md text-center text-white">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-3 bg-gray-700 bg-opacity-50 backdrop-blur-sm rounded-full hover:scale-105 transition-transform duration-300 ease-in-out"
          >
            ← Back
          </button>
          <h2 className="text-3xl font-extrabold mb-6">
            {error === "Dealership not found"
              ? "Dealership not found"
              : "Something went wrong"}
          </h2>
          <p className="text-gray-300 mb-8">
            {error === "Dealership not found"
              ? "This dealership doesn't exist or has been removed."
              : `We encountered an error: ${error || "Unknown error"}`}
          </p>
          <button
            onClick={() => router.push("/dealerships")}
            className="mt-4 px-6 py-3 bg-accent hover:bg-accent/90 transition-colors rounded-full text-white font-semibold uppercase tracking-wide shadow-lg"
          >
            Browse Dealerships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-50 p-3 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-full hover:scale-105 transition-transform duration-300 ease-in-out text-white"
      >
        ← Back
      </button>

      {/* Header Image - Dealership Banner */}
      <div className="relative h-[25rem] sm:h-[30rem] md:h-[35rem] bg-gradient-to-br from-accent/20 via-accent-dark/5 to-gray-900 overflow-hidden">
        {/* Decorative backgrounds */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-indigo-500/0 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-purple-600/0 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        {/* Centered Logo and Dealership Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="w-36 h-36 sm:w-44 sm:h-44 relative mb-6 transform transition-transform duration-300 ease-in-out hover:scale-105">
            <img
              src={
                dealership.logo ||
                "https://via.placeholder.com/150?text=No+Logo"
              }
              alt={`${dealership.name} Logo`}
              className="w-full h-full object-cover rounded-full border-4 border-accent shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/150?text=No+Logo";
              }}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">
            {dealership.name}
          </h1>
          <div className="flex items-center mt-2">
            <MapPinIcon className="h-5 w-5 text-accent mr-1" />
            <p className="text-gray-300 text-lg">{dealership.location}</p>
          </div>
        </div>
      </div>
      <div className="flex  justify-center">
        <div className="w-full 3xl:w-9/12 xl:w-11/12">
          {/* Action Buttons - Positioned to overlap the header and content */}
          <div className="relative z-10 flex justify-center px-4 -mt-12">
            <div className="flex space-x-4 bg-gray-800 bg-opacity-40 backdrop-blur-sm rounded-full p-3 shadow-xl">
              <button
                onClick={handleCall}
                className="p-4 bg-blue-600 rounded-full hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg"
                aria-label="Call"
              >
                <PhoneIcon className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={handleWhatsApp}
                className="p-4 bg-green-600 rounded-full hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={handleShare}
                className="p-4 bg-gray-700 rounded-full hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg"
                aria-label="Share"
              >
                <ShareIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Dealership Information Section */}
          <div className="p-4 space-y-6 mt-6">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-7 mt-6">
              <InfoItem
                icon={
                  <BuildingStorefrontIcon className="h-5 w-5 text-accent" />
                }
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
              <div className="bg-gradient-to-br from-gray-800 to-gray-900  bg-opacity-50 backdrop-blur-sm rounded-2xl overflow-hidden mt-8 shadow-2xl">
                <h2 className="text-xl font-bold p-4 mb-1 border-b border-gray-700">
                  Dealership Location
                </h2>
                <div className="p-4">
                  <iframe
                    src={`https://www.google.com/maps?q=${dealership.latitude},${dealership.longitude}&hl=es;z=14&output=embed`}
                    className="w-full h-64 sm:h-80 rounded-xl border-2 border-gray-700 shadow-inner"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Available Cars Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold p-4 mb-6 border-b-2 border-accent pb-2">
                Available Cars
              </h2>
              {/* Cars list card */}
              <div className="bg-gray-800 bg-opacity-40 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
                {dealership && (
                  <DealershipCarsSection dealershipID={dealership.id} />
                )}
              </div>
            </div>
          </div>

          {/* Padding at the bottom for spacing */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
