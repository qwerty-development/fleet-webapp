"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import RandomCarCards from "./RandomCarCards";

const useInView = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null);
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

const demoCarData = [
  {
    id: 1,
    make: "Mercedes",
    model: "C-Class",
    year: 2023,
    price: 54000,
    mileage: 5,
    fuel: "Hybrid",
    image: "/api/placeholder/500/300",
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
    image: "/api/placeholder/500/300",
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
    image: "/api/placeholder/500/300",
    dealerName: "Luxury Cars",
    location: "West End",
    rating: 4.9,
  },
];

const features = [
  {
    title: "Verified Dealers",
    description: "We partner with top-rated and verified car dealers.",
    icon: <StarIcon className="w-8 h-8 text-yellow-400" />,
    color: "#facc15",
  },
  {
    title: "Affordable Prices",
    description: "Find the best deals without compromise.",
    icon: <StarIcon className="w-8 h-8 text-green-400" />,
    color: "#4ade80",
  },
  {
    title: "Trusted Service",
    description: "We deliver an end-to-end seamless buying experience.",
    icon: <StarIcon className="w-8 h-8 text-blue-400" />,
    color: "#60a5fa",
  },
];

export default function HeroSection() {
  const heroRef = useRef(null);
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [featureRef, featureInView] = useInView({ threshold: 0.2 });
  const [demoRef, demoInView] = useInView({ threshold: 0.2 });
  const [animatedFeatures, setAnimatedFeatures] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setActiveCarIndex((prev) => (prev + 1) % demoCarData.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovering]);

  return (
    <div ref={heroRef} className="relative w-full py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-accent/20 to-accent-light/20 opacity-30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col">
        <div className="flex flex-col md:flex-row items-center justify-center">
          <div className="flex flex-col w-11/12 xl:w-9/12">
            <div className="flex flex-col lg:flex-row gap-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full flex flex-col justify-between text-center md:text-left lg:pr-12"
              >
                {/* Modern feature cards */}
                <div ref={featureRef} className="grid gap-4">
                  {features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 50 }}
                      animate={
                        animatedFeatures[idx]
                          ? { opacity: 1, y: 0 }
                          : featureInView
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: 50 }
                      }
                      transition={{
                        duration: 0.5,
                        delay: idx * 0.2,
                        onComplete: () => {
                          if (!animatedFeatures[idx]) {
                            setAnimatedFeatures((prevState) => ({
                              ...prevState,
                              [idx]: true,
                            }));
                          }
                        },
                      }}
                      className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent-light/20 group-hover:from-accent/30 group-hover:to-accent-light/30 transition-all duration-300">
                          <div className="text-2xl text-accent">
                            {feature.icon}
                          </div>
                        </div>
                        <h3 className="text-xl text-gray-900 font-bold">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-start mt-3 font-medium">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mb-5 lg:mb-0 mt-8">
                  <div className="relative w-full mx-auto p-8 md:p-12 lg:p-16 rounded-3xl overflow-hidden text-center bg-gradient-to-br from-accent/10 via-white to-accent-light/10 border-2 border-accent/20 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4"
                    >
                      Ready to find your{" "}
                      <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
                        dream car?
                      </span>
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-gray-600 mb-10 max-w-xl mx-auto text-lg font-medium"
                    >
                      Join thousands of satisfied users who found their perfect
                      vehicle through FLEET.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-0"
                    >
                      <a
                        href="https://apps.apple.com/lb/app/fleet-your-auto-marketplace/id6742141291?uo=2"
                        target="_blank"
                        className="group flex items-center bg-black hover:bg-gray-900 border-2 border-black rounded-2xl px-6 py-4 w-52 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                            <span className="text-white/70 text-xs font-medium">
                              Download on the
                            </span>
                            <span className="text-white font-bold text-lg leading-tight">
                              App Store
                            </span>
                          </div>
                        </div>
                      </a>

                      <a
                        href="https://apps.apple.com/lb/app/fleet-your-auto-marketplace/id6742141291?uo=2"
                        target="_blank"
                        className="group flex items-center bg-black hover:bg-gray-900 border-2 border-black rounded-2xl px-6 py-4 w-52 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                            <span className="text-white/70 text-xs font-medium">
                              GET IT ON
                            </span>
                            <span className="text-white font-bold text-lg leading-tight">
                              Google Play
                            </span>
                          </div>
                        </div>
                      </a>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full h-full"
              >
                <RandomCarCards />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
