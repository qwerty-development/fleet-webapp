'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useRouter } from 'next/navigation';

// Define TypeScript interfaces
interface EnvironmentInfo {
  isWebView: boolean;
  reason: string | null;
  browserInfo: string;
}

interface GoogleAuthState {
  isLoading: boolean;
  isScriptLoaded: boolean;
  isInitialized: boolean;
  error: string | null;
}

export default function GoogleAuthHandler() {
  const { signInWithIdToken } = useAuth();
  const router = useRouter();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const customButtonRef = useRef<HTMLButtonElement>(null);


  // Track component state
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo>({
    isWebView: false,
    reason: null,
    browserInfo: ''
  });

  const [authState, setAuthState] = useState<GoogleAuthState>({
    isLoading: true,
    isScriptLoaded: false,
    isInitialized: false,
    error: null
  });
  useEffect(() => {
  // Clean up navigation tracking when component unmounts
  return () => {
    sessionStorage.removeItem('google_auth_redirect_pending');
  };
}, []);

  const initAttempts = useRef(0);
  const maxAttempts = 5;
  const attemptInterval = 1000; // ms

  // Google Client ID from environment variable
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Environment detection function with improved reliability
  const detectEnvironment = (): EnvironmentInfo => {
    if (typeof window === 'undefined') {
      return { isWebView: false, reason: null, browserInfo: 'server' };
    }

    const ua = navigator.userAgent;
    const browserInfo = `${navigator.userAgent} | ${navigator.vendor} | ${window.navigator.maxTouchPoints}`;

    // Common web view patterns
    const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua)

    const isAndroidWebView = /Android.*wv/.test(ua);
    const isGenericWebView = /(WebView|wv)/.test(ua);
    const isFacebookBrowser = /FBAN|FBAV/.test(ua);
    const isInstagramBrowser = /Instagram/.test(ua);
    const isLinkedInBrowser = /LinkedIn/.test(ua);

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
    else if (isLinkedInBrowser) reason = 'linkedin_browser';
    else if (isGenericWebView) reason = 'generic_webview';
    else if (isDevelopmentEnv) reason = 'development_environment';

    const isWebView = isIOSWebView || isAndroidWebView || isGenericWebView ||
                      isFacebookBrowser || isInstagramBrowser || isLinkedInBrowser;

    return {
      isWebView,
      reason,
      browserInfo
    };
  };

  const initNetworkStatusListener = () => {
  // Set up network status detection
  const updateNetworkStatus = () => {
    if (!navigator.onLine) {
      setAuthState(prev => ({
        ...prev,
        error: 'You appear to be offline. Please check your internet connection.'
      }));
    } else {
      // Clear network error if we're back online and there was a network error
      setAuthState(prev => {
        if (prev.error?.includes('offline') || prev.error?.includes('internet')) {
          return { ...prev, error: null };
        }
        return prev;
      });
    }
  };

  // Initial check
  updateNetworkStatus();

  // Set up listeners for network status changes
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  };
};

  // Process credential response from Google
