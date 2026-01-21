import React, { useState, useEffect, useRef } from "react";
import { Car } from "@/types";
import { 
  XMarkIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  TrashIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TagIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

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

// Helper function to normalize trim data - only returns single trim for cars table
const normalizeSingleTrim = (trim: any): string => {
  if (!trim) return '';
  
  // If it's already an array, return the first valid trim
  if (Array.isArray(trim)) {
    const validTrims = trim.filter(t => typeof t === 'string' && t.trim().length > 0);
    return validTrims.length > 0 ? validTrims[0] : '';
  }
  
  // If it's a string, try to parse as JSON first
  if (typeof trim === 'string') {
    try {
      const parsed = JSON.parse(trim);
      if (Array.isArray(parsed)) {
        const validTrims = parsed.filter(t => typeof t === 'string' && t.trim().length > 0);
        return validTrims.length > 0 ? validTrims[0] : '';
      }
    } catch (e) {
      // If JSON parsing fails, treat as comma-separated string and take first
      const trimArray = trim.split(',').map(t => t.trim()).filter(t => t.length > 0);
      return trimArray.length > 0 ? trimArray[0] : '';
    }
  }
  
  return '';
};

// Trim Badge Component
const TrimBadge: React.FC<{ 
  trim: string; 
  onRemove?: () => void; 
  onEdit?: (oldValue: string, newValue: string) => void;
  isEditable?: boolean 
}> = ({ 
  trim, 
  onRemove, 
  onEdit,
  isEditable = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(trim);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== trim && onEdit) {
      onEdit(trim, trimmedValue);
    }
    setIsEditing(false);
    setEditValue(trim);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(trim);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing && isEditable) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 border border-indigo-500/30">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={handleSave}
          autoFocus
          className="bg-transparent text-indigo-300 outline-none border-none w-16 min-w-0"
          style={{ width: `${Math.max(editValue.length * 8, 40)}px` }}
        />
      </div>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
      <span 
        className={isEditable ? "cursor-pointer hover:text-indigo-100 transition-colors" : ""}
        onClick={isEditable ? () => setIsEditing(true) : undefined}
        title={isEditable ? "Click to edit" : undefined}
      >
        {trim}
      </span>
      {isEditable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-indigo-100 transition-colors"
          type="button"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

// Trim Manager Component
const TrimManager: React.FC<{
  trims: string[];
  onChange: (trims: string[]) => void;
  placeholder?: string;
}> = ({ trims, onChange, placeholder = "Add trim..." }) => {
  const [newTrim, setNewTrim] = useState("");

  const handleAddTrim = () => {
    const trimmedValue = newTrim.trim();
    if (trimmedValue && !trims.includes(trimmedValue)) {
      onChange([...trims, trimmedValue]);
      setNewTrim("");
    }
  };

  const handleRemoveTrim = (indexToRemove: number) => {
    onChange(trims.filter((_, index) => index !== indexToRemove));
  };

  const handleEditTrim = (oldValue: string, newValue: string) => {
    const trimmedNewValue = newValue.trim();
    if (trimmedNewValue && trimmedNewValue !== oldValue && !trims.includes(trimmedNewValue)) {
      const updatedTrims = trims.map(trim => trim === oldValue ? trimmedNewValue : trim);
      onChange(updatedTrims);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTrim();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTrim}
          onChange={(e) => setNewTrim(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
        />
        <button
          type="button"
          onClick={handleAddTrim}
          disabled={!newTrim.trim() || trims.includes(newTrim.trim())}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      
      {trims.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trims.map((trim, index) => (
            <TrimBadge
              key={index}
              trim={trim}
              onRemove={() => handleRemoveTrim(index)}
              onEdit={handleEditTrim}
              isEditable
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

  // Initialize form data state
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

  // Initialize features, images, and trim state
  const [selectedFeatures, setSelectedFeatures] = useState(parseFeatures());
  const [images, setImages] = useState<string[]>(listing.images || []);
  const [originalImages] = useState<string[]>(listing.images || []);
  const [trim, setTrim] = useState<string>(normalizeSingleTrim(listing.trim));
  const [imagesModified, setImagesModified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // File input ref for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supabase client
  const supabase = createClient();

  // Track if images have been modified
  useEffect(() => {
    const hasChanged = images.length !== originalImages.length || 
      images.some((img, index) => img !== originalImages[index]);
    setImagesModified(hasChanged);
  }, [images, originalImages]);

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

  // Image Management Functions
  const moveImageUp = (index: number) => {
    if (index === 0) return; // Can't move first image up
    
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;
    
    setImages(newImages);
  };

  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return; // Can't move last image down
    
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;
    
    setImages(newImages);
  };

  const deleteImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setShowDeleteConfirmation(null);
  };

  const confirmDeleteImage = (index: number) => {
    setShowDeleteConfirmation(index);
  };

  const cancelDeleteImage = () => {
    setShowDeleteConfirmation(null);
  };

  // Reset images to original state
  const resetImages = () => {
    setImages([...originalImages]);
    setShowDeleteConfirmation(null);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const dealershipId = listing.dealership_id;
    if (!dealershipId) {
      alert("Cannot upload images: No dealership associated with this listing");
      return;
    }
    
    setIsUploadingImage(true);
    
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10MB limit`);
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${dealershipId}/${fileName}`;
        
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
      setImages(prev => [...prev, ...newImageUrls]);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      alert(`Failed to upload images: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
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
        features: prepareFeatures(),
        images: images, // Include the modified images array
        trim: trim.trim() || null // Include single trim
      };
      
      onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {/* Image Management Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Image Management</h3>
              <div className="flex items-center space-x-2">
                {imagesModified && (
                  <button
                    type="button"
                    onClick={resetImages}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm transition-colors"
                  >
                    Reset Images
                  </button>
                )}
              </div>
            </div>

            {/* Add Image Button and Hidden File Input */}
            <div className="flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
                id="image-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isUploadingImage ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Add Images
                  </>
                )}
              </button>
              <span className="text-gray-400 text-sm">Supports JPG, PNG, WebP (Max 10MB each)</span>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">No images available for this listing</p>
                <p className="text-gray-500 text-sm mt-1">Click "Add Images" above to upload</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-300 mb-3">
                  {images.length} image{images.length !== 1 ? 's' : ''} • First image will be the primary image
                  {imagesModified && (
                    <span className="ml-2 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                      Modified
                    </span>
                  )}
                </div>

                {images.map((imageUrl, index) => (
                  <div
                    key={`${imageUrl}-${index}`}
                    className={`bg-gray-700/50 border border-gray-600 rounded-lg p-4 transition-all ${
                      showDeleteConfirmation === index ? 'border-red-500 bg-red-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={`Car image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-car.jpg';
                          }}
                        />
                      </div>

                      {/* Image Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium">
                            Image {index + 1}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm truncate">
                          {imageUrl}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {showDeleteConfirmation === index ? (
                          // Delete Confirmation
                          <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 text-sm">Delete?</span>
                            <button
                              type="button"
                              onClick={() => deleteImage(index)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={cancelDeleteImage}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          // Normal Action Buttons
                          <>
                            {/* Move Up Button */}
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className={`p-2 rounded-md transition-colors ${
                                index === 0
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-600 hover:bg-gray-500 text-white'
                              }`}
                              title="Move up"
                            >
                              <ChevronUpIcon className="h-4 w-4" />
                            </button>

                            {/* Move Down Button */}
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === images.length - 1}
                              className={`p-2 rounded-md transition-colors ${
                                index === images.length - 1
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-600 hover:bg-gray-500 text-white'
                              }`}
                              title="Move down"
                            >
                              <ChevronDownIcon className="h-4 w-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => confirmDeleteImage(index)}
                              className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition-colors"
                              title="Delete image"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-gray-700"></div>

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
          
          {/* Trims Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-2" />
                Trim Level (Optional)
              </div>
            </label>
            <input
              type="text"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              placeholder="e.g. LE, XLE, Sport..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter a single trim level for this vehicle.
            </p>
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