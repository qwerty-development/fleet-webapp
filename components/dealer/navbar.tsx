"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ShoppingBagIcon,
  FilmIcon,
  UserIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  DocumentCurrencyDollarIcon
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  FilmIcon as FilmIconSolid,
  UserIcon as UserIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid
} from "@heroicons/react/24/solid";
import { useAuth } from "@/utils/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
  iconActive: React.ForwardRefExoticComponent<any>;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dealer",
    icon: HomeIcon,
    iconActive: HomeIconSolid
  },
  {
    name: "Inventory",
    href: "/dealer/inventory",
    icon: ShoppingBagIcon,
    iconActive: ShoppingBagIconSolid
  },
  {
    name: "Auto Clips",
    href: "/dealer/autoclips",
    icon: FilmIcon,
    iconActive: FilmIconSolid
  },
  {
    name: "Profile",
    href: "/dealer/profile",
    icon: UserIcon,
    iconActive: UserIconSolid
  },
  {
    name: "Analytics",
    href: "/dealer/analytics",
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid
  },
  {
    name: "Sales History",
    href: "/dealer/saleshistory",
    icon: CurrencyDollarIcon,
    iconActive: DocumentCurrencyDollarIcon
  },
];

const DealerNavbar: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { signOut } = useAuth();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/dealer') {
      return pathname === '/dealer';
    }
    return pathname.startsWith(href);
  };

  // Handle logout
  const handleLogout = async () => {
   try {


      // Use enhanced signOut with options
      await signOut({
        forceRedirect: false,
        redirectUrl: '/',
        clearAllData: true
      });
      // No manual navigation needed - handled by signOut function
    }
   catch (error) {
    console.error('Error during sign-out:', error);
    // Error is captured in signOutError state from AuthContext
  }
  };

  return (
    <>
      {/* Desktop Side Navigation */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-800">
            <Link href="/dealer" className="flex items-center">
              <img src="/logo.png" alt="Fleet Dealer Portal" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-white">Dealer Portal</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {active ? (
                    <item.iconActive className="h-5 w-5 mr-3" />
                  ) : (
                    <item.icon className="h-5 w-5 mr-3" />
                  )}
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 transition-all duration-200 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <Link href="/dealer" className="flex items-center">
            <img src="/logo.png" alt="Fleet Dealer" className="h-8 w-auto" />
            <span className="ml-2 text-lg font-bold text-white">Dealer</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-md"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <aside
        className={`lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 z-30 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {active ? (
                  <item.iconActive className="h-5 w-5 mr-3" />
                ) : (
                  <item.icon className="h-5 w-5 mr-3" />
                )}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 mt-6 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default DealerNavbar;