const handleCredentialResponse = async (response: any) => {
  console.log('Google credential response received');

  if (!response?.credential) {
    setAuthState(prev => ({
      ...prev,
      error: 'Invalid credential received from Google'
    }));
    return;
  }

  try {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    if (!signInWithIdToken) {
      throw new Error('Authentication method not available');
    }

    // 1. Create an authentication promise
    const authPromise = signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });

    // 2. Create a timeout promise (15 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication request timed out')), 15000)
    );

    // 3. Race the promises
    const { data, error, errorType } = await Promise.race([
      authPromise,
      timeoutPromise
    ]);

    if (error) {
      console.error('Error signing in with Google:', error);

      // Set user-friendly error messages based on error type
      let errorMessage = 'Failed to sign in with Google';
      if (errorType === 'network') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorType === 'auth') {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (error.message?.includes('timed out')) {
        errorMessage = 'Authentication request timed out. Please try again.';
      }

      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return;
    }

    console.log('Successfully signed in with Google');

    // 4. Flag for navigation tracking
    sessionStorage.setItem('google_auth_redirect_pending', 'true');

    // 5. Attempt primary navigation
    try {
      router.push('/home');

      // 6. Set a fallback timeout to check if navigation worked
      setTimeout(() => {
        // If we're still on this page after 1.5 seconds, use fallback navigation
        if (sessionStorage.getItem('google_auth_redirect_pending') === 'true') {
          console.log('Navigation fallback triggered after Google sign-in');
          sessionStorage.removeItem('google_auth_redirect_pending');
          window.location.href = '/home';
        }
      }, 1500);
    } catch (navError) {
      // If router.push fails, fall back to direct location change
      console.error('Navigation error after Google sign-in:', navError);
      window.location.href = '/home';
    }
  } catch (error: any) {
    console.error('Error processing Google credential:', error);

    // Specific handling for timeout errors
    if (error.message?.includes('timed out')) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication request timed out. Please try again later.'
      }));
    } else {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to process Google sign in. Please try again.'
      }));
    }
  }
};

  // Initialize Google Sign-In with better error handling
  const initializeGoogleAuth = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      if (initAttempts.current < maxAttempts) {
        console.log(`Google API not available, attempt ${initAttempts.current + 1}/${maxAttempts}`);
        initAttempts.current++;
        setTimeout(initializeGoogleAuth, attemptInterval);
      } else {
        console.error('Failed to load Google API after multiple attempts');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Google Sign-In is currently unavailable. Please try again later or use another sign-in method.'
        }));
      }
      return;
    }

    // Only initialize once
    if (authState.isInitialized) return;

    try {
      // Check environment before attempting initialization
      const envInfo = detectEnvironment();
      setEnvironmentInfo(envInfo);

      console.log('Initializing Google Sign-In with client ID:', GOOGLE_CLIENT_ID);

      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: !envInfo.isWebView, // Only auto-select in standard browsers
        cancel_on_tap_outside: false,
        prompt_parent_id: envInfo.isWebView ? buttonContainerRef.current?.id : undefined
      });

      // Standard browser - try One Tap first
      if (!envInfo.isWebView) {
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

      setAuthState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error initializing Google Sign-In:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize Google Sign-In. Please refresh and try again.'
      }));
    }
  };

  // Render standard Google Sign-In button with consistent styling
  const renderGoogleButton = () => {
    if (!buttonContainerRef.current || !window.google?.accounts?.id) {
      return;
    }

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
        width: buttonContainerRef.current.offsetWidth || 280
      });

      // Make button container visible with smooth fade in
      buttonContainerRef.current.style.opacity = '0';
      buttonContainerRef.current.style.display = 'flex';

      // Trigger reflow for animation to work
      void buttonContainerRef.current.offsetWidth;

      buttonContainerRef.current.style.opacity = '1';
      buttonContainerRef.current.style.transition = 'opacity 0.3s ease';
    } catch (error: any) {
      console.error('Error rendering Google button:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Unable to display Google Sign-In button. Please try refreshing the page.'
      }));

      // Show custom fallback button
      if (customButtonRef.current) {
        customButtonRef.current.style.display = 'flex';
      }
    }
  };

  // Handle manual Google Sign-In via custom button
  const handleManualGoogleSignIn = () => {
    // Trigger Google sign-in flow manually
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setAuthState(prev => ({
        ...prev,
        error: 'Google Sign-In is not available. Please try another method.'
      }));
    }
  };

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: !GOOGLE_CLIENT_ID ? 'Google Client ID is not configured.' : null
      }));
      return;
    }
    const networkCleanup = initNetworkStatusListener();
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Load Google Identity Services script with timeout
    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-script')) {
        console.log('Google script already loaded, initializing auth');
        setAuthState(prev => ({ ...prev, isScriptLoaded: true }));
        initializeGoogleAuth();
        return;
      }

      console.log('Loading Google Identity Services script');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-identity-script';
      script.async = true;
      script.defer = true;

      // Set loading timeout
      const timeoutId = setTimeout(() => {
        if (!window.google?.accounts?.id) {
          console.error('Google script loading timed out');
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load Google Sign-In. Please try refreshing the page.'
          }));
        }
      }, 10000); // 10 seconds timeout

      script.onload = () => {
        console.log('Google Identity Services script loaded');
        clearTimeout(timeoutId);
        setAuthState(prev => ({ ...prev, isScriptLoaded: true }));
        initializeGoogleAuth();
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services script:', error);
        clearTimeout(timeoutId);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load Google Sign-In. Please check your connection and try again.'
        }));
      };

      document.head.appendChild(script);
    };

    // Start loading process with a slight delay
    const scriptLoadTimer = setTimeout(loadGoogleScript, 500);

    // Clean up on component unmount
    return () => {
      clearTimeout(scriptLoadTimer);
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
       networkCleanup();
    };
  }, [GOOGLE_CLIENT_ID]);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3">
      {/* Loading state */}
      {authState.isLoading && (
        <div className="flex items-center justify-center w-full py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent mr-2"></div>
          <span className="text-sm text-gray-400">Loading Google Sign-In...</span>
        </div>
      )}

      {/* Error message */}
      {authState.error && (
        <div className="w-full text-sm text-center text-red-500 bg-red-500/10 rounded-lg py-2 px-3 border border-red-500/20">
          {authState.error}
        </div>
      )}

      {/* Google Button Container */}
      <div
        id="google-button-container"
        ref={buttonContainerRef}
        className="w-full flex justify-center my-2"
        style={{ display: 'none', transition: 'opacity 0.3s ease' }}
        aria-label="Sign in with Google button container"
      />

      {/* Custom fallback button for extreme cases */}
      <button
        ref={customButtonRef}
        onClick={handleManualGoogleSignIn}
        style={{ display: 'none' }}
        className="flex items-center justify-center w-full bg-white text-gray-700 border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
          />
        </svg>
        Sign in with Google
      </button>

      {/* Environment info (development only) */}
      {process.env.NODE_ENV === 'development' && environmentInfo.isWebView && (
        <div className="text-xs text-amber-500 mt-1 text-center">
          Web view detected ({environmentInfo.reason}). Using fallback authentication method.
        </div>
      )}
    </div>
  );
}