"use client";

import { useRef, useState } from "react";
import {
  motion,
  useInView,
  useDragControls,
  AnimatePresence,
} from "framer-motion";
import {
  MagnifyingGlassIcon,
  FilmIcon,
  ChartBarIcon,
  HeartIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function AppShowcase() {
  const featuresRef = useRef(null);
  const isInView = useInView(featuresRef, { once: true, amount: 0.2 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const dragControls = useDragControls();

  const features = [
    {
      id: "browsing",
      title: "Vehicle Browsing",
      description:
        "Browse by brand, category, or use advanced filtering to find your perfect match.",
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      image: "showcase/browsing.png",
    },
    {
      id: "autoclips",
      title: "AutoClips",
      description:
        "Watch vertical video content showcasing vehicles to get a better feel before contacting dealerships.",
      icon: <FilmIcon className="w-6 h-6" />,
      image: "showcase/autoclips.png",
    },
    {
      id: "dealership",
      title: "Dealership Tools",
      description:
        "Powerful tools for dealerships to manage inventory, track analytics, and engage with potential buyers.",
      icon: <ChartBarIcon className="w-6 h-6" />,
      image: "showcase/dealership.png",
    },
    {
      id: "favorites",
      title: "Favorites Collection",
      description:
        "All your favorite listings in one place with updates on price changes and new matching listings.",
      icon: <HeartIcon className="w-6 h-6" />,
      image: "showcase/favorites.png",
    },
    {
      id: "authentication",
      title: "Security & Privacy",
      description:
        "Industry-standard security with multi-factor authentication to protect your account and data.",
      icon: <LockClosedIcon className="w-6 h-6" />,
      image: "showcase/authentication.png",
    },
  ];

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + features.length) % features.length
    );
  };

  const handleDragEnd = (event: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -50) {
      handleNext();
    } else if (info.offset.x > 50) {
      handlePrev();
    }
  };

  // Calculate positions for the "globe" effect with increased separation
  // Updated getPositionStyles function
  const getPositionStyles = (index: number) => {
    const totalItems = features.length;
    const angleDiff = (2 * Math.PI) / totalItems;

    // Calculate the base angle for each item
    const baseAngle = index * angleDiff;

    // Calculate the active angle (where the active item should be)
    const activeAngle = activeIndex * angleDiff;

    // Calculate the shortest angular distance
    let angle = (baseAngle - activeAngle + 2 * Math.PI) % (2 * Math.PI);
    if (angle > Math.PI) angle = angle - 2 * Math.PI;

    // Convert angle to position values
    const z = Math.cos(angle);
    const x = Math.sin(angle);

    // Scale and opacity based on z position (depth)
    const scale = 0.5 + 0.5 * ((z + 1) / 2); // Scale from 0.5 to 1.0 for more dramatic effect
    const opacity = 0.3 + 0.7 * ((z + 1) / 2); // Opacity from 0.3 to 1.0

    // Calculate translateX based on position in the circle
    const translateX = x * 90; // Increased multiplier for wider separation

    // Calculate z-index - items in front should appear above items in back
    const zIndex = Math.round(z * 10) + 10;

    return {
      // Combine centering with computed translation and scale
      transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale})`,
      opacity,
      zIndex,
      filter: z < 0 ? "brightness(0.6)" : "brightness(1)",
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
      },
    },
  };

  const indicatorVariants = {
    inactive: { scale: 1, backgroundColor: "rgba(255, 255, 255, 0.3)" },
    active: { scale: 1.2, backgroundColor: "#FF6A00" },
  };

  return (
    <section
      id="app"
      className="py-12 bg-gradient-to-b relative text-white overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 opacity-30">


        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-r from-accent to-accent-light opacity-20 blur-3xl"
          animate={{
            x: [0, 100, 50, 200, 0],
            y: [0, 150, 50, 100, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-3xl"
          animate={{
            x: [0, -100, -50, -200, 0],
            y: [0, -150, -50, -100, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 30,
            delay: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <motion.span
            className="inline-block text-accent font-semibold mb-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Fleet Mobile App
          </motion.span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl text-white font-bold mb-6">
            <span className="relative">
            Experience
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>
            {" "}
            <span className="text-accent">the Full Feature Set</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Discover all the powerful tools available in the Fleet app, connecting car buyers with dealerships through an intuitive, feature-rich experience
          </p>
        </motion.div>

        {/* 3D Globe Showcase */}
        <motion.div
          ref={featuresRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mb-16"
        >
          {/* Feature Title */}
          <div className="text-center mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`header-${activeIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10"
              >
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  {features[activeIndex].icon}
                </div>
                <h3 className="font-bold text-xl">
                  {features[activeIndex].title}
                </h3>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p
                key={`desc-${activeIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto"
              >
                {features[activeIndex].description}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Globe iPhone Showcase - Better positioned */}
          <div className="relative h-[450px] md:h-[500px] mx-auto flex items-center justify-center">
            {/* Drag area for swipe control */}
            <motion.div
              className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
              drag="x"
              dragControls={dragControls}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
            />

            {/* Navigation buttons - Made more prominent */}
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-between px-4 md:px-16 z-30 pointer-events-none">
              <button
                onClick={handlePrev}
                className="p-3 md:p-4 rounded-full bg-accent/90 text-white shadow-lg pointer-events-auto transform transition-transform hover:scale-110 border border-white/20"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="p-3 md:p-4 rounded-full bg-accent/90 text-white shadow-lg pointer-events-auto transform transition-transform hover:scale-110 border border-white/20"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Phone frames positioned in 3D space */}
            {/* Phone frames positioned in 3D space */}
            <div className="relative w-full flex items-center justify-center perspective-[1200px]">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  // Removed "-translate-y-1/2" since the inline transform now centers the element
                  className="absolute top-1/2 mt-16 left-1/2 transition-all duration-700 ease-out"
                  style={getPositionStyles(index)}
                >
                  {/* Phone frame with drop shadow */}
                  <div className="relative">
                    <div
                      className="relative z-10 border-[8px] border-black rounded-[3rem] overflow-hidden shadow-2xl"
                      style={{
                        width: "280px",
                        aspectRatio: "9/19",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-20"></div>

                      {/* Screenshot */}
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Reflection effect */}
                    <div
                      className="absolute top-0 left-0 right-0 bottom-0 opacity-30 rounded-[3rem] overflow-hidden z-20 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
                        transform: "translateY(8px) scale(0.95)",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators - Made more prominent */}
          <div className="flex justify-center gap-4 mt-8">
            {features.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > activeIndex ? 1 : -1);
                  setActiveIndex(index);
                }}
                variants={indicatorVariants}
                animate={index === activeIndex ? "active" : "inactive"}
                transition={{ duration: 0.3 }}
                className="w-4 h-4 rounded-full"
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Download App CTA */}
      </div>
    </section>
  );
}
