// app/auth/signin/page.tsx

'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import GoogleAuthHandler from '@/components/auth/GoogleAuthHandler';

export default function SignInPage() {
  const { signIn } = useAuth();
  const { setGuestMode } = useGuestUser();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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

  const onSignInPress = async () => {
    // Existing sign-in logic...
  };

  const handleGuestSignIn = async () => {
    // Existing guest sign-in logic...
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-black-light relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Existing background animation code... */}
      </div>

      {/* Content container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 container mx-auto px-4 py-16 max-w-md"
      >
        <motion.div
          variants={itemVariants}
          className="bg-background/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-lg"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold mb-6 text-center text-accent"
          >
            Sign In
          </motion.h1>

          {/* Google Auth Handler - works in both standard browsers and web views */}
          <motion.div variants={itemVariants}>
            <GoogleAuthHandler />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-700"></div>
              <span className="px-3 text-sm text-gray-400">OR</span>
              <div className="flex-grow h-px bg-gray-700"></div>
            </div>

            {/* Email input */}
            <div>
              <input
                type="email"
                className={`w-full px-4 py-3 bg-black-light border ${
                  emailError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white`}
                placeholder="Email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
              {emailError && (
                <p className="mt-1 text-sm text-accent">{emailError}</p>
              )}
            </div>

            {/* Password input */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-3 bg-black-light border ${
                  passwordError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white pr-10`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {passwordError && (
                <p className="mt-1 text-sm text-accent">{passwordError}</p>
              )}
            </div>

            {error && (
              <p className="text-center text-accent">{error}</p>
            )}

            {/* Sign In Button */}
            <button
              onClick={onSignInPress}
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : "Sign In"}
            </button>

            {/* Guest Mode Button */}
            <button
              onClick={handleGuestSignIn}
              disabled={isGuestLoading}
              className="w-full border border-accent text-accent hover:bg-accent/10 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
            >
              {isGuestLoading ? (
                <span className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : "Continue as Guest"}
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-accent hover:underline font-medium">
                Sign up
              </Link>
            </p>

            <Link
              href="/auth/forgot-password"
              className="block mt-2 text-gray-300 hover:text-white"
            >
              Forgot password?
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}