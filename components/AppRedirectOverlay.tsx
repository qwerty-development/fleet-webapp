

import { detectPlatform, attemptAndroidAppLaunch, attemptIOSAppLaunch, getDeepLink, DEEP_LINK_CONFIG } from "@/utils/androidDeepLinkUtils";
import { useState, useRef, useEffect } from "react";

interface AppRedirectOverlayProps {
  itemId: string;
  itemType: 'car' | 'clip';
  onClose: () => void;
  title: string;
  subtitle?: string;
}

export const AppRedirectOverlay: React.FC<AppRedirectOverlayProps> = ({
  itemId,
  itemType,
  onClose,
  title,
  subtitle,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [redirectStatus, setRedirectStatus] = useState<"waiting" | "attempting" | "failed">("waiting");
  const attemptedRef = useRef(false);
  const { platform, isMobile } = detectPlatform();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!attemptedRef.current) {
      attemptedRef.current = true;
      handleAppLaunch();
    }
  }, [countdown]);

  const handleAppLaunch = async () => {
    setRedirectStatus("attempting");
    const deepLink = getDeepLink(itemType, itemId);
    
    let success = false;
    if (platform === 'android') {
      success = await attemptAndroidAppLaunch(deepLink);
    } else if (platform === 'ios') {
      success = await attemptIOSAppLaunch(deepLink);
    }
    
    setRedirectStatus(success ? "attempting" : "failed");
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
          <img src="/logo.png" alt="Fleet App" className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {redirectStatus === "failed" ? "Open in Fleet App" : "Opening in Fleet App"}
        </h2>
        
        <p className="text-gray-300 mb-2">{title}</p>
        {subtitle && <p className="text-gray-400 text-sm mb-4">{subtitle}</p>}

        <div className="mb-6">
          {redirectStatus === "waiting" && countdown > 0 && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">Opening app in {countdown}...</p>
            </>
          )}
          
          {redirectStatus === "attempting" && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">Opening Fleet App...</p>
            </>
          )}
          
          {redirectStatus === "failed" && (
            <p className="text-gray-400">
              App not installed? Download Fleet to view this {itemType}.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={getDeepLink(itemType, itemId)}
            className="block w-full py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium"
          >
            Open in Fleet App
          </a>

          <a
            href={platform === 'android' ? DEEP_LINK_CONFIG.playStoreUrl : DEEP_LINK_CONFIG.appStoreUrl}
            className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
          >
            Download Fleet App
          </a>

          <button
            onClick={onClose}
            className="block w-full py-3 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg font-medium"
          >
            Continue on Website
          </button>
        </div>
      </div>
    </div>
  );
};



// Usage in clip detail page:
// <AppRedirectOverlay
//   itemId={clip.id.toString()}
//   itemType="clip"
//   onClose={handleCloseRedirect}
//   title={clip.car ? `${clip.car.year} ${clip.car.make} ${clip.car.model}` : clip.title || "Video"}
//   subtitle="Watch this video in the app"
// />