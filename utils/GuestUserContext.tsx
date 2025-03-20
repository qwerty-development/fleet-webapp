'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface GuestUserContextType {
  isGuest: boolean;
  guestId: string | null;
  setGuestMode: (isActive: boolean) => Promise<string | null>;
  clearGuestMode: () => Promise<void>;
}

// Create a default context value
const defaultContextValue: GuestUserContextType = {
  isGuest: false,
  guestId: null,
  setGuestMode: async () => null,
  clearGuestMode: async () => {},
};

const GuestUserContext = createContext<GuestUserContextType>(defaultContextValue);

export const GuestUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Helper function to get a cookie value by name
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Helper function to set a cookie
  const setCookie = (name: string, value: string, days: number = 1): void => {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  // Helper function to delete a cookie
  const deleteCookie = (name: string): void => {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  };

  // Initialize the context by checking both localStorage and cookies
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;

    try {


      // Check localStorage first
      const storedIsGuest = localStorage.getItem('isGuestUser');
      const storedGuestId = localStorage.getItem('guestUserId');

      // Also check cookies as fallback (for server-side consistency)
      const cookieIsGuest = getCookie('isGuestUser');
      const cookieGuestId = getCookie('guestUserId');



      // Use either localStorage or cookie values, preferring localStorage
      const isGuestActive = storedIsGuest === 'true' || cookieIsGuest === 'true';
      const userGuestId = storedGuestId || cookieGuestId;

      if (isGuestActive && userGuestId) {

        setIsGuest(true);
        setGuestId(userGuestId);

        // Ensure both storage mechanisms are in sync
        localStorage.setItem('isGuestUser', 'true');
        localStorage.setItem('guestUserId', userGuestId);
        setCookie('isGuestUser', 'true');
        setCookie('guestUserId', userGuestId);
      }
    } catch (error) {
      console.error('GuestUserContext: Error loading guest state:', error);
    } finally {
      setIsInitialized(true);

    }
  }, [isInitialized]);

  // Set guest mode
  const setGuestMode = useCallback(async (isActive: boolean): Promise<string | null> => {


    if (typeof window === 'undefined') {

      return null;
    }

    try {
      // Generate new ID if needed, or use existing one
      const id = isActive ? (guestId || uuidv4()) : null;


      // Update storage mechanisms
      if (isActive && id) {


        // Set localStorage (client-side)
        localStorage.setItem('isGuestUser', 'true');
        localStorage.setItem('guestUserId', id);

        // Set cookies (for server/middleware)
        setCookie('isGuestUser', 'true');
        setCookie('guestUserId', id);
      } else {


        // Clear localStorage
        localStorage.removeItem('isGuestUser');
        localStorage.removeItem('guestUserId');

        // Clear cookies
        deleteCookie('isGuestUser');
        deleteCookie('guestUserId');
      }

      // Update state

      setIsGuest(isActive);
      setGuestId(id);

      // Return the ID for verification
      return id;
    } catch (error) {
      console.error('GuestUserContext: Error setting guest mode:', error);
      return null;
    }
  }, [guestId]);

  // Clear guest mode
  const clearGuestMode = useCallback(async (): Promise<void> => {


    if (typeof window === 'undefined') {

      return;
    }

    try {
      // Clear all storage mechanisms


      // Clear localStorage
      localStorage.removeItem('isGuestUser');
      localStorage.removeItem('guestUserId');

      // Clear cookies
      deleteCookie('isGuestUser');
      deleteCookie('guestUserId');


      setIsGuest(false);
      setGuestId(null);
    } catch (error) {
      console.error('GuestUserContext: Error clearing guest mode:', error);
    }
  }, []);

  // Enhance fetch requests with guest headers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isGuest && guestId) {
      // Add headers to fetch requests when in guest mode
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        init = init || {};
        init.headers = init.headers || {};

        // Add guest mode headers to API requests
        init.headers = {
          ...init.headers,
          'x-guest-mode': 'true',
          'x-guest-id': guestId
        };

        return originalFetch(input, init);
      };

      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [isGuest, guestId]);

  // Log state changes during development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {

    }
  }, [isGuest, guestId]);

  const contextValue = {
    isGuest,
    guestId,
    setGuestMode,
    clearGuestMode,
  };

  return (
    <GuestUserContext.Provider value={contextValue}>
      {children}
    </GuestUserContext.Provider>
  );
};

export const useGuestUser = (): GuestUserContextType => {
  const context = useContext(GuestUserContext);
  if (context === undefined) {
    console.error('useGuestUser must be used within a GuestUserProvider');
    return defaultContextValue;
  }
  return context;
};