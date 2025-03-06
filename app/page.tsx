"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AboutSection from "@/components/about";
import ContactSection from "@/components/contact";
import Footer from "@/components/footer";
import HeroSection from "@/components/herosection";
import Navbar from "@/components/navbar";
import AppShowcase from "@/components/showcase";
import FloatingCarLogos from "@/components/FloatingCarLogos";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  // Track scroll position for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 w-full h-full -z-10">
        {/* Base gradient background */}
        <div 
          className="absolute inset-0 bg-background"
          style={{
            background: "linear-gradient(to bottom, #080810, #101018, #16161e)",
          }}
        />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
          style={{
            backgroundSize: "200% 200%",
            backgroundImage: "radial-gradient(circle at 30% 30%, rgba(213,80,4,0.4) 0%, transparent 30%), radial-gradient(circle at 70% 60%, rgba(213,80,4,0.3) 0%, transparent 40%)",
          }}
        />
        
        {/* Animated particles/dots */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-accent/20"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.3 + 0.1,
              }}
              animate={{
                y: [
                  `${Math.random() * 100}%`, 
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`
                ],
                x: [
                  `${Math.random() * 100}%`, 
                  `${Math.random() * 100}%`,
                  `${Math.random() * 100}%`
                ],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 30 + 40,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                width: `${Math.random() * 40 + 10}px`,
                height: `${Math.random() * 40 + 10}px`,
                filter: "blur(8px)",
              }}
            />
          ))}
        </div>

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: `0px ${scrollY * 0.1}px`,
          }}
        />
      </div>

      {/* Navbar stays fixed at the top */}
      <Navbar />

      {/* Main content sections */}
      <main className="pt-16 relative z-10 text-foreground">
  <HeroSection />
  <AboutSection />
  <AppShowcase />
  <ContactSection />
</main>

      {/* Optional Footer */}
      <Footer />
    </div>
  );
}