"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  VideoCameraIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon,
  SparklesIcon,
  PhotoIcon,
  RectangleGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ListBulletIcon as ListBulletIcon,
  VideoCameraIcon as VideoCameraIconSolid,
  BellIcon as BellIconSolid,
  RectangleGroupIcon as RectangleGroupIconSolid,
} from "@heroicons/react/24/solid";

import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { createClient } from "@/utils/supabase/client";
import { CarIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
  iconActive: React.ForwardRefExoticComponent<any>;
  badge?: "pending" | "notification_count";
  description?: string;
}

// UPDATED: Navigation items with Notifications integration
const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    description: "Overview and metrics",
  },
  {
    name: "Listings",
    href: "/admin/listings",
    icon: ShoppingBagIcon,
    iconActive: ShoppingBagIconSolid,
    description: "Manage car listings",
  },
  {
    name: "Add Listing",
    href: "/admin/add-listing",
    icon: PlusIcon, // Start using PlusIcon since it's generic
    iconActive: PlusIcon,
    description: "Create a new car, rental, or plate listing",
  },
  {
    name: "AutoClip Review",
    href: "/admin/autoclips",
    icon: VideoCameraIcon,
    iconActive: VideoCameraIconSolid,
    badge: "pending",
    description: "Review video submissions",
  },
  {
    name: "Create AutoClip",
    href: "/admin/create-autoclips",
    icon: VideoCameraIcon,
    iconActive: VideoCameraIconSolid,
    description: "Create autoclips for dealerships",
  },
  {
    name: "Send Notifications",
    href: "/admin/notifications",
    icon: BellIcon,
    iconActive: BellIconSolid,
    badge: "notification_count",
    description: "Send notifications to dealerships",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: UserGroupIcon,
    iconActive: UserGroupIconSolid,
    description: "Manage user accounts",
  },
  {
    name: "Dealerships",
    href: "/admin/dealerships",
    icon: BuildingOfficeIcon,
    iconActive: BuildingOfficeIconSolid,
    description: "Manage dealership profiles",
  },
  {
    name: "Brands and Models",
    href: "/admin/allcars",
    icon: ListBulletIcon,
    iconActive: ListBulletIcon,
    description: "Manage vehicle catalog",
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid,
    description: "View platform metrics",
  },
  {
    name: "Banners",
    href: "/admin/banners",
    icon: PhotoIcon,
    iconActive: PhotoIcon,
    description: "Manage promotional banners",
  },
  {
    name: "Ad Banners",
    href: "/admin/ad-banners",
    icon: RectangleGroupIcon,
    iconActive: RectangleGroupIconSolid,
    description: "Manage advertisement banners",
  },
  {
    name: "Celebrate",
    href: "/admin/live-stats",
    icon: SparklesIcon,
    iconActive: SparklesIcon,
    description: "View platform metrics",
  },
];

