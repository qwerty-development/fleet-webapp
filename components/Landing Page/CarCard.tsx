// components/CarCard.tsx
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  DocumentTextIcon,
  FlagIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

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

// Helper: Get the logo URL (if dealership logo isn't provided)
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
  isFavorite = false,
  onFavoritePress,
  isDealer = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add entrance animation when component mounts
    if (cardRef.current) {
      cardRef.current.style.opacity = "0";
      cardRef.current.style.transform = "translateY(20px)";

      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.opacity = "1";
          cardRef.current.style.transform = "translateY(0)";
        }
      }, 100);
    }
  }, []);

  const handleCall = () => {
    if (car.dealerships.phone) {
      window.open(`tel:${car.dealerships.phone}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${car.year} ${car.make} ${car.model}`,
        text: `Check out this ${car.year} ${car.make} ${
          car.model
        } for $${car.price.toLocaleString()}!`,
        url: window.location.href,
      });
    }
  };

  const handleWhatsApp = () => {
    if (car.dealerships.phone) {
      const message = `Hi, I'm interested in the ${car.year} ${car.make} ${
        car.model
      } listed for $${car.price.toLocaleString()}`;
      window.open(
        `https://wa.me/${car.dealerships.phone}?text=${encodeURIComponent(
          message
        )}`
      );
    }
  };

  return (
    <div
      ref={cardRef}
      className="rounded-3xl h-full shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col bg-neutral-900/90 backdrop-blur-sm"
      style={{
        transform: "translateY(20px)",
        opacity: 0,
        transition: "all 0.5s ease-out",
      }}
    >
      {/* Mobile Layout */}
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden">
        <div className="flex h-[180px]">
          {" "}
          {/* Fixed height container */}
          {/* Left side - Image */}
          <Link href={`/cars/${car.id}`} className="block relative w-1/2">
            <div className="relative bg-neutral-800 overflow-hidden h-full">
              <img
                src={car.images[0]}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          {/* Right side - Car details with specs in 2 columns */}
          <div className="w-1/2 p-2 pl-3 flex flex-col">
            {/* Logo and name */}
            <div className="flex items-start mb-1">
              <div className="h-6 w-6 relative mr-1 flex-shrink-0">
                <img src={getLogoUrl(car.make, isLightMode)} alt={car.make} />
              </div>
              <h2 className="text-white text-sm font-bold leading-tight">
                {car.make} {car.model}
              </h2>
            </div>

            {/* Two-column specs grid */}
            <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-xs mt-1">
              {/* Column 1 */}
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 text-accent mr-1" />
                <span className="text-gray-300">{car.year}</span>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 text-accent mr-1" />
                <span className="text-gray-300">
                  {car.mileage > 0
                    ? `${(car.mileage / 1000).toFixed(1)}k `
                    : "New"}
                </span>
              </div>

              <div className="flex items-center">
                <Cog6ToothIcon className="h-3 w-3 text-accent mr-1" />
                <span className="text-gray-300">{car.transmission}</span>
              </div>

              {car.drivetrain && (
                <div className="flex items-center">
                  <TruckIcon className="h-3 w-3 text-accent mr-1" />
                  <span className="text-gray-300">{car.drivetrain}</span>
                </div>
              )}

              <div className="flex items-center">
                <CheckBadgeIcon className="h-3 w-3 text-accent mr-1" />
                <span className="text-gray-300">{car.condition}</span>
              </div>

              {car.type && (
                <div className="flex items-center">
                  <TagIcon className="h-3 w-3 text-accent mr-1" />
                  <span className="text-gray-300">{car.type}</span>
                </div>
              )}

              {car.color && (
                <div className="flex items-center">
                  <SwatchIcon className="h-3 w-3 text-accent mr-1" />
                  <span className="text-gray-300">{car.color}</span>
                </div>
              )}

              {car.source && (
                <div className="flex items-center">
                  <FlagIcon className="h-3 w-3 text-accent mr-1" />
                  <span className="text-gray-300">{car.source}</span>
                </div>
              )}
            </div>

            {/* Price - now below specs instead of on image */}
            <div className="flex items-center mt-auto">
              <CurrencyDollarIcon className="h-4 w-4 text-accent mr-1" />
              <span className="text-white text-sm font-bold">
                ${car.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dealership Info */}
        <div className="p-4 bg-neutral-800 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10">
                <img
                  src={
                    car.dealerships.logo || getLogoUrl(car.make, isLightMode)
                  }
                  alt={car.dealerships.name || car.make}
                  className="w-full h-full rounded-full object-cover border border-gray-700"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-gray-100 font-semibold text-sm truncate max-w-[150px]">
                  {car.dealerships.name}
                </h3>
                {car.dealerships.location && (
                  <p className="text-gray-400 text-xs truncate max-w-[150px]">
                    {car.dealerships.location.split(",")[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {car.dealerships.phone && (
                <ActionButton
                  icon={<PhoneIcon className="h-5 w-5" />}
                  onClick={handleCall}
                  label="Call"
                />
              )}
              <ActionButton
                icon={<ShareIcon className="h-5 w-5" />}
                onClick={handleShare}
                label="Share"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden  md:flex md:flex-col h-full justify-between">
      {/* <div className="hidden bg-yellow-300 md:flex md:flex-col h-full justify-between"> */}
        <div id="container_klshi_abel_grid" className=" h-full">
          <Link href={`/cars/${car.id}`} className="block relative group">
            {/* Image with hover scale effect */}
            <div
              className="relative bg-neutral-800 overflow-hidden w-full rounded-b-3xl transition-transform duration-300 group-hover:scale-100"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                src={car.images[0]}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
              {/* Price badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-accent px-5 py-3 rounded-2xl shadow-lg">
                  <span className="text-white text-xl font-bold md:text-2xl">
                    ${car.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Car Info */}
          <div className="flex items-center px-6 pt-5 pb-3">
            <div className="h-16 w-16 mr-4 flex-shrink-0">
              <img
                src={getLogoUrl(car.make, isLightMode)}
                alt={car.make}
                className="drop-shadow-md"
              />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">
                {car.make} {car.model}
              </h2>
              <div className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 text-accent mr-1" />
                <span className="text-gray-300 text-sm">{car.year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications grid */}
        <div
          id="specs_grid"
          className="px-6 py-4   h-full border-t border-neutral-800 flex-grow"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
              value={car.transmission}
            />
            {car.drivetrain && (
              <SpecItem
                icon={<TruckIcon className="h-5 w-5 text-accent" />}
                title="Drivetrain"
                value={car.drivetrain}
              />
            )}
            {car.color && (
              <SpecItem
                icon={<SwatchIcon className="h-5 w-5 text-accent" />}
                title="Color"
                value={
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: car.color.toLowerCase() }}
                    ></div>
                    <span>{car.color}</span>
                  </div>
                }
              />
            )}
            <SpecItem
              icon={<CheckBadgeIcon className="h-5 w-5 text-accent" />}
              title="Condition"
              value={car.condition}
            />
            <SpecItem
              icon={<TagIcon className="h-5 w-5 text-accent" />}
              title="Type"
              value={car.type || "N/A"}
            />
            <SpecItem
              icon={<FlagIcon className="h-5 w-5 text-accent" />}
              title="Origin"
              value={car.source || "N/A"}
            />
            <SpecItem
              icon={<DocumentTextIcon className="h-5 w-5 text-accent" />}
              title="Status"
              value={car.status}
            />
          </div>

          {/* Feature tags */}
          {car.features && typeof car.features === "string" && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  try {
                    const featuresArray = JSON.parse(car.features);
                    if (
                      Array.isArray(featuresArray) &&
                      featuresArray.length > 0
                    ) {
                      return (
                        <>
                          {featuresArray.slice(0, 4).map((feature, index) => (
                            <span
                              key={index}
                              className="bg-neutral-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700"
                            >
                              {feature}
                            </span>
                          ))}
                          {featuresArray.length > 4 && (
                            <span className="bg-neutral-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">
                              +{featuresArray.length - 4} more
                            </span>
                          )}
                        </>
                      );
                    }
                    return null;
                  } catch (e) {
                    console.error("Error parsing features:", e);
                    return null;
                  }
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Dealership Info */}
        <div
          id="dealer_info"
          className="p-5 bg-gradient-to-b from-neutral-800 to-neutral-900 border-t border-gray-700 rounded-b-3xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="h-14 w-14 flex-shrink-0">
                <img
                  src={
                    car.dealerships.logo || getLogoUrl(car.make, isLightMode)
                  }
                  alt={car.dealerships.name || car.make}
                  className="w-full h-full rounded-full object-cover border-2 border-gray-700 shadow-lg"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-gray-100 font-semibold text-lg truncate max-w-[200px]">
                  {car.dealerships.name}
                </h3>
                {car.dealerships.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-accent mr-1" />
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">
                      {car.dealerships.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {car.dealerships.phone && (
                <>
                  <ActionButton
                    icon={<PhoneIcon className="h-5 w-5" />}
                    onClick={handleCall}
                    label="Call"
                    text="Call"
                  />
                  <ActionButton
                    icon={
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375a9.869 9.869 0 01-1.516-5.26c0-5.445 4.455-9.885 9.942-9.885a9.865 9.865 0 017.021 2.91 9.788 9.788 0 012.909 6.99c-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                      </svg>
                    }
                    onClick={handleWhatsApp}
                    label="WhatsApp"
                    text="WhatsApp"
                  />
                </>
              )}
              <ActionButton
                icon={<ShareIcon className="h-5 w-5" />}
                onClick={handleShare}
                label="Share"
                text="Share"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SpecItemProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
}

const SpecItem: React.FC<SpecItemProps> = ({ icon, title, value }) => (
  <div className="flex items-center p-2 bg-neutral-800/50 rounded-lg hover:bg-neutral-700/60 transition-colors">
    <div className="mr-2">{icon}</div>
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{title}</span>
      <span className="font-semibold text-white text-sm">{value}</span>
    </div>
  </div>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  text?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  onClick,
  label,
  text,
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="flex items-center px-3 py-2 rounded-lg bg-neutral-700 hover:bg-accent active:bg-accent/80 transition-colors text-white shadow-md"
    aria-label={label}
    title={label}
  >
    <span className="mr-1">{icon}</span>
    {text && <span className="text-sm hidden sm:inline">{text}</span>}
  </button>
);

export default CarCard;
