"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SortSelectorProps {
  onSort: (sortOption: string) => void;
  selectedOption: string | null;
  className?: string;
}

const SORT_OPTIONS = [
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "year_desc", label: "Year: Newest First" },
  { id: "year_asc", label: "Year: Oldest First" },
  { id: "mileage_asc", label: "Mileage: Low to High" },
  { id: "mileage_desc", label: "Mileage: High to Low" },
  { id: "views_desc", label: "Most Popular" },
];

const SortSelector: React.FC<SortSelectorProps> = ({
  onSort,
  selectedOption,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the label of the currently selected option
  const selectedLabel =
    SORT_OPTIONS.find((option) => option.id === selectedOption)?.label ||
    "Sort by";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionId: string) => {
    console.log("Sort option selected:", optionId); // Debug log
    onSort(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Button changes to circular on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full z-100 md:flex md:items-center md:justify-between md:px-4 md:py-3 md:bg-white md:border md:border-gray-300 md:rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent hidden md:inline-flex"
        type="button"
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          <span className="text-sm">{selectedLabel}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-300 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Mobile circular button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-12 h-12 bg-white border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
        type="button"
        aria-label="Sort options"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-80 mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-sm w-48 md:w-full"
          >
            <div className="py-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedOption === option.id
                      ? "bg-accent text-white"
                                             : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SortSelector;
