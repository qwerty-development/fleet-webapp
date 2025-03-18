'use client';

import React, { useState } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function SignUpPage() {
  const { signUp, googleSignIn } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    general: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const onSignUpPress = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      const { error, needsEmailVerification } = await signUp({
        email: emailAddress,
        password,
        name,
      });

      if (error) {
        // Check for specific email-exists errors and display them in the email field
        if (error.message.includes('already exists') ||
            error.message.includes('already registered') ||
            error.message.includes('already in use')) {
          setErrors(prev => ({
            ...prev,
            email: error.message || 'This email is already registered. Please try signing in.',
            general: '', // Clear general error since we're showing it in the email field
          }));
        } else {
          // Other errors go to the general error field
          setErrors(prev => ({
            ...prev,
            general: error.message || 'Sign up failed. Please try again.',
          }));
        }
        return;
      }

      if (needsEmailVerification) {
        setPendingVerification(true);
        setVerificationMessage('Please check your email for a verification link to complete your registration.');
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

  // Handle Google sign up
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await googleSignIn();
      // The redirect will be handled by Supabase auth
    } catch (err) {
      console.error("Google sign up error:", err);
      setErrors(prev => ({
        ...prev,
        general: "Failed to sign up with Google. Please try again."
      }));
    } finally {
      setIsGoogleLoading(false);
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
            {pendingVerification ? 'Check Your Email' : 'Create Account'}
          </motion.h1>

          {!pendingVerification ? (
            <motion.div variants={itemVariants} className="space-y-4">
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

              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-gray-700"></div>
                <span className="px-3 text-sm text-gray-400">OR</span>
                <div className="flex-grow h-px bg-gray-700"></div>
              </div>

              <button
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="w-full bg-black-medium border border-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-black-light transition-colors duration-300 disabled:opacity-70 flex justify-center items-center"
              >
                {isGoogleLoading ? (
                  <span className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                      />
                    </svg>
                    Sign up with Google
                  </>
                )}
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
            <motion.div variants={itemVariants} className="text-center space-y-6">
              <div className="bg-black-light border border-gray-700 rounded-lg p-6">
                <p className="text-white text-lg mb-4">
                  {verificationMessage}
                </p>
                <p className="text-gray-400">
                  If you don't see it, check your spam folder or try signing in to verify automatically.
                </p>
              </div>

              <div>
                <Link href="/auth/signin">
                  <button className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
                    Back to Sign In
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}