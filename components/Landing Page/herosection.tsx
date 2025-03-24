'use client'
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import RandomCarCards from "./RandomCarCards";

export default function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background with image fading from right to left */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay for fade effect (right to left) */}
        <div 
          className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-black/60 to-black"
        ></div>
        
        {/* Hero image positioned to the right */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero.jpg" 
            alt="Hero image" 
            className="object-cover h-full w-full md:w-3/4 ml-auto" 
          />
        </div>
      </div>

      {/* Content container */}
      <div className="relative z-10 min-h-screen container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col h-screen">
          <div className="my-auto max-w-xl lg:max-w-2xl py-12">
            {/* Main text content (left-aligned) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6">
                FLEET
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 font-light mb-8">
                Reimagining how you
                <span className="relative inline-block mx-2 px-2">
                  <span className="relative z-10">discover</span>
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </span>
                and
                <span className="relative inline-block mx-2 px-2">
                  <span className="relative z-10">connect with</span>
                  <motion.span
                    className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                </span>
                automotive experiences
              </p>
              
              {/* CTA buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/home" passHref>
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block bg-accent hover:bg-accent-dark transition-colors duration-300 text-white font-bold rounded-xl px-8 py-4 cursor-pointer text-center sm:text-left"
                  >
                    Download now
                  </motion.span>
                </Link>
              
              </div>
              
              {/* Mobile app download buttons */}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}