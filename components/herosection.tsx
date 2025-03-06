import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useScroll, useTransform } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  HeartIcon,
} from "@heroicons/react/24/solid";

// Safely get window dimensions with SSR support
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

export default function HeroSection() {
  const heroRef = useRef(null);
  const controls = useAnimation();
  const windowSize = useWindowSize();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  // Parallax effects for title
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  // Collection of car images for the horizontal scroll
  const carImages = [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570733577524-3a047079e80d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1583267746897-2cf415887172?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517672651691-24622a91b550?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  ];

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  // Smooth scroll helper
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
    },
  };

  // Create horizontal scrolling image galleries with 4 rows
  const createHorizontalScroll = () => {
    // Make sure all rows have enough images by duplicating them if needed
    const ensureEnoughImages = (imageArray:any, minCount:any) => {
      if (imageArray.length < minCount) {
        // Duplicate images until we have enough
        const duplicated = [...imageArray];
        while (duplicated.length < minCount) {
          duplicated.push(...imageArray);
        }
        return duplicated.slice(0, minCount);
      }
      return imageArray;
    };

    // Calculate how many images are needed to fill the screen based on current width
    const getImagesNeeded = () => {
      // Only calculate if we have a valid window width
      if (windowSize.width === 0) return 8;
      
      // For mobile, we need more images to fill the width
      const baseImageWidth = windowSize.width < 768 ? 180 : 350;
      const imagesNeeded = Math.ceil((windowSize.width * 1.5) / baseImageWidth) + 2;
      return Math.max(imagesNeeded, 8); // Ensure at least 8 images
    };

    // Distribute images into 4 rows with different speeds
    // Ensure each row has enough images for seamless looping
    const neededImages = getImagesNeeded();
    
    const rows = [
      { images: ensureEnoughImages(carImages.slice(0, 6), neededImages), speed: 150, direction: "left" },
      { images: ensureEnoughImages(carImages.slice(6, 11), neededImages), speed: 180, direction: "left" },
      { images: ensureEnoughImages(carImages.slice(11, 16), neededImages), speed: 160, direction: "left" },
      { images: ensureEnoughImages(carImages.slice(16), neededImages), speed: 190, direction: "left" },
    ];

    // Don't render the animation until window size is known
    if (windowSize.width === 0) {
      return null;
    }

    return rows.map((row, rowIndex) => {
      // Adjust image width based on screen size
      const imgWidth = windowSize.width < 768 ? 180 : 350;
      const imgGap = windowSize.width < 768 ? 8 : 20;
      
      // Calculate total row width for animation
      const totalWidth = row.images.length * (imgWidth + imgGap);

      return (
        <div 
          key={`row-${rowIndex}`} 
          className="relative overflow-hidden w-full h-1/4 min-h-[25vh]"
        >
          {/* Animation for leftward-moving rows */}
          <motion.div
            key={`set-${rowIndex}-0`}
            className="flex absolute top-0 left-0 h-full"
            initial={{ x: 0 }}
            animate={{ x: -totalWidth }}
            transition={{
              duration: row.speed,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
          >
            {row.images.map((image:any, imgIndex:any) => (
              <div
                key={`image-${rowIndex}-0-${imgIndex}`}
                className="relative h-full mx-2 md:mx-3 rounded-xl overflow-hidden"
                style={{ 
                  minWidth: windowSize.width < 768 ? "180px" : "350px",
                  maxWidth: windowSize.width < 768 ? "180px" : "350px"
                }}
              >
                <motion.div
                  className="w-full h-full bg-cover bg-center absolute inset-0"
                  style={{ backgroundImage: `url(${image})` }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            ))}
          </motion.div>
          
          <motion.div
            key={`set-${rowIndex}-1`}
            className="flex absolute top-0 h-full"
            initial={{ x: totalWidth }}
            animate={{ x: 0 }}
            transition={{
              duration: row.speed,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop",
            }}
          >
            {row.images.map((image:any, imgIndex:any) => (
              <div
                key={`image-${rowIndex}-1-${imgIndex}`}
                className="relative h-full mx-2 md:mx-3 rounded-xl overflow-hidden"
                style={{ 
                  minWidth: windowSize.width < 768 ? "180px" : "350px",
                  maxWidth: windowSize.width < 768 ? "180px" : "350px"
                }}
              >
                <motion.div
                  className="w-full h-full bg-cover bg-center absolute inset-0"
                  style={{ backgroundImage: `url(${image})` }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      );
    });
  };

  // Features extracted from the project document
  const features = [
    {
      title: "Browse & Filter",
      description: "Search and find your perfect car with advanced filters",
      icon: <MagnifyingGlassIcon className="w-7 h-7" />,
      color: "#FF6A00", // Accent color
    },
    {
      title: "Save Favorites",
      description: "Create a collection of your dream cars",
      icon: <HeartIcon className="w-7 h-7" />,
      color: "#e6194b", // Red
    },
    {
      title: "Connect with Dealers",
      description: "Direct communication with trusted dealerships",
      icon: <SparklesIcon className="w-7 h-7" />,
      color: "#3498db", // Blue
    },
    {
      title: "Watch AutoClips",
      description: "Explore cars through engaging video content",
      icon: <VideoCameraIcon className="w-7 h-7" />,
      color: "#27ae60", // Green
    },
  ];

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative flex flex-col items-center justify-center h-screen text-white overflow-hidden"
    >
      {/* Dynamic car image background taking full height */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div className="absolute inset-0 z-0 flex flex-col h-full">
          {createHorizontalScroll()}
        </div>
      </div>

      {/* Overlay gradients for visual interest */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Central highlight */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-70"
        />
        
        {/* Accent color highlights */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-full h-full bg-gradient-to-br from-accent/10 to-transparent rounded-full filter blur-3xl"
          animate={{
            x: ["-5%", "5%", "-5%"],
            y: ["-5%", "5%", "-5%"],
            scale: [0.9, 1.1, 0.9],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-20 text-center px-4 max-w-6xl mx-auto mt-16"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        style={{ y: titleY, opacity: titleOpacity }}
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative mb-6">
            {/* Animated highlight behind title */}
            <motion.div
              className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 opacity-50 blur-3xl"
              animate={{ 
                opacity: [0.3, 0.6, 0.3], 
                scale: [0.96, 1.04, 0.96],
                rotate: [0, 5, 0], 
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Main title with enhanced visuals */}
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/90"
              style={{
                WebkitTextStroke: "2px rgba(255,255,255,0.8)",
                filter: "drop-shadow(0 0 20px rgba(255,106,0,0.6))",
              }}
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(255,106,0,0.6))",
                  "drop-shadow(0 0 35px rgba(255,106,0,0.8))",
                  "drop-shadow(0 0 20px rgba(255,106,0,0.6))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              FLEET
            </motion.h1>
          </div>

          <motion.div
            className="h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50 rounded-full mx-auto"
            style={{ width: "60%" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
          />

          <motion.div
            variants={itemVariants}
            className="text-xl md:text-3xl font-medium mt-6 mb-8"
          >
            <p className="leading-relaxed mb-2">
              Connecting car buyers with trusted dealerships
            </p>
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          variants={itemVariants}
          className="mb-12"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(255,106,0,0.5)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection("app")}
            className="group relative px-10 py-5 rounded-full bg-accent text-white font-bold text-xl shadow-xl transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Explore App</span>
            <motion.span className="absolute inset-0 bg-gradient-to-r from-accent-dark via-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <motion.span
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                left: "-100%",
                width: "150%",
                height: "100%",
                transform: "skewX(-20deg)",
              }}
              animate={{ left: ["0%", "100%"] }}
              transition={{
                repeat: Infinity,
                repeatType: "loop",
                duration: 1,
                repeatDelay: 0.5,
              }}
            />
          </motion.button>
        </motion.div>

        {/* Features with glass-morphism design */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                boxShadow: `0 10px 25px -5px ${feature.color}30`,
              }}
              className="relative rounded-xl overflow-hidden p-2 md:p-4 backdrop-blur-sm bg-black/30 border border-white/10 flex flex-col items-center text-center transition-all duration-300 hover:border-white/20"
            >
              <div 
                className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-2 md:mb-3"
                style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1">{feature.title}</h3>
              <p className="text-white/70 text-xs md:text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 flex justify-center z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.button
          onClick={() => scrollToSection("about")}
          className="flex flex-col items-center text-white/70 hover:text-accent transition-colors duration-300 group"
          whileHover={{ y: 5 }}
        >
          <motion.span className="text-base mb-2 group-hover:text-white relative overflow-hidden">
            Discover More
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-accent w-full"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="bg-black/30 backdrop-blur-sm rounded-full p-2 group-hover:bg-accent/20"
          >
            <ChevronDownIcon className="h-6 w-6 text-accent" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}