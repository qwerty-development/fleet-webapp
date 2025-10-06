'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { useRouter } from 'next/navigation';

interface FavoritesContextType {
  favorites: number[];
  toggleFavorite: (carId: number) => Promise<number>;
  isFavorite: (carId: number) => boolean;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isSignedIn, profile } = useAuth();
  const { isGuest, guestId } = useGuestUser();
  const router = useRouter();
  const supabase = createClient();

  // Fetch favorites when user status changes (skip guests entirely)
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoaded(false);

        // Do not query the database for guest users
        if (isGuest) {
          setFavorites([]);
          setIsLoaded(true);
          return;
        }

        const userId = user?.id;

        if (!userId) {
          setFavorites([]);
          setIsLoaded(true);
          return;
        }

        // Fetch favorites from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('favorite')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching favorites:', error);
          setFavorites([]);
        } else {
          setFavorites(data?.favorite || []);
        }
      } catch (error) {
        console.error('Error in fetchFavorites:', error);
        setFavorites([]);
      } finally {
        setIsLoaded(true);
      }
    };

    if (isSignedIn && user?.id) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setIsLoaded(true);
    }
  }, [isSignedIn, isGuest, user, guestId, supabase]);

  // Toggle favorite status of a car
  const toggleFavorite = useCallback(async (carId: number): Promise<number> => {
    try {
      // Handle case where user is not signed in or is a guest
      if (!isSignedIn || isGuest) {
        router.push('/auth/signin');
        return 0;
      }

      const userId = user?.id;

      if (!userId) return 0;

      // Check if car is already in favorites
      const isFav = favorites.includes(carId);

      // Update favorites list immediately for a responsive UI
      const newFavorites = isFav
        ? favorites.filter(id => id !== carId)
        : [...favorites, carId];

      setFavorites(newFavorites);

      // Update database
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ favorite: newFavorites })
        .eq('id', userId)
        .select('favorite');

      if (updateError) {
        console.error('Error updating favorites:', updateError);
        // Revert the UI change on error
        setFavorites(favorites);
        return 0;
      }

      // Update car likes count using RPC function (same as your mobile app)
      const { data: newLikesCount, error: rpcError } = await supabase.rpc('toggle_car_like', {
        car_id: carId,
        user_id: userId
      });

      if (rpcError) {
        console.error('Error updating car likes count:', rpcError);
        return 0;
      }

      return newLikesCount as number;
    } catch (error) {
      console.error('Unexpected error in toggleFavorite:', error);
      return 0;
    }
  }, [favorites, isSignedIn, isGuest, user, router, supabase]);

  // Check if a car is in favorites
  const isFavorite = useCallback((carId: number) => {
    return favorites.includes(carId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        isLoaded
      }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};