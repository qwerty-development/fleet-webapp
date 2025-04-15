"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import DealerNavbar from "@/components/dealer/navbar";
import Image from "next/image";
import {
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TruckIcon,
  TagIcon,
  DocumentTextIcon,
  KeyIcon,
  SparklesIcon,
  MapPinIcon,
  FlagIcon,
  GlobeAmericasIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  CameraIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import { CompactPicker } from 'react-color';

// Constants for selection options
const CONDITIONS = [
  { value: "New", label: "New", icon: "sparkles" },
  { value: "Used", label: "Used", icon: "truck" },
];

const TRANSMISSIONS = [
  { value: "Automatic", label: "Automatic", icon: "cog" },
  { value: "Manual", label: "Manual", icon: "hand" },
];

const DRIVETRAIN_OPTIONS = [
  { value: "FWD", label: "Front Wheel Drive", icon: "arrow-trending-up" },
  { value: "RWD", label: "Rear Wheel Drive", icon: "arrow-trending-down" },
  { value: "AWD", label: "All Wheel Drive", icon: "arrows-right-left" },
  { value: "4WD", label: "Four Wheel Drive", icon: "cog" }
];

const VEHICLE_TYPES = [
  { value: "Benzine", label: "Gasoline", icon: "fire" },
  { value: "Diesel", label: "Diesel", icon: "truck" },
  { value: "Electric", label: "Electric", icon: "bolt" },
  { value: "Hybrid", label: "Hybrid", icon: "sun" }
];

const CATEGORIES = [
  { value: "Sedan", label: "Sedan", icon: "truck" },
  { value: "SUV", label: "SUV", icon: "truck" },
  { value: "Coupe", label: "Coupe", icon: "truck" },
  { value: "Hatchback", label: "Hatchback", icon: "truck" },
  { value: "Convertible", label: "Convertible", icon: "truck" },

];

const SOURCE_OPTIONS = [
  { value: "Company", label: "Company Source", icon: <BuildingOfficeIcon className="h-5 w-5" /> },
  { value: "GCC", label: "GCC", icon: <MapPinIcon className="h-5 w-5" /> },
  { value: "USA", label: "US", icon: <FlagIcon className="h-5 w-5" /> },
  { value: "Canada", label: "Canada", icon: <FlagIcon className="h-5 w-5" /> },
  { value: "Europe", label: "Europe", icon: <GlobeAmericasIcon className="h-5 w-5" /> }
];

const VEHICLE_FEATURES = [
  { id: 'heated_seats', label: 'Heated Seats', icon: 'temperature-high' },
  { id: 'keyless_entry', label: 'Keyless Entry', icon: 'key' },
  { id: 'keyless_start', label: 'Keyless Start', icon: 'power-off' },
  { id: 'power_mirrors', label: 'Power Mirrors', icon: 'car-side' },
  { id: 'power_steering', label: 'Power Steering', icon: 'steering-wheel' },
  { id: 'power_windows', label: 'Power Windows', icon: 'window-maximize' },
  { id: 'backup_camera', label: 'Backup Camera', icon: 'camera' },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth' },
  { id: 'cruise_control', label: 'Cruise Control', icon: 'tachometer-alt' },
  { id: 'navigation', label: 'Navigation System', icon: 'map-marker-alt' },
  { id: 'sunroof', label: 'Sunroof', icon: 'sun' },
  { id: 'leather_seats', label: 'Leather Seats', icon: 'couch' },
  { id: 'third_row_seats', label: 'Third Row Seats', icon: 'chair' },
  { id: 'parking_sensors', label: 'Parking Sensors', icon: 'parking' },
  { id: 'lane_assist', label: 'Lane Departure Warning', icon: 'road' },
  { id: 'blind_spot', label: 'Blind Spot Monitoring', icon: 'eye-slash' },
  { id: 'apple_carplay', label: 'Apple CarPlay', icon: 'apple' },
  { id: 'android_auto', label: 'Android Auto', icon: 'android' },
  { id: 'premium_audio', label: 'Premium Audio', icon: 'volume-up' },
  { id: 'remote_start', label: 'Remote Start', icon: 'key' }
];

// Define a color list with common car colors
const CAR_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Silver', value: '#C0C0C0' },
  { label: 'Gray', value: '#808080' },
  { label: 'Red', value: '#FF0000' },
  { label: 'Blue', value: '#0000FF' },
  { label: 'Green', value: '#008000' },
  { label: 'Yellow', value: '#FFFF00' },
  { label: 'Brown', value: '#A52A2A' },
  { label: 'Orange', value: '#FFA500' },
  { label: 'Purple', value: '#800080' },
  { label: 'Gold', value: '#FFD700' },
  { label: 'Beige', value: '#F5F5DC' },
  { label: 'Navy', value: '#000080' },
  { label: 'Burgundy', value: '#800020' },
  { label: 'Other', value: 'other' }
];

