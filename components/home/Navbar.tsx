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
  const { user, profile, isSignedIn, signOut } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (isGuest) {
      await clearGuestMode();
    } else {
      await signOut();
    }
    router.push("/");
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
            {isSignedIn || isGuest ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-black-light"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="font-medium">
                    {isGuest
                      ? "Guest"
                      : profile?.name || user?.user_metadata?.name || "User"}
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
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-light hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
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
