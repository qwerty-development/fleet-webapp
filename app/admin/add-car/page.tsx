"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  TruckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  EyeIcon,
  BuildingOffice2Icon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';
import AdminNavbar from '@/components/admin/navbar';

/**
 * Type Definitions
 */
interface Dealership {
  id: string;
  name: string;
  location: string;
  phone: string;
}

interface CarFormData {
  dealership_id: string;
  make: string;
  model: string;
  trim: string;
  year: string;
  price: string;
  color: string;
  category: string;
  fuel_type: string;
  source: string;
  description: string;
  mileage: string;
  transmission: string;
  drivetrain: string;
  condition: string;
  features: string[];
  bought_price: string;
  date_bought: string;
  seller_name: string;
}

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  name: string;
}

interface FormErrors {
  [key: string]: string;
}

const VEHICLE_COLORS = [
  { name: 'Black', value: 'Black', hex: '#000000' },
  { name: 'White', value: 'White', hex: '#FFFFFF' },
  { name: 'Silver', value: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', value: 'Gray', hex: '#808080' },
  { name: 'Red', value: 'Red', hex: '#FF0000' },
  { name: 'Blue', value: 'Blue', hex: '#0000FF' },
  { name: 'Brown', value: 'Brown', hex: '#A52A2A' },
  { name: 'Green', value: 'Green', hex: '#008000' },
  { name: 'Beige', value: 'Beige', hex: '#F5F5DC' },
  { name: 'Orange', value: 'Orange', hex: '#FFA500' },
  { name: 'Gold', value: 'Gold', hex: '#FFD700' },
  { name: 'Yellow', value: 'Yellow', hex: '#FFFF00' },
  { name: 'Purple', value: 'Purple', hex: '#800080' },
];

const CATEGORIES = [
  { value: 'Sedan', label: 'Sedan', icon: '🚗' },
  { value: 'SUV', label: 'SUV', icon: '🚙' },
  { value: 'Truck', label: 'Truck', icon: '🛻' },
  { value: 'Coupe', label: 'Coupe', icon: '🏎️' },
  { value: 'Convertible', label: 'Convertible', icon: '😎' },
  { value: 'Hatchback', label: 'Hatchback', icon: '🚘' },
  { value: 'Wagon', label: 'Wagon', icon: '🚐' },
];

const FUEL_TYPES = [
  { value: 'Benzine', label: 'Benzine', icon: '⛽' },
  { value: 'Diesel', label: 'Diesel', icon: '🛢️' },
  { value: 'Hybrid', label: 'Hybrid', icon: '🔋' },
  { value: 'Electric', label: 'Electric', icon: '⚡' },
  { value: 'plugin-hybrid', label: 'Plug-in Hybrid', icon: '🔌' },
];

const TRANSMISSIONS = [
  { value: 'Automatic', label: 'Automatic', icon: '⚙️' },
  { value: 'Manual', label: 'Manual', icon: '🎛️' },
];

const DRIVE_TRAINS = [
  { value: 'FWD', label: 'FWD', icon: '↘️' },
  { value: 'RWD', label: 'RWD', icon: '↗️' },
  { value: 'AWD', label: 'AWD', icon: '🔼' },
  { value: '4WD', label: '4WD', icon: '🔄' },
];

const CONDITIONS = [
  { value: 'New', label: 'New', icon: '✨' },
  { value: 'Used', label: 'Used', icon: '👍' },
];
const SOURCE_OPTIONS = [
  { value: 'Company', label: 'Company Source', icon: '🏢' },
  { value: 'GCC', label: 'GCC', icon: '🌴' },
  { value: 'USA', label: 'USA', icon: '🇺🇸' },
  { value: 'Canada', label: 'Canada', icon: '🇨🇦' },
  { value: 'China', label: 'China', icon: '🇨🇳' },
  { value: 'Europe', label: 'Europe', icon: '🇪🇺' },
];

const VEHICLE_FEATURES = [
  { id: 'heated_seats', label: 'Heated Seats', category: 'comfort' },
  { id: 'keyless_entry', label: 'Keyless Entry', category: 'convenience' },
  { id: 'keyless_start', label: 'Keyless Start', category: 'convenience' },
  { id: 'power_mirrors', label: 'Power Mirrors', category: 'convenience' },
  { id: 'power_steering', label: 'Power Steering', category: 'convenience' },
  { id: 'power_windows', label: 'Power Windows', category: 'convenience' },
  { id: 'backup_camera', label: 'Backup Camera', category: 'safety' },
  { id: 'bluetooth', label: 'Bluetooth', category: 'technology' },
  { id: 'cruise_control', label: 'Cruise Control', category: 'convenience' },
  { id: 'navigation', label: 'Navigation System', category: 'technology' },
  { id: 'sunroof', label: 'Sunroof', category: 'comfort' },
  { id: 'leather_seats', label: 'Leather Seats', category: 'comfort' },
  { id: 'third_row_seats', label: 'Third Row Seats', category: 'space' },
  { id: 'parking_sensors', label: 'Parking Sensors', category: 'safety' },
  { id: 'lane_assist', label: 'Lane Departure Warning', category: 'safety' },
  { id: 'blind_spot', label: 'Blind Spot Monitoring', category: 'safety' },
  { id: 'apple_carplay', label: 'Apple CarPlay', category: 'technology' },
  { id: 'android_auto', label: 'Android Auto', category: 'technology' },
  { id: 'premium_audio', label: 'Premium Audio', category: 'technology' },
  { id: 'remote_start', label: 'Remote Start', category: 'convenience' },
];




/**
 * Reusable Components
 */
const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-400">{subtitle}</p>
  </div>
);