// Component for section headers
const SectionHeader = ({ title, subtitle }:any) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
    {subtitle && <p className="text-gray-400">{subtitle}</p>}
  </div>
);

// Selection Card component for option selection
const SelectionCard = ({ label, icon, isSelected, onSelect }:any) => (
  <div
    className={`
      relative mr-3 mb-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200
      ${isSelected
        ? 'bg-indigo-600 shadow-lg border border-indigo-700 transform scale-105'
        : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'}
    `}
    onClick={onSelect}
  >
    <div className="flex items-center">
      {icon && typeof icon === 'object' ?
        <div className="mr-2">{icon}</div> :
        <div className="mr-2 w-5 h-5"></div>
      }
      <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-300'}`}>
        {label}
      </span>
      {isSelected && (
        <CheckIcon className="h-4 w-4 text-white ml-2" />
      )}
    </div>
    {isSelected && (
      <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2">
        <div className="bg-green-500 rounded-full p-1 border-2 border-gray-900">
          <CheckIcon className="h-3 w-3 text-white" />
        </div>
      </div>
    )}
  </div>
);

// Feature Selector component
const FeatureSelector = ({ selectedFeatures = [], onFeatureToggle }:any) => {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter features based on search query
  const filteredFeatures = useMemo(() =>
    VEHICLE_FEATURES.filter(feature =>
      feature.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
    ),
    [searchQuery]
  );

  // Render feature item
  const FeatureItem = ({ feature, isSelected, onClick }:any) => (
    <div
      className={`
        relative p-4 m-2 rounded-xl cursor-pointer transition-all duration-200
        ${isSelected
          ? 'bg-indigo-600/20 border border-indigo-500 transform scale-105'
          : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'}
      `}
      onClick={onClick}
    >
      <div className="text-center">
        <div className="mb-2 flex justify-center items-center">
          {/* Here we'd use an icon based on feature.icon, but for simplicity using generic icons */}
          <SparklesIcon className={`h-6 w-6 ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`} />
        </div>
        <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-300'}`}>
          {feature.label}
        </span>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="bg-indigo-500 rounded-full p-1">
            <CheckIcon className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">
            {selectedFeatures.length > 0
              ? `${selectedFeatures.length} Selected Features`
              : 'Select Features'}
          </h3>
          {selectedFeatures.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAllFeatures(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
        >
          View All
        </button>
      </div>

      {/* Featured Grid - shows a subset of features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {VEHICLE_FEATURES.slice(0, 10).map(feature => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            isSelected={selectedFeatures.includes(feature.id)}
            onClick={() => onFeatureToggle(feature.id)}
          />
        ))}
      </div>

      {/* All Features Modal */}
      {showAllFeatures && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">All Features ({filteredFeatures.length})</h3>
                <button
                  onClick={() => setShowAllFeatures(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Search bar */}
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Selected count badge */}
              {selectedFeatures.length > 0 && (
                <div className="mt-4 py-2 px-4 bg-gray-800 rounded-lg">
                  <p className="text-center text-white">
                    {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Features grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFeatures.map(feature => (
                  <FeatureItem
                    key={feature.id}
                    feature={feature}
                    isSelected={selectedFeatures.includes(feature.id)}
                    onClick={() => onFeatureToggle(feature.id)}
                  />
                ))}
              </div>

              {filteredFeatures.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No features found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setShowAllFeatures(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Color Selector component
const EnhancedColorSelector = ({ value, onChange }:any) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [customColorName, setCustomColorName] = useState('');

  // Handle custom color submission
  const handleCustomColorSubmit = () => {
    if (customColorName.trim() && customColor) {
      onChange(`${customColorName.trim()} (${customColor})`);
      setShowColorPicker(false);
      setCustomColorName('');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
        {CAR_COLORS.map(color => (
          <div
            key={color.value}
            onClick={() => color.value === 'other' ? setShowColorPicker(true) : onChange(color.label)}
            className={`
              relative px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center
              ${value === color.label
                ? 'ring-2 ring-indigo-500 bg-gray-800 font-medium'
                : 'bg-gray-800 hover:bg-gray-750'}
            `}
          >
            {color.value !== 'other' && (
              <div
                className="w-4 h-4 rounded-full mr-2 border border-gray-600"
                style={{ backgroundColor: color.value }}
              />
            )}
            {color.value === 'other' && (
              <span className="w-4 h-4 rounded-full mr-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></span>
            )}
            <span className="text-sm text-white">{color.label}</span>
            {value === color.label && (
              <CheckIcon className="h-4 w-4 text-indigo-400 ml-auto" />
            )}
          </div>
        ))}
      </div>

      {/* Custom color picker modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Custom Color</h3>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Color Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  placeholder="Enter color name (e.g. Midnight Blue)"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Select Color
                </label>
                <div className="p-2 bg-gray-800 rounded-lg">
                  <CompactPicker
                    color={customColor}
                    onChange={(color) => setCustomColor(color.hex)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <div className="mr-4">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-600"
                    style={{ backgroundColor: customColor || '#FFFFFF' }}
                  />
                </div>
                <div className="flex-1 text-white">
                  {customColorName || 'No name'}
                  <span className="text-gray-400 ml-2">
                    {customColor || 'No color selected'}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomColorSubmit}
                  disabled={!customColorName.trim() || !customColor}
                  className={`
                    px-4 py-2 rounded-lg text-white
                    ${(!customColorName.trim() || !customColor)
                      ? 'bg-indigo-800 opacity-50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'}
                  `}
                >
                  Add Custom Color
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Brand selector with search and dynamic data
const BrandSelector = ({ selectedBrand, onSelectBrand }:any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [carBrands, setCarBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Fetch brands from database or API
  useEffect(() => {
// REPLACE the fetchBrands function in BrandSelector with:
const fetchBrands = async () => {
  setIsLoading(true);
  try {
    // Fetch unique makes from allcars table
    const { data, error } = await supabase
      .from('allcars')
      .select('make')
      .order('make');

    if (error) throw error;

    // Extract unique makes using Set
    const uniqueMakes:any = [...new Set(data.map(item => item.make))];

    if (uniqueMakes.length === 0) {
      throw new Error('No brands available');
    }

    setCarBrands(uniqueMakes);
  } catch (err) {
    console.error("Error fetching car brands:", err);
    // Fallback to empty state with error display
    setCarBrands([]);
  } finally {
    setIsLoading(false);
  }
};

    fetchBrands();
  }, [supabase]);

  // Filter brands based on search term
  const filteredBrands = useMemo(() => {
    if (!searchTerm) return carBrands;
    return carBrands.filter(brand =>
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [carBrands, searchTerm]);

  const handleSelectBrand = (brand) => {
    onSelectBrand(brand);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative mb-6">
      <div
        className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="text-white">
            {selectedBrand || "Select Brand"}
          </span>
        </div>
        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2">
            <div className="mb-2 relative">
              <input
                type="text"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="text-gray-400 mt-2">Loading brands...</p>
                </div>
              ) : (
                filteredBrands.length > 0 ? (
                  filteredBrands.map(brand => (
                    <div
                      key={brand}
                      className={`
                        p-2 cursor-pointer hover:bg-gray-800 rounded-md
                        ${selectedBrand === brand ? 'bg-indigo-900' : ''}
                      `}
                      onClick={() => handleSelectBrand(brand)}
                    >
                      <div className="flex items-center">
                        <span className={`${selectedBrand === brand ? 'text-white' : 'text-gray-300'}`}>
                          {brand}
                        </span>
                        {selectedBrand === brand && (
                          <CheckIcon className="h-4 w-4 text-indigo-400 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-400">
                    No brands found matching "{searchTerm}"
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Model dropdown component with dynamic loading based on selected brand
// Model dropdown component with Supabase integration
const ModelDropdown = ({ make, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const supabase = createClient();

  // Fetch models for selected make from allcars table
  useEffect(() => {
    if (!make) {
      setModels([]);
      setError(null);
      return;
    }

    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('allcars')
          .select('model')
          .eq('make', make)
          .order('model');

        if (error) throw error;

        // Extract unique models
        const uniqueModels = [...new Set(data.map(item => item.model))];
        setModels(uniqueModels);

        if (uniqueModels.length === 0) {
          setError(`No models found for ${make}`);
        }
      } catch (err) {
        console.error(`Error fetching models for ${make}:`, err);
        setError(`Failed to load models for ${make}`);
        setModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [make, supabase]);

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!searchTerm) return models;
    return models.filter(model =>
      model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  const handleSelectModel = (model) => {
    onChange(model);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Show only a subset of models if the list is very long
  const displayModels = useMemo(() => {
    if (searchTerm) return filteredModels;
    // If no search term, only show first 100 models
    return models.slice(0, 100);
  }, [filteredModels, models, searchTerm]);

  return (
    <div className="relative mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Model <span className="text-red-500">*</span>
      </label>

      {make ? (
        <>
          <div
            className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <span className="text-white">
                {value || "Select Model"}
              </span>
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </div>

          {isOpen && (
            <div className="absolute z-30 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div className="p-2">
                <div className="mb-2 relative">
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchTerm('')}
                    >
                      <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="text-gray-400 mt-2">Loading models...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4 text-gray-400">
                      <p>{error}</p>
                      {searchTerm && (
                        <button
                          className="mt-2 w-full p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white"
                          onClick={() => handleSelectModel(searchTerm)}
                        >
                          Use "{searchTerm}" as model
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {displayModels.length > 0 ? (
                        displayModels.map(model => (
                          <div
                            key={model}
                            className={`
                              p-2 cursor-pointer hover:bg-gray-800 rounded-md
                              ${value === model ? 'bg-indigo-900' : ''}
                            `}
                            onClick={() => handleSelectModel(model)}
                          >
                            <div className="flex items-center">
                              <span className={`${value === model ? 'text-white' : 'text-gray-300'}`}>
                                {model}
                              </span>
                              {value === model && (
                                <CheckIcon className="h-4 w-4 text-indigo-400 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-400">
                          <p>No models found matching "{searchTerm}"</p>
                          <button
                            className="mt-2 w-full p-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white"
                            onClick={() => handleSelectModel(searchTerm)}
                          >
                            Use "{searchTerm}" as model
                          </button>
                        </div>
                      )}

                      {!searchTerm && models.length > 100 && (
                        <p className="text-center py-2 text-sm text-gray-400">
                          Showing 100 of {models.length} models. Type to search for more.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <input
          type="text"
          className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
          placeholder="Select a brand first"
          disabled
        />
      )}
    </div>
  );
};

// Enhanced gallery component for images
const FuturisticGallery = ({ images, onAdd, onRemove, onReorder, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (index) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      const newImages = [...images];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, removed);
      onReorder(newImages);
    }
    setIsDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {/* Image gallery */}
        {images.map((url, index) => (
          <div
            key={url}
            className={`
              relative group h-40 bg-gray-700 rounded-lg overflow-hidden
              ${dragOverIndex === index ? 'scale-105 border-2 border-indigo-500' : ''}
              transition-all duration-200
            `}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => {
              setIsDragging(false);
              setDraggedIndex(null);
              setDragOverIndex(null);
            }}
          >
            <img
              src={url}
              alt={`Vehicle ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-5 w-5 text-white" />
              </button>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...images];
                    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                    onReorder(newImages);
                  }}
                  className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <ArrowsUpDownIcon className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-indigo-500 text-xs text-white px-2 py-1 rounded-md">
                Main Image
              </div>
            )}
          </div>
        ))}

        {/* Upload button */}
        {images.length < 10 && (
          <label className="h-40 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            ) : (
              <>
                <PlusIcon className="h-10 w-10 text-gray-400" />
                <span className="text-gray-400 mt-2">Add Images</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onAdd}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      <p className="text-sm text-gray-400">
        {images.length}/10 images uploaded. {images.length > 0 ? 'Drag and drop to reorder. ' : ''}
        The first image will be used as the main listing image.
      </p>
    </div>
  );
};

export default function AddInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealership, setDealership] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialData, setInitialData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state with more comprehensive defaults
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    price: "",
    year: new Date().getFullYear(),
    description: "",
    condition: "",
    transmission: "",
    color: "",
    mileage: 0,
    drivetrain: "",
    type: "",
    category: "",
    status: "pending",
    source: "",
    bought_price: "",
    date_bought: new Date().toISOString().split("T")[0],
    seller_name: "",
    features: []
  });

  // Fetch dealer information on load
  useEffect(() => {
    async function fetchDealershipData() {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (dealershipError) throw dealershipError;

        setDealership(dealershipData);

        // Check subscription status
        const endDate = new Date(dealershipData.subscription_end_date);
        const now = new Date();
        if (endDate < now) {
          alert("Your subscription has expired. Please renew to add new listings.");
          router.push("/dealer/profile");
        }
      } catch (error) {
        console.error("Error fetching dealership:", error);
        alert("Could not fetch dealership information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDealershipData();
  }, [user, supabase, router]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "mileage" || name === "year" || name === "bought_price"
        ? value === "" ? "" : parseInt(value)
        : value
    }));

    setHasChanges(true);
  };

  // Handle direct state updates (for custom components)
  const handleDirectChange = (name, value) => {
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "mileage" || name === "year" || name === "bought_price"
        ? value === "" ? "" : parseInt(value)
        : value
    }));

    setHasChanges(true);
  };

  // Handle feature selection
  const handleFeatureToggle = (featureId) => {
    setFormData(prev => {
      const features = [...(prev.features || [])];
      const index = features.indexOf(featureId);

      if (index === -1) {
        features.push(featureId);
      } else {
        features.splice(index, 1);
      }

      return {
        ...prev,
        features
      };
    });

    setHasChanges(true);
  };

  // Optimized image handling with preprocessing
  const processImage = async (file) => {
    // In a real implementation, we would add client-side image optimization here
    // For now, we're just returning the file as is
    return file;
  };

  // Handle image uploads
  const handleImageUpload = async (e) => {
    if (!e.target.files || !dealership) return;

    try {
      setUploadLoading(true);

      const files = Array.from(e.target.files);

      // Validate file size and type
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const validFiles = files.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} is too large (max 5MB).`);
          return false;
        }
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setUploadLoading(false);
        return;
      }

      // Process images for optimization
      const processedFiles = await Promise.all(
        validFiles.map(file => processImage(file))
      );

      const uploadPromises = processedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${dealership.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('cars')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...newImageUrls]);
      setHasChanges(true);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Remove image
  const handleRemoveImage = async (urlToRemove) => {
    try {
      // Extract file path from URL
      const storageUrl = supabase.storageUrl || "";
      const relativePath = urlToRemove.replace(`${storageUrl}/object/public/cars/`, "");

      // Remove from storage
      await supabase.storage
        .from('cars')
        .remove([relativePath]);

      // Update state
      setUploadedImages(prev => prev.filter(url => url !== urlToRemove));
      setHasChanges(true);
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove image. Please try again.");
    }
  };

  // Reorder images
  const handleReorderImages = (newOrder) => {
    setUploadedImages(newOrder);
    setHasChanges(true);
  };

  // Enhanced validation with more detailed feedback
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    const requiredFields = [
      { key: 'make', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'price', label: 'Price' },
      { key: 'year', label: 'Year' },
      { key: 'condition', label: 'Condition' },
      { key: 'transmission', label: 'Transmission' },
      { key: 'mileage', label: 'Mileage' },
      { key: 'drivetrain', label: 'Drivetrain' },
      { key: 'type', label: 'Fuel Type' },
      { key: 'category', label: 'Category' }
    ];

    requiredFields.forEach(field => {
      if (!formData[field.key] && formData[field.key] !== 0) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    // Image validation
    if (uploadedImages.length === 0) {
      newErrors.images = "At least one image is required";
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (formData.year && (formData.year < 1900 || formData.year > currentYear + 1)) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }

    // Price validation
    if (formData.price && formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    // Mileage validation
    if (formData.mileage < 0) {
      newErrors.mileage = "Mileage cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!dealership) {
      alert("Dealership information not found. Please try again.");
      return;
    }

    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstError);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSubmitting(true);

      const carData = {
        ...formData,
        images: uploadedImages,
        dealership_id: dealership.id,
        date_bought: formData.date_bought || new Date().toISOString().split("T")[0],
        bought_price: formData.bought_price || null,
        views: 0,
        likes: 0,
        viewed_users: [],
        liked_users: []
      };

      const { data, error } = await supabase
        .from('cars')
        .insert(carData)
        .select();

      if (error) throw error;

      alert("Listing created successfully!");
      router.push('/dealer/inventory');
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push('/dealer/inventory');
      }
    } else {
      router.push('/dealer/inventory');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        <DealerNavbar />
        <div className="pt-16 lg:pt-0 lg:pl-64">
          <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={handleCancel}
              className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Add New Vehicle</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Images */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Vehicle Images"
                subtitle="Upload high-quality photos of your vehicle (up to 10)"
              />

              {errors.images && (
                <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                  {errors.images}
                </div>
              )}

              <FuturisticGallery
                images={uploadedImages}
                onAdd={handleImageUpload}
                onRemove={handleRemoveImage}
                onReorder={handleReorderImages}
                isUploading={uploadLoading}
              />
            </div>

            {/* Basic Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Basic Information"
                subtitle="Essential details about your vehicle"
              />

              {/* Make/Brand */}
              <div className="mb-6">
                <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                  Brand/Make <span className="text-red-500">*</span>
                </label>
                <BrandSelector
                  selectedBrand={formData.make}
                  onSelectBrand={(brand) => {
                    handleDirectChange("make", brand);
                    handleDirectChange("model", "");
                  }}
                />
                {errors.make && <p className="mt-1 text-sm text-red-500">{errors.make}</p>}
              </div>

              {/* Model */}
              <ModelDropdown
                make={formData.make}
                value={formData.model}
                onChange={(model) => handleDirectChange("model", model)}
              />
              {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Year */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="Enter year"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className={`w-full pl-10 px-4 py-2.5 bg-gray-700 border ${
                        errors.year ? "border-red-500" : "border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    />
                  </div>
                  {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Enter price"
                      min="0"
                      className={`w-full pl-10 px-4 py-2.5 bg-gray-700 border ${
                        errors.price ? "border-red-500" : "border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    />
                  </div>
                  {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>
              </div>

              {/* Color */}
              <div className="mb-6">
                <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">
                  Color
                </label>
                <EnhancedColorSelector
                  value={formData.color}
                  onChange={(color) => handleDirectChange("color", color)}
                />
                {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter vehicle description"
                    className="w-full pl-10 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Classifications */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Vehicle Classifications"
                subtitle="Select appropriate categories for your vehicle"
              />

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap">
                  {CATEGORIES.map(option => (
                    <SelectionCard
                      key={option.value}
                      label={option.label}
                      icon={<TruckIcon className="h-5 w-5" />}
                      isSelected={formData.category === option.value}
                      onSelect={() => handleDirectChange("category", option.value)}
                    />
                  ))}
                </div>
                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
              </div>

              {/* Condition */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap">
                  {CONDITIONS.map(option => (
                    <SelectionCard
                      key={option.value}
                      label={option.label}
                      icon={<SparklesIcon className="h-5 w-5" />}
                      isSelected={formData.condition === option.value}
                      onSelect={() => handleDirectChange("condition", option.value)}
                    />
                  ))}
                </div>
                {errors.condition && <p className="mt-1 text-sm text-red-500">{errors.condition}</p>}
              </div>

              {/* Source */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Source
                </label>
                <div className="flex flex-wrap">
                  {SOURCE_OPTIONS.map(option => (
                    <SelectionCard
                      key={option.value}
                      label={option.label}
                      icon={option.icon}
                      isSelected={formData.source === option.value}
                      onSelect={() => handleDirectChange("source", option.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Fuel Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap">
                  {VEHICLE_TYPES.map(option => (
                    <SelectionCard
                      key={option.value}
                      label={option.label}
                      icon={<TagIcon className="h-5 w-5" />}
                      isSelected={formData.type === option.value}
                      onSelect={() => handleDirectChange("type", option.value)}
                    />
                  ))}
                </div>
                {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Technical Specifications"
                subtitle="Detailed technical information about your vehicle"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Mileage */}
                <div>
                  <label htmlFor="mileage" className="block text-sm font-medium text-gray-300 mb-1">
                    Mileage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="mileage"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleChange}
                      min="0"
                      placeholder="Enter mileage"
                      className={`w-full px-4 py-2.5 bg-gray-700 border ${
                        errors.mileage ? "border-red-500" : "border-gray-600"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">km</span>
                    </div>
                  </div>
                  {errors.mileage && <p className="mt-1 text-sm text-red-500">{errors.mileage}</p>}
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Transmission <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap">
                    {TRANSMISSIONS.map(option => (
                      <SelectionCard
                        key={option.value}
                        label={option.label}
                        isSelected={formData.transmission === option.value}
                        onSelect={() => handleDirectChange("transmission", option.value)}
                      />
                    ))}
                  </div>
                  {errors.transmission && <p className="mt-1 text-sm text-red-500">{errors.transmission}</p>}
                </div>

                {/* Drivetrain */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Drivetrain <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap">
                    {DRIVETRAIN_OPTIONS.map(option => (
                      <SelectionCard
                        key={option.value}
                        label={option.label}
                        isSelected={formData.drivetrain === option.value}
                        onSelect={() => handleDirectChange("drivetrain", option.value)}
                      />
                    ))}
                  </div>
                  {errors.drivetrain && <p className="mt-1 text-sm text-red-500">{errors.drivetrain}</p>}
                </div>
              </div>
            </div>

            {/* Vehicle Features */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Vehicle Features"
                subtitle="Select the features and options that your vehicle includes"
              />

              <FeatureSelector
                selectedFeatures={formData.features}
                onFeatureToggle={handleFeatureToggle}
              />
            </div>

            {/* Purchase Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <SectionHeader
                title="Purchase Information"
                subtitle="Optional details about how you acquired this vehicle"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Purchase Price */}
                <div>
                  <label htmlFor="bought_price" className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Price
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="bought_price"
                      name="bought_price"
                      value={formData.bought_price}
                      onChange={handleChange}
                      min="0"
                      placeholder="Enter purchase price"
                      className="w-full pl-10 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label htmlFor="date_bought" className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="date_bought"
                      name="date_bought"
                      value={formData.date_bought}
                      onChange={handleChange}
                      className="w-full pl-10 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    />
                  </div>
                </div>

                {/* Seller */}
                <div>
                  <label htmlFor="seller_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Bought From
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="seller_name"
                      name="seller_name"
                      value={formData.seller_name}
                      onChange={handleChange}
                      placeholder="Enter seller name"
                      className="w-full pl-10 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-6 flex justify-end space-x-4 bg-gray-950/80 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-xl">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center transition-colors"
                disabled={isSubmitting}
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Add Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}