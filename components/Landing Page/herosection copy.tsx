"use client";

"use client";
import React, {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
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

const HeroSection = () => {
  return (
    <section className="bg-black flex justify-center w-full h-screen">
      <div className="flex flex-col sm:flex-row max-w-[1200px] align-middle h-full bg-yellow-500">
        {/* left content */}
        <div id="left content" className="bg-purple-900 w-full h-full">
          <h1 className="text-9xl">Fleet</h1>
          <h3 className="text-5xl">Lorem ipsum dolor sit amet.</h3>
          <p className="text-xl">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione
            voluptatum nisi aperiam esse architecto sed. Consequuntur voluptate
            voluptas dicta doloremque!
          </p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-full max-w-7xl mx-auto px-4 py-12 flex flex-col items-center"
          >
            <div className="relative w-full max-w-3xl mx-auto p-8 rounded-2xl overflow-hidden text-center">
              {/* Animated background */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-purple-500/20 to-accent/20 rounded-2xl"></div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to find your next car?
              </h3>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of satisfied users who found their perfect
                vehicle through FLEET.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.a>

                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
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
                      <span className="text-white/80 text-xs">GET IT ON</span>
                      <span className="text-white font-medium text-lg leading-tight">
                        Google Play
                      </span>
                    </div>
                  </div>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
        {/* right content */}
        <div id="right content" className="bg-purple-800 w-full h-full">
          <h1>Fleet</h1>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
