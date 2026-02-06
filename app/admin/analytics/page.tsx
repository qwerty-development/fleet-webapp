"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ListBulletIcon,
  EyeIcon,
  HeartIcon,
  ShoppingCartIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  KeyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

// Define interface for the new analytics data structure
interface AnalyticsDataV2 {
  overview: {
    cars_sale: {
      total: number;
      available: number;
      sold: number;
      pending: number;
      views: number;
      likes: number;
      revenue: number;
    };
    cars_rent: {
      total: number;
      available: number;
      views: number;
      likes: number;
    };
    number_plates: {
      total: number;
      available: number;
      sold: number;
      pending: number;
      views: number;
      revenue: number;
    };
    total_listings: number;
    total_views: number;
    total_likes: number;
    total_dealerships: number;
    total_users: number;
    active_subscriptions: number;
  };
  weekly_breakdown: {
    week_start: string;
    cars_sale: number;
    cars_rent: number;
    number_plates: number;
    sales: number;
    new_users: number;
  }[];
  filtered_metrics: {
    period_days: number;
    cars_sale: { new_listings: number; sold: number; revenue: number; views: number };
    cars_rent: { new_listings: number; views: number };
    number_plates: { new_listings: number; sold: number; views: number };
    new_users: number;
    new_dealerships: number;
  };
  sales_trend: { month: string; cars_sold: number; cars_revenue: number; plates_sold: number }[];
  user_growth: { month: string; new_users: number }[];
  listings_trend: { month: string; cars_sale: number; cars_rent: number; number_plates: number }[];
  top_dealerships: {
    id: number;
    name: string;
    location: string;
    total_listings: number;
    cars_sale: number;
    cars_rent: number;
    number_plates: number;
    total_views: number;
    total_likes: number;
    total_sales: number;
    total_revenue: number;
  }[];
  top_cars: { id: number; make: string; model: string; year: number; price: number; views: number; likes: number; status: string }[];
  top_rentals: { id: number; make: string; model: string; year: number; price: number; views: number; likes: number; status: string; rental_period: string }[];
  top_plates: { id: number; letter: string; digits: string; price: number; views: number; status: string }[];
  inventory_summary: {
    condition_distribution: Record<string, number>;
    transmission_distribution: Record<string, number>;
    drivetrain_distribution: Record<string, number>;
    category_distribution: Record<string, number>;
  };
  price_distribution: { range: string; count: number }[];
  performance_metrics: {
    avg_time_to_sell: number;
    conversion_rate: number;
    avg_listing_price: number;
    avg_sale_price: number;
    price_difference: number;
    views_per_listing: number;
    likes_per_listing: number;
  };
  user_engagement: {
    top_likers: { id: string; name: string; email: string; likes_count: number }[];
    top_viewers: { id: string; name: string; email: string; views_count: number }[];
  };
  geographical_data: { name: string; dealerships: number; listings: number; sales: number }[];
  autoclips: {
    total: number;
    published: number;
    draft: number;
    under_review: number;
    total_views: number;
    total_likes: number;
  };
  listing_type_distribution: { type: string; count: number }[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  subtitle?: string;
}

// Define chart colors
const CHART_COLORS = {
  primary: "#4f46e5",
  secondary: "#0891b2",
  accent: "#d97706",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#f59e0b",
  info: "#0284c7",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  new: "#3b82f6",
  used: "#8b5cf6",
  certified: "#10b981",
  classic: "#f59e0b",
  custom: "#ef4444",
};

// MetricCard component
const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, textColor, subtitle }) => (
  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 shadow-sm flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 ${color} rounded-lg`}>{icon}</div>
    </div>
    <div className="space-y-1">
      <p className="text-xs text-gray-400">{title}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

export default function AdminAnalyticsDashboard() {
  const supabase = createClient();
  const [analytics, setAnalytics] = useState<AnalyticsDataV2 | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("1y");

  // Convert time range to days
  const getTimeRangeDays = useCallback((range: typeof timeRange): number => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "1y": return 365;
      case "all": return 0;
      default: return 30;
    }
  }, []);

  // Fetch analytics data using the new RPC function
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const days = getTimeRangeDays(timeRange);
      const { data, error: rpcError } = await supabase.rpc("get_admin_analytics_v2", { days_back: days });

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
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";
  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  // Helper to format chart dates
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    if (timeRange === "7d" || timeRange === "30d") {
      return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

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

    // Weekly breakdown data
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

  // Chart data
  const chartData = useMemo(() => {
    if (!analytics) return null;

    return {
      weeklyBreakdown: {
        labels: analytics.weekly_breakdown?.map((w) => new Date(w.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })) || [],
        datasets: [
          { label: "Cars for Sale", data: analytics.weekly_breakdown?.map((w) => w.cars_sale) || [], backgroundColor: CHART_COLORS.primary, barThickness: 20 },
          { label: "Cars for Rent", data: analytics.weekly_breakdown?.map((w) => w.cars_rent) || [], backgroundColor: CHART_COLORS.teal, barThickness: 20 },
          { label: "Number Plates", data: analytics.weekly_breakdown?.map((w) => w.number_plates) || [], backgroundColor: CHART_COLORS.accent, barThickness: 20 },
        ],
      },
      listingTypeDistribution: {
        labels: analytics.listing_type_distribution?.map((item) => item.type) || [],
        datasets: [{
          data: analytics.listing_type_distribution?.map((item) => item.count) || [],
          backgroundColor: [CHART_COLORS.primary, CHART_COLORS.teal, CHART_COLORS.accent],
          borderColor: "rgba(38, 38, 38, 0.8)",
          borderWidth: 2,
        }],
      },
      listingsTrend: {
        labels: analytics.listings_trend?.map((item) => formatChartDate(item.month)) || [],
        datasets: [
          { label: "Cars for Sale", data: analytics.listings_trend?.map((item) => item.cars_sale) || [], backgroundColor: CHART_COLORS.primary, stack: "stack1" },
          { label: "Cars for Rent", data: analytics.listings_trend?.map((item) => item.cars_rent) || [], backgroundColor: CHART_COLORS.teal, stack: "stack1" },
          { label: "Number Plates", data: analytics.listings_trend?.map((item) => item.number_plates) || [], backgroundColor: CHART_COLORS.accent, stack: "stack1" },
        ],
      },
      salesTrend: {
        labels: analytics.sales_trend?.map((item) => formatChartDate(item.month)) || [],
        datasets: [
          { label: "Cars Sold", data: analytics.sales_trend?.map((item) => item.cars_sold) || [], borderColor: CHART_COLORS.primary, backgroundColor: `${CHART_COLORS.primary}20`, borderWidth: 2, fill: true, tension: 0.4 },
          { label: "Plates Sold", data: analytics.sales_trend?.map((item) => item.plates_sold) || [], borderColor: CHART_COLORS.accent, backgroundColor: `${CHART_COLORS.accent}20`, borderWidth: 2, fill: true, tension: 0.4 },
        ],
      },
      userGrowth: {
        labels: analytics.user_growth?.map((item) => formatChartDate(item.month)) || [],
        datasets: [{ label: "New Users", data: analytics.user_growth?.map((item) => item.new_users) || [], borderColor: CHART_COLORS.success, backgroundColor: `${CHART_COLORS.success}20`, borderWidth: 2, fill: true, tension: 0.4 }],
      },
      topDealerships: {
        labels: analytics.top_dealerships?.map((d) => d.name) || [],
        datasets: [
          { label: "Cars for Sale", data: analytics.top_dealerships?.map((d) => d.cars_sale) || [], backgroundColor: CHART_COLORS.primary, barThickness: 16 },
          { label: "Cars for Rent", data: analytics.top_dealerships?.map((d) => d.cars_rent) || [], backgroundColor: CHART_COLORS.teal, barThickness: 16 },
          { label: "Number Plates", data: analytics.top_dealerships?.map((d) => d.number_plates) || [], backgroundColor: CHART_COLORS.accent, barThickness: 16 },
        ],
      },
      inventoryCondition: {
        labels: Object.keys(analytics.inventory_summary?.condition_distribution || {}),
        datasets: [{ data: Object.values(analytics.inventory_summary?.condition_distribution || {}), backgroundColor: [CHART_COLORS.new, CHART_COLORS.used, CHART_COLORS.certified, CHART_COLORS.classic, CHART_COLORS.custom], borderColor: "rgba(38, 38, 38, 0.8)", borderWidth: 1 }],
      },
      transmissionDistribution: {
        labels: Object.keys(analytics.inventory_summary?.transmission_distribution || {}),
        datasets: [{ data: Object.values(analytics.inventory_summary?.transmission_distribution || {}), backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent], borderColor: "rgba(38, 38, 38, 0.8)", borderWidth: 1 }],
      },
      drivetrainDistribution: {
        labels: Object.keys(analytics.inventory_summary?.drivetrain_distribution || {}),
        datasets: [{ data: Object.values(analytics.inventory_summary?.drivetrain_distribution || {}), backgroundColor: [CHART_COLORS.info, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger], borderColor: "rgba(38, 38, 38, 0.8)", borderWidth: 1 }],
      },
      priceDistribution: {
        labels: analytics.price_distribution?.map((p) => p.range) || [],
        datasets: [{ label: "Vehicles", data: analytics.price_distribution?.map((p) => p.count) || [], backgroundColor: CHART_COLORS.accent, barThickness: 30 }],
      },
      geographicalData: {
        labels: analytics.geographical_data?.map((g) => g.name) || [],
        datasets: [
          { label: "Listings", data: analytics.geographical_data?.map((g) => g.listings) || [], backgroundColor: CHART_COLORS.primary, barThickness: 20 },
          { label: "Sales", data: analytics.geographical_data?.map((g) => g.sales) || [], backgroundColor: CHART_COLORS.success, barThickness: 20 },
        ],
      },
    };
  }, [analytics]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: "rgba(75, 85, 99, 0.1)" }, ticks: { color: "rgba(156, 163, 175, 1)" } },
      y: { grid: { color: "rgba(75, 85, 99, 0.1)" }, ticks: { color: "rgba(156, 163, 175, 1)" } },
    },
    plugins: {
      legend: { position: "top" as const, labels: { color: "rgba(156, 163, 175, 1)", boxWidth: 12, padding: 15 } },
      tooltip: { backgroundColor: "rgba(30, 41, 59, 0.9)", titleColor: "rgba(255, 255, 255, 1)", bodyColor: "rgba(255, 255, 255, 0.8)", borderColor: "rgba(107, 114, 128, 0.2)", borderWidth: 1, padding: 10, boxPadding: 3, cornerRadius: 8, usePointStyle: true },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const, labels: { color: "rgba(156, 163, 175, 1)", boxWidth: 15, padding: 10, font: { size: 11 } } },
      tooltip: { backgroundColor: "rgba(30, 41, 59, 0.9)", titleColor: "rgba(255, 255, 255, 1)", bodyColor: "rgba(255, 255, 255, 0.8)", borderColor: "rgba(107, 114, 128, 0.2)", borderWidth: 1, padding: 10, boxPadding: 3, cornerRadius: 8, usePointStyle: true },
    },
  };

  const stackedBarOptions = { ...chartOptions, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, stacked: true }, y: { ...chartOptions.scales.y, stacked: true } } };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400">Comprehensive analytics for cars, rentals, and number plates</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg flex p-1">
                {(["7d", "30d", "90d", "1y", "all"] as const).map((range) => (
                  <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === range ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
                    {range === "7d" ? "7D" : range === "30d" ? "30D" : range === "90d" ? "90D" : range === "1y" ? "1Y" : "All"}
                  </button>
                ))}
              </div>
              <button onClick={exportToExcel} disabled={!analytics || isLoading} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />Export
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <p className="text-gray-500 text-sm mb-6">Make sure the RPC function <code className="bg-gray-700 px-2 py-1 rounded">get_admin_analytics_v2</code> is deployed to your Supabase database.</p>
              <button onClick={() => fetchAnalytics()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors">Try Again</button>
            </div>
          ) : analytics ? (
            <>
              {/* Weekly Breakdown Trend */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-400" />
                    Weekly Breakdown - New Listings (Last 12 Weeks)
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">Track new listings across all types over the past 12 weeks</p>
                  <div className="h-80">{chartData && <Bar data={chartData.weeklyBreakdown} options={chartOptions} />}</div>
                </div>
              </div>

              {/* Overview by Listing Type */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Cars for Sale */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg mr-3"><ShoppingCartIcon className="h-6 w-6 text-indigo-400" /></div>
                    <h3 className="text-lg font-semibold text-white">Cars for Sale</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.cars_sale.total)}</p><p className="text-xs text-gray-400">Total</p></div>
                    <div><p className="text-2xl font-bold text-emerald-400">{formatNumber(analytics.overview.cars_sale.available)}</p><p className="text-xs text-gray-400">Available</p></div>
                    <div><p className="text-2xl font-bold text-purple-400">{formatNumber(analytics.overview.cars_sale.sold)}</p><p className="text-xs text-gray-400">Sold</p></div>
                    <div><p className="text-2xl font-bold text-amber-400">{formatCurrency(analytics.overview.cars_sale.revenue)}</p><p className="text-xs text-gray-400">Revenue</p></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-sm">
                    <span className="text-gray-400"><EyeIcon className="h-4 w-4 inline mr-1" />{formatNumber(analytics.overview.cars_sale.views)} views</span>
                    <span className="text-gray-400"><HeartIcon className="h-4 w-4 inline mr-1" />{formatNumber(analytics.overview.cars_sale.likes)} likes</span>
                  </div>
                </div>

                {/* Cars for Rent */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-teal-500/20 rounded-lg mr-3"><TruckIcon className="h-6 w-6 text-teal-400" /></div>
                    <h3 className="text-lg font-semibold text-white">Cars for Rent</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.cars_rent.total)}</p><p className="text-xs text-gray-400">Total</p></div>
                    <div><p className="text-2xl font-bold text-emerald-400">{formatNumber(analytics.overview.cars_rent.available)}</p><p className="text-xs text-gray-400">Available</p></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-sm">
                    <span className="text-gray-400"><EyeIcon className="h-4 w-4 inline mr-1" />{formatNumber(analytics.overview.cars_rent.views)} views</span>
                    <span className="text-gray-400"><HeartIcon className="h-4 w-4 inline mr-1" />{formatNumber(analytics.overview.cars_rent.likes)} likes</span>
                  </div>
                </div>

                {/* Number Plates */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg mr-3"><KeyIcon className="h-6 w-6 text-amber-400" /></div>
                    <h3 className="text-lg font-semibold text-white">Number Plates</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.number_plates.total)}</p><p className="text-xs text-gray-400">Total</p></div>
                    <div><p className="text-2xl font-bold text-emerald-400">{formatNumber(analytics.overview.number_plates.available)}</p><p className="text-xs text-gray-400">Available</p></div>
                    <div><p className="text-2xl font-bold text-purple-400">{formatNumber(analytics.overview.number_plates.sold)}</p><p className="text-xs text-gray-400">Sold</p></div>
                    <div><p className="text-2xl font-bold text-amber-400">{formatCurrency(analytics.overview.number_plates.revenue)}</p><p className="text-xs text-gray-400">Revenue</p></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700/50 text-sm">
                    <span className="text-gray-400"><EyeIcon className="h-4 w-4 inline mr-1" />{formatNumber(analytics.overview.number_plates.views)} views</span>
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
                  <MetricCard title="New Car Listings" value={formatNumber(analytics.filtered_metrics.cars_sale.new_listings)} icon={<ListBulletIcon className="h-5 w-5 text-indigo-400" />} color="bg-indigo-500/20" textColor="text-indigo-400" />
                  <MetricCard title="New Rental Listings" value={formatNumber(analytics.filtered_metrics.cars_rent.new_listings)} icon={<TruckIcon className="h-5 w-5 text-teal-400" />} color="bg-teal-500/20" textColor="text-teal-400" />
                  <MetricCard title="New Plates" value={formatNumber(analytics.filtered_metrics.number_plates.new_listings)} icon={<KeyIcon className="h-5 w-5 text-amber-400" />} color="bg-amber-500/20" textColor="text-amber-400" />
                  <MetricCard title="Cars Sold" value={formatNumber(analytics.filtered_metrics.cars_sale.sold)} icon={<ShoppingCartIcon className="h-5 w-5 text-emerald-400" />} color="bg-emerald-500/20" textColor="text-emerald-400" />
                  <MetricCard title="Revenue" value={formatCurrency(analytics.filtered_metrics.cars_sale.revenue)} icon={<CurrencyDollarIcon className="h-5 w-5 text-purple-400" />} color="bg-purple-500/20" textColor="text-purple-400" />
                  <MetricCard title="New Users" value={formatNumber(analytics.filtered_metrics.new_users)} icon={<UserIcon className="h-5 w-5 text-cyan-400" />} color="bg-cyan-500/20" textColor="text-cyan-400" />
                </div>
              </div>

              {/* Platform Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                <MetricCard title="Total Listings" value={formatNumber(analytics.overview.total_listings)} icon={<ListBulletIcon className="h-5 w-5 text-blue-400" />} color="bg-blue-500/20" textColor="text-blue-400" />
                <MetricCard title="Total Views" value={formatNumber(analytics.overview.total_views)} icon={<EyeIcon className="h-5 w-5 text-emerald-400" />} color="bg-emerald-500/20" textColor="text-emerald-400" />
                <MetricCard title="Total Likes" value={formatNumber(analytics.overview.total_likes)} icon={<HeartIcon className="h-5 w-5 text-rose-400" />} color="bg-rose-500/20" textColor="text-rose-400" />
                <MetricCard title="Dealerships" value={formatNumber(analytics.overview.total_dealerships)} icon={<BuildingOfficeIcon className="h-5 w-5 text-amber-400" />} color="bg-amber-500/20" textColor="text-amber-400" />
                <MetricCard title="Total Users" value={formatNumber(analytics.overview.total_users)} icon={<UserIcon className="h-5 w-5 text-cyan-400" />} color="bg-cyan-500/20" textColor="text-cyan-400" />
                <MetricCard title="Active Subs" value={formatNumber(analytics.overview.active_subscriptions)} icon={<CalendarDaysIcon className="h-5 w-5 text-purple-400" />} color="bg-purple-500/20" textColor="text-purple-400" />
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2"><div className="p-2 bg-indigo-500/20 rounded-lg mr-2"><ClockIcon className="h-5 w-5 text-indigo-400" /></div><h3 className="text-white font-medium">Avg Time to Sell</h3></div>
                  <div className="flex items-baseline"><p className="text-2xl font-bold text-white mr-2">{analytics.performance_metrics.avg_time_to_sell.toFixed(1)}</p><p className="text-gray-400">days</p></div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2"><div className="p-2 bg-emerald-500/20 rounded-lg mr-2"><ArrowTrendingUpIcon className="h-5 w-5 text-emerald-400" /></div><h3 className="text-white font-medium">Conversion Rate</h3></div>
                  <div className="flex items-baseline"><p className="text-2xl font-bold text-white mr-2">{formatPercent(analytics.performance_metrics.conversion_rate)}</p><p className="text-gray-400">listings to sales</p></div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2"><div className="p-2 bg-amber-500/20 rounded-lg mr-2"><CurrencyDollarIcon className="h-5 w-5 text-amber-400" /></div><h3 className="text-white font-medium">Avg Sale Price</h3></div>
                  <div className="flex items-baseline"><p className="text-2xl font-bold text-white mr-2">{formatCurrency(analytics.performance_metrics.avg_sale_price)}</p><p className={`${analytics.performance_metrics.price_difference > 0 ? "text-emerald-400" : "text-rose-400"}`}>{analytics.performance_metrics.price_difference > 0 ? "+" : ""}{formatCurrency(analytics.performance_metrics.price_difference)}</p></div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2"><div className="p-2 bg-rose-500/20 rounded-lg mr-2"><EyeIcon className="h-5 w-5 text-rose-400" /></div><h3 className="text-white font-medium">Views per Listing</h3></div>
                  <div className="flex items-baseline"><p className="text-2xl font-bold text-white mr-2">{analytics.performance_metrics.views_per_listing.toFixed(1)}</p><p className="text-gray-400">avg views</p></div>
                </div>
              </div>

              {/* AutoClips */}
              {analytics.autoclips && (
                <div className="mb-8">
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-4"><div className="p-2 bg-pink-500/20 rounded-lg mr-3"><PlayCircleIcon className="h-6 w-6 text-pink-400" /></div><h3 className="text-lg font-semibold text-white">AutoClips</h3></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div><p className="text-2xl font-bold text-white">{formatNumber(analytics.autoclips.total)}</p><p className="text-xs text-gray-400">Total</p></div>
                      <div><p className="text-2xl font-bold text-emerald-400">{formatNumber(analytics.autoclips.published)}</p><p className="text-xs text-gray-400">Published</p></div>
                      <div><p className="text-2xl font-bold text-amber-400">{formatNumber(analytics.autoclips.draft)}</p><p className="text-xs text-gray-400">Draft</p></div>
                      <div><p className="text-2xl font-bold text-blue-400">{formatNumber(analytics.autoclips.under_review)}</p><p className="text-xs text-gray-400">Under Review</p></div>
                      <div><p className="text-2xl font-bold text-cyan-400">{formatNumber(analytics.autoclips.total_views)}</p><p className="text-xs text-gray-400">Views</p></div>
                      <div><p className="text-2xl font-bold text-rose-400">{formatNumber(analytics.autoclips.total_likes)}</p><p className="text-xs text-gray-400">Likes</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Listing Type Distribution</h3>
                  <div className="h-72">
                    {chartData && chartData.listingTypeDistribution.labels.length > 0 ? (
                      <Doughnut data={chartData.listingTypeDistribution} options={pieChartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No data available</p>
                          <p className="text-xs mt-1">Run the migration in db/migrations/fix_analytics_charts.sql</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">New Listings Trend</h3>
                  <div className="h-72">
                    {chartData && chartData.listingsTrend.labels.length > 0 ? (
                      <Bar data={chartData.listingsTrend} options={stackedBarOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No data available</p>
                          <p className="text-xs mt-1">Run the migration in db/migrations/fix_analytics_charts.sql</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
                  <div className="h-72">{chartData && <Line data={chartData.salesTrend} options={chartOptions} />}</div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
                  <div className="h-72">
                    {chartData && chartData.userGrowth.labels.length > 0 ? (
                      <Line data={chartData.userGrowth} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No data available</p>
                          <p className="text-xs mt-1">Run the migration in db/migrations/fix_analytics_charts.sql</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Car Condition</h3>
                  <div className="h-64">{chartData && <Pie data={chartData.inventoryCondition} options={pieChartOptions} />}</div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Transmission Types</h3>
                  <div className="h-64">{chartData && <Pie data={chartData.transmissionDistribution} options={pieChartOptions} />}</div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Drivetrain</h3>
                  <div className="h-64">{chartData && <Pie data={chartData.drivetrainDistribution} options={pieChartOptions} />}</div>
                </div>
              </div>

              {/* Price Distribution */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Price Distribution</h3>
                  <div className="h-72">
                    {chartData && chartData.priceDistribution.labels.length > 0 ? (
                      <Bar data={chartData.priceDistribution} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No data available</p>
                          <p className="text-xs mt-1">Run the migration in db/migrations/fix_analytics_charts.sql</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Dealerships */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Dealerships by Listing Type</h3>
                  <div className="h-96">{chartData && <Bar data={chartData.topDealerships} options={{ ...chartOptions, indexAxis: "y" as const }} />}</div>
                </div>
              </div>

              {/* Top Listings by Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Cars for Sale</h3>
                  <div className="space-y-3">
                    {analytics.top_cars?.slice(0, 5).map((car, idx) => (
                      <div key={car.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                        <div className="flex items-center">
                          <span className="text-indigo-400 font-bold mr-3 w-5">{idx + 1}</span>
                          <div><p className="text-white text-sm font-medium">{car.make} {car.model}</p><p className="text-gray-400 text-xs">{car.year} • {formatCurrency(car.price)}</p></div>
                        </div>
                        <div className="text-right"><p className="text-cyan-400 text-sm">{formatNumber(car.views)} views</p><p className="text-rose-400 text-xs">{formatNumber(car.likes)} likes</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Cars for Rent</h3>
                  <div className="space-y-3">
                    {analytics.top_rentals?.slice(0, 5).map((car, idx) => (
                      <div key={car.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                        <div className="flex items-center">
                          <span className="text-teal-400 font-bold mr-3 w-5">{idx + 1}</span>
                          <div><p className="text-white text-sm font-medium">{car.make} {car.model}</p><p className="text-gray-400 text-xs">{car.year} • {formatCurrency(car.price)}/{car.rental_period}</p></div>
                        </div>
                        <div className="text-right"><p className="text-cyan-400 text-sm">{formatNumber(car.views)} views</p><p className="text-rose-400 text-xs">{formatNumber(car.likes)} likes</p></div>
                      </div>
                    ))}
                    {(!analytics.top_rentals || analytics.top_rentals.length === 0) && <p className="text-gray-500 text-center py-4">No rental listings yet</p>}
                  </div>
                </div>
                {/* <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Number Plates</h3>
                  <div className="space-y-3">
                    {analytics.top_plates?.slice(0, 5).map((plate, idx) => (
                      <div key={plate.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                        <div className="flex items-center">
                          <span className="text-amber-400 font-bold mr-3 w-5">{idx + 1}</span>
                          <div><p className="text-white text-sm font-medium">{plate.letter} {plate.digits}</p><p className="text-gray-400 text-xs">{formatCurrency(plate.price)}</p></div>
                        </div>
                        <div className="text-right"><p className="text-cyan-400 text-sm">{formatNumber(plate.views)} views</p><span className={`text-xs px-2 py-0.5 rounded ${plate.status === "available" ? "bg-emerald-500/20 text-emerald-400" : plate.status === "sold" ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"}`}>{plate.status}</span></div>
                      </div>
                    ))}
                    {(!analytics.top_plates || analytics.top_plates.length === 0) && <p className="text-gray-500 text-center py-4">No plates yet</p>}
                  </div>
                </div> */}
              </div>

              {/* Geographic Distribution */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
                  <div className="h-80">
                    {chartData && chartData.geographicalData.labels.length > 0 ? (
                      <Bar data={chartData.geographicalData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No data available</p>
                          <p className="text-xs mt-1">Run the migration in db/migrations/fix_analytics_charts.sql</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Engagement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Viewers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700/30"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Views</th></tr></thead>
                      <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                        {analytics.user_engagement?.top_viewers?.map((v) => (
                          <tr key={v.id} className="hover:bg-gray-700/30"><td className="px-4 py-3 text-sm font-medium text-white">{v.name || "Unknown"}</td><td className="px-4 py-3 text-sm text-gray-300">{v.email || "N/A"}</td><td className="px-4 py-3 text-sm text-right text-cyan-400 font-semibold">{v.views_count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Likers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700/30"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Likes</th></tr></thead>
                      <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                        {analytics.user_engagement?.top_likers?.map((l) => (
                          <tr key={l.id} className="hover:bg-gray-700/30"><td className="px-4 py-3 text-sm font-medium text-white">{l.name || "Unknown"}</td><td className="px-4 py-3 text-sm text-gray-300">{l.email || "N/A"}</td><td className="px-4 py-3 text-sm text-right text-rose-400 font-semibold">{l.likes_count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Regional Highlights */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Regional Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.geographical_data?.slice(0, 6).map((region) => (
                      <div key={region.name} className="p-4 rounded-lg bg-gray-700/30 flex justify-between items-center">
                        <div>
                          <div className="flex items-center"><MapPinIcon className="h-4 w-4 text-gray-400 mr-1.5" /><h4 className="text-white font-medium">{region.name}</h4></div>
                          <div className="mt-1 text-sm text-gray-400">{region.listings} listings, {region.sales} sales</div>
                        </div>
                        <div className="text-xl font-bold text-indigo-400">{region.listings > 0 ? ((region.sales / region.listings) * 100).toFixed(1) : 0}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
