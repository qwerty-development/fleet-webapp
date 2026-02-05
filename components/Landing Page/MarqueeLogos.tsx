// components/MarqueeLogos.tsx
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { getLogoUrl } from "@/utils/getLogoUrl";

interface Brand {
  make: string;
  count: number;
}

interface Dealership {
  name: string;
  logo: string;
  count: number;
  id: string; // Add id to Dealership interface
}

const MarqueeLogos: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Refs for the marquee elements
  const brandsRef = useRef<HTMLDivElement>(null);
  const dealersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Set up marquee animation after data is loaded
  useEffect(() => {
    if (!loading && brands.length > 0 && dealerships.length > 0) {
      setupMarquee();
    }
  }, [loading, brands, dealerships]);

  const setupMarquee = () => {
    // Clone brand items for smooth infinite scrolling
    if (brandsRef.current) {
      const items = brandsRef.current.querySelectorAll(".brand-item");
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        brandsRef.current?.appendChild(clone);
      });
    }

    // Clone dealer items for smooth infinite scrolling
    if (dealersRef.current) {
      const items = dealersRef.current.querySelectorAll(".dealer-item");
      items.forEach((item) => {
        const clone = item.cloneNode(true);
        dealersRef.current?.appendChild(clone);
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch unique car brands and their counts
    const { data: brandsData, error: brandsError } = await supabase
      .from("cars")
      .select("make")
      .eq("status", "available");

    if (brandsError) {
      console.error("Error fetching brands:", brandsError);
    } else if (brandsData) {
      const brandCounts: Record<string, number> = {};
      brandsData.forEach((car) => {
        const brand = car.make;
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      });

      const brandsArray = Object.entries(brandCounts).map(([make, count]) => ({
        make,
        count,
      }));

      // Sort by count descending
      setBrands(brandsArray.sort((a, b) => b.count - a.count));
    }

    // FIXED: Fetch dealerships directly from the dealerships table
    const { data: dealersData, error: dealersError } = await supabase
      .from("dealerships")
      .select("name, logo, id"); // Include id in the select

    if (dealersError) {
      console.error("Error fetching dealerships:", dealersError);
    } else if (dealersData) {
      // Now we need to count cars per dealership
      const dealershipCounts = await Promise.all(
        dealersData.map(async (dealer) => {
          const { count, error } = await supabase
            .from("cars")
            .select("id", { count: "exact", head: true })
            .eq("status", "available")
            .eq("dealership_id", dealer.id); // Assuming there's a dealership_id column

          if (error) {
            console.error(`Error counting cars for ${dealer.name}:`, error);
            return {
              name: dealer.name,
              logo: dealer.logo,
              count: 0,
              id: dealer.id,
            };
          }

          return {
            name: dealer.name,
            logo: dealer.logo,
            count: count || 0,
            id: dealer.id,
          };
        })
      );

      // Sort by count descending
      setDealerships(dealershipCounts.sort((a, b) => b.count - a.count));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full py-4 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-accent rounded-full animate-bounce"></div>
          <div
            className="h-2 w-2 bg-accent rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="h-2 w-2 bg-accent rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 flex flex-col w-full justify-center items-center px-2 sm:px-0">
      {/* Car Brands Section - Compact */}
      <div className="bg-white/80 backdrop-blur-xl w-full border border-gray-200/50 py-2 sm:py-3 overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
        <div className="relative overflow-hidden">
          <div className="absolute w-1/12 h-full rounded-xl left-0 top-0 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none"></div>
          <div className="absolute w-1/12 h-full rounded-xl right-0 top-0 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none"></div>

          <div className="overflow-hidden">
            <div ref={brandsRef} className="flex space-x-6 sm:space-x-8 py-2 sm:py-3 marquee">
              {brands.map((brand, index) => (
                <div
                  key={`${brand.make}-${index}`}
                  className="flex flex-col items-center group hover:scale-105 transition-all duration-300 brand-item flex-shrink-0"
                >
                  <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex items-center justify-center">
                    <img
                      src={getLogoUrl(brand.make, true)}
                      alt={brand.make}
                      className="max-h-full max-w-full drop-shadow-md"
                    />
                  </div>
                  <p className="text-gray-900 text-xs sm:text-sm mt-1 font-semibold">
                    {brand.make}
                  </p>
                  <span className="text-accent text-[10px] sm:text-xs mt-0.5 font-semibold">
                    {brand.count} vehicles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dealerships Section - Compact */}
      <div className="bg-white/80 backdrop-blur-xl w-full border border-gray-200/50 py-2 sm:py-3 overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
        <div className="relative overflow-hidden">
          <div className="absolute w-1/12 h-full rounded-xl left-0 top-0 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none"></div>
          <div className="absolute w-1/12 h-full rounded-xl right-0 top-0 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none"></div>

          <div className="overflow-hidden">
            <div
              ref={dealersRef}
              className="flex space-x-6 sm:space-x-8 py-2 sm:py-3 marquee-reverse"
            >
              {dealerships.map((dealer, index) => (
                <div
                  key={`${dealer.name}-${index}`}
                  className="flex flex-col items-center group hover:scale-105 transition-all duration-300 dealer-item flex-shrink-0"
                >
                  <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex items-center justify-center">
                    {dealer.logo ? (
                      <img
                        src={dealer.logo}
                        alt={dealer.name}
                        className="max-h-full rounded-lg max-w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-900 text-xs sm:text-sm mt-1 font-semibold text-center max-w-[80px] sm:max-w-[100px] truncate">
                    {dealer.name}
                  </p>
                  <span className="text-accent text-[10px] sm:text-xs mt-0.5 font-semibold">
                    {dealer.count} listings
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for marquee animation */}
      <style jsx>{`
        .marquee {
          animation: marquee 30s linear infinite;
        }

        .marquee-reverse {
          animation: marquee 35s linear infinite reverse;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee:hover,
        .marquee-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default MarqueeLogos;
