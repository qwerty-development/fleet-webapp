'use client';

import React from 'react';
import { AuthProvider } from '@/utils/AuthContext';
import { GuestUserProvider } from '@/utils/GuestUserContext';
import { FavoritesProvider } from '@/utils/FavoritesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize React Query client
const queryClient = new QueryClient();

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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