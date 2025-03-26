// components/MarqueeLogos.tsx
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getLogoUrl } from "./CarCard";
import { motion } from "framer-motion";

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
            id: dealer.id
          };
        }

        return {
          name: dealer.name,
          logo: dealer.logo,
          count: count || 0,
          id: dealer.id
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
      <div className="h-32 bg-neutral-900 rounded-3xl flex items-center justify-center shadow-xl">
        <div className="animate-pulse flex flex-col items-center">
          <span className="text-accent text-lg font-bold">Loading</span>
          <div className="mt-2 flex space-x-2">
            <div className="h-3 w-3 bg-accent rounded-full animate-bounce"></div>
            <div
              className="h-3 w-3 bg-accent rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="h-3 w-3 bg-accent rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-12">
      {/* Title and Introduction */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <motion.span
            className="inline-block text-accent font-semibold mb-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Taylored to your needs
          </motion.span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl text-white font-bold mb-6">
            <span className="relative">
              Premium
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
            {" "}
            <span className="text-accent">Automotive Network</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          We work with top-notch dealerships across the country to bring you an unparalleled selection of vehicles. Whatever car you're looking for, you'll find it here.
          </p>
        </motion.div>

      {/* Car Brands Section */}
      <div className="bg-neutral-900/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl">
        <h3 className="text-white text-xl font-bold mb-5 px-2">
          Popular Brands
        </h3>

        <div className="relative overflow-hidden">
          <div className="absolute w-20 h-full left-0 top-0 bg-gradient-to-r from-neutral-900 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute w-20 h-full right-0 top-0 bg-gradient-to-l from-neutral-900 to-transparent z-20 pointer-events-none"></div>

          <div className="overflow-hidden">
            <div ref={brandsRef} className="flex space-x-12 py-6 marquee">
              {brands.map((brand, index) => (
                <div
                  key={`${brand.make}-${index}`}
                  className="flex flex-col items-center group hover:scale-110 transition-all duration-300 brand-item flex-shrink-0"
                >
                  <div className="h-32 w-32 flex items-center justify-center">
                    <img
                      src={getLogoUrl(brand.make, true)}
                      alt={brand.make}
                      className="max-h-full max-w-full drop-shadow-lg"
                    />
                  </div>
                  <p className="text-white text-lg mt-3 font-semibold">
                    {brand.make}
                  </p>
                  <span className="text-accent text-sm mt-1 font-medium">
                    {brand.count} vehicles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dealerships Section */}
      <div className="bg-neutral-900/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl">
        <h3 className="text-white text-xl font-bold mb-5 px-2">
          Our Dealerships
        </h3>

        <div className="relative overflow-hidden">
          <div className="absolute w-20 h-full left-0 top-0 bg-gradient-to-r from-neutral-900 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute w-20 h-full right-0 top-0 bg-gradient-to-l from-neutral-900 to-transparent z-20 pointer-events-none"></div>

          <div className="overflow-hidden">
            <div
              ref={dealersRef}
              className="flex space-x-12 py-6 marquee-reverse"
            >
              {dealerships.map((dealer, index) => (
                <div
                  key={`${dealer.name}-${index}`}
                  className="flex flex-col items-center group hover:scale-110 transition-all duration-300 dealer-item flex-shrink-0"
                >
                  <div className="h-40 w-40 flex items-center justify-center">
                    <img
                      src={dealer.logo }
                      alt={dealer.name}
                      className="max-h-full max-w-full object-contain drop-shadow-lg"

                    />
                  </div>
                  <p className="text-white text-lg mt-3 font-semibold text-center max-w-[150px]">
                    {dealer.name}
                  </p>
                  <span className="text-accent text-sm mt-1 font-medium">
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