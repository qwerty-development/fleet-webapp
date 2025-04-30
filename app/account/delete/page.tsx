'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Get the current user
  useEffect(() => {
    async function getUser() {
      setIsLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setError('Authentication error. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      if (!session) {
        // Not authenticated, redirect to sign in
        router.push('/auth/signin?next=/account/delete');
        return;
      }
      
      setUser(session.user);
      setIsLoading(false);
    }
    
    getUser();
  }, [router]);

  // Countdown timer for redirect after successful deletion
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push('/');
    }
  }, [success, countdown, router]);

  // Handle deletion confirmation
  const handleContinue = () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    
    setError('');
    setStep(2);
  };

  // Execute account deletion via API
  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      // Call the API route to delete the account
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed as we'll get the user ID from the session
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      
      // Successfully deleted
      setSuccess(true);
      
      // Sign out the user after deletion
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Error in account deletion:', error);
      setError(error.message || 'An error occurred during account deletion. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If still loading user data, show spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black-light flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
      
        
        {/* Card Content */}
        <div className="bg-black-medium border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-900/50 to-red-800/20 p-6 border-b border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-red-500/10 rounded-full mr-4">
                <TrashIcon className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Delete Account</h1>
                <p className="text-gray-400">
                  {success 
                    ? 'Account deletion successful' 
                    : 'This action cannot be undone'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-6">
            {/* Success State */}
            {success ? (
              <div className="text-center py-6">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Account Deleted Successfully</h2>
                <p className="text-gray-400 mb-6">Your account and all associated data have been permanently removed.</p>
                <p className="text-gray-500">
                  Redirecting in <span className="text-white font-bold">{countdown}</span> seconds...
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-6 w-full py-3 rounded-lg bg-accent hover:bg-accent-dark transition-colors text-white font-medium"
                >
                  Return to Home
                </button>
              </div>
            ) : step === 1 ? (
              <div>
                {/* Warning Message */}
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5 mr-3" />
                    <div>
                      <p className="text-white font-semibold">Warning: This action cannot be undone</p>
                      <p className="text-gray-300 text-sm mt-1">
                        Deleting your account will permanently remove all your data, including your profile information, 
                        favorites, and settings. This action is irreversible.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                {/* Delete Confirmation Input */}
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-1">Type DELETE to confirm</label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full p-3 bg-black-light border border-gray-700 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white"
                    placeholder="Type DELETE"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <Link
                    href="/profile"
                    className="flex-1 p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-black-light transition-colors text-center"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleContinue}
                    disabled={confirmText !== "DELETE"}
                    className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-red-900/50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Final Warning */}
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5 mr-3" />
                    <div>
                      <p className="text-white font-semibold">Final Confirmation</p>
                      <p className="text-gray-300 text-sm mt-1">
                        Are you absolutely sure you want to delete your account? All your data will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Account Information */}
                <div className="bg-black-light p-4 rounded-lg border border-gray-800 mb-4">
                  <p className="text-gray-400 text-sm">Account being deleted:</p>
                  <p className="text-white font-medium">{user?.email}</p>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isDeleting}
                    className="flex-1 p-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-black-light transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : "Delete Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}