'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';

export default function GuestModeHandler() {
  const searchParams = useSearchParams();
  const guestParam = searchParams?.get('guest');
  const { isSignedIn, isLoaded } = useAuth();
  const { isGuest, setGuestMode } = useGuestUser();

  useEffect(() => {
    console.log('GuestModeHandler: Effect triggered', {
      isSignedIn,
      isGuest,
      isLoaded,
      guestParam
    });

    // Only handle guest mode if:
    // 1. Auth is loaded
    // 2. User is not already signed in
    // 3. User is not already in guest mode
    // 4. guest=true param exists in the URL
    if (isLoaded && !isSignedIn && !isGuest && guestParam === 'true') {
      console.log('GuestModeHandler: Conditions met, activating guest mode');

      const activateGuestMode = async () => {
        try {
          console.log('GuestModeHandler: Setting guest mode');
          const result = await setGuestMode(true);
          console.log('GuestModeHandler: Guest mode set, result:', result);

          // Clean URL by removing guest parameter
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('guest');
            window.history.replaceState({}, '', url.toString());
            console.log('GuestModeHandler: URL cleaned');

            // If on the main page, redirect to home
            if (window.location.pathname === '/') {
              console.log('GuestModeHandler: On main page, redirecting to /home');
              window.location.href = '/home';
            }
          }
        } catch (error) {
          console.error('GuestModeHandler: Error activating guest mode:', error);
        }
      };

      activateGuestMode();
    } else {
      console.log('GuestModeHandler: Conditions not met, skipping');
    }
  }, [isSignedIn, isGuest, isLoaded, guestParam, setGuestMode]);

  // This is a utility component that doesn't render anything
  return null;
}