"use client";

import React from "react";
import Link from "next/link";
import {
  ClockIcon,
  Cog6ToothIcon,
  SwatchIcon,
  MapPinIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

import FavoriteButton from "./FavoriteButton";
import { getLogoUrl } from "@/utils/getLogoUrl";


interface CarCardProps {
  car: any;
  isDealer?: boolean;
}

const CarCard: React.FC<CarCardProps> = ({ car, isDealer = false }) => {
  // Helper function to get brand logo URL

  // Handle missing images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/placeholder-car.jpg";
  };

  // Handle missing logos
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "";
  };

  return (
    <Link href={`/cars/${car.id}`} className="block">
      <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-accent/50 group">
        {/* Main image with fixed dimensions and aspect ratio */}
        <div className="relative w-full md:w-72 h-80 md:h-64 md:flex-shrink-0 bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={car.images?.[0] || "/placeholder-car.jpg"}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={handleImageError}
            />
          </div>

          {/* Price tag */}
          <div className="absolute top-2 left-2 flex justify-center bg-accent px-4 py-2 rounded-full text-white font-bold shadow-md text-lg">
            ${car.price.toLocaleString()}
          </div>

          {/* Favorite button */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton
              carId={Number(car.id)}
              initialLikes={car.likes || 0}
              onLikesUpdate={(newLikes) => {
                // This is optional and would need additional state management
                // to update the car object in the parent component
              }}
              size="md"
            />
          </div>
        </div>

        {/* Car information section */}
        <div className="p-5 flex flex-col flex-1">
          {/* Title and year with make logo */}
          <div className="mb-3">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-2 flex-shrink-0">
                <img
                  src={getLogoUrl(car.make, true)}
                  alt={car.make}
                  className="w-full h-full object-contain"
                  onError={handleLogoError}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-gray-900 font-bold text-xl leading-tight truncate">
                  {car.make} {car.model}
                </h3>
                <span className="text-base text-gray-500">{car.year}</span>
              </div>
            </div>
          </div>

          {/* Specification grid */}
          <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-4 gap-3 mt-4">
            {/* Mileage */}
            <div className="flex items-center bg-gray-100 rounded-lg p-2.5">
              <ClockIcon className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate capitalize">
                {car.mileage > 0
                  ? `${(car.mileage / 1000).toFixed(1)}k Km`
                  : "New"}
              </span>
            </div>

            {/* Transmission */}
            <div className="flex items-center bg-gray-100 rounded-lg p-2.5">
              <Cog6ToothIcon className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate capitalize">
                {car.transmission || "Unknown"}
              </span>
            </div>

            {/* Drivetrain if available */}
            {car.drivetrain && (
              <div className="flex items-center bg-gray-100 rounded-lg p-2.5">
                <TruckIcon className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate capitalize">
                  {car.drivetrain}
                </span>
              </div>
            )}

            {/* Color if available */}
            {car.color && (
              <div className="flex items-center bg-gray-100 rounded-lg p-2.5">
                <SwatchIcon className="h-5 w-5 text-accent mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate capitalize">
                  {car.color}
                </span>
              </div>
            )}
          </div>

          {/* Spacer to push dealer info to bottom */}
          <div className="flex-grow min-h-[20px]"></div>

          {/* Dealership info - rearranged with location on right and name on left */}
          {(car.dealership_name || car.dealerships?.name) && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap">
                {/* Dealership name and logo on lef */}
                <div className="flex items-center mr-2">
                  <div className="h-8 w-8 mr-2 flex-shrink-0">
                    <img
                      src={
                        car.dealership_logo ||
                        car.dealerships?.logo ||
                        "/placeholder-dealer.png"
                      }
                      alt="Dealership Logo"
                      className="w-full h-full rounded-full object-cover border border-gray-300"
                      onError={handleLogoError}
                    />
                  </div>
                  <div className="min-w-0 max-w-[150px]">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {car.dealership_name || car.dealerships?.name}
                    </p>
                  </div>
                </div>

                {/* Location on right */}
                {(car.dealership_location || car.dealerships?.location) && (
                  <div className="flex items-center mt-1 md:mt-0">
                    <MapPinIcon className="h-4 w-4 mr-1 text-gray-500 flex-shrink-0" />
                    <p className="text-sm text-gray-500 truncate max-w-[120px] md:max-w-[180px]">
                      {car.dealership_location || car.dealerships?.location}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
