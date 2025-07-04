// utils/androidDeepLinkUtils.ts

export const DEEP_LINK_CONFIG = {
  appStoreUrl: 'https://apps.apple.com/app/fleet/id6742141291',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.qwertyapp.clerkexpoquickstart',
  webDomain: 'fleetapp.me',
  appScheme: 'fleet',
  androidPackage: 'com.qwertyapp.clerkexpoquickstart',
  iosAppId: '6742141291',
} as const;

export interface PlatformInfo {
  platform: 'android' | 'ios' | 'unknown';
  isMobile: boolean;
  isTablet: boolean;
  userAgent: string;
}

export const detectPlatform = (): PlatformInfo => {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', isMobile: false, isTablet: false, userAgent: '' };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for mobile/tablet
  const isMobile = /mobile|android|iphone|ipod/i.test(userAgent);
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
  
  // Determine platform
  let platform: 'android' | 'ios' | 'unknown' = 'unknown';
  
  if (/android/i.test(userAgent)) {
    platform = 'android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    platform = 'ios';
  }

  return {
    platform,
    isMobile: isMobile || isTablet,
    isTablet,
    userAgent,
  };
};

export const getDeepLink = (type: 'car' | 'clip', id: string): string => {
  // Always use the custom scheme for deep links
  // This ensures consistent behavior across platforms
  return `${DEEP_LINK_CONFIG.appScheme}://${type}s/${id}`;
};

export const getUniversalLink = (type: 'car' | 'clip', id: string): string => {
  // Universal links for fallback
  return `https://www.${DEEP_LINK_CONFIG.webDomain}/${type}s/${id}`;
};

export const attemptAndroidAppLaunch = async (deepLink: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Method 1: Intent URL for Android (most reliable)
    const intentUrl = `intent://${deepLink.replace(/^[^:]+:\/\//, '')}#Intent;scheme=${DEEP_LINK_CONFIG.appScheme};package=${DEEP_LINK_CONFIG.androidPackage};end`;
    
    // Create a hidden iframe to attempt the launch
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    // Set up a timeout to detect if app didn't open
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      
      // Try fallback method using window.location
      window.location.href = deepLink;
      
      // Give it a moment, then resolve as failed
      setTimeout(() => resolve(false), 1000);
    }, 2500);

    // Attempt to open the app
    try {
      iframe.src = intentUrl;
      
      // Also try direct navigation as backup
      setTimeout(() => {
        window.location.href = deepLink;
      }, 100);

      // Check if page is still visible (app didn't open)
      setTimeout(() => {
        if (!document.hidden) {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve(false);
        } else {
          // App likely opened
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve(true);
        }
      }, 1500);
    } catch (e) {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      resolve(false);
    }
  });
};

export const attemptIOSAppLaunch = async (deepLink: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // For iOS, we'll use a simpler approach
    window.location.href = deepLink;
    
    // Check if the page is still visible after a delay
    setTimeout(() => {
      if (document.hidden) {
        resolve(true); // App opened
      } else {
        resolve(false); // App didn't open
      }
    }, 2000);
  });
};

export const launchApp = async (type: 'car' | 'clip', id: string): Promise<boolean> => {
  const { platform } = detectPlatform();
  const deepLink = getDeepLink(type, id);
  
  if (platform === 'android') {
    return attemptAndroidAppLaunch(deepLink);
  } else if (platform === 'ios') {
    return attemptIOSAppLaunch(deepLink);
  }
  
  // For unknown platforms, just try to open the link
  window.location.href = deepLink;
  return false;
};