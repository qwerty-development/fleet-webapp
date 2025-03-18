'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { UserCircleIcon } from '@heroicons/react/24/outline';

// Dynamically import Navbar to avoid SSR issues with localStorage
const Navbar = dynamic(() => import('@/components/home/Navbar'), { ssr: false });

export default function ProfilePage() {
  const { user, profile, isLoaded, isSignedIn, updateUserProfile, signOut } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn && !isGuest) {
      router.push('/auth/signin');
    }
  }, [isLoaded, isSignedIn, isGuest, router]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setUpdateError('Name is required');
      return;
    }

    setUpdateLoading(true);
    setUpdateError('');
    setUpdateSuccess(false);

    try {
      // For guest users, we don't actually update anything
      if (isGuest) {
        // Simulate a successful update
        setTimeout(() => {
          setUpdateSuccess(true);
          setIsEditing(false);
          setUpdateLoading(false);
        }, 1000);
        return;
      }

      const { error } = await updateUserProfile({ name });

      if (error) {
        throw error;
      }

      setUpdateSuccess(true);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    if (isGuest) {
      await clearGuestMode();
    } else {
      await signOut();
    }
    router.push('/');
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black-light">
      <Navbar />

      <main className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-black-medium border border-gray-800 rounded-xl p-8 shadow-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-accent/20 flex items-center justify-center">
              <UserCircleIcon className="h-16 w-16 text-accent" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-8">
            {isGuest ? 'Guest Profile' : 'Your Profile'}
          </h1>

          {updateSuccess && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-lg mb-6">
              Profile updated successfully!
            </div>
          )}

          {updateError && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6">
              {updateError}
            </div>
          )}

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white"
                  placeholder="Your name"
                />
              ) : (
                <div className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg text-white">
                  {isGuest ? 'Guest User' : profile?.name || user?.user_metadata?.name || 'Not set'}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Email
              </label>
              <div className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg text-white">
                {isGuest ? 'guest@example.com' : profile?.email || user?.email || 'Not set'}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Account Type
              </label>
              <div className="w-full px-4 py-3 bg-black-light border border-gray-700 rounded-lg text-white">
                {isGuest ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-700 text-gray-300">
                    Guest
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${
                    profile?.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {profile?.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col space-y-4">
              {isEditing ? (
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateLoading}
                    className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:opacity-70 flex justify-center items-center"
                  >
                    {updateLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : "Save Profile"}
                  </button>

                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-transparent border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-black-light transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                    disabled={isGuest}
                  >
                    Edit Profile
                  </button>

                  {isGuest && (
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                    >
                      Create Account
                    </button>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full bg-transparent border border-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-black-light transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}