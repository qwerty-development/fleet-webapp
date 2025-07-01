"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  TruckIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

interface AutoClipReview {
  id: number;
  dealership_id: number;
  car_id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  status: 'under_review' | 'published' | 'rejected' | 'draft';
  created_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  review_notes?: string;
  published_at?: string;
  dealership?: {
    id: number;
    name: string;
    logo: string;
    location: string;
  };
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

interface AutoClipEditModalProps {
  clip: AutoClipReview;
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  dealership_id: number;
}

interface Dealership {
  id: number;
  name: string;
  logo: string;
  location: string;
}

export default function AutoClipEditModal({
  clip,
  isVisible,
  onClose,
  onSave
}: AutoClipEditModalProps) {
  const [formData, setFormData] = useState({
    title: clip.title,
    description: clip.description || '',
    video_url: clip.video_url,
    thumbnail_url: clip.thumbnail_url || '',
    dealership_id: clip.dealership_id,
    car_id: clip.car_id,
    status: clip.status
  });

  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [availableDealerships, setAvailableDealerships] = useState<Dealership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewVideo, setPreviewVideo] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isVisible) {
      fetchDealerships();
      fetchCars();
    }
  }, [isVisible]);

  useEffect(() => {
    if (formData.dealership_id) {
      fetchCarsByDealership(formData.dealership_id);
    }
  }, [formData.dealership_id]);

  const fetchDealerships = async () => {
    try {
      const { data, error } = await supabase
        .from('dealerships')
        .select('id, name, logo, location')
        .order('name');

      if (error) throw error;
      setAvailableDealerships(data || []);
    } catch (error) {
      console.error('Error fetching dealerships:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, dealership_id')
        .order('year', { ascending: false });

      if (error) throw error;
      setAvailableCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const fetchCarsByDealership = async (dealershipId: number) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, dealership_id')
        .eq('dealership_id', dealershipId)
        .order('year', { ascending: false });

      if (error) throw error;
      setAvailableCars(data || []);
    } catch (error) {
      console.error('Error fetching cars by dealership:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.video_url.trim()) {
      newErrors.video_url = 'Video URL is required';
    } else if (!isValidUrl(formData.video_url)) {
      newErrors.video_url = 'Please enter a valid URL';
    }

    if (formData.thumbnail_url && !isValidUrl(formData.thumbnail_url)) {
      newErrors.thumbnail_url = 'Please enter a valid URL';
    }

    if (!formData.dealership_id) {
      newErrors.dealership_id = 'Dealership is required';
    }

    if (!formData.car_id) {
      newErrors.car_id = 'Car is required';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('auto_clips')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          video_url: formData.video_url.trim(),
          thumbnail_url: formData.thumbnail_url.trim() || null,
          dealership_id: formData.dealership_id,
          car_id: formData.car_id,
          status: formData.status
        })
        .eq('id', clip.id);

      if (error) throw error;

      alert('AutoClip updated successfully!');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating AutoClip:', error);
      alert(`Failed to update AutoClip: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCar = () => {
    return availableCars.find(car => car.id === formData.car_id);
  };

  const getSelectedDealership = () => {
    return availableDealerships.find(d => d.id === formData.dealership_id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Edit AutoClip</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter clip title..."
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Enter clip description..."
                    rows={4}
                    maxLength={1000}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                Media URLs
              </h3>
              
              <div className="space-y-4">
                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => handleInputChange('video_url', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.video_url ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="https://example.com/video.mp4"
                  />
                  {errors.video_url && (
                    <p className="text-red-400 text-sm mt-1">{errors.video_url}</p>
                  )}
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.thumbnail_url ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  {errors.thumbnail_url && (
                    <p className="text-red-400 text-sm mt-1">{errors.thumbnail_url}</p>
                  )}
                </div>

                {/* Preview buttons */}
                <div className="flex space-x-3">
                  {formData.video_url && isValidUrl(formData.video_url) && (
                    <button
                      onClick={() => setPreviewVideo(!previewVideo)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                    >
                      {previewVideo ? 'Hide' : 'Preview'} Video
                    </button>
                  )}
                </div>

                {/* Video Preview */}
                {previewVideo && formData.video_url && isValidUrl(formData.video_url) && (
                  <div className="mt-4">
                    <video
                      src={formData.video_url}
                      poster={formData.thumbnail_url}
                      controls
                      className="w-full max-w-md rounded-lg"
                      onError={() => {
                        alert('Error loading video. Please check the URL.');
                        setPreviewVideo(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dealership and Car Selection */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BuildingOffice2Icon className="h-5 w-5 mr-2" />
                Dealership & Car
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dealership */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dealership *
                  </label>
                  <select
                    value={formData.dealership_id}
                    onChange={(e) => handleInputChange('dealership_id', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.dealership_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="">Select dealership...</option>
                    {availableDealerships.map((dealership) => (
                      <option key={dealership.id} value={dealership.id}>
                        {dealership.name} - {dealership.location}
                      </option>
                    ))}
                  </select>
                  {errors.dealership_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.dealership_id}</p>
                  )}
                </div>

                {/* Car */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Car *
                  </label>
                  <select
                    value={formData.car_id}
                    onChange={(e) => handleInputChange('car_id', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 bg-gray-700 text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.car_id ? 'border-red-500' : 'border-gray-600'
                    }`}
                    disabled={!formData.dealership_id}
                  >
                    <option value="">
                      {formData.dealership_id ? 'Select car...' : 'Select dealership first'}
                    </option>
                    {availableCars
                      .filter(car => car.dealership_id === formData.dealership_id)
                      .map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.year} {car.make} {car.model} - ${car.price?.toLocaleString()}
                        </option>
                      ))}
                  </select>
                  {errors.car_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.car_id}</p>
                  )}
                </div>
              </div>

              {/* Selected car preview */}
              {getSelectedCar() && (
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Selected Car:</h4>
                  <div className="flex items-center space-x-4">
                    <TruckIcon className="h-8 w-8 text-indigo-400" />
                    <div>
                      <p className="text-white font-medium">
                        {getSelectedCar()?.year} {getSelectedCar()?.make} {getSelectedCar()?.model}
                      </p>
                      <p className="text-emerald-400 font-semibold">
                        ${getSelectedCar()?.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || Object.keys(errors).length > 0}
                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg font-medium transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Save Changes
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