const InputField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, error, children, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-400 flex items-center">
        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const SelectionGrid: React.FC<{
  items: Array<{ value: string; label: string; icon?: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}> = ({ items, selectedValue, onSelect, className = "" }) => (
  <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
    {items.map((item) => (
      <button
        key={item.value}
        type="button"
        onClick={() => onSelect(item.value)}
        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center ${
          selectedValue === item.value
            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 text-gray-300 hover:text-white'
        }`}
      >
        {item.icon && <span className="text-2xl mb-2">{item.icon}</span>}
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    ))}
  </div>
);

const ColorSelector: React.FC<{
  colors: Array<{ name: string; value: string; hex: string }>;
  selectedColor: string;
  onSelect: (value: string) => void;
}> = ({ colors, selectedColor, onSelect }) => (
  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
    {colors.map((color) => (
      <button
        key={color.value}
        type="button"
        onClick={() => onSelect(color.value)}
        className={`w-12 h-12 rounded-full border-4 transition-all duration-200 ${
          selectedColor === color.value
            ? 'border-indigo-500 scale-110'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        style={{ backgroundColor: color.hex }}
        title={color.name}
      >
        {selectedColor === color.value && (
          <CheckCircleIcon className="h-6 w-6 text-white mx-auto" />
        )}
      </button>
    ))}
  </div>
);

/**
 * Image Upload Component
 */
const ImageUploadArea: React.FC<{
  images: UploadedImage[];
  onImagesChange: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  maxImages?: number;
}> = ({ images, onImagesChange, maxImages = 10 }) => {
  const [dragActive, setDragActive] = useState(false);

  // Handle drag events for file upload
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  }, []);

  // Process selected files
  const handleFiles = (files: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: Date.now() + Math.random() + '',
          url: e.target?.result as string,
          file: file,
          name: file.name
        };
        onImagesChange(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from list
  const removeImage = (imageId: string) => {
    onImagesChange(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-white mb-2">
          Upload Vehicle Photos
        </p>
        <p className="text-sm text-gray-400 mb-4">
          Drag and drop images here, or click to browse. First image will be the main photo.
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Choose Files
        </label>
        <p className="text-xs text-gray-500 mt-2">
          {images.length}/{maxImages} images uploaded
        </p>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                index === 0 ? 'border-indigo-500' : 'border-gray-700'
              }`}
            >
              <img
                src={image.url}
                alt={`Vehicle photo ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Feature Selector Component
 */
const FeatureSelector: React.FC<{
  features: Array<{ id: string; label: string; category: string }>;
  selectedFeatures: string[];
  onToggle: (featureId: string) => void;
}> = ({ features, selectedFeatures, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'comfort', 'convenience', 'safety', 'technology', 'space'];

  // Filter features based on search and category
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      const matchesSearch = feature.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [features, searchTerm, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.slice(1).map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Count */}
      <div className="text-sm text-gray-400">
        {selectedFeatures.length} features selected
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
        {filteredFeatures.map((feature) => (
          <button
            key={feature.id}
            type="button"
            onClick={() => onToggle(feature.id)}
            className={`p-3 rounded-lg border text-left transition-all duration-200 ${
              selectedFeatures.includes(feature.id)
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/50 text-gray-300 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{feature.label}</span>
              {selectedFeatures.includes(feature.id) && (
                <CheckCircleIcon className="h-4 w-4 text-indigo-400" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Component
 */
export default function AdminAddCarListing() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState<CarFormData>({
    dealership_id: '',
    make: '',
    model: '',
    trim: '',
    year: '',
    price: '',
    color: '',
    category: '',
    fuel_type: '',
    source: '',
    description: '',
    mileage: '',
    transmission: '',
    drivetrain: '',
    condition: '',
    features: [],
    bought_price: '',
    date_bought: '',
    seller_name: '',
  });

  // Component state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoadingDealerships, setIsLoadingDealerships] = useState(true);

  // Dynamic make / model data
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState<boolean>(true);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isLoadingTrims, setIsLoadingTrims] = useState<boolean>(false);

  /**
   * Fetch dealerships from Supabase on component mount
   */
  useEffect(() => {
    async function fetchDealerships() {
      try {
        const { data, error } = await supabase
          .from('dealerships')
          .select('id, name, location, phone')
          .order('name');

        if (error) throw error;
        setDealerships(data || []);
      } catch (error) {
        console.error('Error fetching dealerships:', error);
        setErrors({ dealerships: 'Failed to load dealerships' });
      } finally {
        setIsLoadingDealerships(false);
      }
    }

    fetchDealerships();
  }, [supabase]);

  /**
   * Fetch available vehicle makes from DB on mount
   */
  useEffect(() => {
    async function fetchMakes() {
      setIsLoadingMakes(true);
      setErrors(prev => ({ ...prev, make_fetch: undefined }));
    
      try {
        let allMakes: any[] = [];
        let hasMore = true;
        let offset = 0;
        const limit = 1000;

        // Fetch all makes with pagination to avoid missing any due to default limits
        while (hasMore) {
          const { data, error } = await supabase
            .from('allcars')
            .select('make', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('make');

          if (error) throw error;

          if (data && data.length > 0) {
            allMakes = [...allMakes, ...data];
            offset += limit;
            hasMore = data.length === limit; // Continue if we got a full batch
          } else {
            hasMore = false;
          }

          // Safety check to prevent infinite loops
          if (offset > 50000) {
            console.warn('Stopped fetching after 50k records to prevent infinite loop');
            break;
          }
        }

        console.log(`Fetched ${allMakes.length} total make records`);

        // Process and clean the makes data
        const uniqueMakes = [...new Set(
          allMakes
            .map(item => item.make)
            .filter(make => make && typeof make === 'string' && make.trim().length > 0) // Filter out null, undefined, empty strings
            .map(make => make.trim()) // Remove leading/trailing spaces
            .filter(make => make.length > 0) // Double-check for empty strings after trimming
        )]
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Sort alphabetically, case-insensitive

        console.log(`Processed to ${uniqueMakes.length} unique makes:`, uniqueMakes.slice(0, 10), '...');

        if (uniqueMakes.length === 0) {
          throw new Error('No valid brands found in database');
        }

        setMakes(uniqueMakes);
      } catch (err: any) {
        console.error("Error fetching car brands:", err);
        setErrors(prev => ({ ...prev, make_fetch: err.message || 'Failed to fetch brands' }));
        setMakes([]);
      } finally {
        setIsLoadingMakes(false);
      }
    }

    fetchMakes();
  }, [supabase]);

  /**
   * Fetch models each time selected make changes
   */
  useEffect(() => {
    if (!formData.make) {
      setModels([]);
      return;
    }

    async function fetchModels() {
      try {
        setIsLoadingModels(true);
        const { data, error } = await supabase
          .from('allcars')
          .select('model')
          .eq('make', formData.make)
          .order('model');

        if (error) throw error;

        const uniqueModels = Array.from(
          new Set(
            (data || [])
              .map((row: any) => row.model)
              .filter((m: string | null) => m && m.trim().length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));

        setModels(uniqueModels);
      } catch (err) {
        console.error('Error fetching models:', err);
        setErrors(prev => ({ ...prev, model_fetch: 'Failed to load vehicle models' }));
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    }

    fetchModels();
  }, [formData.make, supabase]);

  /**
   * Fetch trims each time selected model changes
   */
  useEffect(() => {
    if (!formData.make || !formData.model) {
      setTrims([]);
      return;
    }

    async function fetchTrims() {
      try {
        setIsLoadingTrims(true);
        const { data, error } = await supabase
          .from('allcars')
          .select('trim')
          .eq('make', formData.make)
          .eq('model', formData.model)
          .order('trim');

        if (error) throw error;

        // Support "trim" being stored either as text or array of texts
        const trimSet = new Set<string>();
        (data || []).forEach((row: any) => {
          const value = row.trim;
          if (Array.isArray(value)) {
            value.forEach((t) => {
              if (typeof t === 'string' && t.trim().length > 0) {
                trimSet.add(t.trim());
              }
            });
          } else if (typeof value === 'string' && value.trim().length > 0) {
            trimSet.add(value.trim());
          }
        });

        const uniqueTrims = Array.from(trimSet).sort((a, b) => a.localeCompare(b));

        setTrims(uniqueTrims);
      } catch (err) {
        console.error('Error fetching trims:', err);
        setErrors(prev => ({ ...prev, trim_fetch: 'Failed to load trims' }));
        setTrims([]);
      } finally {
        setIsLoadingTrims(false);
      }
    }

    fetchTrims();
  }, [formData.make, formData.model, supabase]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof CarFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields
      ...(field === 'make' && { model: '', trim: '' }),
      ...(field === 'model' && { trim: '' }),
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Handle feature selection toggle
   */
  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Required fields validation
    const requiredFields: Array<keyof CarFormData> = [
      'dealership_id', 'make', 'model', 'year', 'price', 'color',
      'category', 'fuel_type', 'mileage', 'transmission', 'drivetrain', 'condition'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Specific validations
    if (formData.year && (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1)) {
      newErrors.year = 'Please enter a valid year';
    }
    
    if (formData.price && (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Please enter a valid price';
    }
    
    if (formData.mileage && (isNaN(parseFloat(formData.mileage)) || parseFloat(formData.mileage) < 0)) {
      newErrors.mileage = 'Please enter a valid mileage';
    }

    if (images.length === 0) {
      newErrors.images = 'Please upload at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Upload images to Supabase Storage
   */
  const uploadImagesToSupabase = async (dealershipId: string): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileName = `${Date.now()}_${i}_${image.name}`;
      const filePath = `${dealershipId}/${fileName}`;
      
      try {
        // Upload image to Supabase Storage
        const { data, error } = await supabase.storage
          .from('cars')
          .upload(filePath, image.file, {
            contentType: image.file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('cars')
          .getPublicUrl(data.path);

        imageUrls.push(publicUrl);
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        throw new Error(`Failed to upload image ${i + 1}`);
      }
    }
    
    return imageUrls;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    console.log('🔥 Submit button clicked!');
    console.log('📝 Current form data:', formData);
    console.log('🖼️ Current images:', images);
    
    // Clear any previous submit errors
    setErrors(prev => ({ ...prev, submit: '' }));
    
    console.log('✅ Running form validation...');
    const isValid = validateForm();
    console.log('📋 Validation result:', isValid);
    console.log('❌ Current errors:', errors);
    
    if (!isValid) {
      console.log('❌ Form validation failed, stopping submission');
      return;
    }

    console.log('🚀 Starting form submission...');
    setIsSubmitting(true);

    try {
      // Upload images to Supabase Storage
      console.log('📤 Uploading images to Supabase Storage...');
      const imageUrls = await uploadImagesToSupabase(formData.dealership_id);
      console.log('✅ Image upload complete:', imageUrls);
      
      // Prepare car data for database
      const carData = {
        dealership_id: formData.dealership_id,
        make: formData.make,
        model: formData.model,
        trim: formData.trim || null,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        color: formData.color,
        category: formData.category,
        type: formData.fuel_type, // Maps to fuel type
        source: formData.source || null,
        description: formData.description || null,
        mileage: parseFloat(formData.mileage),
        transmission: formData.transmission,
        drivetrain: formData.drivetrain,
        condition: formData.condition,
        features: formData.features,
        bought_price: formData.bought_price ? parseFloat(formData.bought_price) : null,
        date_bought: formData.date_bought ? new Date(formData.date_bought).toISOString() : null,
        seller_name: formData.seller_name || null,
        images: imageUrls,
        status: 'available',
        views: 0,
        likes: 0,
        viewed_users: [],
        liked_users: [],
        listed_at: new Date().toISOString()
      };

      console.log('💾 Prepared car data for database:', carData);

      // Insert car listing into database
      console.log('📝 Inserting car listing into database...');
      const { data, error } = await supabase
        .from('cars')
        .insert(carData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Car listing created successfully:', data);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        dealership_id: '',
        make: '',
        model: '',
        trim: '',
        year: '',
        price: '',
        color: '',
        category: '',
        fuel_type: '',
        source: '',
        description: '',
        mileage: '',
        transmission: '',
        drivetrain: '',
        condition: '',
        features: [],
        bought_price: '',
        date_bought: '',
        seller_name: '',
      });
      setImages([]);
      
    } catch (error: any) {
      console.error('💥 Error creating listing:', error);
      setErrors(prev => ({
        ...prev,
        submit: `Failed to create listing: ${error.message || 'Unknown error'}`
      }));
    } finally {
      console.log('🏁 Form submission complete');
      setIsSubmitting(false);
    }
  };

  /**
   * Success screen component
   */
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        <AdminNavbar />
        <div className="pt-16 lg:pt-0 lg:pl-64 flex items-center justify-center min-h-screen">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl shadow-lg text-center max-w-md">
            <CheckCircleIcon className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Listing Created Successfully!
            </h2>
            <p className="text-gray-400 mb-6">
              The car listing has been added to the selected dealership.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setErrors({});
                }}
                className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Another
              </button>
              <button
                onClick={() => router.push('/admin/listings')}
                className="flex-1 bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                View Listings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 relative">
      <AdminNavbar />
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 p-6 rounded-xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-white font-medium">Creating listing...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait while we process your request</p>
          </div>
        </div>
      )}

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto pb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Add New Car Listing
                </h1>
                <p className="text-gray-400">
                  Create a new vehicle listing for a dealership
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Global Error Display */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-400">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Dealership Selection */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Select Dealership"
                subtitle="Choose which dealership this listing belongs to"
              />
              
              <InputField label="Dealership" required error={errors.dealership_id}>
                <div className="relative">
                  <BuildingOffice2Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={formData.dealership_id}
                    onChange={(e) => handleInputChange('dealership_id', e.target.value)}
                    disabled={isLoadingDealerships}
                    className="w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingDealerships ? 'Loading dealerships...' : 'Select a dealership...'}
                    </option>
                    {dealerships.map(dealer => (
                      <option key={dealer.id} value={dealer.id}>
                        {dealer.name} - {dealer.location}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>
              </InputField>
            </div>

            {/* Vehicle Images */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Images"
                subtitle="Upload high-quality photos of the vehicle (up to 10 images)"
              />
              
              {errors.images && (
                <p className="mb-4 text-sm text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.images}
                </p>
              )}
              
              <ImageUploadArea 
                images={images}
                onImagesChange={setImages}
                maxImages={10}
              />
            </div>

            {/* Vehicle Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Information"
                subtitle="Basic vehicle details and specifications"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Make" required error={errors.make}>
                  <div className="relative">
                    <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      disabled={isLoadingMakes}
                      className="w-full pl-10 pr-10 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none disabled:opacity-50"
                    >
                      <option value="">
                        {isLoadingMakes ? 'Loading makes...' : 'Select make...'}
                      </option>
                      {makes.map((make) => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                  </div>
                </InputField>

                <InputField label="Model" required error={errors.model}>
                  <select
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    disabled={!formData.make || isLoadingModels}
                    className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isLoadingModels ? 'Loading models...' : 'Select model...'}
                    </option>
                    {models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Trim">
                  <select
                    value={formData.trim}
                    onChange={(e) => handleInputChange('trim', e.target.value)}
                    disabled={!formData.model || isLoadingTrims}
                    className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isLoadingTrims ? 'Loading trims...' : 'Select trim (optional)...'}
                    </option>
                    {trims.map((trim) => (
                      <option key={trim} value={trim}>{trim}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Year" required error={errors.year}>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      placeholder="Enter year"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </InputField>

                <InputField label="Price" required error={errors.price}>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </InputField>

                <InputField label="Mileage" required error={errors.mileage}>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange('mileage', e.target.value)}
                    placeholder="Enter mileage"
                    min="0"
                    className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </InputField>
              </div>
            </div>

            {/* Vehicle Color */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Color"
                subtitle="Select the exterior color of the vehicle"
              />
              
              {errors.color && (
                <p className="mb-4 text-sm text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {errors.color}
                </p>
              )}
              
              <ColorSelector 
                colors={VEHICLE_COLORS}
                selectedColor={formData.color}
                onSelect={(color) => handleInputChange('color', color)}
              />
            </div>

            {/* Vehicle Classification */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Classification"
                subtitle="Select the category and fuel type"
              />
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Category <span className="text-red-400">*</span>
                  </label>
                  {errors.category && (
                    <p className="mb-3 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.category}
                    </p>
                  )}
                  <SelectionGrid 
                    items={CATEGORIES}
                    selectedValue={formData.category}
                    onSelect={(value) => handleInputChange('category', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Fuel Type <span className="text-red-400">*</span>
                  </label>
                  {errors.fuel_type && (
                    <p className="mb-3 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.fuel_type}
                    </p>
                  )}
                  <SelectionGrid 
                    items={FUEL_TYPES}
                    selectedValue={formData.fuel_type}
                    onSelect={(value) => handleInputChange('fuel_type', value)}
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Technical Specifications"
                subtitle="Transmission, drivetrain, and condition details"
              />
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Transmission <span className="text-red-400">*</span>
                  </label>
                  {errors.transmission && (
                    <p className="mb-3 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.transmission}
                    </p>
                  )}
                  <SelectionGrid 
                    items={TRANSMISSIONS}
                    selectedValue={formData.transmission}
                    onSelect={(value) => handleInputChange('transmission', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Drivetrain <span className="text-red-400">*</span>
                  </label>
                  {errors.drivetrain && (
                    <p className="mb-3 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.drivetrain}
                    </p>
                  )}
                  <SelectionGrid 
                    items={DRIVE_TRAINS}
                    selectedValue={formData.drivetrain}
                    onSelect={(value) => handleInputChange('drivetrain', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Condition <span className="text-red-400">*</span>
                  </label>
                  {errors.condition && (
                    <p className="mb-3 text-sm text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      {errors.condition}
                    </p>
                  )}
                  <SelectionGrid 
                    items={CONDITIONS}
                    selectedValue={formData.condition}
                    onSelect={(value) => handleInputChange('condition', value)}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Source */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Source"
                subtitle="Where was this vehicle sourced from?"
              />
              
              <SelectionGrid 
                items={SOURCE_OPTIONS}
                selectedValue={formData.source}
                onSelect={(value) => handleInputChange('source', value)}
                className="grid-cols-2 md:grid-cols-3"
              />
            </div>

            {/* Vehicle Features */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Features"
                subtitle="Select all applicable features and options"
              />
              
              <FeatureSelector 
                features={VEHICLE_FEATURES}
                selectedFeatures={formData.features}
                onToggle={handleFeatureToggle}
              />
            </div>

            {/* Description */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Vehicle Description"
                subtitle="Provide additional details about the vehicle"
              />
              
              <InputField label="Description">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter detailed description of the vehicle..."
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                />
              </InputField>
            </div>

            {/* Purchase Information */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              <SectionHeader 
                title="Purchase Information"
                subtitle="Details about vehicle acquisition (optional)"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Purchase Price">
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="number"
                      value={formData.bought_price}
                      onChange={(e) => handleInputChange('bought_price', e.target.value)}
                      placeholder="Enter purchase price"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </InputField>

                <InputField label="Purchase Date">
                  <input
                    type="date"
                    value={formData.date_bought}
                    onChange={(e) => handleInputChange('date_bought', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </InputField>

                <InputField label="Seller Name" className="md:col-span-2">
                  <input
                    type="text"
                    value={formData.seller_name}
                    onChange={(e) => handleInputChange('seller_name', e.target.value)}
                    placeholder="Enter seller name"
                    className="w-full px-3 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </InputField>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-sm">
              {/* Debug Info */}
              
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🖱️ Button clicked directly!');
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Car Listing
                  </>
                )}
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}