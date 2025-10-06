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

export const AppRedirectOverlay: React.FC<AppRedirectOverlayProps> = () => {
  // Disabled globally per product decision; render nothing
  return null;
};