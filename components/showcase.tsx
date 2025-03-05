'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FilmIcon,
  ChartBarIcon,
  BellAlertIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link'; // Import Link for internal navigation


export default function AppShowcase() {
  const features = [
    {
      id: 'browsing',
      title: "Intuitive Vehicle Browsing",
      description: "Browse by brand, category, or use advanced filtering to find your perfect match.",
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      image: "showcase/browsing.png"
    },
    {
      id: 'autoclips',
      title: "AutoClips Video Content",
      description: "Watch vertical video content showcasing vehicles to get a better feel before contacting dealerships.",
      icon: <FilmIcon className="w-6 h-6" />,
      image: "showcase/autoclips.png"
    },
    {
      id: 'dealership',
      title: "Dealership Management",
      description: "Powerful tools for dealerships to manage inventory, track analytics, and engage with potential buyers.",
      icon: <ChartBarIcon className="w-6 h-6" />,
      image: "showcase/dealership.png"
    },
    {
      id: 'favorites',
      title: "All you favorite listings all in one place",
      description: "Stay updated with price drops, liked listings, while also being able to search ",
      icon: <HeartIcon className="w-6 h-6" />,
      image: "showcase/favorites.png"
    },
    {
      id: 'authentication',
      title: "Secure Authentication",
      description: "Industry-standard security with multi-factor authentication to protect your account and data.",
      icon: <LockClosedIcon className="w-6 h-6" />,
      image: "showcase/authentication.png"
    }
  ];

  const [activeFeature, setActiveFeature] = useState(0);
  const [direction, setDirection] = useState('right');

  const nextFeature = () => {
    setDirection('right');
    setActiveFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setDirection('left');
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToFeature = (index:any) => {
    setDirection(index > activeFeature ? 'right' : 'left');
    setActiveFeature(index);
  };

  return (
    <section id="app" className="py-20 bg-gradient-to-b relative overflow-hidden">

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Experience the <span className="text-accent">Fleet App</span></h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A powerful platform connecting car buyers with dealerships through an intuitive, feature-rich experience
          </p>
        </motion.div>

        {/* Mobile Layout (stack) */}
        <div className="lg:hidden flex flex-col items-center">
          {/* iPhone mockup */}
          <div className="relative w-full max-w-[80%] mx-auto" style={{ maxWidth: '320px' }}>
            {/* Phone frame */}
            <div className="relative z-10 border-8 border-black-medium rounded-[3rem] overflow-hidden shadow-2xl" style={{ aspectRatio: '9/19' }}>
              {/* Screen with app screenshots */}
              <div className="absolute inset-0 bg-gray-900 overflow-hidden">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: activeFeature === index ? 1 : 0,
                      x: activeFeature === index
                        ? 0
                        : direction === 'right' && index === (activeFeature + features.length - 1) % features.length
                          ? '-100%'
                          : direction === 'left' && index === (activeFeature + 1) % features.length
                            ? '100%'
                            : index > activeFeature
                              ? '100%'
                              : '-100%'
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover object-center"
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Phone notch */}
          </div>

          {/* Carousel navigation arrows */}
          <div className="flex justify-center mt-8 gap-12">
            <button
              onClick={prevFeature}
              className="bg-black-light hover:bg-black-medium p-3 rounded-full text-white transition-colors duration-300"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button
              onClick={nextFeature}
              className="bg-black-light hover:bg-black-medium p-3 rounded-full text-white transition-colors duration-300"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          </div>

          {/* Feature indicator dots */}
          <div className="flex justify-center mt-4 gap-2 mb-10">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToFeature(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${activeFeature === index ? 'bg-accent' : 'bg-gray-600'
                  }`}
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>

          {/* Feature description - Mobile */}
          <div className="mt-4 w-full text-center">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: activeFeature === index ? 1 : 0,
                  display: activeFeature === index ? 'block' : 'none'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-accent-dark p-4 rounded-lg inline-flex items-center justify-center text-white mb-2">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-gray-400 text-lg max-w-md mx-auto">{feature.description}</p>

                <div className="pt-4">
                  <ul className="space-y-3 inline-block text-left">
                    {feature.id === 'browsing' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Filter by make, model, year, and price
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Save your favorite vehicles
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Compare multiple vehicles side by side
                        </li>
                      </>
                    )}

                    {feature.id === 'autoclips' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Watch vertical video walk-throughs
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          See vehicle features in action
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Share videos with friends and family
                        </li>
                      </>
                    )}

                    {feature.id === 'dealership' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Track inventory performance metrics
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Manage listings with easy upload tools
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Respond to customer inquiries quickly
                        </li>
                      </>
                    )}

                    {feature.id === 'favorites' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Never lose your soon to own cars
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Price drop alerts for saved vehicles
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Instant dealership response notifications
                        </li>
                      </>
                    )}

                    {feature.id === 'authentication' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Multi-factor authentication for account security
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Secure payment processing for transactions
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                          Privacy controls for your personal information
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop Layout (side by side) */}
        <div className="hidden lg:flex lg:flex-row items-center gap-12">
          {/* Device mockup with carousel */}
          <motion.div
            className="lg:w-1/2 flex justify-center"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative" style={{ maxWidth: '360px', width: '100%' }}>
              {/* Phone frame */}
              <div className="relative z-10 border-8 border-black-medium rounded-[3rem] overflow-hidden shadow-2xl" style={{ aspectRatio: '9/19' }}>
                {/* Screen with app screenshots */}
                <div className="absolute inset-0 bg-gray-900 overflow-hidden">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      className="absolute inset-0 w-full h-full"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: activeFeature === index ? 1 : 0,
                        x: activeFeature === index
                          ? 0
                          : direction === 'right' && index === (activeFeature + features.length - 1) % features.length
                            ? '-100%'
                            : direction === 'left' && index === (activeFeature + 1) % features.length
                              ? '100%'
                              : index > activeFeature
                                ? '100%'
                                : '-100%'
                      }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>


              {/* Carousel navigation arrows */}
              <div className="flex justify-center mt-8 gap-8">
                <button
                  onClick={prevFeature}
                  className="bg-black-light hover:bg-black-medium p-3 rounded-full text-white transition-colors duration-300"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={nextFeature}
                  className="bg-black-light hover:bg-black-medium p-3 rounded-full text-white transition-colors duration-300"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Feature indicator dots */}
              <div className="flex justify-center mt-4 gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToFeature(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${activeFeature === index ? 'bg-accent' : 'bg-gray-600'
                      }`}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Current feature highlight */}
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <div className="relative h-[400px]">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className="absolute inset-0 w-full space-y-4"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{
                    opacity: activeFeature === index ? 1 : 0,
                    x: activeFeature === index
                      ? 0
                      : direction === 'right' && index === (activeFeature + features.length - 1) % features.length
                        ? -100
                        : direction === 'left' && index === (activeFeature + 1) % features.length
                          ? 100
                          : index > activeFeature
                            ? 100
                            : -100,
                    pointerEvents: activeFeature === index ? 'auto' : 'none'
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <div className="bg-accent-dark p-4 rounded-lg inline-block text-white mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-gray-400 text-lg">{feature.description}</p>

                  <div className="pt-4">
                    <ul className="space-y-3">
                      {feature.id === 'browsing' && (
                        <>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Filter by make, model, year, and price
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Save your favorite vehicles
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Compare multiple vehicles side by side
                          </li>
                        </>
                      )}

                      {feature.id === 'autoclips' && (
                        <>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Watch vertical video walk-throughs
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            See vehicle features in action
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Share videos with friends and family
                          </li>
                        </>
                      )}

                      {feature.id === 'dealership' && (
                        <>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Track inventory performance metrics
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Manage listings with easy upload tools
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Respond to customer inquiries quickly
                          </li>
                        </>
                      )}

                      {feature.id === 'favorites' && (
                        <>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Price drop alerts for saved vehicles
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            New listing notifications matching your criteria
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Instant dealership response notifications
                          </li>
                        </>
                      )}

                      {feature.id === 'authentication' && (
                        <>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Multi-factor authentication for account security
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Secure payment processing for transactions
                          </li>
                          <li className="flex items-center gap-2 text-gray-300">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                            Privacy controls for your personal information
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="text-center mt-12">
  <Link href="/features" passHref>
    <span className="inline-block bg-accent hover:bg-accent-dark transition-colors duration-300 text-white font-bold rounded-xl px-8 py-5 cursor-pointer">
      Explore More Features
    </span>
  </Link>
</div>
      </div>
    </section>
  );
}