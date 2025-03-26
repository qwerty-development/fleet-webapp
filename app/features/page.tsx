'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  UserIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  MapPinIcon,
  BellAlertIcon,
  ChartBarIcon,
  TagIcon,
  PresentationChartLineIcon,
  PhotoIcon,
  CogIcon,
  UsersIcon,
  DocumentTextIcon,
  QueueListIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ClockIcon,
  StarIcon,
  BanknotesIcon,
  HandThumbUpIcon,
  CloudArrowUpIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  GlobeAltIcon,
  InboxArrowDownIcon,
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ReactElement } from 'react';

// Define feature interface
interface Feature {
  icon: ReactElement;
  title: string;
  description: string;
  color: string;
}

// Define the feature categories type
type FeatureCategory = 'users' | 'dealerships' | 'administrators';

// Define features type
interface Features {
  users: Feature[];
  dealerships: Feature[];
  administrators: Feature[];
}

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<FeatureCategory>('users');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Switch featured feature every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex(prev => (prev + 1) % features[activeTab].length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Track scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const tabVariants = {
    inactive: {
      backgroundColor: "rgb(17, 17, 17)",
      color: "rgb(156, 163, 175)",
      scale: 0.97
    },
    active: {
      backgroundColor: "#FF6A00",
      color: "#ffffff",
      scale: 1,
      boxShadow: "0 0 20px rgba(255, 106, 0, 0.3)"
    }
  };

  const featuredVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  // Feature data by user roles
  const features: Features = {
    users: [
      {
        icon: <MagnifyingGlassIcon className="w-6 h-6" />,
        title: "Advanced Search & Filtering",
        description: "Find your ideal vehicle with powerful search filters including make, model, year, price range, mileage, and more. Save your search criteria for future reference.",
        color: "#3498db" // Blue
      },
      {
        icon: <HeartIcon className="w-6 h-6" />,
        title: "Favorites Management",
        description: "Save vehicles to your favorites list for easy access. Compare multiple vehicles side by side to make the best choice for your needs.",
        color: "#e74c3c" // Red
      },
      {
        icon: <VideoCameraIcon className="w-6 h-6" />,
        title: "AutoClips Video Content",
        description: "Watch engaging video walkthroughs of vehicles to get a better understanding of features and condition before contacting dealerships.",
        color: "#27ae60" // Green
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Instant Messaging",
        description: "Connect directly with dealerships through our secure messaging system. Ask questions and negotiate without leaving the app.",
        color: "#9b59b6" // Purple
      },
      {
        icon: <BellAlertIcon className="w-6 h-6" />,
        title: "Personalized Notifications",
        description: "Receive alerts for price drops on favorite vehicles, new listings matching your criteria, and instant dealership responses.",
        color: "#f39c12" // Orange
      },
      {
        icon: <MapPinIcon className="w-6 h-6" />,
        title: "Location-Based Search",
        description: "Find vehicles and dealerships near you with integrated mapping. Get directions directly to the dealership for test drives.",
        color: "#16a085" // Teal
      },
      {
        icon: <ArrowPathIcon className="w-6 h-6" />,
        title: "Recently Viewed",
        description: "Keep track of vehicles you've viewed with a history feature that lets you quickly return to listings that caught your interest.",
        color: "#8e44ad" // Dark Purple
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Vehicle History Reports",
        description: "Access detailed vehicle history reports including accident history, service records, and previous ownership information.",
        color: "#2c3e50" // Dark Blue
      },
      {
        icon: <StarIcon className="w-6 h-6" />,
        title: "Dealership Ratings",
        description: "View ratings and reviews from other buyers to choose trusted dealerships with proven customer satisfaction.",
        color: "#f1c40f" // Yellow
      },
      {
        icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
        title: "Price Comparison",
        description: "See how a vehicle's price compares to similar models in your area to ensure you're getting a fair deal.",
        color: "#1abc9c" // Light Green
      },
      {
        icon: <ClockIcon className="w-6 h-6" />,
        title: "Appointment Scheduling",
        description: "Schedule test drives and dealership visits directly through the app with calendar integration.",
        color: "#e67e22" // Dark Orange
      },
      {
        icon: <GlobeAltIcon className="w-6 h-6" />,
        title: "Multi-region Search",
        description: "Expand your search to multiple cities or regions to find the perfect vehicle, no matter where it's located.",
        color: "#34495e" // Navy
      }
    ],

    dealerships: [
      {
        icon: <QueueListIcon className="w-6 h-6" />,
        title: "Inventory Management",
        description: "Upload and manage your entire inventory with our easy-to-use dashboard. Add detailed specifications, pricing, and multiple high-quality images per listing.",
        color: "#3498db" // Blue
      },
      {
        icon: <VideoCameraIcon className="w-6 h-6" />,
        title: "AutoClips Creation",
        description: "Create engaging video content showcasing your vehicles. Highlight special features, document condition, and give virtual tours to attract more buyers.",
        color: "#27ae60" // Green
      },
      {
        icon: <ChartBarIcon className="w-6 h-6" />,
        title: "Performance Analytics",
        description: "Track listing performance with detailed metrics including views, inquiries, and comparison rates. Identify trends and optimize your inventory strategy.",
        color: "#9b59b6" // Purple
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Lead Management",
        description: "Manage customer inquiries efficiently with our organized communication system. Never miss a potential sale with notifications and detailed customer information.",
        color: "#e74c3c" // Red
      },
      {
        icon: <TagIcon className="w-6 h-6" />,
        title: "Promotional Tools",
        description: "Create special offers, highlight featured vehicles, and run time-limited promotions to attract more customers and move inventory faster.",
        color: "#f39c12" // Orange
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Sales Reporting",
        description: "Generate comprehensive sales reports with detailed analytics. Export data for your records or integrate with your existing systems.",
        color: "#16a085" // Teal
      },
      {
        icon: <PhotoIcon className="w-6 h-6" />,
        title: "Multi-media Showcase",
        description: "Upload high-resolution photos, 360° views, and detailed closeups of vehicle features to showcase your inventory in the best possible light.",
        color: "#8e44ad" // Dark Purple
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Subscription Management",
        description: "Manage your Fleet subscription, billing history, and upgrade options directly through your dealership dashboard.",
        color: "#2c3e50" // Dark Blue
      },
      {
        icon: <BanknotesIcon className="w-6 h-6" />,
        title: "Finance Calculator",
        description: "Provide potential buyers with financing options and payment calculators directly on your listings.",
        color: "#2ecc71" // Emerald
      },
      {
        icon: <CalendarDaysIcon className="w-6 h-6" />,
        title: "Appointment Management",
        description: "Manage test drive appointments and customer visits with our integrated scheduling system and reminders.",
        color: "#e67e22" // Dark Orange
      },
      {
        icon: <CloudArrowUpIcon className="w-6 h-6" />,
        title: "Bulk Upload Tools",
        description: "Import your inventory in bulk with CSV uploads or API integrations with popular dealer management systems.",
        color: "#34495e" // Navy
      },
      {
        icon: <InboxArrowDownIcon className="w-6 h-6" />,
        title: "Export Functionality",
        description: "Export inventory, customer data, and performance metrics in various formats for reporting and record-keeping.",
        color: "#7f8c8d" // Gray
      }
    ],

    administrators: [
      {
        icon: <UsersIcon className="w-6 h-6" />,
        title: "User Management",
        description: "Comprehensive tools for managing both buyers and dealerships. Handle account verification, support requests, and account actions like suspension if needed.",
        color: "#3498db" // Blue
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Platform Analytics",
        description: "Access detailed platform metrics including user growth, engagement rates, inventory statistics, and revenue tracking across the entire ecosystem.",
        color: "#27ae60" // Green
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Content Moderation",
        description: "Review and approve dealership listings and AutoClips to maintain quality standards. Flag inappropriate content and manage the review process.",
        color: "#e74c3c" // Red
      },
      {
        icon: <CogIcon className="w-6 h-6" />,
        title: "System Configuration",
        description: "Manage platform settings, feature toggles, and system-wide notifications. Control app behavior and tailor the experience for all users.",
        color: "#9b59b6" // Purple
      },
      {
        icon: <BuildingStorefrontIcon className="w-6 h-6" />,
        title: "Dealership Verification",
        description: "Verify the legitimacy of dealerships joining the platform with document review tools and background check capabilities.",
        color: "#f39c12" // Orange
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Billing & Subscription",
        description: "Manage subscription plans, process payments, and handle billing inquiries. Generate revenue reports and monitor subscription metrics.",
        color: "#16a085" // Teal
      },
      {
        icon: <ShieldCheckIcon className="w-6 h-6" />,
        title: "Security Monitoring",
        description: "Monitor platform security, detect suspicious activities, and implement security measures to protect user data and prevent fraud.",
        color: "#8e44ad" // Dark Purple
      },
      {
        icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
        title: "Performance Optimization",
        description: "Tools for monitoring app performance, optimizing database queries, and ensuring smooth operation even during peak usage periods.",
        color: "#2c3e50" // Dark Blue
      },
      {
        icon: <SparklesIcon className="w-6 h-6" />,
        title: "Feature Management",
        description: "Roll out new features gradually with A/B testing capabilities and feature flags to test effectiveness before full release.",
        color: "#f1c40f" // Yellow
      },
      {
        icon: <LockClosedIcon className="w-6 h-6" />,
        title: "Access Control",
        description: "Granular permission settings to control access levels for different administrator roles and responsibilities.",
        color: "#7f8c8d" // Gray
      },
      {
        icon: <HandThumbUpIcon className="w-6 h-6" />,
        title: "Support Dashboard",
        description: "Manage user and dealership support tickets with prioritization tools and service level tracking.",
        color: "#1abc9c" // Light Green
      },
      {
        icon: <GlobeAltIcon className="w-6 h-6" />,
        title: "Regional Settings",
        description: "Configure regional settings, currencies, and language options to support multiple markets and international expansion.",
        color: "#34495e" // Navy
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 opacity-30">


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
          transition={{ duration: 30, delay: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <header className="relative py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" passHref>
              <div className="flex items-center gap-2 text-accent hover:text-accent-light transition-colors duration-300 cursor-pointer">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Home</span>
              </div>
            </Link>
            <img src="logo.png" alt="Fleet Logo" className="h-10" />
          </div>

          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-7xl font-bold mb-6 text-center relative"
            >
              <span className="relative inline-block">
                Fleet <span className="text-accent">Features</span>
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto text-center mb-12"
            >
              Explore the comprehensive set of tools and capabilities available on the Fleet platform,
              designed for car buyers, dealerships, and platform administrators
            </motion.p>

            {/* Featured rotating feature */}
            <div className="max-w-4xl mx-auto relative h-32 sm:h-24 mb-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  variants={featuredVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 w-full">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${features[activeTab][featuredIndex].color}20` }}
                      >
                        <div style={{ color: features[activeTab][featuredIndex].color }}>
                          {features[activeTab][featuredIndex].icon}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="font-bold text-lg">{features[activeTab][featuredIndex].title}</h3>
                          <p className="text-sm text-gray-300 line-clamp-1">
                            {features[activeTab][featuredIndex].description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="px-3 py-1 text-xs rounded-full bg-accent/20 text-accent border border-accent/30">
                            Featured
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className={`py-5 sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-sm shadow-lg' : 'bg-black/50 backdrop-blur-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            <motion.button
              onClick={() => setActiveTab('users')}
              variants={tabVariants}
              animate={activeTab === 'users' ? 'active' : 'inactive'}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full flex items-center gap-2"
            >
              <UserIcon className="w-5 h-5" />
              <span>For Car Buyers</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('dealerships')}
              variants={tabVariants}
              animate={activeTab === 'dealerships' ? 'active' : 'inactive'}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full flex items-center gap-2"
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              <span>For Dealerships</span>
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('administrators')}
              variants={tabVariants}
              animate={activeTab === 'administrators' ? 'active' : 'inactive'}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full flex items-center gap-2"
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>For Administrators</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              key={activeTab}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {features[activeTab].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{
                    scale: 1.03,
                    backgroundColor: `${feature.color}10`,
                    borderColor: `${feature.color}50`
                  }}
                  className="backdrop-blur-sm bg-black/30 rounded-xl p-6 border border-white/10 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="p-3 rounded-lg inline-block mb-4"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <div style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-50"></div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to experience Fleet?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Join the growing community of car buyers and dealerships using Fleet to revolutionize the car shopping experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mb-8 sm:mb-10">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center bg-black/80 hover:bg-black border border-white/20 rounded-xl px-5 py-2.5 w-48 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-white mr-3" viewBox="0 0 384 512" fill="currentColor">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-white/80 text-xs">Download on the</span>
                      <span className="text-white font-medium text-lg leading-tight">App Store</span>
                    </div>
                  </div>
                </motion.a>

                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center bg-black/80 hover:bg-black border border-white/20 rounded-xl px-5 py-2.5 w-48 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-white mr-3" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-white/80 text-xs">GET IT ON</span>
                      <span className="text-white font-medium text-lg leading-tight">Google Play</span>
                    </div>
                  </div>
                </motion.a>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      </div>
  )}