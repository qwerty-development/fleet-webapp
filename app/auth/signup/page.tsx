// Your complete adapted SignUpPage with toggle between email and phone registration
"use client";

import React, { useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import AppleAuthHandler from "@/components/auth/AppleAuthHandler";

const CrossBrowserGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        console.error("Google auth error:", error);
        window.location.href = `${window.location.origin}/auth/google`;
      }
    } catch (err) {
      console.error("Google sign-up failed:", err);
      window.location.href = `${window.location.origin}/auth/google`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignUp}
      disabled={isLoading}
      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50"
    >
      {isLoading ? "Signing in..." : "Continue with Google"}
    </button>
  );
};

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/home");
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) return setError(error.message);
    setOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-accent mb-4">Sign Up</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button className={`px-4 py-2 rounded ${authMethod === 'email' ? 'bg-accent text-white' : 'bg-gray-200'}`} onClick={() => setAuthMethod('email')}>Email</button>
          <button className={`px-4 py-2 rounded ${authMethod === 'phone' ? 'bg-accent text-white' : 'bg-gray-200'}`} onClick={() => setAuthMethod('phone')}>Phone</button>
        </div>

        {authMethod === 'email' ? (
          <>
            <input placeholder="Full Name" className="w-full mb-3 px-4 py-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Email" className="w-full mb-3 px-4 py-2 border rounded" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password" className="w-full mb-4 px-4 py-2 border rounded" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleEmailSignup} className="w-full bg-accent text-white py-2 rounded">{loading ? 'Loading...' : 'Sign Up'}</button>
          </>
        ) : (
          <>
            {!otpSent ? (
              <>
                <input placeholder="Phone (+961...)" className="w-full mb-4 px-4 py-2 border rounded" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <button onClick={handleSendOtp} className="w-full bg-accent text-white py-2 rounded">{loading ? 'Sending...' : 'Send OTP'}</button>
              </>
            ) : (
              <>
                <input placeholder="Enter OTP" className="w-full mb-4 px-4 py-2 border rounded text-center tracking-widest" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button onClick={handleVerifyOtp} className="w-full bg-accent text-white py-2 rounded">{loading ? 'Verifying...' : 'Verify & Sign Up'}</button>
              </>
            )}
          </>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}

        <p className="mt-6 text-center text-sm">Already have an account? <Link href="/auth/signin" className="text-accent font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
