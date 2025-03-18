'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if we have the required parameters
  useEffect(() => {
    const hasRequiredParams = searchParams.has('type') &&
                               searchParams.get('type') === 'recovery' &&
                               searchParams.has('token');

    if (!hasRequiredParams) {
      setError('Invalid or missing parameters for password reset');
    }
  }, [searchParams]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleResetPassword = async () => {
    // Validate inputs
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to sign in page after a delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            className="text-3xl font-bold mb-6 text-center text-accent"
          >
            {success ? 'Password Reset Successfully' : 'Reset Your Password'}
          </motion.h1>

          {success ? (
            <motion.div variants={itemVariants} className="text-center space-y-6">
              <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-lg mb-4">
                Your password has been successfully reset.
              </div>

              <p className="text-gray-300">
                You'll be redirected to the sign-in page shortly, or you can click the button below.
              </p>

              <Link href="/auth/signin">
                <button className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                  Sign In Now
                </button>
              </Link>
            </motion.div>
          ) : error && !searchParams.has('token') ? (
            <motion.div variants={itemVariants} className="text-center space-y-6">
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>

              <p className="text-gray-300">
                Please request a new password reset link from the sign-in page.
              </p>

              <Link href="/auth/signin">
                <button className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300">
                  Back to Sign In
                </button>
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-4">
              <p className="text-gray-300 text-center mb-4">
                Enter your new password below.
              </p>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-2">
                  {error}
                </div>
              )}

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white pr-10"
                  placeholder="New Password"
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
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white pr-10"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70 mt-4"
              >
                {loading ? (
                  <span className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </span>
                ) : "Reset Password"}
              </button>

              <div className="text-center mt-4">
                <Link href="/auth/signin" className="text-gray-300 hover:text-white">
                  Cancel and return to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}