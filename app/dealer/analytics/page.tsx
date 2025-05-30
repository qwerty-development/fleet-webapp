"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  HeartIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserGroupIcon,
  VideoCameraIcon,
  DocumentArrowDownIcon,
  LightBulbIcon,
  FunnelIcon,
  FireIcon,
  ChartPieIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { TrendingUpIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

// Types
interface DealershipData {
  id: number;
  name: string;
  subscription_end_date: string;
  user_id: string;
  [key: string]: any;
}

interface AnalyticsData {
  overviewMetrics: {
    totalViews: number;
    totalLikes: number;
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    avgDealTime: number;
    conversionRate: number;
    customerSatisfaction: number;
    viewsChange: number;
    likesChange: number;
    salesChange: number;
    revenueChange: number;
  };
  inventoryMetrics: {
    totalCars: number;
    availableCars: number;
    pendingCars: number;
    soldCars: number;
    newCars: number;
    usedCars: number;
    avgPrice: number;
    totalValue: number;
    avgAge: number;
    turnoverRate: number;
    hotInventory: number;
    staleInventory: number;
  };
  performanceMetrics: {
    avgTimeToSell: number;
    avgProfitMargin: number;
    avgDiscountGiven: number;
    leadConversionRate: number;
    repeatCustomerRate: number;
    avgViewsPerSale: number;
    bestSellingMake: string;
    bestSellingCategory: string;
    peakSellingDay: string;
    peakSellingHour: number;
  };
  customerMetrics: {
    totalUniqueViewers: number;
    avgViewsPerCustomer: number;
    engagementRate: number;
    mostViewedMake: string;
    mostLikedCategory: string;
    avgCustomerAge: number;
    topLocation: string;
    mobileVsDesktop: { mobile: number; desktop: number };
  };
  autoClipsMetrics: {
    totalClips: number;
    totalClipViews: number;
    totalClipLikes: number;
    avgViewsPerClip: number;
    conversionFromClips: number;
    topPerformingClip: any;
    clipEngagementRate: number;
  };
  financialMetrics: {
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    netProfit: number;
    roi: number;
    avgDealSize: number;
    profitPerCar: number;
    revenuePerDay: number;
  };
}

interface TimeSeriesData {
  date: string;
  views: number;
  likes: number;
  sales: number;
  revenue: number;
  profit: number;
  leads: number;
  conversions: number;
}

interface InsightData {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  priority: number;
}

// Constants
const SUBSCRIPTION_WARNING_DAYS = 7;
const STALE_INVENTORY_DAYS = 60;
const HOT_INVENTORY_THRESHOLD = 50; // views

// Chart color schemes
const CHART_COLORS = {
  primary: "#6366F1",
  secondary: "#10B981",
  accent: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  purple: "#8B5CF6",
  pink: "#EC4899",
  gray: "#6B7280",
};

const GRADIENT_COLORS = [
  { start: "#6366F1", end: "#4F46E5" },
  { start: "#10B981", end: "#059669" },
  { start: "#F59E0B", end: "#D97706" },
  { start: "#EF4444", end: "#DC2626" },
  { start: "#8B5CF6", end: "#7C3AED" },
];

export default function DealerAnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealership, setDealership] = useState<DealershipData | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("year");
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "customers" | "financial" | "autoclips">("overview");
  
  // Analytics Data States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [inventoryAging, setInventoryAging] = useState<any[]>([]);
  const [priceDistribution, setPriceDistribution] = useState<any[]>([]);
  const [customerBehavior, setCustomerBehavior] = useState<any[]>([]);
  const [salesFunnel, setSalesFunnel] = useState<any[]>([]);
  const [makePerformance, setMakePerformance] = useState<any[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<any[]>([]);
  const [geographicData, setGeographicData] = useState<any[]>([]);
  const [autoClipsPerformance, setAutoClipsPerformance] = useState<any[]>([]);
  const [profitMargins, setProfitMargins] = useState<any[]>([]);

  // Fetch comprehensive analytics data
  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Get dealership
      const { data: dealershipData, error: dealershipError } = await supabase
        .from("dealerships")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (dealershipError) throw dealershipError;
      setDealership(dealershipData);

      // Calculate date ranges
      const endDate = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();
      let previousEndDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      previousStartDate.setFullYear(startDate.getFullYear() - 1);
      previousEndDate.setFullYear(endDate.getFullYear() - 1);

      // Fetch all cars data with detailed information
      const { data: allCars, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .eq("dealership_id", dealershipData.id)
        .order("listed_at", { ascending: false });

      if (carsError) throw carsError;

      // Fetch AutoClips data
      const { data: autoClips, error: clipsError } = await supabase
        .from("auto_clips")
        .select("*")
        .eq("dealership_id", dealershipData.id);

      if (clipsError) throw clipsError;

      // Process analytics data
      const analytics = processAnalyticsData(
        allCars || [],
        autoClips || [],
        startDate,
        endDate,
        previousStartDate,
        previousEndDate
      );

      setAnalyticsData(analytics);

      // Generate time series data
      const timeSeries = generateTimeSeriesData(
        allCars || [],
        startDate,
        endDate,
        period
      );
      setTimeSeriesData(timeSeries);

      // Generate insights
      const generatedInsights = generateInsights(analytics, allCars || []);
      setInsights(generatedInsights);

      // Generate specialized visualizations data
      generateVisualizationData(allCars || [], autoClips || []);

    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, supabase, period]);

  // Process raw data into analytics metrics
  const processAnalyticsData = (
    cars: any[],
    clips: any[],
    startDate: Date,
    endDate: Date,
    prevStartDate: Date,
    prevEndDate: Date
  ): AnalyticsData => {
    // Current period cars
    const currentCars = cars.filter(car => {
      const listedDate = new Date(car.listed_at);
      return listedDate >= startDate && listedDate <= endDate;
    });

    // Previous period cars
    const previousCars = cars.filter(car => {
      const listedDate = new Date(car.listed_at);
      return listedDate >= prevStartDate && listedDate <= prevEndDate;
    });

    // Calculate metrics for current period
    const currentMetrics = calculatePeriodMetrics(currentCars, cars);
    const previousMetrics = calculatePeriodMetrics(previousCars, cars);

    // Calculate changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // AutoClips metrics
    const clipMetrics = calculateAutoClipsMetrics(clips, cars);

    // Customer metrics
    const customerMetrics = calculateCustomerMetrics(cars);

    // Financial metrics
    const financialMetrics = calculateFinancialMetrics(cars, currentCars);

    return {
      overviewMetrics: {
        totalViews: currentMetrics.totalViews,
        totalLikes: currentMetrics.totalLikes,
        totalSales: currentMetrics.totalSales,
        totalRevenue: currentMetrics.totalRevenue,
        totalProfit: currentMetrics.totalProfit,
        avgDealTime: currentMetrics.avgDealTime,
        conversionRate: currentMetrics.conversionRate,
        customerSatisfaction: 4.5, // This would come from reviews/ratings
        viewsChange: calculateChange(currentMetrics.totalViews, previousMetrics.totalViews),
        likesChange: calculateChange(currentMetrics.totalLikes, previousMetrics.totalLikes),
        salesChange: calculateChange(currentMetrics.totalSales, previousMetrics.totalSales),
        revenueChange: calculateChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
      },
      inventoryMetrics: calculateInventoryMetrics(cars),
      performanceMetrics: calculatePerformanceMetrics(cars, currentCars),
      customerMetrics,
      autoClipsMetrics: clipMetrics,
      financialMetrics,
    };
  };

  // Calculate period-specific metrics
  const calculatePeriodMetrics = (periodCars: any[], allCars: any[]) => {
    const totalViews = periodCars.reduce((sum, car) => sum + (car.views || 0), 0);
    const totalLikes = periodCars.reduce((sum, car) => sum + (car.likes || 0), 0);
    const soldCars = periodCars.filter(car => car.status === "sold");
    const totalSales = soldCars.length;
    const totalRevenue = soldCars.reduce((sum, car) => sum + (car.sold_price || car.price || 0), 0);
    const totalCost = soldCars.reduce((sum, car) => sum + (car.bought_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    // Average deal time
    const dealTimes = soldCars.map(car => {
      if (car.date_sold && car.listed_at) {
        const sold = new Date(car.date_sold);
        const listed = new Date(car.listed_at);
        return (sold.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24);
      }
      return 0;
    }).filter(days => days > 0);

    const avgDealTime = dealTimes.length > 0
      ? dealTimes.reduce((sum, days) => sum + days, 0) / dealTimes.length
      : 0;

    // Conversion rate
    const uniqueViewers = new Set(
      allCars.flatMap(car => car.viewed_users || [])
    ).size;
    const conversionRate = uniqueViewers > 0 ? (totalSales / uniqueViewers) * 100 : 0;

    return {
      totalViews,
      totalLikes,
      totalSales,
      totalRevenue,
      totalProfit,
      avgDealTime,
      conversionRate,
    };
  };

  // Calculate inventory metrics
  const calculateInventoryMetrics = (cars: any[]) => {
    const now = new Date();
    const availableCars = cars.filter(car => car.status === "available");
    const pendingCars = cars.filter(car => car.status === "pending");
    const soldCars = cars.filter(car => car.status === "sold");

    // Calculate inventory age
    const inventoryAges = availableCars.map(car => {
      const listed = new Date(car.listed_at);
      return (now.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24);
    });

    const avgAge = inventoryAges.length > 0
      ? inventoryAges.reduce((sum, age) => sum + age, 0) / inventoryAges.length
      : 0;

    // Hot and stale inventory
    const hotInventory = availableCars.filter(car => car.views >= HOT_INVENTORY_THRESHOLD).length;
    const staleInventory = availableCars.filter(car => {
      const listed = new Date(car.listed_at);
      const daysListed = (now.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24);
      return daysListed > STALE_INVENTORY_DAYS;
    }).length;

    // Turnover rate (annualized)
    const totalDays = 365;
    const soldInPeriod = soldCars.filter(car => {
      if (car.date_sold) {
        const soldDate = new Date(car.date_sold);
        const daysAgo = (now.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= totalDays;
      }
      return false;
    }).length;

    const avgInventory = cars.length;
    const turnoverRate = avgInventory > 0 ? (soldInPeriod / avgInventory) : 0;

    return {
      totalCars: cars.length,
      availableCars: availableCars.length,
      pendingCars: pendingCars.length,
      soldCars: soldCars.length,
      newCars: cars.filter(car => car.condition === "New").length,
      usedCars: cars.filter(car => car.condition === "Used").length,
      avgPrice: availableCars.length > 0
        ? availableCars.reduce((sum, car) => sum + (car.price || 0), 0) / availableCars.length
        : 0,
      totalValue: availableCars.reduce((sum, car) => sum + (car.price || 0), 0),
      avgAge,
      turnoverRate,
      hotInventory,
      staleInventory,
    };
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = (allCars: any[], periodCars: any[]) => {
    const soldCars = allCars.filter(car => car.status === "sold");
    const periodSoldCars = periodCars.filter(car => car.status === "sold");

    // Average profit margin
    const profitMargins = soldCars.map(car => {
      const revenue = car.sold_price || car.price || 0;
      const cost = car.bought_price || 0;
      return cost > 0 ? ((revenue - cost) / revenue) * 100 : 0;
    }).filter(margin => margin > 0);

    const avgProfitMargin = profitMargins.length > 0
      ? profitMargins.reduce((sum, margin) => sum + margin, 0) / profitMargins.length
      : 0;

    // Average discount given
    const discounts = soldCars.map(car => {
      const listed = car.price || 0;
      const sold = car.sold_price || listed;
      return listed > 0 ? ((listed - sold) / listed) * 100 : 0;
    }).filter(discount => discount >= 0);

    const avgDiscountGiven = discounts.length > 0
      ? discounts.reduce((sum, discount) => sum + discount, 0) / discounts.length
      : 0;

    // Lead conversion rate
    const totalLeads = new Set(
      allCars.flatMap(car => car.viewed_users || [])
    ).size;
    const conversions = soldCars.length;
    const leadConversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

    // Best selling make
    const makeSales: Record<string, number> = {};
    soldCars.forEach(car => {
      makeSales[car.make] = (makeSales[car.make] || 0) + 1;
    });
    const bestSellingMake = Object.entries(makeSales)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Best selling category
    const categorySales: Record<string, number> = {};
    soldCars.forEach(car => {
      const category = car.category || "Other";
      categorySales[category] = (categorySales[category] || 0) + 1;
    });
    const bestSellingCategory = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Peak selling patterns
    const salesByDay: Record<string, number> = {};
    const salesByHour: Record<number, number> = {};

    soldCars.forEach(car => {
      if (car.date_sold) {
        const date = new Date(car.date_sold);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = date.getHours();
        
        salesByDay[dayName] = (salesByDay[dayName] || 0) + 1;
        salesByHour[hour] = (salesByHour[hour] || 0) + 1;
      }
    });

    const peakSellingDay = Object.entries(salesByDay)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const peakSellingHour = parseInt(
      Object.entries(salesByHour)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "12"
    );

    // Average views per sale
    const avgViewsPerSale = periodSoldCars.length > 0
      ? periodSoldCars.reduce((sum, car) => sum + (car.views || 0), 0) / periodSoldCars.length
      : 0;

    return {
      avgTimeToSell: calculateAvgTimeToSell(soldCars),
      avgProfitMargin,
      avgDiscountGiven,
      leadConversionRate,
      repeatCustomerRate: 15, // This would need buyer tracking
      avgViewsPerSale,
      bestSellingMake,
      bestSellingCategory,
      peakSellingDay,
      peakSellingHour,
    };
  };

  // Calculate average time to sell
  const calculateAvgTimeToSell = (soldCars: any[]) => {
    const sellTimes = soldCars.map(car => {
      if (car.date_sold && car.listed_at) {
        const sold = new Date(car.date_sold);
        const listed = new Date(car.listed_at);
        return (sold.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24);
      }
      return 0;
    }).filter(days => days > 0);

    return sellTimes.length > 0
      ? sellTimes.reduce((sum, days) => sum + days, 0) / sellTimes.length
      : 0;
  };

  // Calculate customer metrics
  const calculateCustomerMetrics = (cars: any[]) => {
    // Unique viewers
    const allViewers = cars.flatMap(car => car.viewed_users || []);
    const uniqueViewers = new Set(allViewers);
    const totalUniqueViewers = uniqueViewers.size;

    // Average views per customer
    const viewerCounts: Record<string, number> = {};
    allViewers.forEach(viewer => {
      viewerCounts[viewer] = (viewerCounts[viewer] || 0) + 1;
    });
    const avgViewsPerCustomer = totalUniqueViewers > 0
      ? allViewers.length / totalUniqueViewers
      : 0;

    // Engagement rate (viewers who also liked)
    const allLikers = new Set(cars.flatMap(car => car.liked_users || []));
    const engagementRate = totalUniqueViewers > 0
      ? (allLikers.size / totalUniqueViewers) * 100
      : 0;

    // Most viewed make
    const makeViews: Record<string, number> = {};
    cars.forEach(car => {
      makeViews[car.make] = (makeViews[car.make] || 0) + (car.views || 0);
    });
    const mostViewedMake = Object.entries(makeViews)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Most liked category
    const categoryLikes: Record<string, number> = {};
    cars.forEach(car => {
      const category = car.category || "Other";
      categoryLikes[category] = (categoryLikes[category] || 0) + (car.likes || 0);
    });
    const mostLikedCategory = Object.entries(categoryLikes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      totalUniqueViewers,
      avgViewsPerCustomer,
      engagementRate,
      mostViewedMake,
      mostLikedCategory,
      avgCustomerAge: 35, // Would need user demographics
      topLocation: "Metro Area", // Would need user location data
      mobileVsDesktop: { mobile: 65, desktop: 35 }, // Would need device tracking
    };
  };

  // Calculate AutoClips metrics
  const calculateAutoClipsMetrics = (clips: any[], cars: any[]) => {
    const totalClips = clips.length;
    const totalClipViews = clips.reduce((sum, clip) => sum + (clip.views || 0), 0);
    const totalClipLikes = clips.reduce((sum, clip) => sum + (clip.likes || 0), 0);
    const avgViewsPerClip = totalClips > 0 ? totalClipViews / totalClips : 0;

    // Find cars that were featured in clips and sold
    const clippedCarIds = clips.map(clip => clip.car_id);
    const soldClippedCars = cars.filter(car => 
      clippedCarIds.includes(car.id) && car.status === "sold"
    );
    const conversionFromClips = clippedCarIds.length > 0
      ? (soldClippedCars.length / clippedCarIds.length) * 100
      : 0;

    // Top performing clip
    const topPerformingClip = clips.sort((a, b) => 
      (b.views || 0) + (b.likes || 0) - (a.views || 0) - (a.likes || 0)
    )[0] || null;

    // Engagement rate
    const totalEngagements = totalClipLikes;
    const clipEngagementRate = totalClipViews > 0
      ? (totalEngagements / totalClipViews) * 100
      : 0;

    return {
      totalClips,
      totalClipViews,
      totalClipLikes,
      avgViewsPerClip,
      conversionFromClips,
      topPerformingClip,
      clipEngagementRate,
    };
  };

  // Calculate financial metrics
  const calculateFinancialMetrics = (allCars: any[], periodCars: any[]) => {
    const soldCars = allCars.filter(car => car.status === "sold");
    const periodSoldCars = periodCars.filter(car => car.status === "sold");

    const totalCost = soldCars.reduce((sum, car) => sum + (car.bought_price || 0), 0);
    const totalRevenue = soldCars.reduce((sum, car) => sum + (car.sold_price || car.price || 0), 0);
    const grossProfit = totalRevenue - totalCost;
    const operatingExpenses = totalRevenue * 0.15; // Estimated 15% operating expenses
    const netProfit = grossProfit - operatingExpenses;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    const avgDealSize = periodSoldCars.length > 0
      ? periodSoldCars.reduce((sum, car) => sum + (car.sold_price || car.price || 0), 0) / periodSoldCars.length
      : 0;

    const profitPerCar = soldCars.length > 0 ? netProfit / soldCars.length : 0;

    // Revenue per day calculation
    const daysSinceFirstSale = soldCars.length > 0
      ? (() => {
          const firstSaleDate = new Date(
            Math.min(...soldCars
              .filter(car => car.date_sold)
              .map(car => new Date(car.date_sold).getTime())
            )
          );
          return (new Date().getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24);
        })()
      : 1;

    const revenuePerDay = daysSinceFirstSale > 0 ? totalRevenue / daysSinceFirstSale : 0;

    return {
      totalCost,
      totalRevenue,
      grossProfit,
      netProfit,
      roi,
      avgDealSize,
      profitPerCar,
      revenuePerDay,
    };
  };

  // Generate time series data
  const generateTimeSeriesData = (
    cars: any[],
    startDate: Date,
    endDate: Date,
    period: string
  ): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const current = new Date(startDate);

    // Determine interval based on period
    let intervalDays = 30;

    while (current <= endDate) {
      const nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      // Filter data for this interval
      const intervalCars = cars.filter(car => {
        const carDate = new Date(car.listed_at);
        return carDate >= current && carDate < nextDate;
      });

      const intervalSoldCars = cars.filter(car => {
        if (car.date_sold) {
          const soldDate = new Date(car.date_sold);
          return soldDate >= current && soldDate < nextDate;
        }
        return false;
      });

      // Calculate metrics for this interval
      const views = intervalCars.reduce((sum, car) => sum + (car.views || 0), 0);
      const likes = intervalCars.reduce((sum, car) => sum + (car.likes || 0), 0);
      const sales = intervalSoldCars.length;
      const revenue = intervalSoldCars.reduce((sum, car) => sum + (car.sold_price || car.price || 0), 0);
      const cost = intervalSoldCars.reduce((sum, car) => sum + (car.bought_price || 0), 0);
      const profit = revenue - cost;

      // Count unique viewers as leads
      const leads = new Set(
        intervalCars.flatMap(car => car.viewed_users || [])
      ).size;

      data.push({
        date: current.toISOString(),
        views,
        likes,
        sales,
        revenue,
        profit,
        leads,
        conversions: sales,
      });

      current.setDate(current.getDate() + intervalDays);
    }

    return data;
  };

  // Generate insights based on analytics data
  const generateInsights = (analytics: AnalyticsData, cars: any[]): InsightData[] => {
    const insights: InsightData[] = [];

    // Revenue insights
    if (analytics.overviewMetrics.revenueChange > 20) {
      insights.push({
        type: 'success',
        title: 'Revenue Growth',
        description: `Revenue increased by ${analytics.overviewMetrics.revenueChange.toFixed(1)}% compared to last ${period}`,
        metric: `+${analytics.overviewMetrics.revenueChange.toFixed(1)}%`,
        priority: 1,
      });
    } else if (analytics.overviewMetrics.revenueChange < -10) {
      insights.push({
        type: 'danger',
        title: 'Revenue Decline',
        description: `Revenue decreased by ${Math.abs(analytics.overviewMetrics.revenueChange).toFixed(1)}% compared to last ${period}`,
        metric: `${analytics.overviewMetrics.revenueChange.toFixed(1)}%`,
        action: 'Review pricing strategy and marketing efforts',
        priority: 1,
      });
    }

    // Inventory insights
    if (analytics.inventoryMetrics.staleInventory > 5) {
      insights.push({
        type: 'warning',
        title: 'Stale Inventory Alert',
        description: `${analytics.inventoryMetrics.staleInventory} vehicles have been listed for over ${STALE_INVENTORY_DAYS} days`,
        action: 'Consider price adjustments or promotional campaigns',
        priority: 2,
      });
    }

    // Hot inventory
    if (analytics.inventoryMetrics.hotInventory > 0) {
      insights.push({
        type: 'info',
        title: 'Hot Inventory',
        description: `${analytics.inventoryMetrics.hotInventory} vehicles are getting high interest with ${HOT_INVENTORY_THRESHOLD}+ views`,
        action: 'Follow up with interested customers',
        priority: 3,
      });
    }

    // Conversion rate insights
    if (analytics.overviewMetrics.conversionRate < 2) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Only ${analytics.overviewMetrics.conversionRate.toFixed(1)}% of viewers are converting to sales`,
        action: 'Improve listing quality and customer engagement',
        priority: 2,
      });
    }

    // AutoClips performance
    if (analytics.autoClipsMetrics.totalClips > 0 && analytics.autoClipsMetrics.conversionFromClips > 30) {
      insights.push({
        type: 'success',
        title: 'AutoClips Driving Sales',
        description: `${analytics.autoClipsMetrics.conversionFromClips.toFixed(1)}% of cars with AutoClips have sold`,
        action: 'Create more AutoClips for popular inventory',
        priority: 3,
      });
    }

    // Profit margin insights
    if (analytics.performanceMetrics.avgProfitMargin < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Profit Margins',
        description: `Average profit margin is only ${analytics.performanceMetrics.avgProfitMargin.toFixed(1)}%`,
        action: 'Review buying prices and negotiate better deals',
        priority: 2,
      });
    }

    // Best performing insights
    insights.push({
      type: 'info',
      title: 'Best Performers',
      description: `${analytics.performanceMetrics.bestSellingMake} is your top selling make, ${analytics.performanceMetrics.bestSellingCategory} is the most popular category`,
      action: 'Stock more of these high-demand vehicles',
      priority: 4,
    });

    // Customer engagement
    if (analytics.customerMetrics.engagementRate > 20) {
      insights.push({
        type: 'success',
        title: 'High Customer Engagement',
        description: `${analytics.customerMetrics.engagementRate.toFixed(1)}% of viewers are liking vehicles`,
        priority: 4,
      });
    }

    // Sort by priority
    return insights.sort((a, b) => a.priority - b.priority);
  };

  // Generate visualization data
  const generateVisualizationData = (cars: any[], clips: any[]) => {
    // Inventory aging
    const agingData = [
      { name: '0-30 days', value: 0, color: CHART_COLORS.success },
      { name: '31-60 days', value: 0, color: CHART_COLORS.warning },
      { name: '61-90 days', value: 0, color: CHART_COLORS.purple },
      { name: '90+ days', value: 0, color: CHART_COLORS.danger },
    ];

    const now = new Date();
    cars.filter(car => car.status === "available").forEach(car => {
      const listed = new Date(car.listed_at);
      const days = (now.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24);
      
      if (days <= 30) agingData[0].value++;
      else if (days <= 60) agingData[1].value++;
      else if (days <= 90) agingData[2].value++;
      else agingData[3].value++;
    });

    setInventoryAging(agingData);

    // Price distribution
    const priceRanges = [
      { range: '$0-20k', min: 0, max: 20000, count: 0 },
      { range: '$20k-40k', min: 20000, max: 40000, count: 0 },
      { range: '$40k-60k', min: 40000, max: 60000, count: 0 },
      { range: '$60k-80k', min: 60000, max: 80000, count: 0 },
      { range: '$80k+', min: 80000, max: Infinity, count: 0 },
    ];

    cars.forEach(car => {
      const price = car.price || 0;
      const range = priceRanges.find(r => price >= r.min && price < r.max);
      if (range) range.count++;
    });

    setPriceDistribution(priceRanges.map(r => ({
      name: r.range,
      value: r.count,
    })));

    // Sales funnel
    const uniqueViewers = new Set(cars.flatMap(car => car.viewed_users || [])).size;
    const uniqueLikers = new Set(cars.flatMap(car => car.liked_users || [])).size;
    const testDrives = Math.floor(uniqueLikers * 0.3); // Estimated
    const negotiations = Math.floor(testDrives * 0.7); // Estimated
    const sales = cars.filter(car => car.status === "sold").length;

    setSalesFunnel([
      { stage: 'Views', value: uniqueViewers, fill: CHART_COLORS.primary },
      { stage: 'Likes', value: uniqueLikers, fill: CHART_COLORS.info },

      { stage: 'Sales', value: sales, fill: CHART_COLORS.success },
    ]);

    // Make performance
    const makeData: Record<string, { views: number; sales: number; revenue: number }> = {};
    
    cars.forEach(car => {
      if (!makeData[car.make]) {
        makeData[car.make] = { views: 0, sales: 0, revenue: 0 };
      }
      
      makeData[car.make].views += car.views || 0;
      
      if (car.status === "sold") {
        makeData[car.make].sales++;
        makeData[car.make].revenue += car.sold_price || car.price || 0;
      }
    });

    const makePerf = Object.entries(makeData)
      .map(([make, data]) => ({
        make,
        views: data.views,
        sales: data.sales,
        revenue: data.revenue,
        conversionRate: data.views > 0 ? (data.sales / data.views) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setMakePerformance(makePerf);

    // Category trends over time
    const categoryData: Record<string, Record<string, number>> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    cars.forEach(car => {
      const category = car.category || 'Other';
      const month = new Date(car.listed_at).getMonth();
      const monthName = months[month];
      
      if (!categoryData[monthName]) {
        categoryData[monthName] = {};
      }
      
      categoryData[monthName][category] = (categoryData[monthName][category] || 0) + 1;
    });

    const categoryTrendData = Object.entries(categoryData).map(([month, categories]) => ({
      month,
      ...categories,
    }));

    setCategoryTrends(categoryTrendData);

    // Hourly activity heatmap
    const hourlyData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    cars.forEach(car => {
      (car.viewed_users || []).forEach((userId: string) => {
        // Simulate view times (in real app, you'd track actual view timestamps)
        const randomDay = Math.floor(Math.random() * 7);
        const randomHour = Math.floor(Math.random() * 24);
        hourlyData[randomDay][randomHour]++;
      });
    });

    const heatmapData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData.push({
          day: days[day],
          hour,
          value: hourlyData[day][hour],
        });
      }
    }

    setHourlyActivity(heatmapData);

    // AutoClips performance
    const clipPerf = clips.map(clip => {
      const car = cars.find(c => c.id === clip.car_id);
      return {
        title: clip.title,
        views: clip.views,
        likes: clip.likes,
        engagementRate: clip.views > 0 ? (clip.likes / clip.views) * 100 : 0,
        carSold: car?.status === "sold",
      };
    }).sort((a, b) => b.views - a.views);

    setAutoClipsPerformance(clipPerf);

    // Profit margins by category
    const profitData: Record<string, { revenue: number; cost: number; count: number }> = {};
    
    cars.filter(car => car.status === "sold").forEach(car => {
      const category = car.category || 'Other';
      if (!profitData[category]) {
        profitData[category] = { revenue: 0, cost: 0, count: 0 };
      }
      
      profitData[category].revenue += car.sold_price || car.price || 0;
      profitData[category].cost += car.bought_price || 0;
      profitData[category].count++;
    });

    const margins = Object.entries(profitData).map(([category, data]) => ({
      category,
      margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
      avgProfit: data.count > 0 ? (data.revenue - data.cost) / data.count : 0,
    }));

    setProfitMargins(margins);
  };

  // Export functions
  const exportToPDF = useCallback(() => {
    // In a real implementation, you'd use a library like jsPDF or react-pdf
    console.log("Exporting to PDF...");
    alert("PDF export functionality would be implemented here");
  }, []);

  const exportToCSV = useCallback(() => {
    if (!analyticsData) return;

    // Create CSV content
    const headers = ['Metric', 'Value', 'Change %'];
    const rows = [
      ['Total Views', analyticsData.overviewMetrics.totalViews, analyticsData.overviewMetrics.viewsChange.toFixed(1)],
      ['Total Likes', analyticsData.overviewMetrics.totalLikes, analyticsData.overviewMetrics.likesChange.toFixed(1)],
      ['Total Sales', analyticsData.overviewMetrics.totalSales, analyticsData.overviewMetrics.salesChange.toFixed(1)],
      ['Total Revenue', analyticsData.overviewMetrics.totalRevenue, analyticsData.overviewMetrics.revenueChange.toFixed(1)],
      ['Conversion Rate', analyticsData.overviewMetrics.conversionRate.toFixed(1) + '%', 'N/A'],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [analyticsData, period]);

  // Effects
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  // Calculate days until subscription expiration
  const getDaysUntilExpiration = useMemo(() => {
    if (!dealership?.subscription_end_date) return 0;

    const endDate = new Date(dealership.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dealership]);

  // Format functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') || entry.name.includes('Profit') 
                ? formatCurrency(entry.value) 
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render functions for different sections
  const renderOverviewTab = () => (
    <>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Total Views</p>
              <p className="text-gray-800 text-2xl font-bold mt-1">
                {formatNumber(analyticsData?.overviewMetrics.totalViews || 0)}
              </p>
              <div className="flex items-center text-xs mt-2">
                <span className={`flex items-center font-medium ${
                  (analyticsData?.overviewMetrics.viewsChange || 0) >= 0 
                    ? "text-emerald-600" 
                    : "text-rose-600"
                }`}>
                  {(analyticsData?.overviewMetrics.viewsChange || 0) >= 0 ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {formatPercent(analyticsData?.overviewMetrics.viewsChange || 0)}
                </span>
                <span className="ml-2 text-gray-500">vs last {period}</span>
              </div>
            </div>
            <span className="flex items-center justify-center p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <EyeIcon className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-rose-600 text-sm font-medium">Engagement</p>
              <p className="text-gray-800 text-2xl font-bold mt-1">
                {formatNumber(analyticsData?.overviewMetrics.totalLikes || 0)}
              </p>
              <div className="flex items-center text-xs mt-2">
                <span className={`flex items-center font-medium ${
                  (analyticsData?.overviewMetrics.likesChange || 0) >= 0 
                    ? "text-emerald-600" 
                    : "text-rose-600"
                }`}>
                  {(analyticsData?.overviewMetrics.likesChange || 0) >= 0 ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {formatPercent(analyticsData?.overviewMetrics.likesChange || 0)}
                </span>
                <span className="ml-2 text-gray-500">vs last {period}</span>
              </div>
            </div>
            <span className="flex items-center justify-center p-2.5 rounded-xl bg-rose-100 text-rose-500">
              <HeartIcon className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Sales</p>
              <p className="text-gray-800 text-2xl font-bold mt-1">
                {analyticsData?.overviewMetrics.totalSales || 0}
              </p>
              <div className="flex items-center text-xs mt-2">
                <span className={`flex items-center font-medium ${
                  (analyticsData?.overviewMetrics.salesChange || 0) >= 0 
                    ? "text-emerald-600" 
                    : "text-rose-600"
                }`}>
                  {(analyticsData?.overviewMetrics.salesChange || 0) >= 0 ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {formatPercent(analyticsData?.overviewMetrics.salesChange || 0)}
                </span>
                <span className="ml-2 text-gray-500">vs last {period}</span>
              </div>
            </div>
            <span className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <TagIcon className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-600 text-sm font-medium">Revenue</p>
              <p className="text-gray-800 text-2xl font-bold mt-1">
                {formatCurrency(analyticsData?.overviewMetrics.totalRevenue || 0)}
              </p>
              <div className="flex items-center text-xs mt-2">
                <span className={`flex items-center font-medium ${
                  (analyticsData?.overviewMetrics.revenueChange || 0) >= 0 
                    ? "text-emerald-600" 
                    : "text-rose-600"
                }`}>
                  {(analyticsData?.overviewMetrics.revenueChange || 0) >= 0 ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {formatPercent(analyticsData?.overviewMetrics.revenueChange || 0)}
                </span>
                <span className="ml-2 text-gray-500">vs last {period}</span>
              </div>
            </div>
            <span className="flex items-center justify-center p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <CurrencyDollarIcon className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Unique Viewers</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatNumber(analyticsData?.customerMetrics.totalUniqueViewers || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg {analyticsData?.customerMetrics.avgViewsPerCustomer.toFixed(1)} views each
              </p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analyticsData?.customerMetrics.engagementRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Of viewers liked cars</p>
            </div>
            <HeartIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium">Top Interest</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {analyticsData?.customerMetrics.mostViewedMake}
              </p>
              <p className="text-xs text-gray-600 mt-1">Most viewed make</p>
            </div>
            <EyeIcon className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-700 text-sm font-medium">Favorite Category</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {analyticsData?.customerMetrics.mostLikedCategory}
              </p>
              <p className="text-xs text-gray-600 mt-1">Most liked type</p>
            </div>
            <SparklesIcon className="h-10 w-10 text-rose-500" />
          </div>
        </div>
      </div>
      {/* Performance Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue & Profit Trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Profit Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={CHART_COLORS.success}
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS.success, r: 4 }}
                  name="Profit"
                />
                <Bar
                  dataKey="sales"
                  fill={CHART_COLORS.accent}
                  opacity={0.3}
                  name="Sales"
                
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Conversion Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesFunnel} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="category" dataKey="stage" stroke="#6B7280" />
                <YAxis type="number" stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {salesFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
       
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600">Lead Conversion</p>
              <p className="text-xl font-semibold text-gray-800">
                {analyticsData?.overviewMetrics.conversionRate.toFixed(1)}%
              </p>
            </div>
      
          </div>
       
      </div>

      {/* Insights Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-amber-500" />
             Insights
          </h3>
          <span className="text-sm text-gray-500">{insights.length} insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.slice(0, 6).map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                insight.type === 'danger' ? 'bg-rose-50 border-rose-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-medium ${
                  insight.type === 'success' ? 'text-emerald-800' :
                  insight.type === 'warning' ? 'text-amber-800' :
                  insight.type === 'danger' ? 'text-rose-800' :
                  'text-blue-800'
                }`}>
                  {insight.title}
                </h4>
                {insight.metric && (
                  <span className={`text-sm font-semibold ${
                    insight.type === 'success' ? 'text-emerald-600' :
                    insight.type === 'warning' ? 'text-amber-600' :
                    insight.type === 'danger' ? 'text-rose-600' :
                    'text-blue-600'
                  }`}>
                    {insight.metric}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
              {insight.action && (
                <p className="text-xs text-gray-600 italic">
                  <strong>Action:</strong> {insight.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderInventoryTab = () => (
    <>
      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-gray-600 text-sm">Total Inventory</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {analyticsData?.inventoryMetrics.totalCars || 0}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-emerald-700 text-sm">Available</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">
            {analyticsData?.inventoryMetrics.availableCars || 0}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-amber-700 text-sm">Pending</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">
            {analyticsData?.inventoryMetrics.pendingCars || 0}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-blue-700 text-sm">Sold</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {analyticsData?.inventoryMetrics.soldCars || 0}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-purple-700 text-sm">Hot Sale</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">
            {analyticsData?.inventoryMetrics.hotInventory || 0}
          </p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
          <p className="text-rose-700 text-sm">Stale Stock</p>
          <p className="text-2xl font-bold text-rose-800 mt-1">
            {analyticsData?.inventoryMetrics.staleInventory || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory Aging */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Aging</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryAging}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryAging.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {inventoryAging.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Price</span>
              <span className="text-lg font-semibold text-gray-800">
                {formatCurrency(analyticsData?.inventoryMetrics.avgPrice || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="text-lg font-semibold text-gray-800">
                {formatCurrency(analyticsData?.inventoryMetrics.totalValue || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Make Performance Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Make Performance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Make</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Sales</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {makePerformance.map((make, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800 font-medium">{make.make}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700">{formatNumber(make.views)}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700">{make.sales}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700">{formatCurrency(make.revenue)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      make.conversionRate > 5 ? 'bg-emerald-100 text-emerald-800' :
                      make.conversionRate > 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {make.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );



  const renderFinancialTab = () => (
    <>
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium">Gross Profit</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(analyticsData?.financialMetrics.grossProfit || 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                +{((analyticsData?.financialMetrics.grossProfit || 0) / (analyticsData?.financialMetrics.totalRevenue || 1) * 100).toFixed(1)}% margin
              </p>
            </div>
            <TrendingUpIcon className="h-10 w-10 text-emerald-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(analyticsData?.financialMetrics.netProfit || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">After expenses</p>
            </div>
            <BanknotesIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">ROI</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analyticsData?.financialMetrics.roi.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Return on investment</p>
            </div>
            <ChartPieIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium">Avg Deal Size</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(analyticsData?.financialMetrics.avgDealSize || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Per vehicle</p>
            </div>
            <ShoppingCartIcon className="h-10 w-10 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Profit Margins by Category */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit Margins by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitMargins} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="category" stroke="#6B7280" width={80} />
                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                <Bar dataKey="margin" fill={CHART_COLORS.success} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Cost Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#6B7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={CHART_COLORS.success}
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Metrics Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Financial Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Revenue Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(analyticsData?.financialMetrics.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Revenue per Day</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(analyticsData?.financialMetrics.revenuePerDay || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Average Deal Size</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(analyticsData?.financialMetrics.avgDealSize || 0)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Profit Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Cost</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(analyticsData?.financialMetrics.totalCost || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Profit per Car</span>
                <span className="font-medium text-gray-800">
                  {formatCurrency(analyticsData?.financialMetrics.profitPerCar || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Average Discount</span>
                <span className="font-medium text-gray-800">
                  {analyticsData?.performanceMetrics.avgDiscountGiven.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  const renderAutoClipsTab = () => (
    <>
      {/* AutoClips Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Total Clips</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analyticsData?.autoClipsMetrics.totalClips || 0}
              </p>
            </div>
            <VideoCameraIcon className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total Views</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatNumber(analyticsData?.autoClipsMetrics.totalClipViews || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg {analyticsData?.autoClipsMetrics.avgViewsPerClip.toFixed(0)} per clip
              </p>
            </div>
            <EyeIcon className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-700 text-sm font-medium">Engagement</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analyticsData?.autoClipsMetrics.clipEngagementRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Like rate</p>
            </div>
            <HeartIcon className="h-10 w-10 text-rose-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-sm font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {analyticsData?.autoClipsMetrics.conversionFromClips.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Cars sold</p>
            </div>
            <ShoppingCartIcon className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* AutoClips Performance */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">AutoClips Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Likes</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Engagement</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {autoClipsPerformance.slice(0, 10).map((clip, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{clip.title}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700">{formatNumber(clip.views)}</td>
                  <td className="text-right py-3 px-4 text-sm text-gray-700">{formatNumber(clip.likes)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      clip.engagementRate > 10 ? 'bg-emerald-100 text-emerald-800' :
                      clip.engagementRate > 5 ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {clip.engagementRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {clip.carSold ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Sold
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Clip */}
      {analyticsData?.autoClipsMetrics.topPerformingClip && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FireIcon className="h-6 w-6 mr-2" />
            Top Performing AutoClip
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-purple-100 text-sm">Title</p>
              <p className="text-lg font-medium">{analyticsData.autoClipsMetrics.topPerformingClip.title}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total Views</p>
              <p className="text-lg font-medium">{formatNumber(analyticsData.autoClipsMetrics.topPerformingClip.views)}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Engagement Rate</p>
              <p className="text-lg font-medium">
                {((analyticsData.autoClipsMetrics.topPerformingClip.likes / analyticsData.autoClipsMetrics.topPerformingClip.views) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}


    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500">
                Comprehensive insights for {dealership?.name || 'your dealership'}
              </p>
            </div>

            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              {/* Export Buttons */}
              
              <button
                onClick={exportToCSV}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export to CSV"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>

  
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-indigo-500" />
                ) : (
                  <ArrowPathIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Subscription Warning */}
          {dealership?.subscription_end_date &&
            getDaysUntilExpiration <= SUBSCRIPTION_WARNING_DAYS && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center">
                <div className="bg-amber-500 rounded-full p-2 mr-3 flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-amber-700 font-semibold">
                    Subscription expiring soon
                  </h3>
                  <p className="text-amber-600 text-sm">
                    {getDaysUntilExpiration <= 0
                      ? "Your subscription has expired. Please renew to continue using all features."
                      : `${getDaysUntilExpiration} days remaining. Renew now to avoid service interruption.`}
                  </p>
                </div>
                <button className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm">
                  Renew Now
                </button>
              </div>
            )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
              <div className="bg-rose-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Error Loading Analytics
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-lg text-white transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Tabs Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-wrap">
                  {[
                    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                    { id: 'inventory', label: 'Inventory', icon: BuildingStorefrontIcon },
               
                    { id: 'financial', label: 'Financial', icon: CurrencyDollarIcon },
                    { id: 'autoclips', label: 'AutoClips', icon: VideoCameraIcon },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center px-6 py-4 border-b-2 transition-colors font-medium ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5'
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="animate-fadeIn">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'inventory' && renderInventoryTab()}
                
                {activeTab === 'financial' && renderFinancialTab()}
                {activeTab === 'autoclips' && renderAutoClipsTab()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}