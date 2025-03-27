'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/utils/AuthContext';
import { GuestUserProvider } from '@/utils/GuestUserContext';
import { FavoritesProvider } from '@/utils/FavoritesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize React Query client
const queryClient = new QueryClient();

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
  // Check if we're on the error page with a 405 error
  if (window.location.pathname === '/auth/signin' &&
      window.location.search.includes('next=%2Fhome')) {
    // Detect if we have authentication cookies
    const hasAuthCookie = document.cookie.includes('sb-') ||
                          document.cookie.includes('supabase');

    if (hasAuthCookie) {
      console.log('Detected authentication cookies, redirecting to home');
      window.location.href = '/home';
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