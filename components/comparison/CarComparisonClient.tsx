"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertCircle, Lock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useFavorites } from '@/utils/FavoritesContext';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { Car } from '@/types/comparison';
import { CarSelectionCard } from '@/components/comparison/CarSelectionCard';
import { TabNavigation } from '@/components/comparison/TabNavigation';
import { BasicsTab } from '@/components/comparison/BasicsTab';
import { FeaturesTab } from '@/components/comparison/FeaturesTable';
import { CostTab } from '@/components/comparison/CostTab';
import { SummaryTab } from '@/components/comparison/SummaryTab';
import { CarPickerModal } from '@/components/comparison/CarPickerModal';
import Navbar from '@/components/home/Navbar';

export default function CarComparisonClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const supabase = createClient();

  const [selectedCars, setSelectedCars] = useState<[Car | null, Car | null]>([null, null]);
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<'left' | 'right'>('left');
  // const [activeTab, setActiveTab] = useState<'basics' | 'features' | 'cost' | 'summary'>('basics');
  const [activeTab, setActiveTab] = useState<'basics' | 'features'  | 'summary'>('basics');

  useEffect(() => {
    const fetchFavoriteCars = async () => {
      if ((!user && !isGuest) || favorites.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cars')
          .select(
            `*
            , dealerships (
              name,
              logo,
              phone,
              location,
              latitude,
              longitude
            )`
          )
          .eq('status', 'available')
          .in('id', favorites);

        if (error) throw error;

        const availableCars = (data || [])
          .filter((item) => item && item.status === 'available')
          .map((item) => ({
            ...item,
            dealership_name: item.dealerships?.name,
            dealership_logo: item.dealerships?.logo,
            dealership_phone: item.dealerships?.phone,
            dealership_location: item.dealerships?.location,
            dealership_latitude: item.dealerships?.latitude,
            dealership_longitude: item.dealerships?.longitude,
          }));

        setFavoriteCars(availableCars);

        const car1Id = searchParams?.get('car1');
        const car2Id = searchParams?.get('car2');

        if (car1Id) {
          const car1 = availableCars.find((car) => car.id.toString() === car1Id);
          if (car1) setSelectedCars((prev) => [car1, prev[1]]);
        }

        if (car2Id) {
          const car2 = availableCars.find((car) => car.id.toString() === car2Id);
          if (car2) setSelectedCars((prev) => [prev[0], car2]);
        }
      } catch (error) {
        console.error('Error fetching favorite cars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteCars();
  }, [user, favorites, isGuest, searchParams]);

  const handleSelectCar = useCallback((car: Car, position: 'left' | 'right') => {
    setSelectedCars((prev) => {
      if (position === 'left') {
        return [car, prev[1]];
      } else {
        return [prev[0], car];
      }
    });
    setPickerVisible(false);
  }, []);

  const handleClearCar = useCallback((position: 'left' | 'right') => {
    setSelectedCars((prev) => {
      if (position === 'left') {
        return [null, prev[1]];
      } else {
        return [prev[0], null];
      }
    });
  }, []);

  const openCarPicker = useCallback((position: 'left' | 'right') => {
    setPickerPosition(position);
    setPickerVisible(true);
  }, []);

  const canCompare = useMemo(() => favoriteCars.length >= 2, [favoriteCars.length]);

  const handleSignIn = () => {
    clearGuestMode();
    router.push('/auth/signin');
  };

  const renderTabContent = () => {
    if (!selectedCars[0] || !selectedCars[1]) return null;

    switch (activeTab) {
      case 'basics':
        return <BasicsTab car1={selectedCars[0]} car2={selectedCars[1]} />;
      case 'features':
        return <FeaturesTab car1={selectedCars[0]} car2={selectedCars[1]} />;
      case 'cost':
        return <CostTab car1={selectedCars[0]} car2={selectedCars[1]} />;
      case 'summary':
        return <SummaryTab car1={selectedCars[0]} car2={selectedCars[1]} />;
      default:
        return null;
    }
  };

  if (isGuest) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-white p-8 rounded-xl max-w-md mx-4 shadow-lg border border-gray-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent/10 p-4 rounded-full mb-4">
                <Lock className="h-12 w-12 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">You're browsing as a guest</h2>
              <p className="mb-6 text-gray-600">Please sign in to access the car comparison feature.</p>
              <button
                onClick={handleSignIn}
                className="bg-accent hover:bg-accent/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/')}
                className="mt-4 text-gray-500 hover:text-gray-700"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-4"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Car Comparison</h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CarSelectionCard
                car={selectedCars[0]}
                position="left"
                onOpenPicker={openCarPicker}
                onClearCar={handleClearCar}
              />
              <CarSelectionCard
                car={selectedCars[1]}
                position="right"
                onOpenPicker={openCarPicker}
                onClearCar={handleClearCar}
              />
            </div>
            {selectedCars[0] && selectedCars[1] ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select Two Cars to Compare
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose from your favorite cars to see a detailed comparison of specifications, features, and insights.
                </p>
                {favoriteCars.length === 0 && (
                  <button
                    onClick={() => router.push('/home')}
                    className="mt-6 bg-accent hover:bg-accent/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Browse Cars to Add Favorites
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <CarPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        cars={favoriteCars}
        onSelect={handleSelectCar}
        selectedCars={selectedCars}
        position={pickerPosition}
      />
    </div>
  );
}
