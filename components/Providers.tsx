'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/utils/AuthContext';
import { GuestUserProvider } from '@/utils/GuestUserContext';
import { FavoritesProvider } from '@/utils/FavoritesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize React Query client
const queryClient = new QueryClient();

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Enhanced failsafe for Apple Sign-In redirect issue
  useEffect(() => {
    // Check if we're on the error page with potential 405 error
    if (window.location.pathname === '/auth/signin' &&
        window.location.search.includes('next=')) {

      // Detect if we have authentication cookies (more comprehensive check)
      const hasAuthCookie = document.cookie.split(';').some(cookie => {
        const trimmedCookie = cookie.trim();
        return trimmedCookie.startsWith('sb-') ||
               trimmedCookie.includes('supabase') ||
               trimmedCookie.includes('access_token');
      });

      if (hasAuthCookie) {
        console.log('Client-side failsafe: Detected authentication cookies, redirecting from signin page');
        // Extract the intended destination from the next parameter
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get('next') || '/home';

        // Strip URL encoding if present
        const cleanDestination = nextPath.replace(/%2F/g, '/');

        // Use history API to replace current URL to avoid adding to browser history
        window.location.replace(cleanDestination);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GuestUserProvider>
        <AuthProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </AuthProvider>
      </GuestUserProvider>
    </QueryClientProvider>
  );
};

export default Providers;