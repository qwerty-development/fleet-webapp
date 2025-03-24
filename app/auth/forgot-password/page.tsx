'use client';

import React, { useState } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  // UI states
  const [stage, setStage] = useState('request'); // 'request' or 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validation states
  const [errors, setErrors] = useState({
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
  });

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

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Validate form fields
  const validateInputs = (formStage:any) => {
    let isValid = true;
    const newErrors = {
      email: '',
      code: '',
      password: '',
      confirmPassword: '',
    };

    if (formStage === 'request') {
      if (!emailAddress.trim()) {
        newErrors.email = 'Email is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
        newErrors.email = 'Invalid email format';
        isValid = false;
      }
    } else if (formStage === 'reset') {
      if (!code.trim()) {
        newErrors.code = 'Verification code is required';
        isValid = false;
      }

      if (!password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
        isValid = false;
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle request password reset
  const handleRequestReset = async () => {
    if (!validateInputs('request')) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await resetPassword(emailAddress);

      if (error) throw error;

      setSuccessMessage('Check your email for the verification code to reset your password.');
      setStage('reset');
    } catch (error:any) {
      console.error('Error requesting password reset:', error);
      setError(error.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password with verification code
  const handleResetPassword = async () => {
    if (!validateInputs('reset')) return;

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: emailAddress,
        token: code,
        type: 'recovery',
      });

      if (verifyError) throw verifyError;

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccessMessage('Your password has been reset successfully.');

      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error:any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            {stage === 'request' ? 'Forgot Password' : 'Reset Password'}
          </motion.h1>

          {/* Success message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-400 text-center"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-center"
            >
              {error}
            </motion.div>
          )}

          {stage === 'request' ? (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-400">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>
              </div>

              {/* Email input */}
              <div>
                <input
                  type="email"
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white`}
                  placeholder="Email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-accent">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRequestReset}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </span>
                ) : "Send Verification Code"}
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Remember your password?{' '}
                  <Link href="/auth/signin" className="text-accent hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-400">
                  Enter the verification code sent to your email and create a new password.
                </p>
              </div>

              {/* Verification Code input */}
              <div>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.code ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white`}
                  placeholder="Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-accent">{errors.code}</p>
                )}
              </div>

              {/* New Password input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white pr-10`}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
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

              {/* Confirm Password input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 bg-black-light border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white pr-10`}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-accent">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Reset Password Button */}
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </span>
                ) : "Reset Password"}
              </button>

              {/* Back link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStage('request')}
                  className="text-accent hover:underline"
                  disabled={isLoading}
                >
                  ← Back to Email Entry
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}