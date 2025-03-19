'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useGuestUser } from '@/utils/GuestUserContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  BellIcon,
  BellSlashIcon,
  CameraIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Dynamically import Navbar to avoid SSR issues with localStorage
const Navbar = dynamic(() => import('@/components/home/Navbar'), { ssr: false });

// Default profile image
const DEFAULT_PROFILE_IMAGE = "";

// Support contact information
const WHATSAPP_NUMBER = "81972024";
const SUPPORT_EMAIL = "support@example.com";
const EMAIL_SUBJECT = "Support Request";

// Notification settings type
interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  marketingUpdates: boolean;
  newCarAlerts: boolean;
}

export default function ProfilePage() {
  const { user, profile, isLoaded, isSignedIn, updateUserProfile, updatePassword, signOut } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const router = useRouter();
  const supabase = createClient();

  // State for profile information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_PROFILE_IMAGE);

  // Modal states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangePasswordMode, setIsChangePasswordMode] = useState(false);
  const [isSecuritySettingsVisible, setIsSecuritySettingsVisible] = useState(false);
  const [isNotificationSettingsVisible, setIsNotificationSettingsVisible] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
const [passwordSuccess, setPasswordSuccess] = useState('');
const [passwordError, setPasswordError] = useState('');

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    marketingUpdates: false,
    newCarAlerts: true,
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Initialize profile data
  useEffect(() => {
    if (user && profile && !isGuest) {
      // Extract first and last name from full name in profile
      const nameParts = profile.name ? profile.name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(' ') || "");
      setEmail(profile.email || user.email || "");

      // Set avatar URL if available in user metadata
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
    } else if (isGuest) {
      setFirstName("Guest");
      setLastName("User");
      setEmail("guest@example.com");
      setAvatarUrl(DEFAULT_PROFILE_IMAGE);
    }
  }, [user, profile, isGuest]);

  // Handler for profile update
