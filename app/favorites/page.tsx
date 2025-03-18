'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { HeartIcon } from '@heroicons/react/24/solid';

// Dynamically import Navbar to avoid SSR issues with localStorage
const Navbar = dynamic(() => import('@/components/home/Navbar'), { ssr: false });

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
  status: string;
  condition: string;
  color: string;
  mileage: number;
}

export default function FavoritesPage() {
  const { user, profile, isLoaded, isSignedIn } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const router = useRouter();
  const supabase = createClient();

  const [favorites, setFavorites] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not signed in or guest
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isGuest) {
      router.push('/auth/signin');
    }
  }, [isLoaded, isSignedIn, isGuest, router]);

  // Fetch favorite cars
  useEffect(() => {
    const fetchFavorites = async () => {
      if ((!isSignedIn && !isGuest) || !isLoaded) return;

      try {
        const userId = isGuest ? `guest_${guestId}` : user?.id;

        if (!userId) {
          setLoading(false);
          return;
        }

        // Get user's favorite car IDs
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('favorite')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user favorites:', userError);
          setLoading(false);
          return;
        }

        const favoriteIds = userData?.favorite || [];

        if (favoriteIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Fetch car details for favorites
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .in('id', favoriteIds);

        if (carsError) {
          console.error('Error fetching favorite cars:', carsError);
        } else {
          setFavorites(carsData || []);
        }
      } catch (error) {
        console.error('Error in fetchFavorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isSignedIn, isGuest, isLoaded, user, guestId, supabase]);

  // Handle removing a car from favorites
  const removeFavorite = async (carId: number) => {
    try {
      const userId = isGuest ? `guest_${guestId}` : user?.id;

      if (!userId) return;

      // Get current favorites
      const { data, error } = await supabase
        .from('users')
        .select('favorite')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentFavorites = data?.favorite || [];
      const updatedFavorites = currentFavorites.filter((id: number) => id !== carId);

      // Update favorites in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ favorite: updatedFavorites })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setFavorites(favorites.filter(car => car.id !== carId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format mileage with commas
  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  // If not signed in or guest and still loading, show auth required page
  if (isLoaded && !isSignedIn && !isGuest) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black-light">
      <Navbar />

      <main className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-white mb-8 mt-4">Your Favorites</h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(car => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-black-medium border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:border-accent transition-colors duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-black-light flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => removeFavorite(car.id)}
                        className="p-2 bg-black/40 backdrop-blur-sm rounded-full text-accent hover:bg-black/60 transition-colors"
                      >
                        <HeartIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {car.status === 'sold' && (
                      <div className="absolute top-3 left-3 bg-red-900/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                        SOLD
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {car.year} {car.make} {car.model}
                    </h3>

                    <p className="text-2xl font-semibold text-accent mb-3">
                      {formatPrice(car.price)}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-black-light px-3 py-2 rounded-lg">
                        <span className="text-gray-400 text-xs">Condition</span>
                        <p className="text-white text-sm font-medium">{car.condition}</p>
                      </div>

                      <div className="bg-black-light px-3 py-2 rounded-lg">
                        <span className="text-gray-400 text-xs">Color</span>
                        <p className="text-white text-sm font-medium">{car.color}</p>
                      </div>

                      <div className="bg-black-light px-3 py-2 rounded-lg">
                        <span className="text-gray-400 text-xs">Mileage</span>
                        <p className="text-white text-sm font-medium">{formatMileage(car.mileage)} mi</p>
                      </div>

                      <div className="bg-black-light px-3 py-2 rounded-lg">
                        <span className="text-gray-400 text-xs">Status</span>
                        <p className="text-white text-sm font-medium capitalize">{car.status}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => router.push(`/cars/${car.id}`)}
                        className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 font-bold py-2 px-4 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-black-medium border border-gray-800 rounded-xl p-12 shadow-xl text-center">
              <h3 className="text-2xl font-semibold text-white mb-4">No Favorites Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                You haven't added any cars to your favorites. Browse the available cars and click the heart icon to add favorites.
              </p>
              <button
                onClick={() => router.push('/cars')}
                className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Cars
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}