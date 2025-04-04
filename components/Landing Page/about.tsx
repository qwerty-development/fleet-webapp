"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  HeartIcon,
  PhoneIcon,
  CheckBadgeIcon,
  TagIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  PresentationChartLineIcon,
  PhotoIcon,
  GlobeAltIcon,
  SparklesIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function AboutSection() {
  const [activeTab, setActiveTab] = useState("buyers");

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1],
      },
    }),
  };

  const tabVariants = {
    inactive: { opacity: 0.7, scale: 0.95 },
    active: {
      opacity: 1,
      scale: 1,
      boxShadow: "0 0 25px rgba(255, 106, 0, 0.3)",
      border: "1px solid rgba(255, 106, 0, 0.5)",
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const buyerFeatures = [
    {
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      title: "Advanced Search",
      description: "Powerful filters to find exactly what you're looking for",
    },
    {
      icon: <HeartIcon className="w-6 h-6" />,
      title: "Favorites Collection",
      description: "Save and organize vehicles you love",
    },
    {
      icon: <VideoCameraIcon className="w-6 h-6" />,
      title: "Video Walkthroughs",
      description: "Experience cars through interactive AutoClips",
    },
    {
      icon: <PhoneIcon className="w-6 h-6" />,
      title: "Direct Contact",
      description: "Connect with dealerships instantly",
    },
    {
      icon: <CheckBadgeIcon className="w-6 h-6" />,
      title: "Verified Listings",
      description: "All vehicles verified for quality and accuracy",
    },
    {
      icon: <TagIcon className="w-6 h-6" />,
      title: "Special Offers",
      description: "Access to exclusive deals and promotions",
    },
  ];

  const dealerFeatures = [
    {
      icon: <ShoppingBagIcon className="w-6 h-6" />,
      title: "Inventory Management",
      description: "Easily list and update your vehicle inventory",
    },
    {
      icon: <PresentationChartLineIcon className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Track listings, views, and customer engagement",
    },
    {
      icon: <PhotoIcon className="w-6 h-6" />,
      title: "AutoClips Creation",
      description: "Create engaging video content to showcase vehicles",
    },
    {
      icon: <UserGroupIcon className="w-6 h-6" />,
      title: "Lead Generation",
      description: "Direct connections with interested buyers",
    },
    {
      icon: <ChartBarIcon className="w-6 h-6" />,
      title: "Sales Reporting",
      description: "Comprehensive sales and performance metrics",
    },
    {
      icon: <GlobeAltIcon className="w-6 h-6" />,
      title: "Digital Presence",
      description: "Enhanced online visibility for your dealership",
    },
  ];

  return (
    <section id="about" className="py-24 overflow-hidden">
      <div className="container mx-auto px-4">
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
            Designed for Everyone
          </motion.span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl text-white font-bold mt-10 mb-6">
            <span className="text-accent font-bold bg-white/5 rounded-md p-1">
              Revolutionizing
            </span>{" "}
            {/* <span className="relative">
              Revolutionizing
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </span>{" "} */}
            <span className="">Car Shopping</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Fleet connects car buyers with trusted dealerships through an
            intuitive platform designed to make vehicle shopping seamless and
            enjoyable.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-black/40 p-1.5 rounded-xl backdrop-blur-sm border border-white/10">
            <motion.button
              className={`relative px-6 py-3 rounded-lg font-medium text-lg ${
                activeTab === "buyers" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("buyers")}
              variants={tabVariants}
              animate={activeTab === "buyers" ? "active" : "inactive"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                For Car Buyers
              </span>
              {activeTab === "buyers" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 rounded-lg border border-accent/20"
                  layoutId="activeTab"
                />
              )}
            </motion.button>

            <motion.button
              className={`relative px-6 py-3 rounded-lg font-medium text-lg ${
                activeTab === "dealers" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("dealers")}
              variants={tabVariants}
              animate={activeTab === "dealers" ? "active" : "inactive"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center">
                <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
                For Dealerships
              </span>
              {activeTab === "dealers" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 rounded-lg border border-accent/20"
                  layoutId="activeTab"
                />
              )}
            </motion.button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
          {/* Animated background elements */}
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Car Buyers Features */}
          <motion.div
            className={`w-full ${activeTab === "buyers" ? "block" : "hidden"}`}
            variants={containerVariants}
            initial="hidden"
            animate={activeTab === "buyers" ? "visible" : "hidden"}
            key="buyers"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <motion.div
                className="relative overflow-hidden rounded-xl aspect-video flex items-center justify-center backdrop-blur-sm bg-black/30 border border-white/10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent z-0 rounded-xl"></div>

                {/* Large icon instead of image */}
                <motion.div
                  className="relative z-10 text-accent"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <UserIcon className="w-32 h-32" />
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Seamless Experience
                  </h3>
                  <p className="text-white/80">
                    Find, compare, and connect with dealerships through our
                    intuitive interface
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {buyerFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={featureVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{
                      scale: 1.03,
                      backgroundColor: "rgba(255, 106, 0, 0.08)",
                      borderColor: "rgba(255, 106, 0, 0.3)",
                    }}
                    className="flex flex-col p-5 rounded-xl backdrop-blur-sm bg-black/20 border border-white/10 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-2.5 bg-accent/10 rounded-lg w-fit mb-3">
                      <div className="text-accent">{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Dealer Features */}
          <motion.div
            className={`w-full ${activeTab === "dealers" ? "block" : "hidden"}`}
            variants={containerVariants}
            initial="hidden"
            animate={activeTab === "dealers" ? "visible" : "hidden"}
            key="dealers"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 order-2 md:order-1">
                {dealerFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={featureVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{
                      scale: 1.03,
                      backgroundColor: "rgba(255, 106, 0, 0.08)",
                      borderColor: "rgba(255, 106, 0, 0.3)",
                    }}
                    className="flex flex-col p-5 rounded-xl backdrop-blur-sm bg-black/20 border border-white/10 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-2.5 bg-accent/10 rounded-lg w-fit mb-3">
                      <div className="text-accent">{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="relative overflow-hidden rounded-xl aspect-video flex items-center justify-center backdrop-blur-sm bg-black/30 border border-white/10 order-1 md:order-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-black/80 via-black/40 to-transparent z-0 rounded-xl"></div>

                {/* Large icon instead of image */}
                <motion.div
                  className="relative z-10 text-accent"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <BuildingStorefrontIcon className="w-32 h-32" />
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Powerful Dashboard
                  </h3>
                  <p className="text-white/80">
                    Comprehensive tools to manage your inventory and connect
                    with buyers
                  </p>
                </div>
              </motion.div>
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
