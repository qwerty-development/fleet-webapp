'use client';

import React from 'react';
import { AuthProvider } from '@/utils/AuthContext';
import { GuestUserProvider } from '@/utils/GuestUserContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GuestUserProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </GuestUserProvider>
  );
}