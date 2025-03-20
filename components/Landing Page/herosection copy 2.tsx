"use client";
import React, {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { motion } from "framer-motion"; // Import motion
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  HeartIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import RandomCarCards from "./RandomCarCards";
import Link from "next/link";

const useInView = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null); // specify HTMLDivElement type
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return [ref, inView] as const;
};

// Mock car data for the interactive demo
const demoCarData = [
  {
    id: 1,
    make: "Mercedes",
    model: "C-Class",
    year: 2023,
    price: 54000,
    mileage: 5,
    fuel: "Hybrid",
    image: "/api/placeholder/500/300", //Corrected paths
    dealerName: "Premium Auto",
    location: "Downtown",
    rating: 4.8,
  },
  {
    id: 2,
    make: "BMW",
    model: "5 Series",
    year: 2022,
    price: 62000,
    mileage: 12000,
    fuel: "Gasoline",
    image: "/api/placeholder/500/300", //Corrected paths
    dealerName: "Elite Motors",
    location: "East Side",
    rating: 4.7,
  },
  {
    id: 3,
    make: "Audi",
    model: "A6",
    year: 2023,
    price: 58000,
    mileage: 8000,
    fuel: "Electric",
    image: "/api/placeholder/500/300", //Corrected paths
    dealerName: "Luxury Cars",
    location: "West End",
    rating: 4.9,
  },
];

// Expanded features list
const features = [
  {
    title: "Search & Filter",
    description: "Find your dream car with powerful search tools",
    icon: <MagnifyingGlassIcon className="w-full h-full" />,
    color: "#FF6A00", // Accent orange
  },
  {
    title: "Save Favorites",
    description: "Build your personal collection",
    icon: <HeartIcon className="w-full h-full" />,
    color: "#e6194b", // Red
  },
  {
    title: "Watch AutoClips",
    description: "Experience cars through video",
    icon: <VideoCameraIcon className="w-full h-full" />,
    color: "#27ae60", // Green
  },
  {
    title: "Compare Prices",
    description: "Get the best deals instantly",
    icon: <CurrencyDollarIcon className="w-full h-full" />,
    color: "#3498db", // Blue
  },
  {
    title: "Direct Messaging",
    description: "Chat with dealers in real-time",
    icon: <ChatBubbleLeftRightIcon className="w-full h-full" />,
    color: "#9b59b6", // Purple
  },
  {
    title: "Special Offers",
    description: "Exclusive deals just for you",
    icon: <TagIcon className="w-full h-full" />,
    color: "#f1c40f", // Yellow
  },
  {
    title: "Market Analytics",
    description: "Track price trends and value",
    icon: <ArrowTrendingUpIcon className="w-full h-full" />,
    color: "#1abc9c", // Teal
  },
  {
    title: "Dealership Locator",
    description: "Find nearby trusted dealers",
    icon: <MapPinIcon className="w-full h-full" />,
    color: "#e67e22", // Orange
  },
  {
    title: "Verified Listings",
    description: "All cars checked for quality",
    icon: <ShieldCheckIcon className="w-full h-full" />,
    color: "#34495e", // Dark blue
  },
  {
    title: "Premium Network",
    description: "Access to exclusive inventory",
    icon: <SparklesIcon className="w-full h-full" />,
    color: "#8e44ad", // Dark purple
  },
];

