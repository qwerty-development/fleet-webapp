import React, { useState, useEffect } from "react";
import { Car } from "@/types";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface EditListingFormProps {
  listing: Car;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

const STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Pending", value: "pending" },
  { label: "Sold", value: "sold" },
];

const CONDITION_OPTIONS = [
  { label: "New", value: "New" },
  { label: "Used", value: "Used" },
  { label: "Certified", value: "Certified" },
  { label: "Classic", value: "Classic" },
];

const TRANSMISSION_OPTIONS = [
  { label: "Automatic", value: "Automatic" },
  { label: "Manual", value: "Manual" },
  { label: "Semi-Automatic", value: "Semi-Automatic" },
];

const DRIVETRAIN_OPTIONS = [
  { label: "FWD", value: "FWD" },
  { label: "RWD", value: "RWD" },
  { label: "AWD", value: "AWD" },
  { label: "4WD", value: "4WD" },
];

const VEHICLE_FEATURES = [
  { id: 'heated_seats', label: 'Heated Seats', icon: 'car-seat-heater' },
  { id: 'keyless_entry', label: 'Keyless Entry', icon: 'key-wireless' },
  { id: 'keyless_start', label: 'Keyless Start', icon: 'power' },
  { id: 'power_mirrors', label: 'Power Mirrors', icon: 'car-side' },
  { id: 'power_steering', label: 'Power Steering', icon: 'steering' },
  { id: 'power_windows', label: 'Power Windows', icon: 'window-maximize' },
  { id: 'backup_camera', label: 'Backup Camera', icon: 'camera' },
  { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth' },
  { id: 'cruise_control', label: 'Cruise Control', icon: 'speedometer' },
  { id: 'navigation', label: 'Navigation System', icon: 'map-marker' },
  { id: 'sunroof', label: 'Sunroof', icon: 'weather-sunny' },
  { id: 'leather_seats', label: 'Leather Seats', icon: 'car-seat' },
  { id: 'third_row_seats', label: 'Third Row Seats', icon: 'seat-passenger' },
  { id: 'parking_sensors', label: 'Parking Sensors', icon: 'parking' },
  { id: 'lane_assist', label: 'Lane Departure Warning', icon: 'road-variant' },
  { id: 'blind_spot', label: 'Blind Spot Monitoring', icon: 'eye-off' },
  { id: 'apple_carplay', label: 'Apple CarPlay', icon: 'apple' },
  { id: 'android_auto', label: 'Android Auto', icon: 'android' },
  { id: 'premium_audio', label: 'Premium Audio', icon: 'speaker' },
  { id: 'remote_start', label: 'Remote Start', icon: 'remote' },
];

const EditListingForm: React.FC<EditListingFormProps> = ({
  listing,
  onClose,
  onSubmit,
}) => {
  // Parse features from listing.features if it exists
  const parseFeatures = () => {
    if (!listing.features) return {};
    
    try {
      if (typeof listing.features === 'string') {
        try {
          // Try to parse as JSON string first
          const featuresObj:any = JSON.parse(listing.features);
          if (typeof featuresObj === 'object') {
            return featuresObj;
          }
        } catch (e) {
          // If not valid JSON, treat as comma-separated list
          const featuresList:any = listing.features.split(',').map(f => f.trim());
          const featuresObj:any = {};
          featuresList.forEach((feature: string) => {
            // Find matching feature from VEHICLE_FEATURES
            const matchedFeature:any = VEHICLE_FEATURES.find(vf => 
              vf.label.toLowerCase() === feature.toLowerCase() || 
              vf.id.toLowerCase() === feature.toLowerCase()
            );
            
            if (matchedFeature) {
              featuresObj[matchedFeature.id] = true;
            }
          });
          return featuresObj;
        }
      } else if (Array.isArray(listing.features)) {
        // If it's an array, convert to object format
        const featuresObj:any = {};
        listing.features.forEach(feature => {
          const matchedFeature = VEHICLE_FEATURES.find(vf => 
            vf.label.toLowerCase() === feature.toLowerCase() || 
            vf.id.toLowerCase() === feature.toLowerCase()
          );
          
          if (matchedFeature) {
            featuresObj[matchedFeature.id] = true;
          }
        });
        return featuresObj;
      }
    } catch (e) {
      console.error("Error parsing features:", e);
    }
    
    return {};
  };

  const [formData, setFormData] = useState({
    make: listing.make || "",
    model: listing.model || "",
    year: listing.year || new Date().getFullYear(),
    price: listing.price || 0,
    description: listing.description || "",
    status: listing.status || "available",
    condition: listing.condition || "",
    color: listing.color || "",
    transmission: listing.transmission || "",
    mileage: listing.mileage || 0,
    drivetrain: listing.drivetrain || "",
    type: listing.type || "",
    category: listing.category || "",
  });

  const [selectedFeatures, setSelectedFeatures] = useState(parseFeatures());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes for regular form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "mileage" || name === "year" ? 
        parseInt(value) || 0 : value,
    }));
    
    // Clear error for this field when user changes it
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle feature checkbox changes
  const handleFeatureChange = (featureId: string) => {
    setSelectedFeatures((prev: { [x: string]: any; }) => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.make) newErrors.make = "Make is required";
    if (!formData.model) newErrors.model = "Model is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = "Please enter a valid year";
    }
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prepare features for submission
  const prepareFeatures = () => {
    const activeFeatures = Object.entries(selectedFeatures)
      .filter(([_, isSelected]) => isSelected)
      .map(([featureId]) => featureId);
    
    return activeFeatures;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a data object with all the fields we want to update
      const dataToSubmit = {
        ...formData,
        features: prepareFeatures() // Convert selected features to array format
      };
      
      onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 z-10 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Listing</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">
                Make*
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-700 border ${
                  errors.make ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                placeholder="e.g. Toyota"
              />
              {errors.make && <p className="mt-1 text-sm text-red-500">{errors.make}</p>}
            </div>
            
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                Model*
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-700 border ${
                  errors.model ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                placeholder="e.g. Camry"
              />
              {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-1">
                Year*
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-700 border ${
                  errors.year ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                placeholder="e.g. 2021"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                Price ($)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-gray-700 border ${
                  errors.price ? "border-red-500" : "border-gray-600"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                placeholder="e.g. 25000"
                min="0"
              />
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                Status*
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="">Select condition</option>
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="transmission" className="block text-sm font-medium text-gray-300 mb-1">
                Transmission
              </label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="">Select transmission</option>
                {TRANSMISSION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="drivetrain" className="block text-sm font-medium text-gray-300 mb-1">
                Drivetrain
              </label>
              <select
                id="drivetrain"
                name="drivetrain"
                value={formData.drivetrain}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              >
                <option value="">Select drivetrain</option>
                {DRIVETRAIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">
                Color
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="e.g. Red"
              />
            </div>
            
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-300 mb-1">
                Mileage
              </label>
              <input
                type="number"
                id="mileage"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="e.g. 25000"
                min="0"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                Vehicle Type
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="e.g. Sedan, SUV, etc."
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="e.g. Luxury, Economy, etc."
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="Enter vehicle description"
            />
          </div>
          
          {/* Features Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Vehicle Features
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VEHICLE_FEATURES.map((feature) => (
                <div 
                  key={feature.id} 
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id={`feature-${feature.id}`}
                    checked={!!selectedFeatures[feature.id]}
                    onChange={() => handleFeatureChange(feature.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                  />
                  <label 
                    htmlFor={`feature-${feature.id}`}
                    className="text-sm text-gray-300 cursor-pointer select-none"
                  >
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingForm;