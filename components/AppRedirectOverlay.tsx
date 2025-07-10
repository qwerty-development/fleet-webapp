"use client";

import {
  detectPlatform,
  attemptAndroidAppLaunch,
  attemptIOSAppLaunch,
  getDeepLink,
  DEEP_LINK_CONFIG,
} from "@/utils/androidDeepLinkUtils";
import { useState, useRef, useEffect } from "react";

interface AppRedirectOverlayProps {
  itemId: string;
  itemType: "car" | "clip";
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
  const [status, setStatus] = useState<"waiting" | "attempting" | "failed">("waiting");
  const attemptedRef = useRef(false);
  const { platform } = detectPlatform();

  const deepLink = getDeepLink(itemType, itemId);

  // Don't render on web/desktop - only show on mobile platforms
  if (platform !== "android" && platform !== "ios") {
    return null;
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!attemptedRef.current) {
      attemptedRef.current = true;
      launchApp();
    }
  }, [countdown]);

  const launchApp = async () => {
    setStatus("attempting");

    let success = false;
    if (platform === "android") {
      success = await attemptAndroidAppLaunch(deepLink);
    } else if (platform === "ios") {
      success = await attemptIOSAppLaunch(deepLink);
    }

    setStatus(success ? "attempting" : "failed");
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 text-white rounded-xl max-w-md w-full p-6 text-center relative">
        <button
          onClick={handleCloseClick}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
          <img src="/logo.png" alt="Fleet App" className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-bold mb-2">
          {status === "failed" ? "Open in Fleet App" : "Opening in Fleet App"}
        </h2>

        <p className="text-gray-300 mb-2">{title}</p>
        {subtitle && <p className="text-gray-400 text-sm mb-4">{subtitle}</p>}

        <div className="mb-6">
          {status === "waiting" && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">Opening app in {countdown}...</p>
            </>
          )}

          {status === "attempting" && (
            <>
              <div className="h-10 w-10 mx-auto border-t-2 border-accent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-400">Opening Fleet App...</p>
            </>
          )}

          {status === "failed" && (
            <p className="text-gray-400">
              App not installed? Download Fleet to view this {itemType}.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={platform === "android" ? DEEP_LINK_CONFIG.playStoreUrl : DEEP_LINK_CONFIG.appStoreUrl}
            className="block w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Fleet App
          </a>

          <button
            onClick={handleCloseClick}
            type="button"
            className="block w-full py-3 bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
          >
            Continue on website
          </button>
        </div>
      </div>
    </div>
  );
};