"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  BuildingOffice2Icon,
  VideoCameraIcon,
  HeartIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { useFavorites } from "@/utils/FavoritesContext";
import { GitCompare } from 'lucide-react';

const navItems = [
  { name: "Home", href: "/home", icon: HomeIcon },
  { name: "Dealerships", href: "/dealerships", icon: BuildingOffice2Icon },
  { name: "Autoclips", href: "/autoclips", icon: VideoCameraIcon },
  { name: "Favorites", href: "/favorites", icon: HeartIcon },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isSignedIn, signOut, isSigningOut, signOutError } =
    useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { favorites } = useFavorites();

const canCompare = !isGuest && favorites.length >= 2;

  const handleSignOut = async () => {
    try {
      // Close user menu when sign-out process begins
      setUserMenuOpen(false);
      setMobileMenuOpen(false);

      if (isGuest) {
        await clearGuestMode();
        router.push("/");
      } else {
        // Use enhanced signOut with options
        await signOut({
          forceRedirect: false,
          redirectUrl: "/",
          clearAllData: true,
        });
      }
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center h-16">
          {/* Logo - always visible but sized appropriately */}
          <div className="flex-none w-24 sm:w-32 lg:w-40">
            <Link href={"/"} className="flex items-center">
              <img
                src="/logo-dark.png"
                alt="CarApp Logo"
                className="h-6 w-auto sm:h-8 object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Centered with flex-1 */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <p
                      className={`flex items-center px-2 lg:px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-1" />
                      <span className="hidden sm:inline">{item.name}</span>
                    </p>
                  </Link>
                );
              })}
              {canCompare && (
                <Link href="/comparison">
                  <p
                    className={`flex items-center px-2 lg:px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                      pathname === "/comparison"
                        ? "bg-accent text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <GitCompare className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Compare</span>
                  </p>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button - push to right with ml-auto */}
          <div className="md:hidden ml-auto flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-accent hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-8 w-8" />
              ) : (
                <Bars3Icon className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* User Menu - Desktop - Fixed width to balance with logo */}
          <div className="hidden md:flex items-center justify-end flex-none w-24 sm:w-32 lg:w-40">
            {isSignedIn ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="font-medium text-sm lg:text-base max-w-[100px] lg:max-w-[150px] truncate">
                    {profile?.name || user?.user_metadata?.name || "User"}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white border border-gray-200 rounded-lg shadow-xl">
                    <Link
                      href="/favorites"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <HeartIcon className="h-5 w-5 mr-2" />
                      Favorites
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 mr-2" />
                      Profile
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="w-full">
                      {signOutError && (
                        <div className="mx-4 mb-2 text-xs text-red-500 bg-red-500/10 p-1 rounded border border-red-500/20 text-center">
                          Failed to sign out
                        </div>
                      )}
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center justify-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-70"
                      >
                        {isSigningOut ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
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
                            Signing Out...
                          </>
                        ) : (
                          "Sign Out"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isGuest ? (
              <Link
                href="/auth/signup"
                className="flex items-center px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              >
                Create Account
              </Link>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link
                  href="/auth/signin"
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-2 text-sm bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <p
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-accent text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </p>
                </Link>
              );
            })}
            
            {canCompare && (
              <Link 
                href="/comparison"
                onClick={() => setMobileMenuOpen(false)}
              >
                <p
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    pathname === "/comparison"
                      ? "bg-accent text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <GitCompare className="h-5 w-5 mr-3" />
                  Compare
                </p>
              </Link>
            )}
            
            {/* Mobile User Actions */}
            <div className="pt-4 border-t  border-gray-200">
              {isSignedIn ? (
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
  {/* User info */}
  <div className="flex items-center">
    <UserCircleIcon className="h-8 w-8 text-gray-700 mr-2" />
    <div>
      <p className="text-xs text-gray-500">Signed in as:</p>
      <p className="font-semibold text-gray-900 text-sm">
        {profile?.name || user?.user_metadata?.name || "User"}
      </p>
    </div>
  </div>

  {/* Sign out button */}
  <button
    onClick={handleSignOut}
    disabled={isSigningOut}
    className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors w-full sm:w-auto disabled:opacity-70"
  >
    {isSigningOut ? (
      <>
        <svg
          className="animate-spin mr-2 h-4 w-4 text-white"
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
        Signing Out...
      </>
    ) : (
      "Sign Out"
    )}
  </button>
</div>
              ) : isGuest ? (
                <Link
                  href="/auth/signup"
                  className="flex items-center justify-center mx-2 px-3 py-2 text-base font-medium bg-accent text-white rounded-md hover:bg-accent-dark"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-2">
                  <Link
                    href="/auth/signin"
                    className="flex items-center justify-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center px-3 py-2 text-base font-medium bg-accent text-white rounded-md hover:bg-accent-dark"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;