const AdminNavbar: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const { signOut, isSigningOut, signOutError } = useAuth();
  const { isGuest, clearGuestMode } = useGuestUser();

  // STATE: AutoClip review tracking
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  
  // UPDATED: Add notification tracking
  const [notificationStats, setNotificationStats] = useState({
    sent_today: 0,
    active_dealerships: 0,
  });
  
  const supabase = createClient();

  // UPDATED: Initialize both pending review count and notification stats
  useEffect(() => {
    fetchPendingReviewCount();
    fetchNotificationStats();
    
    // RULE: Set up real-time subscription for pending count updates
    const subscription = supabase
      .channel('autoclip_reviews_navbar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auto_clips',
          filter: 'status=eq.under_review'
        },
        () => {
          fetchPendingReviewCount();
        }
      )
      .subscribe();

    // UPDATED: Set up subscription for notification stats
    const notificationSubscription = supabase
      .channel('notification_logs_navbar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_admin_logs'
        },
        () => {
          fetchNotificationStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  }, []);

  // METHOD: Fetch current pending review count
  const fetchPendingReviewCount = async () => {
    try {
      const { count, error } = await supabase
        .from('auto_clips')
        .select('id', { count: 'exact' })
        .eq('status', 'under_review');

      if (error) {
        console.error('Error fetching pending review count:', error);
        setPendingReviewCount(0);
      } else {
        setPendingReviewCount(count || 0);
      }
    } catch (error) {
      console.error('Error in fetchPendingReviewCount:', error);
      setPendingReviewCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  };

  // UPDATED: Fetch notification stats
  const fetchNotificationStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISOString = today.toISOString();

      const [
        { count: sentTodayCount },
        { count: activeDealershipsCount }
      ] = await Promise.all([
        supabase.from('notification_admin_logs').select('id', { count: 'exact' }).gte('created_at', todayISOString),
        supabase.from('dealerships').select('id', { count: 'exact' }).gte('subscription_end_date', new Date().toISOString().split('T')[0])
      ]);

      setNotificationStats({
        sent_today: sentTodayCount || 0,
        active_dealerships: activeDealershipsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      setNotificationStats({
        sent_today: 0,
        active_dealerships: 0,
      });
    }
  };

  const handleSignOut = async () => {
    try {
      // Use enhanced signOut with options
      await signOut({
        forceRedirect: false,
        redirectUrl: "/",
        clearAllData: true,
      });
      // No manual navigation needed - handled by signOut function
    } catch (error) {
      console.error("Error during sign-out:", error);
      // Error is captured in signOutError state from AuthContext
    }
  };

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
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  // UPDATED: Navigation badge for pending items and notification stats
  const NavigationBadge = ({ item }: { item: NavItem }) => {
    if (item.badge === "pending" && pendingReviewCount > 0) {
      return (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-5 flex items-center justify-center px-1.5 shadow-sm">
          {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
        </div>
      );
    }
    
 
    
    return null;
  };

  // COMPONENT: Urgency indicator for high pending counts
  const UrgencyIndicator = ({ item }: { item: NavItem }) => {
    if (item.badge === "pending" && pendingReviewCount > 5) {
      return (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      );
    }
    return null;
  };

  // COMPONENT: Enhanced navigation item with badge support
  const NavItemComponent = ({ 
    item, 
    isMobile = false 
  }: { 
    item: NavItem; 
    isMobile?: boolean; 
  }) => {
    const active = isActive(item.href);
    const hasPendingBadge = item.badge === "pending" && pendingReviewCount > 0;
    const hasNotificationBadge = item.badge === "notification_count" && notificationStats.active_dealerships > 0;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`relative flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
          active
            ? "bg-accent text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        } ${(hasPendingBadge || hasNotificationBadge) ? 'ring-1 ring-orange-200' : ''}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <div className="relative flex items-center">
          {active ? (
            <item.iconActive className="h-5 w-5 mr-3" />
          ) : (
            <item.icon className="h-5 w-5 mr-3" />
          )}
          <NavigationBadge item={item} />
          <UrgencyIndicator item={item} />
        </div>
        
        <div className="flex-1">
          <span className="font-medium">{item.name}</span>
          {isMobile && item.description && (
            <p className="text-xs text-gray-500 group-hover:text-gray-600 mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* UPDATED: Pending review status and notification indicators */}
        {item.badge === "pending" && pendingReviewCount > 0 && !isMobile && (
          <div className="flex items-center ml-2">
            <ClockIcon className="h-3 w-3 text-orange-500" />
            {pendingReviewCount > 10 && (
              <ExclamationTriangleIcon className="h-3 w-3 text-red-500 ml-1" />
            )}
          </div>
        )}
        
        {item.badge === "notification_count" && notificationStats.active_dealerships > 0 && !isMobile && (
          <div className="flex items-center ml-2">
            <BellIcon className="h-3 w-3 text-blue-500" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Side Navigation */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <Link href="/admin" className="flex items-center group">
              <img
                src="/logo-dark.png"
                alt="CarApp Admin"
                className="h-8 w-auto transition-transform group-hover:scale-105"
              />
              <span className="ml-2 text-xl font-bold text-gray-800 group-hover:text-accent transition-colors">
                Admin
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavItemComponent key={item.name} item={item} />
            ))}
          </nav>

          {/* SECTION: AutoClip Review Quick Stats (Desktop Only) */}
          {pendingReviewCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="bg-white border border-orange-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <VideoCameraIcon className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Reviews Pending</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    {pendingReviewCount}
                  </span>
                </div>
                <Link
                  href="/admin/autoclips"
                  className="block w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-center py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Review Now
                </Link>
              </div>
            </div>
          )}

 

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 group-hover:text-red-500 transition-colors" />
              <span className="font-medium">
                {isSigningOut ? "Signing out..." : "Logout"}
              </span>
            </button>
            {signOutError && (
              <p className="text-xs text-red-500 mt-1 px-4">
                Sign out failed. Please try again.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 bg-white transition-all duration-200 ${
          scrolled ? "shadow-md" : "border-b border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/admin" className="flex items-center group">
            <img
              src="/logo-dark.png"
              alt="CarApp Admin"
              className="h-8 w-auto transition-transform group-hover:scale-105"
            />
            <span className="ml-2 text-lg font-bold text-gray-800 group-hover:text-accent transition-colors">
              Admin
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            {/* INDICATOR: Mobile pending review notification */}
            {pendingReviewCount > 0 && (
              <Link
                href="/admin/autoclips"
                className="relative p-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-sm transition-all duration-200"
              >
                <VideoCameraIcon className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {pendingReviewCount > 9 ? "9+" : pendingReviewCount}
                </div>
              </Link>
            )}

            {/* UPDATED: Mobile notification indicator */}
            

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-gray-500/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <aside
        className={`lg:hidden fixed top-16 left-0 bottom-0 w-80 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavItemComponent key={item.name} item={item} isMobile />
            ))}
          </nav>

          {/* SECTION: Mobile AutoClip Review Stats */}
          {pendingReviewCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <VideoCameraIcon className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="font-medium text-gray-700">Pending Reviews</p>
                      <p className="text-xs text-gray-500">AutoClips awaiting approval</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {pendingReviewCount}
                  </span>
                </div>
                <Link
                  href="/admin/autoclips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-2 rounded-lg font-medium transition-all duration-200 shadow-sm space-x-2"
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Review Now</span>
                </Link>
              </div>
            </div>
          )}

          {/* UPDATED: Mobile Notification Stats */}
   

          {/* Mobile Logout Button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 group-hover:text-red-500 transition-colors" />
              <span className="font-medium">
                {isSigningOut ? "Signing out..." : "Logout"}
              </span>
            </button>
            {signOutError && (
              <p className="text-xs text-red-500 mt-2 px-4">
                Sign out failed. Please try again.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminNavbar;