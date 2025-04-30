// components/dealerships/DealershipCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { PhoneIcon } from "@heroicons/react/24/outline";

export interface Dealership {
  id: number | string;
  name: string;
  logo: string;
  phone: string;
  location: string;
  carsAvailable: number;
}

interface DealershipCardProps {
  dealership: Dealership;
}

const DealershipCard: React.FC<DealershipCardProps> = ({ dealership }) => {
  // Convert the ID to string to ensure consistency when navigating
  const dealershipId = String(dealership.id);

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Changed from stopPropagation to prevent both propagation and default behavior
    if (navigator.share) {
      try {
        await navigator.share({
          title: dealership.name,
          text: `Check out ${dealership.name} located at ${dealership.location}`,
          url: `${window.location.origin}/dealerships/${dealershipId}`,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  const handleWhatsApp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Changed from stopPropagation
    const message = encodeURIComponent(
      `Check out ${dealership.name} located at ${dealership.location}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="relative bg-gray-800 rounded-lg px-10 py-5 shadow-md hover:scale-105 hover:shadow-xl transition-all duration-200">
      {/* Badge for available cars */}
      <div className="absolute top-2 right-2 bg-accent text-white text-xs font-semibold px-2 py-1 rounded-full">
        {dealership.carsAvailable} Cars
      </div>
      {/* Main card content */}
      <Link href={`/dealerships/${dealershipId}`} className="block">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              src={
                dealership.logo ||
                "https://via.placeholder.com/150?text=No+Logo"
              }
              alt={`${dealership.name} Logo`}
              className="w-16 h-16 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/150?text=No+Logo";
              }}
            />
          </div>
          <div className="ml-4">
            <h3 className="text-white font-semibold text-lg sm:text-base">
              {dealership.name}
            </h3>
            <p className="text-gray-400 text-sm">{dealership.location}</p>
            <p className="text-gray-400 text-sm">Number: {dealership.phone}</p>
          </div>
        </div>
      </Link>
      {/* CTA buttons */}
      <div className="flex justify-around mt-10">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-full text-white text-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 12v.01M12 4v.01M20 12v.01M12 20v.01M16.24 7.76l-.01.01M7.76 7.76l.01.01M7.76 16.24l.01.01M16.24 16.24l-.01-.01"
            />
          </svg>
          <span>Share</span>
        </button>
        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsApp}
          className="flex items-center space-x-1 bg-green-600 hover:bg-green-500 px-3 py-2 rounded-full text-white text-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.52 3.48A11.96 11.96 0 0012 0C5.38 0 0 5.38 0 12c0 2.12.55 4.15 1.6 5.96L0 24l6.22-1.64A11.94 11.94 0 0012 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.86 0-3.67-.5-5.25-1.44l-.38-.22-3.69.97.99-3.6-.25-.38A9.97 9.97 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10c0 5.52-4.48 10-10 10zm5.54-7.69c-.31-.15-1.84-.91-2.12-1.02-.27-.11-.47-.15-.67.15-.2.31-.77 1.02-.95 1.23-.18.2-.36.23-.67.08-.31-.15-1.3-.48-2.48-1.53-.92-.82-1.55-1.83-1.73-2.14-.18-.31-.02-.48.14-.63.15-.15.31-.36.46-.54.15-.18.2-.31.3-.52.11-.21.06-.39-.03-.54-.09-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.51-.18-.01-.39-.01-.6-.01s-.54.08-.82.39c-.28.31-1.06 1.03-1.06 2.52s1.08 2.93 1.23 3.14c.15.21 2.13 3.25 5.17 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.84-.75 2.1-1.48.27-.75.27-1.39.19-1.48-.08-.09-.27-.15-.57-.3z" />
          </svg>
          <span>WhatsApp</span>
        </button>
        {/* Call Button */}
        <a
          href={`tel:${dealership.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-full text-white text-xs"
        >
          <PhoneIcon className="h-4 w-4" />
          <span>Call</span>
        </a>
      </div>
    </div>
  );
};

export default DealershipCard;
