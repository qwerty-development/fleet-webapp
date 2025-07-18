"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Form states
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  // UI states
  const [stage, setStage] = useState("request"); // 'request' or 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Validation states
  const [errors, setErrors] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  // Real-time validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [confirmValid, setConfirmValid] = useState<boolean | null>(null);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  const stageVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  // Real-time validation effects
  useEffect(() => {
    if (emailAddress.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailValid(emailRegex.test(emailAddress));
    } else {
      setEmailValid(null);
    }
  }, [emailAddress]);

  useEffect(() => {
    if (password.length > 0) {
      setPasswordValid(password.length >= 8);
    } else {
      setPasswordValid(null);
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setConfirmValid(password === confirmPassword && password.length >= 8);
    } else {
      setConfirmValid(null);
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    if (code.length > 0) {
      setCodeValid(code.length >= 6);
    } else {
      setCodeValid(null);
    }
  }, [code]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Clear errors when switching stages
  const clearErrors = () => {
    setError("");
    setErrors({
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
    });
  };

  // Validate form fields
  const validateInputs = (formStage: string) => {
    let isValid = true;
    const newErrors = {
      email: "",
      code: "",
      password: "",
      confirmPassword: "",
    };

    if (formStage === "request") {
      if (!emailAddress.trim()) {
        newErrors.email = "Email is required";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
        newErrors.email = "Invalid email format";
        isValid = false;
      }
    } else if (formStage === "reset") {
      if (!code.trim()) {
        newErrors.code = "Verification code is required";
        isValid = false;
      } else if (code.length < 6) {
        newErrors.code = "Verification code must be at least 6 characters";
        isValid = false;
      }

      if (!password) {
        newErrors.password = "Password is required";
        isValid = false;
      } else if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
        isValid = false;
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle request password reset
  const handleRequestReset = async () => {
    if (!validateInputs("request")) return;

    setIsLoading(true);
    clearErrors();

    try {
      const { error } = await resetPassword(emailAddress);

      if (error) throw error;

      setSuccessMessage(
        `Verification code sent to ${emailAddress}. Please check your email.`
      );
      setStage("reset");
    } catch (error:any) {
      console.error("Error requesting password reset:", error);
      setError(
        error.message || "Failed to request password reset. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password with verification code
  const handleResetPassword = async () => {
    if (!validateInputs("reset")) return;

    setIsLoading(true);
    clearErrors();

    try {
      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: emailAddress,
        token: code,
        type: "recovery",
      });

      if (verifyError) {
        if (verifyError.message.includes("invalid") || verifyError.message.includes("expired")) {
          setErrors(prev => ({ ...prev, code: "Invalid or expired verification code" }));
        } else {
          throw verifyError;
        }
        return;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccessMessage("Your password has been reset successfully!");

      // Redirect to sign in page after a short delay
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (error:any) {
      console.error("Error resetting password:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to email stage
  const handleBackToEmail = () => {
    setStage("request");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    clearErrors();
    setSuccessMessage("");
  };

  // Get validation indicator color
  const getValidationColor = (isValid: boolean | null) => {
    if (isValid === null) return "border-gray-300";
    return isValid ? "border-green-500" : "border-red-500";
  };

  // Get validation icon
  const getValidationIcon = (isValid: boolean | null) => {
    if (isValid === null) return null;
    return (
      <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
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
                `${Math.random() * 100}%`,
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
          className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-8 shadow-lg"
        >
          {/* Header */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold mb-3 text-center text-accent"
          >
            Reset Password
          </motion.h1>

          {/* Success message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center text-sm"
              >
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <div className="min-h-[28px] mb-2">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm text-center">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Stage Content */}
          <AnimatePresence mode="wait">
            {stage === "request" ? (
              <motion.div
                key="request"
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 text-center mb-6"
                >
                  Enter your email to receive a verification code.
                </motion.p>

                {/* Email input */}
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      className={`w-full px-4 py-3 bg-gray-50 border ${getValidationColor(emailValid)} rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800 pr-10`}
                      placeholder="Email Address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      disabled={isLoading}
                    />
                    {emailValid !== null && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getValidationIcon(emailValid)}
                      </div>
                    )}
                  </div>
                  <div className="min-h-[20px]">
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleRequestReset}
                  disabled={isLoading || !emailValid}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex justify-center items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="reset"
                variants={stageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 text-center mb-6"
                >
                  Enter the verification code sent to{" "}
                  <span className="font-medium text-gray-800">{emailAddress}</span>
                </motion.p>

                {/* Verification Code input */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full px-4 py-3 bg-gray-50 border ${getValidationColor(codeValid)} rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800 text-center text-lg font-mono tracking-widest pr-10`}
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength={6}
                      disabled={isLoading}
                    />
                    {codeValid !== null && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getValidationIcon(codeValid)}
                      </div>
                    )}
                  </div>
                  <div className="min-h-[20px]">
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>
                </div>

                {/* New Password input */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full px-4 py-3 bg-gray-50 border ${getValidationColor(passwordValid)} rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800 pr-20`}
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      {passwordValid !== null && getValidationIcon(passwordValid)}
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="min-h-[20px]">
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* Confirm Password input */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full px-4 py-3 bg-gray-50 border ${getValidationColor(confirmValid)} rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800 pr-20`}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      {confirmValid !== null && getValidationIcon(confirmValid)}
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="min-h-[20px]">
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Security note */}
                <p className="text-xs text-gray-500 text-center">
                  The verification code is valid for 30 minutes.
                </p>

                {/* Reset Password Button */}
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading || !codeValid || !passwordValid || !confirmValid}
                  className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex justify-center items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {/* Back to Email button */}
                <button
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                  className="w-full mt-2 text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200 disabled:opacity-50"
                >
                  <span className="flex items-center justify-center">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Email Entry
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="flex items-center justify-center">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Sign In
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}