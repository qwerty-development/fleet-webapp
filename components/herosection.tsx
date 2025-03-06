import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { SparklesIcon, ShieldCheckIcon, CubeTransparentIcon } from '@heroicons/react/24/solid';

interface CarLogo {
  id: string;
  url: string;
}

export default function HeroSection() {
  const [carLogos, setCarLogos] = useState<CarLogo[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Transform scrollYProgress to use for parallax effects
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const backgroundBlur = useTransform(scrollYProgress, [0, 0.5], [0, 10]);

  useEffect(() => {
    // Using a dummy API endpoint from npoint.io that returns an array of car logos.
    // Expected JSON format: [{ "id": "1", "url": "https://example.com/logos/tesla.png" }, ... ]
    fetch('https://api.npoint.io/7c0f9d2af9af9c4f7f9f')
      .then((response) => response.json())
      .then((data) => {
        setCarLogos(data);
      })
      .catch((error) => {
        console.error('Error fetching car logos:', error);
        // Fallback static logos if API fails
        setCarLogos([
          { id: '1', url: 'https://www.carlogos.org/car-logos/tesla-logo.png' },
          { id: '2', url: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
          { id: '3', url: 'https://www.carlogos.org/car-logos/audi-logo.png' },
          { id: '4', url: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
          { id: '5', url: 'https://www.carlogos.org/car-logos/ford-logo.png' },
          { id: '6', url: 'https://www.carlogos.org/car-logos/honda-logo.png' },
          { id: '7', url: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
          { id: '8', url: 'https://www.carlogos.org/car-logos/porsche-logo.png' },
          { id: '9', url: 'https://www.carlogos.org/car-logos/ferrari-logo.png' },
        ]);
      });
      
    // Sequence the initial animations
    const sequence = async () => {
      await controls.start("visible");
    };
    
    sequence();
  }, [controls]);

  // Scroll helper function
  const scrollToSection = (sectionId: string) => {
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

  // Particle animation for the background
  const generateParticles = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full bg-accent/20"
        style={{
          width: Math.random() * 8 + 2,
          height: Math.random() * 8 + 2,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, Math.random() * -100 - 50],
          x: [0, (Math.random() - 0.5) * 50],
          opacity: [0, 0.8, 0],
          scale: [0, 1, 0.5]
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
          delay: Math.random() * 5
        }}
      />
    ));
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative flex flex-col items-center justify-center min-h-screen text-foreground overflow-hidden"
    >
      {/* Ambient light effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full filter blur-3xl opacity-30 animate-pulse" 
             style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {generateParticles(30)}
      </div>

      {/* Background Car Logos with enhanced animation */}
      <div className="absolute inset-0 z-0 filter blur-3xl opacity-20">
        {carLogos.map((logo, index) => {
          // Position each logo in a more artistic manner based on its index
          const top = (index * 15 + Math.sin(index) * 20) % 100;
          const left = (index * 25 + Math.cos(index) * 20) % 100;
          return (
            <motion.img
              key={logo.id}
              src={logo.url}
              alt="Car Logo"
              className="w-16 h-16 m-4 absolute"
              style={{ top: `${top}%`, left: `${left}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.6, 0.4, 0.6], 
                scale: [0.8, 1.2, 1, 1.2],
                rotate: [0, 5, -5, 0],
                filter: ["blur(0px)", "blur(1px)", "blur(0px)", "blur(1px)"]
              }}
              transition={{ 
                duration: 20 + index * 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: index * 0.5
              }}
            />
          );
        })}
      </div>

      {/* Main content with parallax effects */}
      <motion.div 
        className="z-10 text-center px-4 max-w-5xl relative"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        style={{ y: titleY, opacity: titleOpacity }}
      >
        {/* Glow effect behind title */}
        <div className="absolute inset-0 bg-accent/5 filter blur-3xl rounded-full opacity-70" />
        
        <motion.div
          variants={itemVariants}
          className="mb-8 relative"
        >
          {/* 3D looking title with enhanced gradient and shadow effects */}
          <motion.h1
            className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #ff8a00, #e52e71, #ff8a00)",
              backgroundSize: "200% 200%",
              textShadow: "0 0 40px rgba(229, 46, 113, 0.2), 0 0 20px rgba(255, 138, 0, 0.1)",
              WebkitTextStroke: "1px rgba(255, 255, 255, 0.1)"
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            FLEET
          </motion.h1>
          
          {/* Animated underline */}
          <motion.div
            className="h-1 bg-gradient-to-r from-accent-light via-accent to-accent-light rounded-full mx-auto"
            style={{ width: "60%" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
          />
          
          <motion.div
            variants={itemVariants}
            className="text-xl md:text-3xl font-medium mt-8 mb-10 space-y-3"
          >
            <p className="leading-relaxed text-white/90">Connecting car buyers with trusted dealerships.</p>
            <p className="text-accent-light font-semibold relative inline-block">
              Your journey to the perfect ride begins here.
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-accent-light"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 2, duration: 1.5 }}
              />
            </p>
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
              boxShadow: "0 0 30px rgba(213,80,4,0.4)",
              backgroundColor: "#FF6A00"
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection('app')}
            className="group relative px-10 py-5 rounded-full bg-accent text-white font-bold text-xl shadow-xl transition-all duration-300 w-full md:w-auto overflow-hidden"
          >
            <span className="relative z-10">Explore App</span>
            <motion.span 
              className="absolute inset-0 bg-gradient-to-r from-accent-dark via-accent to-accent-light opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            {/* Shine effect on hover */}
            <motion.span 
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{ 
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                left: "-100%",
                width: "150%",
                height: "100%",
                transform: "skewX(-20deg)"
              }}
              animate={{ left: ["0%", "100%"] }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "loop", 
                duration: 1.5,
                repeatDelay: 0.5
              }}
            />
          </motion.button>
          
          {/* Secondary CTA with glass effect */}
          <motion.button
            whileHover={{ 
              scale: 1.05, 
              boxShadow: "0 0 30px rgba(213,80,4,0.2)",
              borderColor: "#FF6A00"
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollToSection('contact')}
            className="px-10 py-5 rounded-full bg-white/5 backdrop-blur-sm border border-accent text-white font-bold text-xl shadow-xl hover:bg-accent/10 transition-all duration-300 w-full md:w-auto"
          >
            Book a Demo
          </motion.button>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          className="flex flex-wrap justify-center gap-8 text-gray-300 text-lg"
        >
          {[
            { text: 'Browse Vehicles', icon: <CubeTransparentIcon className="w-6 h-6 mr-2" /> },
            { text: 'Connect with Dealerships', icon: <SparklesIcon className="w-6 h-6 mr-2" /> },
            { text: 'Watch AutoClips', icon: <ShieldCheckIcon className="w-6 h-6 mr-2" /> }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                color: '#FF6A00',
                boxShadow: "0 10px 30px -10px rgba(255,106,0,0.3)" 
              }}
              custom={index}
            >
              <span className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-accent/10 text-accent">
                {item.icon}
              </span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Enhanced decorative car silhouette */}
      <motion.div
        className="absolute top-1/4 right-1/6 opacity-0"
        animate={{
          opacity: [0, 0.12, 0.08, 0.12],
          rotate: [0, 2, 0, -2, 0],
          scale: [0.9, 1, 0.98, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      >
        <svg width="400" height="150" viewBox="0 0 400 150" fill="currentColor" className="text-accent/30">
          <path d="M50,65 C50,45 75,40 100,40 L250,40 C275,40 280,55 280,65 L280,70 C280,80 270,80 250,80 L100,80 C80,80 50,85 50,65 Z M65,75 C55,75 50,70 50,65 C50,60 55,55 65,55 C75,55 75,75 65,75 Z M265,75 C255,75 250,70 250,65 C250,60 255,55 265,55 C275,55 275,75 265,75 Z" />
          <motion.path 
            d="M320,65 C320,55 330,55 335,55 C340,55 350,55 350,65 C350,75 340,75 335,75 C330,75 320,75 320,65 Z"
            animate={{ 
              d: [
                "M320,65 C320,55 330,55 335,55 C340,55 350,55 350,65 C350,75 340,75 335,75 C330,75 320,75 320,65 Z",
                "M320,65 C320,55 330,55 335,55 C340,55 350,55 350,65 C350,75 340,75 335,75 C330,75 320,75 320,65 Z",
                "M320,65 C320,55 330,55 335,55 C340,55 350,55 350,65 C350,75 340,75 335,75 C330,75 320,75 320,65 Z"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path 
            d="M30,65 C30,55 40,55 45,55 C50,55 60,55 60,65 C60,75 50,75 45,75 C40,75 30,75 30,65 Z" 
            animate={{ 
              d: [
                "M30,65 C30,55 40,55 45,55 C50,55 60,55 60,65 C60,75 50,75 45,75 C40,75 30,75 30,65 Z",
                "M30,65 C30,55 40,55 45,55 C50,55 60,55 60,65 C60,75 50,75 45,75 C40,75 30,75 30,65 Z",
                "M30,65 C30,55 40,55 45,55 C50,55 60,55 60,65 C60,75 50,75 45,75 C40,75 30,75 30,65 Z"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
      
      {/* Dynamic road lines animation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
        <motion.div 
          className="absolute h-px w-1/3 bg-accent/30 left-1/3"
          style={{ bottom: '15%' }}
          animate={{ 
            x: ["-100%", "100%"],
            opacity: [0, 0.8, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "linear" 
          }}
        />
        <motion.div 
          className="absolute h-px w-1/4 bg-accent/30 left-1/3"
          style={{ bottom: '30%' }}
          animate={{ 
            x: ["-100%", "100%"],
            opacity: [0, 0.6, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5,
            ease: "linear",
            delay: 1
          }}
        />
      </div>
      
      {/* Enhanced scroll down indicator */}
      <motion.div
        className="absolute hidden lg:flex bottom-24 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.button
          onClick={() => scrollToSection('about')}
          className="flex flex-col items-center text-gray-400 hover:text-accent transition-colors duration-300 group"
          whileHover={{ y: 5 }}
        >
          <motion.span 
            className="text-base mb-2 group-hover:font-medium relative overflow-hidden"
          >
            Discover More
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-accent/50 w-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </motion.span>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="bg-accent/10 rounded-full p-2 group-hover:bg-accent/30 backdrop-blur-sm"
          >
            <ChevronDownIcon className="h-6 w-6 text-accent" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}