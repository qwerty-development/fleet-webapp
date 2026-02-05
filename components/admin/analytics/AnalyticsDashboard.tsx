"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ListBulletIcon,
  ShoppingCartIcon,
  TruckIcon,
  KeyIcon,
  UserIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { AnalyticsDataV2, TimeRange } from "./types";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { MetricCard } from "./MetricCard";
import { OverviewGrid } from "./OverviewGrid";
import { ChartsSection } from "./ChartsSection";
import { TopLists } from "./TopLists";

/**
 * AnalyticsDashboard V2 - Main Container
 * Orchestrates data fetching and renders all dashboard sections
 */
export const AnalyticsDashboard: React.FC = () => {
  const supabase = createClient();
  const [analytics, setAnalytics] = useState<AnalyticsDataV2 | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Convert time range to days
  const getTimeRangeDays = useCallback((range: TimeRange): number => {
    switch (range) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      case "1y":
        return 365;
      case "all":
        return 0;
      default:
        return 30;
    }
  }, []);

  // Get time-based greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Generate dynamic insight based on analytics data
  const getInsight = (): string => {
    if (!analytics) return "Loading insights...";

    const pendingCars = analytics.overview.cars_sale.pending;
    const pendingPlates = analytics.overview.number_plates.pending;
    const newListings = analytics.filtered_metrics.cars_sale.new_listings +
      analytics.filtered_metrics.cars_rent.new_listings +
      analytics.filtered_metrics.number_plates.new_listings;

    if (pendingCars + pendingPlates > 0) {
      return `You have ${pendingCars + pendingPlates} pending listings awaiting approval.`;
    }

    if (newListings > 0) {
      return `${newListings} new listings added in the last ${analytics.filtered_metrics.period_days} days.`;
    }

    return `Platform running smoothly with ${analytics.overview.total_listings} active listings.`;
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const days = getTimeRangeDays(timeRange);
      const { data, error: rpcError } = await supabase.rpc("get_admin_analytics_v2", {
        days_back: days,
      });

      if (rpcError) throw rpcError;
      setAnalytics(data as AnalyticsDataV2);
    } catch (err: unknown) {
      console.error("Error fetching analytics:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch analytics data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, timeRange, getTimeRangeDays]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Format helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";
  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    if (!analytics) return;
    const wb = XLSX.utils.book_new();

    const overviewData = [
      ["Metric", "Value"],
      ["Total Listings", analytics.overview.total_listings],
      ["Total Views", analytics.overview.total_views],
      ["Total Likes", analytics.overview.total_likes],
      ["Total Dealerships", analytics.overview.total_dealerships],
      ["Total Users", analytics.overview.total_users],
      ["Active Subscriptions", analytics.overview.active_subscriptions],
      ["", ""],
      ["Cars for Sale - Total", analytics.overview.cars_sale.total],
      ["Cars for Sale - Revenue", formatCurrency(analytics.overview.cars_sale.revenue)],
      ["Cars for Rent - Total", analytics.overview.cars_rent.total],
      ["Number Plates - Total", analytics.overview.number_plates.total],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), "Overview");

    const weeklyData = [
      ["Week", "Cars for Sale", "Cars for Rent", "Number Plates", "Sales", "New Users"],
      ...analytics.weekly_breakdown.map((week) => [
        new Date(week.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        week.cars_sale,
        week.cars_rent,
        week.number_plates,
        week.sales,
        week.new_users,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(weeklyData), "Weekly Breakdown");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fleet-analytics-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, [analytics]);

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-rose-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-gray-500 text-sm mb-6">
            Make sure the RPC function{" "}
            <code className="bg-gray-700 px-2 py-1 rounded">get_admin_analytics_v2</code> is
            deployed to your Supabase database.
          </p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl mb-2 font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive analytics for cars, rentals, and number plates</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg flex p-1">
            {(["7d", "30d", "90d", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {range === "7d" ? "7D" : range === "30d" ? "30D" : range === "90d" ? "90D" : range === "1y" ? "1Y" : "All"}
              </button>
            ))}
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
            Export
          </button>
        </div>
      </div>

      {/* Command Center Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {getGreeting()}, Admin 👋
            </h2>
            <p className="text-indigo-200 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
              {getInsight()}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{formatNumber(analytics.overview.total_listings)}</p>
              <p className="text-xs text-gray-400">Total Listings</p>
            </div>
            <div className="h-12 w-px bg-gray-700"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">{formatNumber(analytics.overview.active_subscriptions)}</p>
              <p className="text-xs text-gray-400">Active Subs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Grid */}
      <OverviewGrid analytics={analytics} />

      {/* Overview by Listing Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Cars for Sale */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
              <ShoppingCartIcon className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Cars for Sale</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.cars_sale.total)}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatNumber(analytics.overview.cars_sale.available)}
              </p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {formatNumber(analytics.overview.cars_sale.sold)}
              </p>
              <p className="text-xs text-gray-400">Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(analytics.overview.cars_sale.revenue)}
              </p>
              <p className="text-xs text-gray-400">Revenue</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-sm">
            <span className="text-gray-400">
              <EyeIcon className="h-4 w-4 inline mr-1" />
              {formatNumber(analytics.overview.cars_sale.views)} views
            </span>
          </div>
        </div>

        {/* Cars for Rent */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-teal-500/20 rounded-lg mr-3">
              <TruckIcon className="h-6 w-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Cars for Rent</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.cars_rent.total)}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatNumber(analytics.overview.cars_rent.available)}
              </p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-sm">
            <span className="text-gray-400">
              <EyeIcon className="h-4 w-4 inline mr-1" />
              {formatNumber(analytics.overview.cars_rent.views)} views
            </span>
          </div>
        </div>

        {/* Number Plates */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg mr-3">
              <KeyIcon className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Number Plates</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(analytics.overview.number_plates.total)}
              </p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatNumber(analytics.overview.number_plates.available)}
              </p>
              <p className="text-xs text-gray-400">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {formatNumber(analytics.overview.number_plates.sold)}
              </p>
              <p className="text-xs text-gray-400">Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(analytics.overview.number_plates.revenue)}
              </p>
              <p className="text-xs text-gray-400">Revenue</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm">
            <span className="text-gray-400">
              <EyeIcon className="h-4 w-4 inline mr-1" />
              {formatNumber(analytics.overview.number_plates.views)} views
            </span>
          </div>
        </div>
      </div>

      {/* Time-Filtered Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-400" />
          Period Metrics ({timeRange === "all" ? "All Time" : `Last ${analytics.filtered_metrics.period_days} Days`})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="New Car Listings"
            value={formatNumber(analytics.filtered_metrics.cars_sale.new_listings)}
            icon={<ListBulletIcon className="h-5 w-5 text-indigo-400" />}
            color="bg-indigo-500/20"
            textColor="text-indigo-400"
          />
          <MetricCard
            title="New Rental Listings"
            value={formatNumber(analytics.filtered_metrics.cars_rent.new_listings)}
            icon={<TruckIcon className="h-5 w-5 text-teal-400" />}
            color="bg-teal-500/20"
            textColor="text-teal-400"
          />
          <MetricCard
            title="New Plates"
            value={formatNumber(analytics.filtered_metrics.number_plates.new_listings)}
            icon={<KeyIcon className="h-5 w-5 text-amber-400" />}
            color="bg-amber-500/20"
            textColor="text-amber-400"
          />
          <MetricCard
            title="Cars Sold"
            value={formatNumber(analytics.filtered_metrics.cars_sale.sold)}
            icon={<ShoppingCartIcon className="h-5 w-5 text-emerald-400" />}
            color="bg-emerald-500/20"
            textColor="text-emerald-400"
          />
          <MetricCard
            title="Revenue"
            value={formatCurrency(analytics.filtered_metrics.cars_sale.revenue)}
            icon={<CurrencyDollarIcon className="h-5 w-5 text-purple-400" />}
            color="bg-purple-500/20"
            textColor="text-purple-400"
          />
          <MetricCard
            title="New Users"
            value={formatNumber(analytics.filtered_metrics.new_users)}
            icon={<UserIcon className="h-5 w-5 text-cyan-400" />}
            color="bg-cyan-500/20"
            textColor="text-cyan-400"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg mr-2">
              <ClockIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-white font-medium">Avg Time to Sell</h3>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-white mr-2">
              {analytics.performance_metrics.avg_time_to_sell.toFixed(1)}
            </p>
            <p className="text-gray-400">days</p>
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg mr-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium">Conversion Rate</h3>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-white mr-2">
              {formatPercent(analytics.performance_metrics.conversion_rate)}
            </p>
            <p className="text-gray-400">listings to sales</p>
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg mr-2">
              <CurrencyDollarIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-white font-medium">Avg Sale Price</h3>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-white mr-2">
              {formatCurrency(analytics.performance_metrics.avg_sale_price)}
            </p>
            <p
              className={`${
                analytics.performance_metrics.price_difference > 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {analytics.performance_metrics.price_difference > 0 ? "+" : ""}
              {formatCurrency(analytics.performance_metrics.price_difference)}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-rose-500/20 rounded-lg mr-2">
              <EyeIcon className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="text-white font-medium">Views per Listing</h3>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-white mr-2">
              {analytics.performance_metrics.views_per_listing.toFixed(1)}
            </p>
            <p className="text-gray-400">avg views</p>
          </div>
        </div>
      </div>

      {/* AutoClips */}
      {analytics.autoclips && (
        <div className="mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                <PlayCircleIcon className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">AutoClips</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.autoclips.total)}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatNumber(analytics.autoclips.published)}
                </p>
                <p className="text-xs text-gray-400">Published</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{formatNumber(analytics.autoclips.draft)}</p>
                <p className="text-xs text-gray-400">Draft</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {formatNumber(analytics.autoclips.under_review)}
                </p>
                <p className="text-xs text-gray-400">Under Review</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatNumber(analytics.autoclips.total_views)}
                </p>
                <p className="text-xs text-gray-400">Views</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-400">
                  {formatNumber(analytics.autoclips.total_likes)}
                </p>
                <p className="text-xs text-gray-400">Likes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <ChartsSection analytics={analytics} />

      {/* Top Lists Section */}
      <TopLists analytics={analytics} />
    </div>
  );
};
