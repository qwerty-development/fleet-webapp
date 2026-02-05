// components/CarCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { getLogoUrl } from "@/utils/getLogoUrl";

export interface Car {
  id: number;
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
  views?: number;
  likes?: number;
  dealerships: {
    name: string;
    logo: string;
    phone?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  };
  status: string;
}

interface CarCardProps {
  car: Car;
  isLightMode?: boolean;
  isFavorite?: boolean;
  onFavoritePress?: (id: number) => void;
  isDealer?: boolean;
}

const CarCard: React.FC<CarCardProps> = ({
  car,
  isLightMode = true,
}) => {
  return (
    <Link href={`/cars/${car.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        {/* Large Image Section */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={car.images?.[0] || "/placeholder-car.jpg"}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-car.jpg";
            }}
          />
          {/* Price Badge */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-accent px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg">
            <span className="text-white font-bold text-base sm:text-lg">
              ${car.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Make and Model */}
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="h-7 w-7 sm:h-8 sm:w-8 mr-2 flex-shrink-0">
              <img
                src={getLogoUrl(car.make, isLightMode)}
                alt={car.make}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 font-bold text-base sm:text-lg leading-tight truncate">
                {car.make} {car.model}
              </h3>
            </div>
          </div>

          {/* Key Specs - Minimal */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent mr-1 flex-shrink-0" />
              <span>{car.year}</span>
            </div>
            {car.mileage > 0 && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent mr-1 flex-shrink-0" />
                <span>{(car.mileage / 1000).toFixed(1)}k km</span>
              </div>
            )}
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Cog6ToothIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent mr-1 flex-shrink-0" />
              <span className="capitalize">{car.transmission}</span>
            </div>
          </div>

          {/* Dealership Info - Minimal */}
          {car.dealerships?.name && (
            <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-200">
              <div className="flex items-center">
                {car.dealerships.logo && (
                  <div className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0">
                    <img
                      src={car.dealerships.logo}
                      alt={car.dealerships.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {car.dealerships.name}
                  </p>
                  {car.dealerships.location && (
                    <div className="flex items-center mt-0.5">
                      <MapPinIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 mr-1 flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {car.dealerships.location.split(",")[0]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CarCard;
