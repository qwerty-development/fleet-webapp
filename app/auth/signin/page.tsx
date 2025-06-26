"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import AppleAuthHandler from "@/components/auth/AppleAuthHandler";

// Cross-browser compatible Google Auth component
const CrossBrowserGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Use Supabase's built-in Google OAuth which handles browser compatibility
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        console.error('Google auth error:', error);
        // Fallback to redirect method for better browser compatibility
        window.location.href = `${window.location.origin}/auth/google`;
      }
    } catch (err) {
      console.error('Google sign-in failed:', err);
      // Ultimate fallback - direct redirect
      window.location.href = `${window.location.origin}/auth/google`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      style={{ minHeight: '48px' }} // Ensure consistent height across browsers
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-gray-500"
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
      ) : (
        <>
          {/* Google Logo SVG - works in all browsers */}
          <svg
            className="w-5 h-5 mr-3"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium">Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default function SignInPage() {
  const { signIn } = useAuth();
  const { setGuestMode } = useGuestUser();
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Error states
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Check if we're on the error page with potential 405 error
    if (
      window.location.pathname === "/auth/signin" &&
      window.location.search.includes("next=")
    ) {
      // Detect if we have authentication cookies (more comprehensive check)
      const hasAuthCookie = document.cookie.split(";").some((cookie) => {
        const trimmedCookie = cookie.trim();
        return (
          trimmedCookie.startsWith("sb-") ||
          trimmedCookie.includes("supabase") ||
          trimmedCookie.includes("access_token")
        );
      });

      if (hasAuthCookie) {
        console.log(
          "Client-side failsafe: Detected authentication cookies, redirecting from signin page"
        );
        // Extract the intended destination from the next parameter
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get("next") || "/home";

        // Strip URL encoding if present
        const cleanDestination = nextPath.replace(/%2F/g, "/");

        // Use history API to replace current URL to avoid adding to browser history
        window.location.replace(cleanDestination);
      }
    }
  }, []);

  useEffect(() => {
    // Extract and handle error from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");

    if (errorParam) {
      // Map error codes to user-friendly messages
      const errorMessages: any = {
        authentication_failed:
          "Authentication with Apple failed. Please try again.",
        missing_credentials:
          "Authentication information was missing. Please try again.",
        default: "An error occurred during sign in. Please try again.",
      };

      // Set appropriate error message
      setError(errorMessages[errorParam] || errorMessages.default);

      // Clean up URL without error parameter (prevent showing errors after page refresh)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []);

  // Check if already signed in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setIsAuthenticated(true);

        // Get the 'next' parameter from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get("next") || "/home";

        router.push(nextPath);
      }
      setIsPageReady(true);
    };

    checkAuthStatus();
  }, [router]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  const onSignInPress = async () => {
    // Reset all error states
    setError("");
    setEmailError("");
    setPasswordError("");

    // Client-side validation
    let hasError = false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailAddress) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!emailRegex.test(emailAddress)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    // Add timeout for network issues
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Sign in timed out. Please check your connection and try again."
            )
          ),
        15000
      )
    );

    try {
      // Race against timeout
      const result = (await Promise.race([
        signIn({
          email: emailAddress,
          password,
        }),
        timeoutPromise,
      ])) as any;

      // Handle authentication response
      if (result.error) {
        // Route errors to appropriate fields based on type
        if (
          result.errorType === "email" ||
          result.errorType === "verification"
        ) {
          setEmailError(result.error.message || "Invalid email address.");
        } else if (result.errorType === "password") {
          setPasswordError(result.error.message || "Password is incorrect.");
        } else if (result.errorType === "credentials") {
          // With credential errors, we don't know if it's email or password
          // Set as general error instead of highlighting a specific field
          setError(result.error.message || "Invalid email or password.");
        } else {
          // For unknown errors, show general error message
          setError(
            result.error.message || "Authentication failed. Please try again."
          );
        }
        setIsLoading(false);
        return;
      }

      setTimeout(async () => {
        try {
          const { data } = await supabase.auth.getSession();

          if (data?.session) {
            // Set loading false before navigation
            setIsLoading(false);

            // Get the 'next' parameter from URL
            const params = new URLSearchParams(window.location.search);
            const nextPath = params.get("next") || "/home";

            // Implement robust navigation with fallback
            try {
              // Primary navigation method using the nextPath
              router.push(nextPath);

              // Fallback in case router.push doesn't trigger navigation
              setTimeout(() => {
                // Check if we're still on the signin page after attempt
                if (window.location.href.includes("/auth/signin")) {
                  console.log("Router navigation fallback triggered");
                  window.location.href = nextPath;
                }
              }, 1000);
            } catch (navError) {
              console.error("Navigation error:", navError);
              // Force navigation as last resort
              window.location.href = nextPath;
            }
          } else {
            setError(
              "Sign in successful but session not established. Please try again."
            );
            setIsLoading(false);
          }
        } catch (sessionError) {
          console.error("Session verification error:", sessionError);
          setError(
            "Sign in appeared successful but couldn't verify session. Please try again."
          );
          setIsLoading(false);
        }
      }, 500);
    } catch (err: any) {
      console.error("Sign in process error:", err);

      // Handle timeout errors specifically
      if (err.message && err.message.includes("timed out")) {
        setError(err.message);
      } else {
        setError(
          err.message || "An unexpected error occurred. Please try again."
        );
      }
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    setError("");

    try {
      const result = await setGuestMode(true);

      if (result) {
        // Get the 'next' parameter from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get("next") || "/home";

        // Use router instead of direct location change
        router.push(nextPath);
      } else {
        setError("Failed to activate guest mode. Please try again.");
      }
    } catch (err: any) {
      console.error("Guest mode error:", err);
      setError("Failed to continue as guest. Please try again.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Prevent showing the sign-in page if already authenticated
  if (isAuthenticated) {
    return null;
  }

  // Add a placeholder loading state to maintain consistent height
  if (!isPageReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md h-[500px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background animation - using static opacity to prevent layout shifts */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/10"
            style={{
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.15,
              filter: "blur(8px)",
              transform: `scale(${Math.random() * 0.5 + 0.5})`,
            }}
          />
        ))}
      </div>

      {/* Content container with fixed height minimum */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 container mx-auto px-4 py-16 max-w-md min-h-[500px] flex items-center"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-8 shadow-lg w-full"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold mb-6 text-center text-accent"
          >
            Sign In
          </motion.h1>

          {/* Cross-browser compatible Google Auth and Apple Auth */}
          <motion.div variants={itemVariants} className="min-h-[110px]">
            <CrossBrowserGoogleAuth />
            <AppleAuthHandler />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">OR</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* Error message area with minimum height to prevent layout shift */}
            <div className="min-h-[28px]">
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>

            {/* Email input with fixed error message space */}
            <div>
              <input
                type="email"
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800`}
                placeholder="Email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                disabled={isLoading || isGuestLoading}
              />
              <div className="min-h-[20px]">
                {emailError && (
                  <p className="mt-1 text-sm text-accent">{emailError}</p>
                )}
              </div>
            </div>

            {/* Password input with fixed error message space */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full px-4 py-3 bg-gray-50 border ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-800 pr-10`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGuestLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading || isGuestLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <div className="min-h-[20px]">
                {passwordError && (
                  <p className="mt-1 text-sm text-accent">{passwordError}</p>
                )}
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={onSignInPress}
              disabled={isLoading || isGuestLoading}
              className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
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
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Guest Mode Button */}
            <button
              onClick={handleGuestSignIn}
              disabled={isLoading || isGuestLoading}
              className="w-full border border-accent text-accent hover:bg-accent/10 font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70"
            >
              {isGuestLoading ? (
                <span className="flex justify-center items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent"
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
                  Loading...
                </span>
              ) : (
                "Continue as Guest"
              )}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-accent hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>

            <Link
              href="/auth/forgot-password"
              className="block mt-2 text-gray-600 hover:text-gray-900"
            >
              Forgot password?
            </Link>

            <div className="text-xs text-gray-500 mt-4">
              By using this service, you agree to our{" "}
              <Link href="/terms" className="text-accent hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}