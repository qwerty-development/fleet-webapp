'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Brand {
  name: string;
  logoUrl: string;
}

interface BrandRowProps {
  brands: Brand[];
  onBrandSelect: (brand: string) => void;
  selectedBrands: string[];
  className?: string;
}

const BrandRow: React.FC<BrandRowProps> = ({
  brands,
  onBrandSelect,
  selectedBrands,
  className = ""
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if we need to show scroll indicators
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to update indicators
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    setShowScrollIndicator(scrollWidth > clientWidth);
  };

  // Initialize scroll indicators
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [brands]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  // Scroll handler
  const handleScroll = () => {
    checkScrollPosition();
  };


  return (
    <div className={`relative pt-16 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl z-40 font-bold text-white">
          Explore by Brands
        </h2>
        <Link href="/allbrands" className="text-accent z-20 hover:text-accent-light transition-colors flex items-center">
          <span>View All</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Gradient fade on left side (shows when scrollable left) */}
      {showScrollIndicator && (
        <div
          className={`hidden md:block absolute left-0 top-[50px] bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Scrollable brands container */}
      <motion.div
        ref={scrollRef}
        className="flex flex-nowrap space-x-6 overflow-x-auto pb-4 scrollbar-hide"
        onScroll={handleScroll}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {brands.map((brand, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex-shrink-0 p-2"
          >
            <button
              onClick={() => onBrandSelect(brand.name)}
              className="flex flex-col items-center"
            >
              <div
                className={`p-3 rounded-lg transition-all duration-300 ${
                  selectedBrands.includes(brand.name)
                    ? "bg-accent/20 ring-2 ring-accent"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                <div className="w-20 h-20 relative">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback if logo fails to load
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                </div>
              </div>
              <span className={`mt-2 text-sm ${
                selectedBrands.includes(brand.name)
                  ? "text-accent font-semibold"
                  : "text-gray-300"
              }`}>
                {brand.name}
              </span>
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Gradient fade on right side (shows when scrollable right) */}
      {showScrollIndicator && (
        <div
          className={`hidden md:block absolute right-0 top-[50px] bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Custom scrollbar hiding CSS - Applied to motion.div above */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BrandRow;