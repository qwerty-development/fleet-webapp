"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import Hero from "@/components/Landing Page/Hero";
// Critical sections load immediately
import BentoGrid from "@/components/Landing Page/BentoGrid";
import Navbar from "@/components/Landing Page/navbar";
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
        {/* Animated Background */}
        <div className="fixed inset-0 w-full h-full -z-10">
          <div
            className="absolute inset-0 bg-background"
            style={{
              background:
                "linear-gradient(to bottom, #111111, #1a1a1a, #222222)",
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundSize: "200% 200%",
              backgroundImage:
                "radial-gradient(circle at 30% 30%, rgba(213,80,4,0.4) 0%, transparent 30%), radial-gradient(circle at 70% 60%, rgba(213,80,4,0.3) 0%, transparent 40%)",
            }}
          />
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-accent/20"
                style={{
                  width: `${Math.random() * 40 + 10}px`,
                  height: `${Math.random() * 40 + 10}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3 + 0.1,
                  filter: "blur(8px)",
                }}
              />
            ))}
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
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
          <section className="">
            <BentoGrid />
          </section>

          {/* Content Sections */}
          <div
            className="relative z-30"
            style={{
              background:
                "linear-gradient(to bottom, #111111, #1a1a1a, #222222)",
            }}
          >
            <AppShowcase />
            <DealerDetails />
            {/* <AboutSection /> */}
            <MarqueeLogos />
            <ContactSection />
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}
