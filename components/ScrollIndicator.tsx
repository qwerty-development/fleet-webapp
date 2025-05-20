"use client";

import React, { useState, useEffect } from "react";

interface ScrollIndicatorProps {
  scrollContainerSelector: string;
  autoHideTime?: number; // Time in ms before auto-hiding (default: 5000ms)
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  scrollContainerSelector,
  autoHideTime = 5000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (visible) {
        setVisible(false);
      }
    };

    // Auto-hide after specified time
    const timer = setTimeout(() => {
      setVisible(false);
    }, autoHideTime);

    // Add scroll event listener
    const scrollContainer = document.querySelector(scrollContainerSelector);
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [visible, scrollContainerSelector, autoHideTime]);

  if (!visible) return null;

  return (
    <div className="center-scroll-indicator">
      {/* Animated circles */}
      <div className="animated-circle circle-1"></div>


      <style jsx>{`
        .center-scroll-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 60vh;
          pointer-events: none;
          z-index: 10;
          overflow: hidden;
        }
        
        .animated-circle {
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          opacity: 0;
          border-radius: 50%;
          left: 0;
          bottom: -20px;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        
        .circle-1 {
          animation: circle-move 3s infinite;
          animation-delay: 0s;
        }
        
        .circle-2 {
          animation: circle-move 3s infinite;
          animation-delay: 0.6s;
        }
        
        .circle-3 {
          animation: circle-move 3s infinite;
          animation-delay: 1.2s;
        }
        
        .circle-4 {
          animation: circle-move 3s infinite;
          animation-delay: 1.8s;
        }
        
        .circle-5 {
          animation: circle-move 3s infinite;
          animation-delay: 2.4s;
        }
        
        @keyframes circle-move {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-60vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ScrollIndicator;