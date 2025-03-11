// components/dealerships/DealershipSortSelector.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DealershipSortSelectorProps {
  onSort: (sortOption: string) => void;
  selectedOption: string | null;
  className?: string;
}

const DEALERSHIP_SORT_OPTIONS = [
  { id: "name_asc", label: "Name: A-Z" },
  { id: "name_desc", label: "Name: Z-A" },
];

const DealershipSortSelector: React.FC<DealershipSortSelectorProps> = ({
  onSort,
  selectedOption,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    DEALERSHIP_SORT_OPTIONS.find((option) => option.id === selectedOption)?.label ||
    "Sort by";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (optionId: string) => {
    onSort(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Desktop Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:flex md:items-center md:justify-between md:px-4 md:py-3 md:bg-gray-800 md:border md:border-gray-700 md:rounded-full text-white focus:outline-none focus:ring-2 focus:ring-accent hidden md:inline-flex"
        type="button"
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6" />
          </svg>
          <span className="text-sm">{selectedLabel}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mobile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-12 h-12 bg-gray-800 border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-accent"
        type="button"
        aria-label="Sort options"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-48 md:w-full"
          >
            <div className="py-1">
              {DEALERSHIP_SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedOption === option.id
                      ? "bg-accent text-white"
                      : "text-gray-300 hover:bg-gray-700"
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

export default DealershipSortSelector;
