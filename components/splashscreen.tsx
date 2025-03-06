"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Car logo URLs
const carLogos = [
  'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'https://www.carlogos.org/car-logos/bmw-logo.png',
  'https://www.carlogos.org/car-logos/audi-logo.png',
  'https://www.carlogos.org/car-logos/porsche-logo.png',
  'https://www.carlogos.org/car-logos/ferrari-logo.png',
  'https://www.carlogos.org/car-logos/tesla-logo.png',
  'https://www.carlogos.org/car-logos/lamborghini-logo.png',
  'https://www.carlogos.org/car-logos/maserati-logo.png',
  'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  'https://www.carlogos.org/car-logos/bentley-logo.png'
];

// Component for each animated logo
const AnimatedLogo = ({ index, isActive }:any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: isActive && isLoaded ? 1 : 0,
        y: isActive ? 0 : 50,
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{
        width: '120px',
        height: '120px',
      }}
    >
      <img
        src={carLogos[index]}
        alt={`Car Logo ${index}`}
        className="w-full h-full object-contain"
        onLoad={() => setIsLoaded(true)}
      />
    </motion.div>
  );
};

// FLEET text component
const FleetText = ({ isVisible }:any) => (
  <motion.div
    className="mt-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: isVisible ? 1 : 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
  >
    <h1 
      className="text-[56px] font-bold tracking-[12px]"
      style={{ color: '#D55004' }}
    >
      FLEET
    </h1>
  </motion.div>
);

// Main splash screen component
const WebSplashScreen = ({ onAnimationComplete }:any) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [showFleetLogo, setShowFleetLogo] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  // Preload the logo images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const promises = carLogos.map(src => {
          return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => resolve(src);
            img.onerror = reject;
          });
        });
        
        await Promise.all(promises);
        setIsPreloaded(true);
      } catch (error) {
        console.warn('Failed to preload images:', error);
        setIsPreloaded(true); // Continue even on error
      }
    };

    preloadImages();
  }, []);

  // Start animation once images are preloaded
  useEffect(() => {
    if (isPreloaded) {
      runSlotMachineAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreloaded]);

  // Slot machine animation
  const runSlotMachineAnimation = () => {
    const slotDuration = 3500; // slightly longer duration for smoother effect
    const logoChangeInterval = slotDuration / (carLogos.length * 2);
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      setCurrentLogoIndex(currentIndex % carLogos.length);
      
      if (currentIndex >= carLogos.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setShowFleetLogo(true);
          
          // Final fade out and callback to main content
          setTimeout(() => {
            setIsFinishing(true);
            setTimeout(() => {
              onAnimationComplete();
            }, 500);
          }, 2000);
        }, 300);
      }
    }, logoChangeInterval);
  };

  return (
    <AnimatePresence>
      {!isFinishing && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Slot machine: render only the active logo */}
          {!showFleetLogo && (
            <motion.div 
              className="relative w-[120px] h-[120px]"
              animate={{ y: [0, -20, 0] }}
              transition={{ 
                duration: 3.5,
                times: [0, 0.8, 1],
                ease: "easeInOut"
              }}
            >
              <AnimatedLogo index={currentLogoIndex} isActive />
            </motion.div>
          )}

          {/* FLEET logo and text */}
          {showFleetLogo && (
            <div className="flex flex-col items-center">
              <motion.div
                className="relative w-64 h-64"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
              >
                <div className="relative w-64 h-64">
                  <img
                    src="/logo.png"
                    alt="FLEET Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>
              <FleetText isVisible={showFleetLogo} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WebSplashScreen;
