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
  signIn: (credentials: SignInCredentials) => Promise<{ error: Error | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: Error | null, needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (params: { currentPassword: string, newPassword: string }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  googleSignIn: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  updateUserRole: (userId: string, newRole: string) => Promise<{ error: Error | null }>;
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
  const { isGuest, clearGuestMode } = useGuestUser();
  const router = useRouter();

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

  // Google Sign In
  const googleSignIn = async () => {
    try {
      if (isGuest) {
        await clearGuestMode();
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // The OAuth sign-in process will redirect the user away from the current page
      // and eventually back to the callback URL, so we don't need to handle navigation here
    } catch (error) {
      console.error('Google sign in error:', error);
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

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
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

  // Update User Profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No user is signed in');

      // Update the user metadata in Supabase Auth if name is provided
      if (data.name) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: { name: data.name }
        });

        if (authUpdateError) {
          console.error('Error updating auth user metadata:', authUpdateError);
        }
      }

      // Update the profile in the database
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // Update the local profile state
      if (profile) {
        setProfile({ ...profile, ...data });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { error };
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
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        verifyOtp,
        googleSignIn,
        refreshSession,
        updateUserProfile,
        updateUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};