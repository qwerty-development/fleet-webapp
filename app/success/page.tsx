'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircleIcon, HomeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

export default function SuccessPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black-light flex items-center justify-center px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          variants={iconVariants}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <CheckCircleIcon className="h-24 w-24 text-green-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={itemVariants}
          className="bg-background/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 md:p-8 shadow-lg"
        >
          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-4 text-green-500"
          >
            Payment Successful!
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-300 text-lg mb-6"
          >
            Thank you for your subscription payment. Your dealership account has been successfully updated and all features are now active.
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="text-gray-400 text-sm mb-8"
          >
            You can now manage your inventory, create AutoClips, and access all premium features.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="space-y-3"
          >
            <Link
              href="/dealer"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-300"
            >
              <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
              Go to Dealer Dashboard
            </Link>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors duration-300"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@fleetapp.me" className="text-accent hover:underline">
              support@fleetapp.me
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
