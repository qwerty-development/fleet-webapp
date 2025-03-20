// components/auth/GoogleAuthHandler.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './GoogleAuthHandler.module.css';

interface EnvironmentInfo {
  isWebView: boolean;
  reason: string | null;
  browserInfo: string;
}

export default function GoogleAuthHandler() {
  const { signInWithIdToken } = useAuth();
  const router = useRouter();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo>({
    isWebView: false,
    reason: null,
    browserInfo: ''
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const initAttempts = useRef(0);

  // Google Client ID from environment variable
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Detect environment - is this a web view?
  const detectEnvironment = () => {
    const ua = navigator.userAgent;
    const browserInfo = `${navigator.userAgent} | ${navigator.vendor} | ${window.navigator.maxTouchPoints}`;

    // Common web view patterns
    const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
    const isAndroidWebView = /Android.*wv/.test(ua);
    const isGenericWebView = /(WebView|wv)/.test(ua);
    const isFacebookBrowser = /FBAN|FBAV/.test(ua);
    const isInstagramBrowser = /Instagram/.test(ua);

    // Special case for development environments
    const isDevelopmentEnv = window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname.includes('.gitpod.io');

    // Determine the specific reason for web view detection
    let reason = null;
    if (isIOSWebView) reason = 'ios_webview';
    else if (isAndroidWebView) reason = 'android_webview';
    else if (isFacebookBrowser) reason = 'facebook_browser';
    else if (isInstagramBrowser) reason = 'instagram_browser';
    else if (isGenericWebView) reason = 'generic_webview';
    else if (isDevelopmentEnv) reason = 'development_environment';

    const isWebView = isIOSWebView || isAndroidWebView || isGenericWebView ||
                      isFacebookBrowser || isInstagramBrowser;

    setEnvironmentInfo({
      isWebView,
      reason,
      browserInfo
    });

    console.log('Environment detection:', { isWebView, reason, browserInfo });
    return { isWebView, reason, browserInfo };
  };

  // Process credential response from Google
  const handleCredentialResponse = async (response: any) => {
    console.log('Google credential response received');

    try {
      if (!signInWithIdToken) {
        console.error('signInWithIdToken not available');
        return;
      }

      const { data, error } = await signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        return;
      }

      console.log('Successfully signed in with Google');
      router.push('/home');
    } catch (error) {
      console.error('Error processing Google credential:', error);
    }
  };

  // Initialize Google Sign-In
  const initializeGoogleAuth = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (initAttempts.current < 5) {
        console.log(`Google API not available, attempt ${initAttempts.current + 1}/5`);
        initAttempts.current++;
        setTimeout(initializeGoogleAuth, 1000);
      } else {
        console.error('Failed to load Google API after multiple attempts');
      }
      return;
    }

    // Only initialize once
    if (isInitialized) return;

    try {
      // Check environment before attempting initialization
      const { isWebView } = detectEnvironment();

      console.log('Initializing Google Sign-In with client ID:', GOOGLE_CLIENT_ID);

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: !isWebView, // Only auto-select in standard browsers
        cancel_on_tap_outside: false
      });

      // Standard browser - try One Tap first
      if (!isWebView) {
        console.log('Attempting to display Google One Tap');
        window.google.accounts.id.prompt((notification) => {
          const notDisplayedReason = notification.isNotDisplayed()
            ? notification.getNotDisplayedReason()
            : null;

          const skippedReason = notification.isSkippedMoment()
            ? notification.getSkippedReason()
            : null;

          const dismissedReason = notification.isDismissedMoment()
            ? notification.getDismissedReason()
            : null;

          console.log('One Tap notification:', {
            notDisplayed: notDisplayedReason,
            skipped: skippedReason,
            dismissed: dismissedReason
          });

          // If One Tap failed for any reason, render the button as fallback
          if (notDisplayedReason || skippedReason) {
            renderGoogleButton();
          }
        });
      } else {
        // Web view environment - use standard button immediately
        console.log('Web view detected, using standard Google Sign-In button');
        renderGoogleButton();
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  };

  // Render standard Google Sign-In button
  const renderGoogleButton = () => {
    if (!buttonContainerRef.current || !window.google?.accounts?.id) return;

    try {
      console.log('Rendering standard Google Sign-In button');

      // Clear existing content
      while (buttonContainerRef.current.firstChild) {
        buttonContainerRef.current.removeChild(buttonContainerRef.current.firstChild);
      }

      // Render the button
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 280
      });

      // Make button container visible
      buttonContainerRef.current.style.display = 'flex';
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
  };

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID) return;

    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-script')) {
        console.log('Google script already loaded, initializing auth');
        initializeGoogleAuth();
        return;
      }

      console.log('Loading Google Identity Services script');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-identity-script';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Identity Services script loaded');
        initializeGoogleAuth();
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services script:', error);
      };

      document.head.appendChild(script);
    };

    // Start loading process with a slight delay
    setTimeout(loadGoogleScript, 500);

    // Clean up on component unmount
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [GOOGLE_CLIENT_ID, router, signInWithIdToken]);

  return (
    <>
      {/* Hidden container for standard Google button (shows when One Tap fails) */}
      <div
        ref={buttonContainerRef}
        className="w-full flex justify-center my-4 hidden"
        style={{ display: 'none' }}
        aria-label="Sign in with Google button container"
      />

      {/* Dev info - only shown in development */}
      {process.env.NODE_ENV === 'development' && environmentInfo.isWebView && (
        <div className="text-xs text-amber-500 mt-1 text-center">
          Web view detected ({environmentInfo.reason}). Using fallback authentication.
        </div>
      )}
    </>
  );
}