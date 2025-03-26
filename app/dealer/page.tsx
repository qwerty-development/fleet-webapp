"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBagIcon,
  FilmIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import DealerNavbar from "@/components/dealer/navbar";
import { useAuth } from "@/utils/AuthContext";

// Dashboard sections
const SECTIONS = [
  {
    id: "inventory",
    name: "Inventory",
    description: "Manage your car listings",
    icon: ShoppingBagIcon,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "autoclips",
    name: "Auto Clips",
    description: "Manage your video content",
    icon: FilmIcon,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "profile",
    name: "Profile",
    description: "Manage dealership profile",
    icon: UserIcon,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "View performance metrics",
    icon: ChartBarIcon,
    color: "from-purple-500 to-violet-500",
  },
];

export default function DealerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuth();

  // State for dashboard data
  const [dealershipData, setDealershipData] = useState<any>(null);
  const [stats, setStats] = useState({
    inventory: {
      total: 0,
      available: 0,
      pending: 0,
      sold: 0,
      totalViews: 0,
      totalLikes: 0,
      avgPrice: 0,
    },
    subscription: {
      endDate: "",
      isActive: true,
      daysRemaining: 0,
    }
  });

  const [popularCars, setPopularCars] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      setIsLoading(true);
      try {
        // 1. Fetch dealership data
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (dealershipError) throw dealershipError;
        setDealershipData(dealershipData);

        // 2. Fetch cars data
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("dealership_id", dealershipData.id);

        if (carsError) throw carsError;

        // Process cars data
        if (carsData) {
          const availableCars = carsData.filter(
            (car) => car.status === "available"
          );
          const pendingCars = carsData.filter(
            (car) => car.status === "pending"
          );
          const soldCars = carsData.filter((car) => car.status === "sold");

          const totalViews = carsData.reduce(
            (sum, car) => sum + (car.views || 0),
            0
          );
          const totalLikes = carsData.reduce(
            (sum, car) => sum + (car.likes || 0),
            0
          );
          const avgPrice =
            carsData.length > 0
              ? Math.round(
                  carsData.reduce((sum, car) => sum + (car.price || 0), 0) /
                    carsData.length
                )
              : 0;

          setStats((prev) => ({
            ...prev,
            inventory: {
              total: carsData.length,
              available: availableCars.length,
              pending: pendingCars.length,
              sold: soldCars.length,
              totalViews,
              totalLikes,
              avgPrice,
            },
          }));

          // Calculate subscription status
          const endDate = new Date(dealershipData.subscription_end_date);
          const now = new Date();
          const daysRemaining = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          setStats((prev) => ({
            ...prev,
            subscription: {
              endDate: dealershipData.subscription_end_date,
              isActive: endDate > now,
              daysRemaining: daysRemaining,
            },
          }));

          // Sort cars by views to get the most popular ones
          const sortedByViews = [...carsData]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);

          setPopularCars(sortedByViews);

          // Sort cars by listing date to get the most recent ones
          const sortedByDate = [...carsData]
            .sort(
              (a, b) =>
                new Date(b.listed_at || 0).getTime() -
                new Date(a.listed_at || 0).getTime()
            )
            .slice(0, 5);

          setRecentListings(sortedByDate);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, supabase]);

  const navigateToSection = (sectionId: string) => {
    router.push(`/dealer/${sectionId}`);
  };

  // Format date string to a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format currency numbers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      case "sold":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  // Get subscription status class
  const getSubscriptionStatusClass = () => {
    if (!stats.subscription.isActive) {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    }
    if (stats.subscription.daysRemaining <= 30) {
      return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dealer Dashboard
              </h1>
              <p className="text-gray-400">
                Manage your inventory, monitor activity, and track performance
              </p>
            </div>

            {dealershipData && (
              <div className="mt-4 md:mt-0 flex items-center">
                <div className="px-4 py-2 rounded-lg bg-gray-800 text-white">
                  <span className="font-semibold">{dealershipData.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Alert Banner */}
          {dealershipData && (
            <div className={`mb-6 p-4 rounded-lg ${getSubscriptionStatusClass()}`}>
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {!stats.subscription.isActive
                    ? "Your subscription has expired. Please contact support to renew."
                    : stats.subscription.daysRemaining <= 30
                    ? `Your subscription expires in ${stats.subscription.daysRemaining} days on ${formatDate(stats.subscription.endDate)}.`
                    : `Your subscription is active until ${formatDate(stats.subscription.endDate)}.`}
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">
                      Total Cars
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      <ShoppingBagIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">
                      {stats.inventory.total}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className={`flex items-center ${stats.inventory.available > 0 ? "text-emerald-400" : "text-gray-400"}`}>
                        {stats.inventory.available} available
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">Sales</p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-emerald-500/20 text-emerald-300">
                      <BanknotesIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">
                      {stats.inventory.sold}
                    </p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">
                        <span className="text-rose-400">
                          {stats.inventory.pending}
                        </span>{" "}
                        pending
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">
                      Average Price
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-amber-500/20 text-amber-300">
                      <CurrencyDollarIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">
                      {formatCurrency(stats.inventory.avgPrice)}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className="text-emerald-400">
                        Based on {stats.inventory.total} cars
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">
                      Engagement
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-purple-500/20 text-purple-300">
                      <EyeIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">
                      {stats.inventory.totalViews}
                    </p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-400">
                        <span className="text-rose-400">
                          {stats.inventory.totalLikes}
                        </span>{" "}
                        likes
                      </span>
                      <span className="text-gray-400">
                        <span className="text-emerald-400">
                          {stats.inventory.totalViews > 0
                            ? Math.round(
                                (stats.inventory.totalLikes / stats.inventory.totalViews) *
                                  100
                              )
                            : 0}
                          %
                        </span>{" "}
                        conversion
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cars by Status */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Car Inventory Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-emerald-500/20">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-400 mr-2" />
                      <h4 className="text-white font-medium">Available</h4>
                    </div>
                    <p className="text-3xl text-emerald-400 font-bold">
                      {stats.inventory.available}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Ready for sale</p>
                  </div>

                  <div className="bg-gray-900/60 rounded-lg p-4 border border-amber-500/20">
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-5 w-5 text-amber-400 mr-2" />
                      <h4 className="text-white font-medium">Pending</h4>
                    </div>
                    <p className="text-3xl text-amber-400 font-bold">
                      {stats.inventory.pending}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">In process</p>
                  </div>

                  <div className="bg-gray-900/60 rounded-lg p-4 border border-rose-500/20">
                    <div className="flex items-center mb-2">
                      <BanknotesIcon className="h-5 w-5 text-rose-400 mr-2" />
                      <h4 className="text-white font-medium">Sold</h4>
                    </div>
                    <p className="text-3xl text-rose-400 font-bold">
                      {stats.inventory.sold}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Completed sales
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Sections Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => navigateToSection(section.id)}
                    className="bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:border-gray-600 transition-all duration-300"
                  >
                    <div
                      className={`h-2 bg-gradient-to-r ${section.color}`}
                    ></div>
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <div
                          className={`p-3 rounded-full bg-gradient-to-br ${section.color} text-white`}
                        >
                          <section.icon className="h-6 w-6" />
                        </div>
                        <h3 className="ml-3 text-xl font-semibold text-white">
                          {section.name}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {section.description}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button className="flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                          Manage
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Popular Cars */}
              {popularCars.length > 0 && (
                <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Most Popular Cars
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                          <th className="pb-2 font-medium">Car</th>
                          <th className="pb-2 font-medium">Price</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium text-right">Views</th>
                          <th className="pb-2 font-medium text-right">Likes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {popularCars.map((car) => (
                          <tr key={car.id} className="hover:bg-gray-800/50">
                            <td className="py-3">
                              <div>
                                <p className="text-white font-medium">
                                  {car.make} {car.model}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {car.year}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 text-white">
                              {formatCurrency(car.price)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                                  car.status
                                )}`}
                              >
                                {car.status}
                              </span>
                            </td>
                            <td className="py-3 text-right text-white">
                              {car.views || 0}
                            </td>
                            <td className="py-3 text-right text-white">
                              {car.likes || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Listings */}
              {recentListings.length > 0 && (
                <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Recent Listings
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                          <th className="pb-2 font-medium">Car</th>
                          <th className="pb-2 font-medium">Price</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Listed Date</th>
                          <th className="pb-2 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {recentListings.map((car) => (
                          <tr key={car.id} className="hover:bg-gray-800/50">
                            <td className="py-3">
                              <div>
                                <p className="text-white font-medium">
                                  {car.make} {car.model}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {car.year}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 text-white">
                              {formatCurrency(car.price)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                                  car.status
                                )}`}
                              >
                                {car.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-300 text-sm">
                              {formatDate(car.listed_at)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() =>
                                  router.push(`/dealer/inventory/${car.id}`)
                                }
                                className="text-indigo-400 hover:text-indigo-300 text-sm"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigateToSection("inventory")}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                    >
                      View All Listings
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}