"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import Hero from "@/components/Landing Page/Hero";
// Critical sections load immediately
import Navbar from "@/components/home/Navbar";
import MarqueeLogos from "@/components/Landing Page/MarqueeLogos";
import DealerDetails from "@/components/Landing Page/DealerDetails";

// Dynamically import non-critical sections with loading placeholders
const AboutSection = dynamic(() => import("@/components/Landing Page/about"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading About...
    </div>
  ),
});
const AppShowcase = dynamic(
  () => import("@/components/Landing Page/showcase"),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        Loading Showcase...
      </div>
    ),
  }
);
const ContactSection = dynamic(
  () => import("@/components/Landing Page/contact"),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        Loading Contact...
      </div>
    ),
  }
);
const Footer = dynamic(() => import("@/components/Landing Page/footer"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading Footer...
    </div>
  ),
});

// Splash screen (client-side only)
const WebSplashScreen = dynamic(
  () => import("../components/Landing Page/splashscreen"),
  { ssr: false }
);

export default function Home() {
  // Authentication & guest mode hooks
  const { isLoaded, isSignedIn, profile } = useAuth();
  const { isGuest, setGuestMode, clearGuestMode } = useGuestUser();
  const router = useRouter();

  useEffect(() => {
    const handleGuestModeFromQuery = async () => {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const guestParam = urlParams.get("guest");

      if (guestParam === "true" && !isSignedIn && !isGuest) {
        await setGuestMode(true);

        // Remove the URL parameter without redirecting
        const url = new URL(window.location.href);
        url.searchParams.delete("guest");
        window.history.replaceState({}, "", url.toString());

        // Do not redirect to /home
      }
    };

    if (isLoaded) {
      handleGuestModeFromQuery();
    }
  }, [isLoaded, isSignedIn, isGuest, setGuestMode]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Redirect signed-in users based on role
      if (profile?.role === "admin") {
        router.push("/admin");
      } else if (profile?.role === "dealer") {
        router.push("/dealer");
      } else {
        router.push("/home");
      }
    }
  }, [isLoaded, isSignedIn, profile, router]);

  // Local state for scroll tracking and splash screen
  const [scrollY, setScrollY] = useState(0);
  const [showSplash, setShowSplash] = useState(false);

  // Track scroll position for background grid effect only
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check first visit to show the splash screen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenSplash = localStorage.getItem("hasSeenSplash");
      if (!hasSeenSplash) {
        // Lock scroll while splash is showing
        document.body.style.overflow = "hidden";
        setShowSplash(true);
      }
    }
  }, []);

  const handleSplashComplete = () => {
    localStorage.setItem("hasSeenSplash", "true");
    // Re-enable scrolling
    document.body.style.overflow = "";
    setShowSplash(false);
  };

  return (
    <>
      {/* Show splash screen on first visit */}
      {showSplash && (
        <WebSplashScreen onAnimationComplete={handleSplashComplete} />
      )}

      {/* Hide main content while splash is active */}
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ visibility: showSplash ? "hidden" : "visible" }}
      >
        {/* Modern Animated Background */}
        <div className="fixed inset-0 w-full h-full -z-10">
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950"
          />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundSize: "200% 200%",
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(213,80,4,0.5) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(213,80,4,0.3) 0%, transparent 50%)",
            }}
          />
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => {
              const size = Math.random() * 50 + 15;
              const left = Math.random() * 100;
              const top = Math.random() * 100;
              return (
                <div
                  key={i}
                  className="absolute rounded-full bg-accent/15"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    top: `${top}%`,
                    opacity: Math.random() * 0.4 + 0.1,
                    filter: "blur(12px)",
                  }}
                />
              );
            })}
          </div>
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              backgroundPosition: `0px ${scrollY * 0.1}px`,
            }}
          />
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Main Content - Simple Structure Without Parallax */}
        <main className="relative z-20">
          {/* Hero Section - No longer fixed */}
          <section>
            <Hero />
          </section>

          {/* Content Sections */}
          <div className="relative bg-gradient-to-b from-white via-gray-50 to-white flex flex-col justify-center items-center z-30">
            <AppShowcase />
            <div className="w-[98%]">
              <DealerDetails />
            </div>

            {/* <AboutSection /> */}
            <ContactSection />
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}
