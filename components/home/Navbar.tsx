"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, BuildingOffice2Icon, VideoCameraIcon, HeartIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";

const navItems = [
  { name: "Home", href: "/home", icon: HomeIcon },
  { name: "Dealerships", href: "/dealerships", icon: BuildingOffice2Icon },
  { name: "Autoclips", href: "/autoclips", icon: VideoCameraIcon },
  { name: "Favorites", href: "/favorites", icon: HeartIcon },
  { name: "Profile", href: "/profile", icon: UserCircleIcon },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
const { user, profile, isSignedIn, signOut, isSigningOut, signOutError } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

const handleSignOut = async () => {
  try {
    // Close user menu when sign-out process begins
    setUserMenuOpen(false);

    if (isGuest) {
      await clearGuestMode();
      router.push("/");
    } else {
      // Use enhanced signOut with options
      await signOut({
        forceRedirect: false,
        redirectUrl: '/',
        clearAllData: true
      });
      // No manual navigation needed - handled by signOut function
    }
  } catch (error) {
    console.error('Error during sign-out:', error);
    // Error is captured in signOutError state from AuthContext
  }
};

  return (
    <nav className="bg-black dark:bg-neutral-900 shadow-md fixed top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex-shrink-0 ml-4">
            <Link href={"/"}>
              <img
                src="/logo.png"
                alt="CarApp Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>
          {/* Navigation items */}
          <div className="flex items-center justify-center flex-1 space-x-4 md:space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <p
                    className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
                      isActive
                        ? "bg-accent text-white"
                        : "text-white dark:text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </p>
                </Link>
              );
            })}
          </div>
          {/* User Menu */}

<div className="hidden md:flex items-center">
  {isSignedIn ? (

    <div className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-black-light"
      >
        <UserCircleIcon className="h-6 w-6" />
        <span className="font-medium">
          {profile?.name || user?.user_metadata?.name || "User"}
        </span>
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-black-medium border border-gray-700 rounded-lg shadow-xl">
          <Link
            href="/favorites"
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-light hover:text-white transition-colors"
          >
            <HeartIcon className="h-5 w-5 mr-2" />
            Favorites
          </Link>
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-light hover:text-white transition-colors"
          >
            <UserCircleIcon className="h-5 w-5 mr-2" />
            Profile
          </Link>
          <div className="border-t border-gray-700 my-1"></div>
          <div className="w-full">
  {signOutError && (
    <div className="mx-4 mb-2 text-xs text-red-500 bg-red-500/10 p-1 rounded border border-red-500/20 text-center">
      Failed to sign out
    </div>
  )}
  <button
    onClick={handleSignOut}
    disabled={isSigningOut}
    className="flex w-full items-center justify-center px-4 py-2 text-sm text-gray-300 hover:bg-black-light hover:text-white transition-colors disabled:opacity-70"
  >
    {isSigningOut ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing Out...
      </>
    ) : "Sign Out"}
  </button>
</div>
        </div>
      )}
    </div>
  ) : isGuest ? (
    // GUEST USER MENU - Limited menu for guest users
    <div className="relative">
      <Link
            href="/auth/signup"
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-light hover:text-white transition-colors"
          >
            <UserCircleIcon className="h-5 w-5 mr-2" />
            Create Account
          </Link>

    </div>
  ) : (
    // NOT SIGNED IN - Sign in/up buttons
    <div className="flex items-center space-x-4">
      <Link
        href="/auth/signin"
        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors"
      >
        Sign Up
      </Link>
    </div>
  )}
</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
