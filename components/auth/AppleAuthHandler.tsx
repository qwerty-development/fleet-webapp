'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AppleRedirectAuthHandler() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateAppleAuth = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate cryptographically secure state
      const generateState = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      };

      const state = generateState();

      // Store state in session storage for validation
      sessionStorage.setItem('apple_auth_state', state);

      // Get client ID from environment
      const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Apple Client ID not configured');
      }

      // Build the redirect URL with exact format
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);

      // Build authentication URL with exact parameter order
      const authUrl =
        'https://appleid.apple.com/auth/authorize' +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        '&response_type=code id_token' +
        '&scope=name email' +
        `&state=${state}` +
        '&response_mode=form_post';

      // Log URL for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Apple Auth URL:', authUrl);
      }

      // Use location.assign for reliable navigation
      window.location.assign(authUrl);
    } catch (error) {
      console.error('Apple auth initiation error:', error);
      setError('Failed to initiate Apple authentication. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="w-full text-sm text-center text-red-500 bg-red-500/10 rounded-lg py-2 px-3 border border-red-500/20 mb-3">
          {error}
        </div>
      )}

      <button
        onClick={initiateAppleAuth}
        disabled={isLoading}
        className="flex items-center justify-center w-full bg-white text-black border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black mr-2"></div>
            <span>Connecting to Apple...</span>
          </div>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.569 12.6254C17.597 15.4511 20.2129 16.3555 20.247 16.3683C20.2259 16.4352 19.875 17.7106 18.9927 19.0546C18.2287 20.1979 17.4224 21.3371 16.1808 21.3647C14.9673 21.3922 14.5686 20.5982 13.1762 20.5982C11.7858 20.5982 11.3466 21.3371 10.1957 21.3922C9.01321 21.4472 8.06051 20.1449 7.2869 19.0095C5.70406 16.6828 4.50156 12.4262 6.12557 9.57095C6.92936 8.15579 8.34453 7.25053 9.88701 7.22301C11.0563 7.1969 12.1547 8.07047 12.8594 8.07047C13.5661 8.07047 14.9053 7.02527 16.3169 7.15736C16.8571 7.17962 18.3747 7.37897 19.3557 8.75896C19.2671 8.8167 17.547 9.77485 17.569 12.6254ZM15.584 5.68173C16.2062 4.91109 16.6142 3.85182 16.4916 2.75C15.5559 2.79141 14.4246 3.35205 13.7784 4.11318C13.2002 4.79003 12.7037 5.88377 12.8491 6.94947C13.8916 7.03037 14.9618 6.45097 15.584 5.68173Z" fill="black"/>
            </svg>
            Sign in with Apple
          </>
        )}
      </button>
    </div>
  );
}