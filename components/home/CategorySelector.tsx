"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  {
    id: "Convertible",
    label: "Convertible",
    icon: (
      <img
        src="/types/convertible.png"
        alt="Convertible"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "Coupe",
    label: "Coupe",
    icon: (
      <img
        src="/types/coupe.png"
        alt="Coupe"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "Hatchback",
    label: "Hatchback",
    icon: (
      <img
        src="/types/hatchback.png"
        alt="Hatchback"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "Sedan",
    label: "Sedan",
    icon: (
      <img
        src="/types/sedan.png"
        alt="Sedan"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "Sports",
    label: "Sports",
    icon: (
      <img
        src="/types/sports.png"
        alt="Sports"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "SUV",
    label: "SUV",
    icon: (
      <img
        src="/types/suv.png"
        alt="SUV"
        className="w-full h-full object-contain"
      />
    ),
  },
  {
    id: "Classic",
    label: "Classic",
    icon: (
      <img
        src="/types/classic.png"
        alt="Classic"
        className="w-full h-full object-contain"
      />
    ),
  },
];

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryPress: (category: string) => void;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoryPress,
  className = "",
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    setShowScrollIndicator(scrollWidth > clientWidth);
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleScroll = () => {
    checkScrollPosition();
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className={`relative pb-5 w-full ${className}`}>
      <h2 className="text-xl mb-5 font-bold text-gray-800">
        Browse by Category
      </h2>

      {/* Gradient fade left: visible only on md+ */}
      {showScrollIndicator && (
        <div
          className="hidden md:block absolute left-0 top-[50px] bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-300"
          style={{ opacity: canScrollLeft ? 1 : 0 }}
        />
      )}

      {/* Left arrow navigation button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white/60 hover:bg-white/80 text-gray-800 rounded-full p-2 items-center justify-center transition-all duration-300 shadow-md"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <motion.div
        ref={scrollRef}
        className="flex flex-nowrap space-x-6 overflow-x-auto pb-4 scrollbar-hide"
        onScroll={handleScroll}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {CATEGORIES.map((category) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            className="flex-shrink-0 p-2"
          >
            <button
              onClick={() => onCategoryPress(category.id)}
              className="flex flex-col items-center"
            >
              <div
                className={`p-3 rounded-lg transition-all duration-300 ${
                  selectedCategories.includes(category.id)
                    ? "bg-accent/20 ring-2 ring-accent"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="w-20 h-20 relative">{category.icon}</div>
              </div>
              <span
                className={`mt-2 text-sm ${
                  selectedCategories.includes(category.id)
                    ? "text-accent font-semibold"
                    : "text-gray-600"
                }`}
              >
                {category.label}
              </span>
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Right arrow navigation button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white/60 hover:bg-white/80 text-gray-800 rounded-full p-2 items-center justify-center transition-all duration-300 shadow-md"
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Gradient fade right: visible only on md+ */}
      {showScrollIndicator && (
        <div
          className="hidden md:block absolute right-0 top-[50px] bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-300"
          style={{ opacity: canScrollRight ? 1 : 0 }}
        />
      )}

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

export default CategorySelector;
