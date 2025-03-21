'use client';

// utils/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useGuestUser } from './GuestUserContext';

// Initialize Supabase client
const supabase = createClient();

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isSigningOut: boolean;
  signOutError: string | null;
  signIn: (credentials: SignInCredentials) => Promise<{ error: Error | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: Error | null, needsEmailVerification: boolean }>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (params: { currentPassword: string, newPassword: string }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  updateUserProfile: any;
  updateUserRole: (userId: string, newRole: string) => Promise<{ error: Error | null }>;
  signInWithIdToken: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  favorite: number[];
  last_active: string;
  timezone: string;
  is_guest?: boolean;
  role?: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  role?: string;
}

interface SignOutOptions {
  forceRedirect?: boolean;
  redirectUrl?: string;
  clearAllData?: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: {children: React.ReactNode}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { isGuest, clearGuestMode } = useGuestUser();
  const router = useRouter();

  // Helper to clear all auth-related local storage items
  const clearLocalStorage = () => {
    try {
      const authItemKeys = [
        'supabase.auth.token',
        'sb-refresh-token',
        'sb-access-token',
        'supabase.auth.refreshToken',
        'supabase.auth.expires_at',
        'supabase.auth.user'
      ];

      authItemKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key} from localStorage`, e);
        }
      });

      // Clear any items that match a pattern (handles version differences)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key} from localStorage`, e);
          }
        }
      });
    } catch (e) {
      console.warn('Failed to clear localStorage items', e);
    }
  };

  // Helper to clear authentication cookies
  const clearAuthCookies = () => {
    try {
      // Identify all potential auth-related cookies
      const cookiesToClear = document.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .filter(cookie =>
          cookie.startsWith('sb-') ||
          cookie.startsWith('supabase-auth-') ||
          cookie.includes('auth')
        );

      // Clear each cookie by setting expiration to past date
      cookiesToClear.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; SameSite=Lax`;
      });
    } catch (e) {
      console.warn('Failed to clear cookies', e);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    setIsLoaded(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change event:', event);

        if(event=='USER_UPDATED'){
          router.refresh();
          window.location.reload();
        }

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Get user profile from the users table
          if (currentSession.user && !isGuest) {
            await fetchUserProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
        }

        setIsLoaded(true);
      }
    );

    // Check for existing session on startup
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);

          if (session.user && !isGuest) {
            await fetchUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSession();

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [isGuest]);

  // Process OAuth user profile
  const processOAuthUser = async (session: Session): Promise<UserProfile | null> => {
    try {
      // Check if user exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // If user doesn't exist, create a new profile
      if (fetchError && fetchError.code === 'PGRST116') {
        // Extract user details from session
        const userName = session.user.user_metadata.full_name ||
                        session.user.user_metadata.name ||
                        'User';

        const newUser: Partial<UserProfile> = {
          id: session.user.id,
          name: userName,
          email: session.user.email || '',
          favorite: [],
          last_active: new Date().toISOString(),
          timezone: 'UTC',
          role: 'user', // Default role
        };

        // Use upsert instead of insert
        const { data: upsertedUser, error: upsertError } = await supabase
          .from('users')
          .upsert([newUser], {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (upsertError) {
          // Check if it's a constraint violation
          if (upsertError.code === '23505') {
            console.log('User already exists, retrieving existing record');

            // Retrieve the existing user record
            const { data: existingUser, error: getError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (getError) {
              console.error('Error retrieving existing user:', getError);
              return null;
            }

            return existingUser as UserProfile;
          } else {
            console.error('Error upserting user after OAuth:', upsertError);
            return null;
          }
        }

        // If user exists but doesn't have a role in auth metadata, add default role
        if (!session.user.user_metadata.role) {
          await supabase.auth.updateUser({
            data: { role: 'user' }
          });
        }

        return upsertedUser as UserProfile;
      } else if (fetchError) {
        // Handle other possible errors
        console.error('Error fetching user profile:', fetchError);
        return null;
      }

      // If user exists but doesn't have a role in auth metadata, add default role
      if (!session.user.user_metadata.role) {
        await supabase.auth.updateUser({
          data: { role: existingUser?.role || 'user' }
        });
      }

      return existingUser as UserProfile;
    } catch (error) {
      console.error('Error processing OAuth user:', error);
      return null;
    }
  };

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);

        // If user not found, try to get session and create profile
        if (error.code === 'PGRST116') {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            const createdProfile = await processOAuthUser(sessionData.session);
            if (createdProfile) {
              setProfile(createdProfile);
              return;
            }
          }
        }
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Improved implementation with better typing and error handling
  const signInWithIdToken = async ({
    provider,
    token
  }: {
    provider: 'google' | 'apple' | 'facebook',
    token: string
  }): Promise<{
    data: any,
    error: Error | null,
    errorType?: 'auth' | 'network' | 'unknown'
  }> => {
    try {
      if (!token || token.trim() === '') {
        return {
          data: null,
          error: new Error('Invalid authentication token'),
          errorType: 'auth'
        };
      }

      console.log(`Signing in with ${provider} ID token`);

      if (isGuest) {
        await clearGuestMode();
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider,
        token,
      });

      if (error) {
        console.error(`${provider} ID token sign-in error:`, error);

        // Categorize error types for better handling
        const errorType = error.message?.includes('network')
          ? 'network'
          : 'auth';

        return { data: null, error, errorType };
      }

      if (data?.user) {
        await fetchUserProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error(`${provider} ID token sign-in error:`, error);
      return { data: null, error, errorType: 'unknown' };
    }
  };

  // Email/Password Sign In
  const signIn = async ({ email, password }: SignInCredentials) => {
    try {
      if (isGuest) {
        await clearGuestMode();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error types with more user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        } else {
          throw error;
        }
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  // Sign Up
  const signUp = async ({ email, password, name, role = 'user' }: SignUpCredentials) => {
    try {
      if (isGuest) {
        await clearGuestMode();
      }

      // First, check if email already exists by attempting a passwordless sign-in
      const { error: emailCheckError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,  // Don't create a new user, just check if email exists
        }
      });

      // If there's no error with error code 'user-not-found', then the user exists
      if (!emailCheckError || (emailCheckError && emailCheckError.message !== 'User not found')) {
        return {
          error: new Error('An account with this email already exists. Please sign in instead.'),
          needsEmailVerification: false
        };
      }

      // Proceed with signup if email doesn't exist
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Handle specific error cases with clear messages
        if (error.message?.includes('already registered')) {
          return {
            error: new Error('An account with this email already exists. Please sign in instead.'),
            needsEmailVerification: false
          };
        }
        throw error;
      }

      // Create user in users table with the same ID
      if (data.user) {
        const { error: upsertError } = await supabase.from('users').upsert([{
          id: data.user.id,
          name: name,
          email: email,
          favorite: [],
          last_active: new Date().toISOString(),
          timezone: 'UTC',
          role: role,
        }], {
          onConflict: 'id',
          ignoreDuplicates: false
        });

        if (upsertError && upsertError.code !== '23505') {
          console.error('Error creating user profile:', upsertError);
        }
      }

      // Determine if email verification is needed
      const needsEmailVerification = data.session === null;

      return { error: null, needsEmailVerification };
    } catch (error: any) {
      console.error('Sign up error:', error);

      // Improve error messaging for specific cases
      if (error.message?.includes('already registered') ||
          error.message?.includes('already in use') ||
          error.message?.includes('already exists')) {
        return {
          error: new Error('An account with this email already exists. Please sign in instead.'),
          needsEmailVerification: false
        };
      }

      return { error, needsEmailVerification: false };
    }
  };

  // Enhanced Sign Out with better error handling and improved performance
  const signOut = async (options?: SignOutOptions) => {
    // Default options
    const defaultOptions = {
      forceRedirect: false,
      redirectUrl: '/',
      clearAllData: true
    };

    const opts = { ...defaultOptions, ...options };

    // Prevent multiple simultaneous sign-out attempts
    if (isSigningOut) {
      console.warn('Sign-out already in progress');
      return;
    }

    let signOutAttemptCompleted = false;
    let navigationAttempted = false;

    try {
      // Set loading state
      setIsSigningOut(true);
      setSignOutError(null);

      // Create a timeout promise to prevent hanging on network issues
      const timeoutId = setTimeout(() => {
        if (!signOutAttemptCompleted) {
          console.warn('Sign-out request timed out, proceeding with cleanup');
          throw new Error('Sign-out request timed out');
        }
      }, 5000);

      try {
        // Attempt Supabase sign-out
        await supabase.auth.signOut({ scope: opts.clearAllData ? 'global' : 'local' });
        console.log('Supabase sign-out successful');
      } catch (error) {
        console.error('Supabase sign-out API error:', error);
        // Continue with cleanup even if API call fails
      } finally {
        signOutAttemptCompleted = true;
        clearTimeout(timeoutId);
      }

      // Clear local state in specific order to prevent UI flashes
      setSession(null);
      setUser(null);
      setProfile(null);

      // Clean up storage and cookies
      if (opts.clearAllData) {
        clearLocalStorage();
        clearAuthCookies();
      }

      // Ensure there are no remnants by directly modifying Supabase internal state
      try {
        (supabase.auth as any).setSession(null);
        console.log('Successfully cleared Supabase internal session');
      } catch (e) {
        console.warn('Unable to directly clear Supabase session', e);
      }

      // Add a small delay before navigation to ensure clean-up completes
      if (typeof window !== 'undefined' && !navigationAttempted) {
        navigationAttempted = true;

        setTimeout(() => {
          try {
            if (opts.forceRedirect) {
              window.location.href = opts.redirectUrl;
            } else {
              router.push(opts.redirectUrl);
            }
            console.log('Navigation after sign-out successful');
          } catch (navError) {
            console.error('Navigation error after sign-out:', navError);
            // Last resort: force redirect
            window.location.href = opts.redirectUrl;
          }
        }, 100);
      }

    } catch (error) {
      console.error('Sign-out error:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unknown error occurred during sign-out';

      setSignOutError(errorMessage);

      // Fall back to manual clean-up on error
      setSession(null);
      setUser(null);
      setProfile(null);

      if (opts.clearAllData) {
        clearLocalStorage();
        clearAuthCookies();
      }

      // Force navigation as last resort if not already attempted
      if (!navigationAttempted && opts.forceRedirect && typeof window !== 'undefined') {
        window.location.href = opts.redirectUrl;
      }
    } finally {
      // Reset loading state after a minimum duration to prevent UI flicker
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.document.body) {
          setIsSigningOut(false);
        }
      }, 500);
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  // Update Password
  const updatePassword = async ({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      // Verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        console.error("Current password verification failed:", signInError);
        return { error: new Error("Current password is incorrect") };
      }

      // Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      window.location.reload();

      if (updateError) {
        console.error("Password update failed:", updateError);
        return { error: updateError };
      }

      console.log("Password updated successfully");
      return { error: null };
    } catch (error: any) {
      console.error("Update password error:", error);
      return { error };
    }
  };

  // Verify OTP for email verification
  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return { error };
    }
  };

  // Refresh Session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user is signed in');

      // Step 1: Log the update attempt for troubleshooting
      console.log('Profile update initiated:', {
        userId: user.id,
        updateData: data,
        timestamp: new Date().toISOString()
      });

      // Step 2: Update user metadata in Supabase Auth
      // This will automatically trigger the database sync to public.users table
      const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          name: data.name,  // Primary field used by the trigger
          full_name: data.name  // Backup field for compatibility
        }
      });

      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError);
        throw authUpdateError;
      }

      console.log('Auth user metadata successfully updated');

      // Step 3: Fetch the updated profile to verify changes and update local state
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
        throw fetchError;
      }

      // Step 4: Update the local profile state with the latest data
      if (profile) {
        setProfile(updatedProfile as UserProfile);
      }

      // Step 5: Return success response with updated data
      return {
        error: null,
        data: updatedProfile
      };

    } catch (error: any) {
      // Step 6: Error handling
      console.error('Profile update failed:', error);

      // Provide a more specific error message if available
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }

      return {
        error: {
          original: error,
          message: errorMessage
        }
      };
    }
  };

  // Update User Role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Update role in users table for consistency
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (dbError) throw dbError;

      // If updating the current user, reflect changes locally
      if (user && userId === user.id) {
        const updatedUser = { ...user };
        updatedUser.user_metadata = {
          ...updatedUser.user_metadata,
          role: newRole
        };
        setUser(updatedUser);

        if (profile) {
          setProfile({ ...profile, role: newRole });
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoaded,
        isSignedIn: !!user,
        isSigningOut,
        signOutError,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        verifyOtp,
        refreshSession,
        updateUserProfile,
        updateUserRole,
        signInWithIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};