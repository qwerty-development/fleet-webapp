'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';

export default function GuestModeHandler() {
  const searchParams = useSearchParams();
  const guestParam = searchParams.get('guest');
  const { isSignedIn, isLoaded } = useAuth();
  const { isGuest, setGuestMode } = useGuestUser();
  const router = useRouter();

  useEffect(() => {
    // Only handle guest mode if:
    // 1. User is not already signed in
    // 2. User is not already in guest mode
    // 3. Auth is loaded
    // 4. guest=true param exists in the URL
    if (!isSignedIn && !isGuest && isLoaded && guestParam === 'true') {
      const activateGuestMode = async () => {
        await setGuestMode(true);

        // Remove the guest parameter from URL without a page reload
        const url = new URL(window.location.href);
        url.searchParams.delete('guest');
        window.history.replaceState({}, '', url.toString());

        // If on the main page, redirect to home
        if (window.location.pathname === '/') {
          router.push('/home');
        }
      };

      activateGuestMode();
    }
  }, [isSignedIn, isGuest, isLoaded, guestParam, setGuestMode, router]);

  // This is a utility component that doesn't render anything
  return null;
}