const handleUpdateProfile = async () => {
  if (isGuest) return;

  setIsLoading(true);
  setUpdateError('');
  setUpdateSuccess(false);

  try {
    // Create full name from first and last name
    const fullName = `${firstName} ${lastName}`.trim();

    // Update user profile
    const { error } = await updateUserProfile({
      name: fullName
    });

    // Check for error in the returned object
    if (error) {
      // Extract the error message from the returned error object
      throw error;
    }

    setUpdateSuccess(true);
    setIsEditMode(false);

    // Reset success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    // Handle both direct errors and error objects
    setUpdateError(error.message || (error.error?.message) || 'Failed to update profile. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  // Handler for changing password
const handleChangePassword = async () => {
  if (isGuest) return;

  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }

  if (newPassword.length < 8) {
    setPasswordError("Password must be at least 8 characters long.");
    return;
  }

  setIsPasswordLoading(true);
  setPasswordError('');
  setPasswordSuccess('');

  try {
    const { error } = await updatePassword({ currentPassword, newPassword });
    console.log("updatePassword returned:", error);

    if (error) throw error;

    setPasswordSuccess("Password updated successfully.");
    // Clear password fields on success
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    // Ensure loading state is reset before closing modal
    setIsPasswordLoading(false);

    // Auto-close modal after a short delay
    setTimeout(() => {
      setIsChangePasswordMode(false);
      setPasswordSuccess('');
    }, 2000);
  } catch (error: any) {
    console.error("Error in handleChangePassword:", error);
    setPasswordError(
      error.message ||
      (error.error?.message) ||
      "Failed to change password. Please try again."
    );
    // Always reset loading state in error case
    setIsPasswordLoading(false);
  }
  // Remove the finally block since we're handling both success and error cases explicitly
};

  // Handler for profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGuest) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageUploading(true);

    try {
      // Upload to Supabase Storage
      const fileName = `avatar-${user?.id}-${Date.now()}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData?.publicUrl;

      if (avatarUrl) {
        // Update user metadata with new avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl }
        });

        if (updateError) throw updateError;

        // Update local state
        setAvatarUrl(avatarUrl);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUpdateError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsImageUploading(false);
    }
  };

  // Handler for toggling notification settings
  const toggleNotification = (key: keyof NotificationSettings) => {
    if (isGuest) return;

    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handler for sign out
  const handleSignOut = async () => {
    if (isGuest) {
      await clearGuestMode();
    } else {
      await signOut();
    }

    router.push('/');
  };

  // Handler for guest to sign in
  const handleSignIn = () => {
    clearGuestMode();
    router.push('/auth/signin');
  };

  // Handler for contacting support via WhatsApp
  const handleWhatsAppSupport = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  // Handler for contacting support via email
  const handleEmailSupport = () => {
    const subject = encodeURIComponent(EMAIL_SUBJECT);
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}`, '_blank');
  };

  // If still loading, show a spinner
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

      {/* Guest Mode Overlay */}
      {isGuest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-accent text-white p-8 rounded-xl max-w-md mx-4 shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <LockClosedIcon className="h-16 w-16 mb-4" />
              <h2 className="text-2xl font-bold mb-2">You're browsing as a guest</h2>
              <p className="mb-6">Please sign in to access and manage your profile.</p>
              <button
                onClick={handleSignIn}
                className="bg-white text-accent font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/')}
                className="mt-4 text-white hover:text-white"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <main className="container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-b from-accent to-accent-dark rounded-3xl overflow-hidden mb-8">
            <div className="p-8 pb-16 text-center">
              {/* Avatar and Upload Button */}
              <div className="relative inline-block mb-6">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white/20 bg-gray-800">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="object-cover h-full w-full"
                  />
                </div>

                {!isGuest && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-white/90 p-2 rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors"
                  >
                    <CameraIcon className="h-5 w-5 text-accent" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isImageUploading}
                    />
                  </label>
                )}


              </div>

              <h1 className="text-2xl font-bold text-white">
                {isGuest ? "Guest User" : `${firstName} ${lastName}`}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {isGuest ? "" : email}
              </p>
            </div>
          </div>

          {/* Success message */}
          {updateSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-lg mb-6"
            >
              Your changes have been saved successfully.
            </motion.div>
          )}

          {/* Error message */}
          {updateError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6"
            >
              {updateError}
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Profile Actions Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wider ml-2">Account Management</h2>

              {/* Edit Profile Button */}
              <button
                onClick={() => !isGuest && setIsEditMode(true)}
                className={`w-full flex items-center p-4 rounded-xl transition-colors ${
                  isGuest
                    ? "bg-black-light border border-gray-800 opacity-75"
                    : "bg-black-medium border border-gray-800 hover:border-accent"
                }`}
              >
                <div className="p-3 bg-accent/10 rounded-xl">
                  <UserCircleIcon className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-medium text-white">Edit Profile</p>
                  <p className="text-sm text-gray-400">
                    {isGuest ? "Sign in to edit your profile" : "Update your personal information"}
                  </p>
                </div>
                <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-500" />
              </button>

              {/* Security Settings Button */}
              <button
                onClick={() => !isGuest && setIsSecuritySettingsVisible(true)}
                className={`w-full flex items-center p-4 rounded-xl transition-colors ${
                  isGuest
                    ? "bg-black-light border border-gray-800 opacity-75"
                    : "bg-black-medium border border-gray-800 hover:border-accent"
                }`}
              >
                <div className="p-3 bg-accent/10 rounded-xl">
                  <ShieldCheckIcon className="h-6 w-6 text-accent" />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-medium text-white">Security</p>
                  <p className="text-sm text-gray-400">
                    {isGuest ? "Sign in to access security settings" : "Password and privacy settings"}
                  </p>
                </div>
                <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-500" />
              </button>


            </div>

            {/* Support Section */}
            <div className="space-y-4 mt-6">
              <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wider ml-2">Support & Help</h2>

              {/* WhatsApp Support Button */}
              <button
                onClick={handleWhatsAppSupport}
                className="w-full flex items-center p-4 rounded-xl bg-black-medium border border-gray-800 hover:border-green-500 transition-colors"
              >
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-medium text-white">WhatsApp Support</p>
                  <p className="text-sm text-gray-400">Available 24/7</p>
                </div>
                <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-500" />
              </button>

              {/* Email Support Button */}
              <button
                onClick={handleEmailSupport}
                className="w-full flex items-center p-4 rounded-xl bg-black-medium border border-gray-800 hover:border-blue-500 transition-colors"
              >
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <EnvelopeIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-medium text-white">Email Support</p>
                  <p className="text-sm text-gray-400">Detailed inquiries</p>
                </div>
                <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Sign Out Button (Only show for non-guest users) */}
            {!isGuest && (
              <button
                onClick={handleSignOut}
                className="w-full mt-8 p-4 border border-accent text-accent hover:bg-accent/10 font-medium rounded-xl transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black-medium border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-3 bg-black-light border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-white"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-3 bg-black-light border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-white"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full p-3 bg-black-light/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                    placeholder="Email"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="flex-1 p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-black-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="flex-1 p-3 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Settings Modal */}
      <AnimatePresence>
        {isSecuritySettingsVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black-medium border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Security & Privacy</h2>
                <button
                  onClick={() => setIsSecuritySettingsVisible(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setIsSecuritySettingsVisible(false);
                    setIsChangePasswordMode(true);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-black-light hover:bg-black-light/80 transition-colors"
                >
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                    <span className="ml-3 text-white">Change Password</span>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </button>

                <button
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-black-light hover:bg-black-light/80 transition-colors"
                >
                  <div className="flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                    <span className="ml-3 text-white">Privacy Policy</span>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </button>

                <button
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-black-light hover:bg-black-light/80 transition-colors"
                >
                  <div className="flex items-center">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    <span className="ml-3 text-white">Account Security</span>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <button
                onClick={() => setIsSecuritySettingsVisible(false)}
                className="w-full mt-6 p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-black-light transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

<AnimatePresence>
  {isChangePasswordMode && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-black-medium border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Change Password</h2>
          <button
            onClick={() => setIsChangePasswordMode(false)}
            className="text-gray-400 hover:text-white"
            disabled={isPasswordLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Inline feedback messages */}
        {passwordSuccess && (
          <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-lg mb-4">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
            {passwordError}
          </div>
        )}

        <div className="space-y-4">
          {/* Current Password Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isPasswordLoading}
                className="w-full p-3 pr-10 bg-black-light border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-white"
                placeholder="Current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                disabled={isPasswordLoading}
              >
                {showCurrentPassword ? (
                  // SVG icon for visible password
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                ) : (
                  // SVG icon for hidden password
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                )}
              </button>
            </div>
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPasswordLoading}
                className="w-full p-3 pr-10 bg-black-light border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-white"
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                disabled={isPasswordLoading}
              >
                {showNewPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
          </div>

          {/* Confirm New Password Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPasswordLoading}
                className="w-full p-3 pr-10 bg-black-light border border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent text-white"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                disabled={isPasswordLoading}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" /* ... */></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setIsChangePasswordMode(false)}
            disabled={isPasswordLoading}
            className="flex-1 p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-black-light transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={isPasswordLoading}
            className="flex-1 p-3 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isPasswordLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {isNotificationSettingsVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black-medium border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Notification Settings</h2>
                <button
                  onClick={() => setIsNotificationSettingsVisible(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {(Object.keys(notificationSettings) as Array<keyof NotificationSettings>).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-black-light rounded-lg"
                  >
                    <div className="flex items-center">
                      {notificationSettings[key] ? (
                        <BellIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <BellSlashIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="ml-3 text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleNotification(key)}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                        notificationSettings[key] ? 'bg-accent justify-end' : 'bg-gray-700 justify-start'
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-full mx-0.5 ${
                        notificationSettings[key] ? 'bg-white' : 'bg-gray-400'
                      }`}></span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsNotificationSettingsVisible(false)}
                className="w-full mt-6 p-3 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}