export default function HeroSection() {
  const heroRef = useRef(null);
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [featureRef, featureInView] = useInView({ threshold: 0.2 });
  const [demoRef, demoInView] = useInView({ threshold: 0.2 });

  // Automatic car rotation
  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setActiveCarIndex((prev) => (prev + 1) % demoCarData.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovering]);

  // Scroll to section helper

  return (
    <div ref={heroRef} className="relative w-full  overflow-hidden">
      {/* Dynamic background with animated gradient */}
      <div className="absolute inset-0 z-0">
        {/* Dark overlay */}
        <div className="absolute inset-0  z-10"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat z-0 opacity-20"></div>

        {/* Moving lighting effects - ANIMATIONS REMOVED */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-accent to-accent-light opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-3xl" />
      </div>

      {/* Main hero content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header and Car Carousel Section - NOW SIDE BY SIDE */}

        <div className="flex  flex-col md:flex-row items-center justify-center pt-24 pb-12 px-6 md:px-12">
          <div className="flex flex-col lg:flex-row lg:w-11/12">
            {/* Left Side: Title, Tagline, Button */}
            <motion.div // Wrapped with motion.div for fade-in
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full  flex flex-col justify-between  text-center md:text-left lg:pr-12"
            >
              {/* FLEET la hadit l button */}
              <div className="">
                <div className="relative  inline-block mb-6">
                  {" "}
                  {/* Adjusted mb-8 to mb-6 */}
                  {/* Main title with effects - ANIMATIONS REMOVED */}
                  <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white">
                    <span className="relative inline-block">
                      <span className="relative z-10">F</span>
                      <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                        F
                      </span>
                    </span>
                    <span className="relative inline-block">
                      <span className="relative z-10">L</span>
                      <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                        L
                      </span>
                    </span>
                    <span className="relative inline-block">
                      <span className="relative z-10">E</span>
                      <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                        E
                      </span>
                    </span>
                    <span className="relative inline-block">
                      <span className="relative z-10">E</span>
                      <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                        E
                      </span>
                    </span>
                    <span className="relative inline-block">
                      <span className="relative z-10">T</span>
                      <span className="absolute top-0 left-0 z-0 text-accent blur-sm opacity-80">
                        T
                      </span>
                    </span>
                  </h1>
                </div>

                {/* Animated tagline - ANIMATIONS REMOVED */}
                <div className="mt-4 max-w-2xl mx-auto md:mx-0">
                  {" "}
                  <p className="text-2xl md:text-3xl text-white/90 font-light">
                    Reimagining how you{" "}
                    <span className="text-accent font-bold bg-white/5 rounded-md p-1">
                      discover
                    </span>{" "}
                    and
                    <br />
                    <span className="text-accent font-bold bg-white/5 rounded-md p-1">
                      connect with
                    </span>{" "}
                    automotive experiences
                  </p>
                </div>
                <div className="mt-8">
                  {" "}
                  {/* Adjusted mt-12 to mt-8 */}
                  <Link href="/home" passHref>
                    <motion.span // Wrapped with motion.span for hover animation
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                      className="inline-block mt-0 bg-accent hover:bg-accent-dark transition-colors duration-300 text-white font-bold rounded-xl px-8 py-5 cursor-pointer"
                    >
                      Start Browsing
                    </motion.span>
                  </Link>
                </div>
              </div>

              {/* google play component */}
              <div className="">
                <div className="relative w-full mt-10 mx-auto p-8 rounded-2xl overflow-hidden text-center">
                  {/* Animated background - ANIMATIONS REMOVED */}
                  <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-purple-500/20 to-accent/20 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to find your next car?
                  </h3>
                  <p className="text-white/80 mb-8 max-w-xl mx-auto">
                    Join thousands of satisfied users who found their perfect
                    vehicle through FLEET.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                    <a
                      href="#"
                      className="flex items-center bg-black/80 hover:bg-black border border-white/20 rounded-xl px-5 py-2.5 w-48 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-8 h-8 text-white mr-3"
                          viewBox="0 0 384 512"
                          fill="currentColor"
                        >
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="text-white/80 text-xs">
                            Download on the
                          </span>
                          <span className="text-white font-medium text-lg leading-tight">
                            App Store
                          </span>
                        </div>
                      </div>
                    </a>

                    <a
                      href="#"
                      className="flex items-center bg-black/80 hover:bg-black border border-white/20 rounded-xl px-5 py-2.5 w-48 transition-colors"
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-8 h-8 text-white mr-3"
                          viewBox="0 0 512 512"
                          fill="currentColor"
                        >
                          <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="text-white/80 text-xs">
                            GET IT ON
                          </span>
                          <span className="text-white font-medium text-lg leading-tight">
                            Google Play
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Car Carousel */}
            <motion.div // Wrapped with motion.div for fade-in
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }} // Added delay for staggered fade-in
              className="w-full"
            >
              <RandomCarCards />
            </motion.div>
          </div>
        </div>

        {/* CTA section - ANIMATIONS REMOVED - BELOW LEFT & RIGHT */}
      </div>
    </div>
  );
}
