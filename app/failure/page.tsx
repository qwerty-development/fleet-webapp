'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { XCircleIcon, HomeIcon, CreditCardIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function FailurePage() {
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
        {/* Failure Icon */}
        <motion.div
          variants={iconVariants}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <XCircleIcon className="h-24 w-24 text-red-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse"
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
            className="text-3xl md:text-4xl font-bold mb-4 text-red-500"
          >
            Payment Failed
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-300 text-lg mb-6"
          >
            We couldn't process your subscription payment. Please check your payment details and try again.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
          >
            <p className="text-red-400 text-sm">
              Common issues: insufficient funds, expired card, incorrect billing information, or network timeout.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="space-y-3"
          >
            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-300"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>

            <Link
              href="/dealer"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors duration-300"
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Manage Subscription
            </Link>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-gray-400 font-medium rounded-lg hover:bg-gray-500 transition-colors duration-300"
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
            Still having trouble? Contact our support team at{' '}
            <a href="mailto:support@fleetapp.me" className="text-accent hover:underline">
              support@fleetapp.me
            </a>
            {' '}or call{' '}
            <a href="tel:+96176875775" className="text-accent hover:underline">
              +96176875775
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
