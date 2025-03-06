import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { SparklesIcon, ShieldCheckIcon, CubeTransparentIcon, FireIcon } from '@heroicons/react/24/solid';

export default function HeroSection() {
  const heroRef = useRef(null);
  const controls = useAnimation();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Transform scrollYProgress for parallax effects
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  
  // Collection of car images for the scrolling collage
  const carImages = [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570733577524-3a047079e80d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    // Additional images
    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583267746897-2cf415887172?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517672651691-24622a91b550?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558992658-08a063bb01af?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1685914375306-9671a2603b19?q=80&w=2662&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  useEffect(() => {
    // Initial animation sequence
    const sequence = async () => {
      await controls.start("visible");
    };
    
    sequence();
  }, [controls]);

  // Scroll helper function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }
    }
  };

  // Create the scrolling collage columns with truly seamless looping
  const createScrollingCollage = () => {
    // Divide images into 4 columns
    const imagesPerColumn = Math.ceil(carImages.length / 4);
    
    // Create columns with different scroll speeds
    const columns = [
      { images: carImages.slice(0, imagesPerColumn), direction: 'down', speed: 120 },
      { images: carImages.slice(imagesPerColumn, imagesPerColumn * 2), direction: 'up', speed: 150 },
      { images: carImages.slice(imagesPerColumn * 2, imagesPerColumn * 3), direction: 'down', speed: 135 },
      { images: carImages.slice(imagesPerColumn * 3), direction: 'up', speed: 145 }
    ];

    return columns.map((column, columnIndex) => {
      // Calculate the total height of images in a column to properly set up the seamless loop
      const columnHeight = column.images.length * 260; // 260px = image height (240px) + gap (20px)
      
      return (
        <div 
          key={`column-${columnIndex}`} 
          className="h-full flex-1 flex flex-col relative overflow-hidden"
        >
          {/* Create two identical sets of images that will infinitely scroll */}
          {[0, 1].map((setIndex) => (
            <motion.div
              key={`set-${columnIndex}-${setIndex}`}
              className="flex flex-col gap-5 w-full absolute"
              style={{ 
                top: setIndex === 0 ? 0 : `-${columnHeight}px`
              }}
              animate={{
                y: column.direction === 'down' 
                  ? [0, columnHeight] 
                  : [0, -columnHeight]
              }}
              transition={{
                duration: column.speed,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                repeatDelay: 0 // No delay for seamless looping
              }}
            >
              {column.images.map((image, imageIndex) => (
                <div
                  key={`image-${columnIndex}-${setIndex}-${imageIndex}`}
                  className="w-full h-60 relative rounded-xl overflow-hidden shadow-lg"
                  style={{ marginBottom: "20px" }}
                >
                  <div 
                    className="w-full h-full bg-cover bg-center transform hover:scale-105 transition-transform duration-1000"
                    style={{ 
                      backgroundImage: `url(${image})`,
                    }}
                  />
                  {/* Overlay with improved gradient for better text readability */}
                  <div 
                    className="absolute inset-0" 
                    style={{ 
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
                      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
                    }}
                  />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      );
    });
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative flex flex-col items-center justify-center min-h-screen text-white overflow-hidden"
    >
      {/* Full-screen scrolling collage background with improved styling */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 flex"
        >
          {createScrollingCollage()}
        </motion.div>
        
        {/* Enhanced dark overlay with more sophisticated gradient and blur */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: 'blur(5px)'
          }}
        />
        
        {/* Additional accent color overlay to add brand color tint */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: 'radial-gradient(circle at center, rgba(255,106,0,0.15) 0%, rgba(0,0,0,0) 70%)',
            mixBlendMode: 'overlay'
          }}
        />
      </div>

      {/* Subtle light effects */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-full h-full bg-gradient-to-br from-accent/5 to-transparent rounded-full filter blur-3xl"
          animate={{ 
            x: ["-5%", "5%", "-5%"],
            y: ["-5%", "5%", "-5%"],
            scale: [0.9, 1.1, 0.9],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
      </div>
      
      {/* Main content with parallax effects */}
      <motion.div 
        className="z-10 text-center px-4 max-w-5xl relative"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        style={{ y: titleY, opacity: titleOpacity }}
      >
        <motion.div
          variants={itemVariants}
          className="mb-8 relative"
        >
          {/* Redesigned premium title with enhanced styling */}
          <div className="relative mb-10">
            <motion.h1
              className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/90"
              style={{
                WebkitTextStroke: "2px rgba(255,255,255,0.8)",
                filter: "drop-shadow(0 0 20px rgba(255, 106, 0, 0.6))"
              }}
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(255, 106, 0, 0.6))",
                  "drop-shadow(0 0 35px rgba(255, 106, 0, 0.8))",
                  "drop-shadow(0 0 20px rgba(255, 106, 0, 0.6))"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              FLEET
            </motion.h1>
            
            {/* Additional subtle title highlight */}
            <motion.div
              className="absolute -inset-2 -z-10 rounded-lg bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-30 blur-2xl"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [0.96, 1.04, 0.96],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          {/* Animated accent line */}
          <motion.div
            className="h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50 rounded-full mx-auto"
            style={{ width: "60%" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
          />
          
          <motion.div
            variants={itemVariants}
            className="text-xl md:text-3xl font-medium mt-8 mb-10 text-white/90"
          >
            <p className="leading-relaxed mb-4">Connecting car enthusiasts with their dream rides.</p>
            <div className="flex items-center justify-center">
              <motion.span 
                className="w-12 h-0.5 bg-gradient-to-r from-transparent to-accent hidden md:block"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 48, opacity: 1 }}
                transition={{ delay: 1.7, duration: 1 }}
              />
              <p className="text-accent-light font-semibold relative inline-block mx-3 px-1">
                Your journey begins with the perfect car
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 bg-accent w-full"
                  initial={{ scaleX: 0, transformOrigin: "left" }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 2, duration: 1.5 }}
                />
              </p>
              <motion.span 
                className="w-12 h-0.5 bg-gradient-to-l from-transparent to-accent hidden md:block"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 48, opacity: 1 }}
                transition={{ delay: 1.7, duration: 1 }}
              />
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-16"
        >
          {/* Primary CTA with enhanced hover effects */}
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 30px rgba(255,106,0,0.5)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection('app')}
            className="group relative px-10 py-5 rounded-full bg-accent text-white font-bold text-xl shadow-xl transition-all duration-300 w-full md:w-auto overflow-hidden"
          >
            <span className="relative z-10">Find Your Car</span>
            <motion.span 
              className="absolute inset-0 bg-gradient-to-r from-accent-dark via-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            {/* Shine effect on hover */}
            <motion.span 
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{ 
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                left: "-100%",
                width: "150%",
                height: "100%",
                transform: "skewX(-20deg)"
              }}
              animate={{ left: ["0%", "100%"] }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "loop", 
                duration: 1,
                repeatDelay: 0.5
              }}
            />
          </motion.button>
          
          {/* Secondary CTA with glass effect */}
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 20px rgba(255,255,255,0.2)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection('contact')}
            className="px-10 py-5 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 text-white font-bold text-xl shadow-xl hover:bg-black/40 hover:border-accent/50 transition-all duration-300 w-full md:w-auto"
          >
            Watch Demo
          </motion.button>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          className="flex flex-wrap justify-center gap-8 text-white/80 text-lg"
        >
          {[
            { text: 'Premium Vehicles', icon: <CubeTransparentIcon className="w-6 h-6 mr-2" /> },
            { text: 'Direct Dealership Connect', icon: <SparklesIcon className="w-6 h-6 mr-2" /> },
            { text: 'Exclusive Test Drives', icon: <ShieldCheckIcon className="w-6 h-6 mr-2" /> }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                color: '#FF6A00',
                textShadow: "0 0 10px rgba(255,106,0,0.5)" 
              }}
              custom={index}
            >
              <span className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-white/10 text-accent backdrop-blur-sm">
                {item.icon}
              </span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Enhanced scroll down indicator */}
      <motion.div
        className="absolute hidden lg:flex bottom-16 left-0 right-0 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.button
          onClick={() => scrollToSection('about')}
          className="flex flex-col items-center text-white/70 hover:text-accent transition-colors duration-300 group"
          whileHover={{ y: 5 }}
        >
          <motion.span 
            className="text-base mb-2 group-hover:text-white relative overflow-hidden"
          >
            Explore More
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-accent w-full"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="bg-black/30 backdrop-blur-sm rounded-full p-2 group-hover:bg-accent/20"
          >
            <ChevronDownIcon className="h-6 w-6 text-accent" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}