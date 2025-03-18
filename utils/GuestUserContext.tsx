'use client'
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface GuestUserContextType {
  isGuest: boolean;
  guestId: string | null;
  setGuestMode: (isActive: boolean) => Promise<void>;
  clearGuestMode: () => Promise<void>;
}

const GuestUserContext = createContext<GuestUserContextType | undefined>(undefined);

export const GuestUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize the context by checking localStorage
  useEffect(() => {
    const initializeGuestState = () => {
      try {
        const storedIsGuest = localStorage.getItem('isGuestUser');
        const storedGuestId = localStorage.getItem('guestUserId');

        if (storedIsGuest === 'true' && storedGuestId) {
          setIsGuest(true);
          setGuestId(storedGuestId);
        }
      } catch (error) {
        console.error('Error loading guest state:', error);
      }
    };

    // Only run in browser environment
    if (typeof window !== 'undefined') {
      initializeGuestState();
    }
  }, []);

  const setGuestMode = async (isActive: boolean) => {
    try {
      if (typeof window === 'undefined') return;

      const id = isActive ? (guestId || uuidv4()) : null;

      localStorage.setItem('isGuestUser', isActive ? 'true' : 'false');

      if (isActive && id) {
        localStorage.setItem('guestUserId', id);
      } else {
        localStorage.removeItem('guestUserId');
      }

      setIsGuest(isActive);
      setGuestId(id);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const clearGuestMode = async () => {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem('isGuestUser');
      localStorage.removeItem('guestUserId');
      setIsGuest(false);
      setGuestId(null);
    } catch (error) {
      console.error('Error clearing guest mode:', error);
    }
  };

  return (
    <GuestUserContext.Provider value={{ isGuest, guestId, setGuestMode, clearGuestMode }}>
      {children}
    </GuestUserContext.Provider>
  );
};

export const useGuestUser = () => {
  const context = useContext(GuestUserContext);
  if (context === undefined) {
    throw new Error('useGuestUser must be used within a GuestUserProvider');
  }
  return context;
};