import { useState, useEffect } from "react";

export default function MobileAppBanner() {
  // 1. Show if on mobile *and* not already dismissed
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone/.test(navigator.userAgent);
    const dismissed = localStorage.getItem("fleetAppBannerDismissed") === "true";

    if (isMobile && !dismissed) {
      setShowBanner(true);
    }
  }, []);

  // 2. Dismiss handler
  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("fleetAppBannerDismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-2 bg-gradient-to-t from-transparent to-black/5" />
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 p-0.5 shadow-sm flex-shrink-0">
            <div className="absolute inset-0 bg-white rounded-lg m-0.5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logo-dark.png" 
                alt="Fleet App" 
                className="w-8 h-8 object-contain" 
              />
            </div>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-base">Fleet App</h3>
            <p className="text-gray-500 text-xs leading-tight">
              Enhance your experience with our mobile app
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <a
            href="https://apps.apple.com/us/app/fleet-your-auto-marketplace/id6742141291?uo=2"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-white py-2.5 rounded-lg font-medium shadow-sm hover:bg-accent/90 active:bg-accent-dark transition-colors flex items-center justify-center w-full"
          >
            <span>Get the App</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
          <button
            onClick={dismiss}
            className="bg-white text-gray-700 py-2.5 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center w-full"
          >
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
