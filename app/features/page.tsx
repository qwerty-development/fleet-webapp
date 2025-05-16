"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { ReactElement } from "react";

// Define feature interface
interface Feature {
  icon: ReactElement;
  title: string;
  description: string;
  color: string;
}

// Define the feature categories type
type FeatureCategory = "users" | "dealerships" | "administrators";

// Define features type
interface Features {
  users: Feature[];
  dealerships: Feature[];
  administrators: Feature[];
}

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<FeatureCategory>("users");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Switch featured feature every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % features[activeTab].length);
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
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const tabVariants = {
    inactive: {
      backgroundColor: "rgb(17, 17, 17)",
      color: "rgb(156, 163, 175)",
      scale: 0.97,
    },
    active: {
      backgroundColor: "#FF6A00",
      color: "#ffffff",
      scale: 1,
      boxShadow: "0 0 20px rgba(255, 106, 0, 0.3)",
    },
  };

  const featuredVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 },
    },
  };

  // Feature data by user roles
  const features: Features = {
    users: [
      {
        icon: <MagnifyingGlassIcon className="w-6 h-6" />,
        title: "Advanced Search & Filtering",
        description:
          "Find your ideal vehicle with powerful search filters including make, model, year, price range, mileage, and more. Save your search criteria for future reference.",
        color: "#3498db", // Blue
      },
      {
        icon: <HeartIcon className="w-6 h-6" />,
        title: "Favorites Management",
        description:
          "Save vehicles to your favorites list for easy access. Compare multiple vehicles side by side to make the best choice for your needs.",
        color: "#e74c3c", // Red
      },
      {
        icon: <VideoCameraIcon className="w-6 h-6" />,
        title: "AutoClips Video Content",
        description:
          "Watch engaging video walkthroughs of vehicles to get a better understanding of features and condition before contacting dealerships.",
        color: "#27ae60", // Green
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Instant Messaging",
        description:
          "Connect directly with dealerships through our secure messaging system. Ask questions and negotiate without leaving the app.",
        color: "#9b59b6", // Purple
      },
      {
        icon: <BellAlertIcon className="w-6 h-6" />,
        title: "Personalized Notifications",
        description:
          "Receive alerts for price drops on favorite vehicles, new listings matching your criteria, and instant dealership responses.",
        color: "#f39c12", // Orange
      },
      {
        icon: <MapPinIcon className="w-6 h-6" />,
        title: "Location-Based Search",
        description:
          "Find vehicles and dealerships near you with integrated mapping. Get directions directly to the dealership for test drives.",
        color: "#16a085", // Teal
      },
      {
        icon: <ArrowPathIcon className="w-6 h-6" />,
        title: "Recently Viewed",
        description:
          "Keep track of vehicles you've viewed with a history feature that lets you quickly return to listings that caught your interest.",
        color: "#8e44ad", // Dark Purple
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Vehicle History Reports",
        description:
          "Access detailed vehicle history reports including accident history, service records, and previous ownership information.",
        color: "#2c3e50", // Dark Blue
      },
      {
        icon: <StarIcon className="w-6 h-6" />,
        title: "Dealership Ratings",
        description:
          "View ratings and reviews from other buyers to choose trusted dealerships with proven customer satisfaction.",
        color: "#f1c40f", // Yellow
      },
      {
        icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
        title: "Price Comparison",
        description:
          "See how a vehicle's price compares to similar models in your area to ensure you're getting a fair deal.",
        color: "#1abc9c", // Light Green
      },
      {
        icon: <ClockIcon className="w-6 h-6" />,
        title: "Appointment Scheduling",
        description:
          "Schedule test drives and dealership visits directly through the app with calendar integration.",
        color: "#e67e22", // Dark Orange
      },
      {
        icon: <GlobeAltIcon className="w-6 h-6" />,
        title: "Multi-region Search",
        description:
          "Expand your search to multiple cities or regions to find the perfect vehicle, no matter where it's located.",
        color: "#34495e", // Navy
      },
    ],

    dealerships: [
      {
        icon: <QueueListIcon className="w-6 h-6" />,
        title: "Inventory Management",
        description:
          "Upload and manage your entire inventory with our easy-to-use dashboard. Add detailed specifications, pricing, and multiple high-quality images per listing.",
        color: "#3498db", // Blue
      },
      {
        icon: <VideoCameraIcon className="w-6 h-6" />,
        title: "AutoClips Creation",
        description:
          "Create engaging video content showcasing your vehicles. Highlight special features, document condition, and give virtual tours to attract more buyers.",
        color: "#27ae60", // Green
      },
      {
        icon: <ChartBarIcon className="w-6 h-6" />,
        title: "Performance Analytics",
        description:
          "Track listing performance with detailed metrics including views, inquiries, and comparison rates. Identify trends and optimize your inventory strategy.",
        color: "#9b59b6", // Purple
      },
      {
        icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
        title: "Lead Management",
        description:
          "Manage customer inquiries efficiently with our organized communication system. Never miss a potential sale with notifications and detailed customer information.",
        color: "#e74c3c", // Red
      },
      {
        icon: <TagIcon className="w-6 h-6" />,
        title: "Promotional Tools",
        description:
          "Create special offers, highlight featured vehicles, and run time-limited promotions to attract more customers and move inventory faster.",
        color: "#f39c12", // Orange
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Sales Reporting",
        description:
          "Generate comprehensive sales reports with detailed analytics. Export data for your records or integrate with your existing systems.",
        color: "#16a085", // Teal
      },
      {
        icon: <PhotoIcon className="w-6 h-6" />,
        title: "Multi-media Showcase",
        description:
          "Upload high-resolution photos, 360° views, and detailed closeups of vehicle features to showcase your inventory in the best possible light.",
        color: "#8e44ad", // Dark Purple
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Subscription Management",
        description:
          "Manage your Fleet subscription, billing history, and upgrade options directly through your dealership dashboard.",
        color: "#2c3e50", // Dark Blue
      },
      {
        icon: <BanknotesIcon className="w-6 h-6" />,
        title: "Finance Calculator",
        description:
          "Provide potential buyers with financing options and payment calculators directly on your listings.",
        color: "#2ecc71", // Emerald
      },
      {
        icon: <CalendarDaysIcon className="w-6 h-6" />,
        title: "Appointment Management",
        description:
          "Manage test drive appointments and customer visits with our integrated scheduling system and reminders.",
        color: "#e67e22", // Dark Orange
      },
      {
        icon: <CloudArrowUpIcon className="w-6 h-6" />,
        title: "Bulk Upload Tools",
        description:
          "Import your inventory in bulk with CSV uploads or API integrations with popular dealer management systems.",
        color: "#34495e", // Navy
      },
      {
        icon: <InboxArrowDownIcon className="w-6 h-6" />,
        title: "Export Functionality",
        description:
          "Export inventory, customer data, and performance metrics in various formats for reporting and record-keeping.",
        color: "#7f8c8d", // Gray
      },
    ],

    administrators: [
      {
        icon: <UsersIcon className="w-6 h-6" />,
        title: "User Management",
        description:
          "Comprehensive tools for managing both buyers and dealerships. Handle account verification, support requests, and account actions like suspension if needed.",
        color: "#3498db", // Blue
      },
      {
        icon: <PresentationChartLineIcon className="w-6 h-6" />,
        title: "Platform Analytics",
        description:
          "Access detailed platform metrics including user growth, engagement rates, inventory statistics, and revenue tracking across the entire ecosystem.",
        color: "#27ae60", // Green
      },
      {
        icon: <DocumentTextIcon className="w-6 h-6" />,
        title: "Content Moderation",
        description:
          "Review and approve dealership listings and AutoClips to maintain quality standards. Flag inappropriate content and manage the review process.",
        color: "#e74c3c", // Red
      },
      {
        icon: <CogIcon className="w-6 h-6" />,
        title: "System Configuration",
        description:
          "Manage platform settings, feature toggles, and system-wide notifications. Control app behavior and tailor the experience for all users.",
        color: "#9b59b6", // Purple
      },
      {
        icon: <BuildingStorefrontIcon className="w-6 h-6" />,
        title: "Dealership Verification",
        description:
          "Verify the legitimacy of dealerships joining the platform with document review tools and background check capabilities.",
        color: "#f39c12", // Orange
      },
      {
        icon: <CurrencyDollarIcon className="w-6 h-6" />,
        title: "Billing & Subscription",
        description:
          "Manage subscription plans, process payments, and handle billing inquiries. Generate revenue reports and monitor subscription metrics.",
        color: "#16a085", // Teal
      },
      {
        icon: <ShieldCheckIcon className="w-6 h-6" />,
        title: "Security Monitoring",
        description:
          "Monitor platform security, detect suspicious activities, and implement security measures to protect user data and prevent fraud.",
        color: "#8e44ad", // Dark Purple
      },
      {
        icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
        title: "Performance Optimization",
        description:
          "Tools for monitoring app performance, optimizing database queries, and ensuring smooth operation even during peak usage periods.",
        color: "#2c3e50", // Dark Blue
      },
      {
        icon: <SparklesIcon className="w-6 h-6" />,
        title: "Feature Management",
        description:
          "Roll out new features gradually with A/B testing capabilities and feature flags to test effectiveness before full release.",
        color: "#f1c40f", // Yellow
      },
      {
        icon: <LockClosedIcon className="w-6 h-6" />,
        title: "Access Control",
        description:
          "Granular permission settings to control access levels for different administrator roles and responsibilities.",
        color: "#7f8c8d", // Gray
      },
      {
        icon: <HandThumbUpIcon className="w-6 h-6" />,
        title: "Support Dashboard",
        description:
          "Manage user and dealership support tickets with prioritization tools and service level tracking.",
        color: "#1abc9c", // Light Green
      },
      {
        icon: <GlobeAltIcon className="w-6 h-6" />,
        title: "Regional Settings",
        description:
          "Configure regional settings, currencies, and language options to support multiple markets and international expansion.",
        color: "#34495e", // Navy
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 opacity-10">
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

      {/* Header */}
      <header className="relative pt-24 pb-10 px-6 sm:px-10 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              Fleet
            </span>{" "}
            Features
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mb-8">
            Explore our comprehensive features designed to provide the best car
            buying, selling, and browsing experience for users, dealerships, and
            administrators.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            {(Object.keys(features) as FeatureCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeTab === category
                    ? "bg-accent text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <main className="px-6 sm:px-10 md:px-16 lg:px-24 pb-24">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features[activeTab].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: index * 0.1,
                    },
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
