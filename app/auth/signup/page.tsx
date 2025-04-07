'use client';

import React, { useState } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import GoogleAuthHandler from '@/components/auth/GoogleAuthHandler';

export default function SignUpPage() {
  const { signUp, verifyOtp } = useAuth();
  const router = useRouter();

  // Form state variables
  const [name, setName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification state variables
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Error states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    general: '',
  });
  const [verificationError, setVerificationError] = useState('');

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

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Validate input fields
  const validateInputs = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      general: '',
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle sign-up submission
  const onSignUpPress = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const result:any = await signUp({
        email: emailAddress,
        password,
        name,
      });

      if (result.error) {
        // Check for specific email-exists errors and display them in the email field
        if (result.error.message.includes('already exists') ||
            result.error.message.includes('already registered') ||
            result.error.message.includes('already in use')) {
          setErrors(prev => ({
            ...prev,
            email: result.error.message || 'This email is already registered. Please try signing in.',
            general: '', // Clear general error since we're showing it in the email field
          }));
        } else {
          // Other errors go to the general error field
          setErrors(prev => ({
            ...prev,
            general: result.error.message || 'Sign up failed. Please try again.',
          }));
        }
        return;
      }

      if (result.needsEmailVerification) {
        setPendingVerification(true);
        setVerificationEmail(emailAddress);
        setVerificationMessage('Please check your email for a verification code (OTP).');
      } else {
        // If email verification not required, registration is complete
        router.push('/home');
      }
    } catch (error: any) {
      console.error(JSON.stringify(error, null, 2));
      setErrors(prev => ({
        ...prev,
        general: error.message || 'Sign up failed. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification submission
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim() === '') {
      setVerificationError('Please enter the verification code from your email.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    try {
      const { error } = await verifyOtp(verificationEmail, otpCode);

      if (error) {
        setVerificationError(error.message || 'Invalid verification code. Please try again.');
        return;
      }

      // Verification successful, redirect to home
      router.push('/home');
    } catch (error: any) {
      setVerificationError(error.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle returning to sign-up form
  const handleGoBack = () => {
    setPendingVerification(false);
    setOtpCode('');
    setVerificationError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-black-light relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/10"
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            animate={{
              y: [
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`,
                `${Math.random() * 100}%`
              ],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              filter: "blur(8px)",
            }}
          />
        ))}
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
            {pendingVerification ? 'Verify Your Email' : 'Create Account'}
          </motion.h1>

          {!pendingVerification ? (
            // Sign-up form
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Google Authentication Handler */}
              <motion.div variants={itemVariants}>
                <GoogleAuthHandler />
                <div className="flex items-center my-4">
                  <div className="flex-grow h-px bg-gray-700"></div>
                  <span className="px-3 text-sm text-gray-400">OR</span>
                  <div className="flex-grow h-px bg-gray-700"></div>
                </div>
              </motion.div>

              <div>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white`}
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-accent">{errors.name}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white`}
                  placeholder="Email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-accent">{errors.email}</p>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
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
                {errors.password && (
                  <p className="mt-1 text-sm text-accent">{errors.password}</p>
                )}
              </div>

              {errors.general && (
                <p className="text-center text-accent">{errors.general}</p>
              )}

        <div className="text-xs text-gray-500 mb-4 text-center">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-accent hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </div>

              <button
                onClick={onSignUpPress}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : "Sign Up"}
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-accent hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            // OTP verification form
            <motion.div variants={itemVariants} className="text-center space-y-6">
              <div className="bg-black-light border border-gray-700 rounded-lg p-6">
                <p className="text-white text-lg mb-4">
                  {verificationMessage}
                </p>
                <p className="text-gray-400 mb-4">
                  We've sent a verification code to <span className="text-white font-medium">{verificationEmail}</span>.
                  Please enter it below to complete your registration.
                </p>

                {/* OTP Input */}
                <div className="mt-6">
                  <div className="flex justify-center items-center space-x-2">
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white text-center text-xl tracking-widest"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                    />
                  </div>

                  {verificationError && (
                    <p className="mt-3 text-sm text-accent">{verificationError}</p>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpCode.length < 6}
                  className="w-full mt-6 bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
                >
                  {isVerifying ? (
                    <span className="flex justify-center items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : "Verify Code"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                <button
                  onClick={handleGoBack}
                  className="flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Sign Up
                </button>



                <Link href="/auth/signin">
                  <span className="text-gray-400 hover:text-white transition-colors">
                    Sign In Instead
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}