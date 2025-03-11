"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BuildingOffice2Icon,
  VideoCameraIcon,
  HeartIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { name: "Home", href: "/home", icon: HomeIcon },
  { name: "Dealerships", href: "/dealerships", icon: BuildingOffice2Icon },
  { name: "Autoclips", href: "/autoclips", icon: VideoCameraIcon },
  { name: "Favorites", href: "/favorites", icon: HeartIcon },
  { name: "Profile", href: "/profile", icon: UserCircleIcon },
];

const Navbar: React.FC = () => {
  const pathname = usePathname();

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
          {/* Navigation items - now takes up more space */}
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
          
          {/* Logo on the right */}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;