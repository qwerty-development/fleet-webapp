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
} from "@heroicons/react/24/outline";
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
} from "recharts";

// Constant for subscription warning threshold
const SUBSCRIPTION_WARNING_DAYS = 7;

export default function DealerAnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealership, setDealership] = useState<any>(null);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  // Analytics data states
  const [overviewStats, setOverviewStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalSales: 0,
    revenue: 0,
    viewsChange: 0,
    likesChange: 0,
    salesChange: 0,
    revenueChange: 0,
  });

  const [viewsData, setViewsData] = useState<any[]>([]);
  const [likesData, setLikesData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [popularCars, setPopularCars] = useState<any[]>([]);
  const [totalCars, setTotalCars] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>("views");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalCars: 0,
    newCars: 0,
    usedCars: 0,
    avgPrice: 0,
    totalValue: 0,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgTimeToSell: 0,
    conversionRate: 0,
    avgSalePrice: 0,
    priceDifference: 0,
  });
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(
    async (isRefresh = false) => {
      if (!user) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        // 1. Get the dealership for this dealer
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (dealershipError) throw dealershipError;
        setDealership(dealershipData);
        setDealershipId(dealershipData.id);

        // 2. Try to fetch analytics data from a server function if it exists
        let analyticsData;
        try {
          // Try to use RPC function if available (like in the mobile app)
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "get_dealer_analytics",
            {
              p_dealership_id: dealershipData.id,
              p_time_range: period,
            }
          );

          if (!rpcError && rpcData) {
            analyticsData = rpcData;

            // If we have RPC data but need to fetch car details for the listings
            if (rpcData.top_viewed_cars) {
              // Count total cars for pagination
              const { count, error: countError } = await supabase
                .from("cars")
                .select("*", { count: "exact", head: true })
                .eq("dealership_id", dealershipData.id);

              if (!countError) {
                setTotalCars(count || 0);
              }

              // Fetch detailed car information for our popular cars
              // This is needed because the RPC only returns basic info
              try {
                // Create a comma-separated list of makes and models to search for
                const makeModelPatterns = rpcData.top_viewed_cars
                  .map((car: any) => `${car.make}.*${car.model}`)
                  .join("|");

                // Get cars matching our top viewed makes and models
                const { data: carDetails, error: carDetailsError } =
                  await supabase
                    .from("cars")
                    .select("*")
                    .eq("dealership_id", dealershipData.id)
                    .or(
                      `make.ilike.${
                        rpcData.top_viewed_cars[0]?.make || "%"
                      }, model.ilike.${
                        rpcData.top_viewed_cars[0]?.model || "%"
                      }`
                    )
                    .order(sortField, { ascending: sortDirection === "asc" })
                    .range((currentPage - 1) * 10, currentPage * 10 - 1);

                if (!carDetailsError && carDetails) {
                  // Map top_viewed_cars to the detailed data if available
                  const enhancedCars = rpcData.top_viewed_cars.map(
                    (topCar: any) => {
                      const match = carDetails.find(
                        (detailCar: any) =>
                          detailCar.make === topCar.make &&
                          detailCar.model === topCar.model &&
                          detailCar.year === topCar.year
                      );

                      return match || topCar;
                    }
                  );

                  // Set as popular cars with filled details
                  setPopularCars(enhancedCars);
                } else {
                  // Fallback to just using the basic data
                  setPopularCars(rpcData.top_viewed_cars);
                }
              } catch (searchError) {
                console.error("Error fetching car details:", searchError);
                // Still use the basic data if detailed search fails
                setPopularCars(rpcData.top_viewed_cars);
              }
            }
          }
        } catch (rpcFallbackError) {
          console.log(
            "RPC function not available, falling back to direct query"
          );
        }

        // 3. If no analytics data from RPC, fetch cars directly
        if (!analyticsData) {
          // Count total cars for pagination
          const { count, error: countError } = await supabase
            .from("cars")
            .select("*", { count: "exact", head: true })
            .eq("dealership_id", dealershipData.id)
            .ilike("make", searchQuery ? `%${searchQuery}%` : "%")
            .or(`model.ilike.%${searchQuery}%`);

          if (!countError) {
            setTotalCars(count || 0);
          }

          // Fetch paginated cars
          const query = supabase
            .from("cars")
            .select("*")
            .eq("dealership_id", dealershipData.id);

          // Apply search if provided
          if (searchQuery) {
            query.or(
              `make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,year.ilike.%${searchQuery}%`
            );
          }

          // Apply sorting
          query.order(sortField, { ascending: sortDirection === "asc" });

          // Apply pagination
          query.range((currentPage - 1) * 10, currentPage * 10 - 1);

          const { data: cars, error: carsError } = await query;

          if (carsError) throw carsError;

          // Set cars for display
          setPopularCars(cars || []);

          // Calculate analytics from car data
          if (cars && cars.length > 0) {
            analyticsData = processCarData(cars);
          } else {
            analyticsData = {
              total_views: 0,
              total_likes: 0,
              total_sales: 0,
              total_revenue: 0,
              cars: [],
            };
          }
        }

        // Process analytics data
        if (analyticsData) {
          processAnalyticsData(analyticsData);
        }
      } catch (err: any) {
        console.error("Error fetching analytics data:", err);
        setError(err.message || "Failed to load analytics data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, supabase, period, currentPage, sortField, sortDirection, searchQuery]
  );

  // Process car data into analytics (fallback method if RPC not available)
  const processCarData = (cars: any[]) => {
    // Mock previous period data for demonstration
    const mockPreviousPeriodMultiplier = Math.random() * 0.4 + 0.7; // 0.7 to 1.1

    const totalViews = cars.reduce((sum, car) => sum + (car.views || 0), 0);
    const totalLikes = cars.reduce((sum, car) => sum + (car.likes || 0), 0);
    const soldCars = cars.filter((car) => car.status === "sold");
    const totalSales = soldCars.length;
    const revenue = soldCars.reduce(
      (sum, car) => sum + (car.sold_price || car.price || 0),
      0
    );

    // Get "previous period" data (mock for this example)
    const previousViews = Math.floor(totalViews * mockPreviousPeriodMultiplier);
    const previousLikes = Math.floor(totalLikes * mockPreviousPeriodMultiplier);
    const previousSales = Math.floor(totalSales * mockPreviousPeriodMultiplier);
    const previousRevenue = Math.floor(revenue * mockPreviousPeriodMultiplier);

    // Generate inventory metrics
    const newCars = cars.filter((car) => car.condition === "New").length;
    const usedCars = cars.filter((car) => car.condition === "Used").length;
    const avgPrice =
      cars.length > 0
        ? cars.reduce((sum, car) => sum + (car.price || 0), 0) / cars.length
        : 0;
    const totalValue = cars.reduce((sum, car) => sum + (car.price || 0), 0);

    // Generate category distribution
    const categories: Record<string, number> = {};
    cars.forEach((car) => {
      const category = car.category || "Other";
      categories[category] = (categories[category] || 0) + 1;
    });

    // Calculate performance metrics
    let avgTimeToSell = 0;
    let avgSalePrice = 0;
    let priceDifference = 0;

    if (soldCars.length > 0) {
      avgTimeToSell =
        soldCars.reduce((sum, car) => {
          const listedDate = new Date(car.listed_at);
          const soldDate = new Date(car.date_sold);
          const daysToSell = Math.floor(
            (soldDate.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + daysToSell;
        }, 0) / soldCars.length;

      avgSalePrice =
        soldCars.reduce((sum, car) => sum + (car.sold_price || car.price), 0) /
        soldCars.length;

      priceDifference =
        soldCars.reduce((sum, car) => {
          const soldPrice = car.sold_price || 0;
          const listedPrice = car.price || 0;
          return sum + (soldPrice - listedPrice);
        }, 0) / soldCars.length;
    }

    const conversionRate = totalViews > 0 ? totalSales / totalViews : 0;

    // Sort cars by views to get popular cars
    const sortedCars = [...cars].sort(
      (a, b) => (b.views || 0) - (a.views || 0)
    );
    const topViewedCars = sortedCars.slice(0, 5);

    // Generate time series data
    const timeSeriesData = generateTimeSeriesData({
      totalViews,
      totalLikes,
      totalSales,
      revenue,
    });

    return {
      total_views: totalViews,
      total_likes: totalLikes,
      total_sales: totalSales,
      total_revenue: revenue,
      views_change:
        previousViews > 0
          ? ((totalViews - previousViews) / previousViews) * 100
          : 0,
      likes_change:
        previousLikes > 0
          ? ((totalLikes - previousLikes) / previousLikes) * 100
          : 0,
      sales_change:
        previousSales > 0
          ? ((totalSales - previousSales) / previousSales) * 100
          : 0,
      revenue_change:
        previousRevenue > 0
          ? ((revenue - previousRevenue) / previousRevenue) * 100
          : 0,
      top_viewed_cars: topViewedCars,
      inventory_summary: {
        total_cars: cars.length,
        new_cars: newCars,
        used_cars: usedCars,
        avg_price: avgPrice,
        total_value: totalValue,
      },
      performance_metrics: {
        avg_time_to_sell: avgTimeToSell,
        conversion_rate: conversionRate,
        avg_sale_price: avgSalePrice,
        price_difference: priceDifference,
      },
      category_distribution: categories,
      time_series_data: timeSeriesData,
      inventory_status: [
        {
          name: "Available",
          value: cars.filter((car) => car.status === "available").length,
        },
        {
          name: "Pending",
          value: cars.filter((car) => car.status === "pending").length,
        },
        {
          name: "Sold",
          value: cars.filter((car) => car.status === "sold").length,
        },
      ],
      cars: cars,
    };
  };

  // Process analytics data from either RPC or direct query
  const processAnalyticsData = (data: any) => {
    if (!data) return;

    // Set overview stats
    setOverviewStats({
      totalViews: data.total_views || 0,
      totalLikes: data.total_likes || 0,
      totalSales: data.total_sales || 0,
      revenue: data.total_revenue || 0,
      viewsChange: data.views_change || 0,
      likesChange: data.likes_change || 0,
      salesChange: data.sales_change || 0,
      revenueChange: data.revenue_change || 0,
    });

    // Set inventory metrics
    if (data.inventory_summary) {
      setInventoryMetrics({
        totalCars: data.inventory_summary.total_cars || 0,
        newCars: data.inventory_summary.new_cars || 0,
        usedCars: data.inventory_summary.used_cars || 0,
        avgPrice: data.inventory_summary.avg_price || 0,
        totalValue: data.inventory_summary.total_value || 0,
      });
    }

    // Set performance metrics
    if (data.performance_metrics) {
      setPerformanceMetrics({
        avgTimeToSell: data.performance_metrics.avg_time_to_sell || 0,
        conversionRate: data.performance_metrics.conversion_rate || 0,
        avgSalePrice: data.performance_metrics.avg_sale_price || 0,
        priceDifference: data.performance_metrics.price_difference || 0,
      });
    }

    // Set category distribution
    if (data.category_distribution) {
      const categories = Object.entries(data.category_distribution).map(
        ([name, value]) => ({
          name,
          value,
          color: getCategoryColor(name),
        })
      );
      setCategoryDistribution(categories);
    }

    // Set inventory status data
    if (data.inventory_status) {
      setInventoryData(data.inventory_status);
    } else if (data.cars) {
      const cars = data.cars;
      const inventoryStatus = [
        {
          name: "Available",
          value: cars.filter((car: any) => car.status === "available").length,
        },
        {
          name: "Pending",
          value: cars.filter((car: any) => car.status === "pending").length,
        },
        {
          name: "Sold",
          value: cars.filter((car: any) => car.status === "sold").length,
        },
      ];
      setInventoryData(inventoryStatus);
    }

    // Set popular cars with proper id handling for both data sources
    if (data.top_viewed_cars) {
      // When using the RPC function, we need to fetch additional car details
      // since top_viewed_cars only has make, model, year, and views
      const processedCars = data.top_viewed_cars.map(
        (car: any, index: number) => ({
          ...car,
          id: car.id || `top-${index}`, // Ensure we have some unique identifier
          // We don't have these fields in the RPC result, so we mark them as undefined
          // The UI will handle displaying appropriate fallbacks
          price: undefined,
          status: undefined,
          likes: car.likes || 0,
        })
      );

      setPopularCars(processedCars);

      // Optional: If we have car ids, we could fetch additional details in a secondary query
      // This would require implementing a batch fetch operation
    } else if (data.cars) {
      // When using direct query, we already have all car details
      const sorted = [...data.cars].sort(
        (a, b) => (b.views || 0) - (a.views || 0)
      );
      setPopularCars(sorted.slice(0, 10)); // Show more cars for better pagination demonstration
    }

    // Set time series data
    if (data.time_series_data) {
      // Process time series data if available
      const viewsData = data.time_series_data.map((item: any) => ({
        name: formatDate(item.date),
        views: item.views,
      }));

      const likesData = data.time_series_data.map((item: any) => ({
        name: formatDate(item.date),
        likes: item.likes,
      }));

      const salesData = data.time_series_data.map((item: any) => ({
        name: formatDate(item.date),
        sales: item.sales || 0,
        revenue: item.revenue || 0,
      }));

      setViewsData(viewsData);
      setLikesData(likesData);
      setSalesData(salesData);
    } else {
      // Generate mock time series data if not available
      const { viewsData, likesData, salesData } =
        generateTimeSeriesDataSets(overviewStats);
      setViewsData(viewsData);
      setLikesData(likesData);
      setSalesData(salesData);
    }
  };

  // Generate time series data based on selected period
  const generateTimeSeriesData = (stats: any) => {
    let timeLabels: string[] = [];
    const now = new Date();

    // Generate appropriate time labels based on period
    if (period === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        timeLabels.push(date.toISOString().split("T")[0]);
      }
    } else if (period === "month") {
      // Last 30 days, grouped by week
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        timeLabels.push(date.toISOString().split("T")[0]);
      }
    } else if (period === "year") {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        timeLabels.push(date.toISOString().split("T")[0]);
      }
    }

    return timeLabels.map((date, index) => {
      // Base values are proportional to totals with growth trend
      const growth = 1 + index / timeLabels.length;
      const randomFactor = 0.7 + Math.random() * 0.6;

      const views = Math.floor(
        (stats.totalViews / timeLabels.length) * randomFactor * growth
      );
      const likes = Math.floor(
        (stats.totalLikes / timeLabels.length) * randomFactor * growth
      );

      // Ensure we have at least some sales
      let salesBase = stats.totalSales / timeLabels.length;
      if (salesBase < 0.5) salesBase = 0.5;

      const sales = Math.floor(salesBase * randomFactor * growth);
      const avgPrice = stats.revenue / (stats.totalSales || 1);
      const revenue = Math.floor(
        sales * avgPrice * (0.9 + Math.random() * 0.2)
      );

      return {
        date,
        views,
        likes,
        sales,
        revenue,
      };
    });
  };

  // Helper function to generate time series datasets
  const generateTimeSeriesDataSets = (stats: any) => {
    let timeLabels: string[] = [];
    const now = new Date();

    // Generate appropriate time labels based on period
    if (period === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        timeLabels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
      }
    } else if (period === "month") {
      // Last 30 days, grouped by week
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        timeLabels.push(`Week ${5 - i}`);
      }
    } else if (period === "year") {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        timeLabels.push(date.toLocaleDateString("en-US", { month: "short" }));
      }
    }

    // Generate mock data
    const viewsData = timeLabels.map((label, index) => {
      const baseValue = stats.totalViews / (timeLabels.length * 1.5);
      const value = Math.floor(
        baseValue *
          (0.7 + Math.random() * 0.6) *
          (1 + index / timeLabels.length)
      );
      return { name: label, views: value };
    });

    const likesData = timeLabels.map((label, index) => {
      const baseValue = stats.totalLikes / (timeLabels.length * 1.5);
      const value = Math.floor(
        baseValue *
          (0.7 + Math.random() * 0.6) *
          (1 + index / timeLabels.length)
      );
      return { name: label, likes: value };
    });

    const salesData = timeLabels.map((label, index) => {
      let baseValue = stats.totalSales / (timeLabels.length * 1.5);
      if (baseValue < 1) baseValue = 1;
      const sales = Math.floor(
        baseValue *
          (0.5 + Math.random() * 1.0) *
          (1 + index / timeLabels.length)
      );
      const avgPrice = stats.revenue / (stats.totalSales || 1);
      const revenue = Math.floor(
        sales * avgPrice * (0.9 + Math.random() * 0.2)
      );
      return { name: label, sales, revenue };
    });

    return { viewsData, likesData, salesData };
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        fetchAnalyticsData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchAnalyticsData]);

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (period === "week") {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else if (period === "month") {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    } else {
      return date.toLocaleDateString("en-US", { month: "short" });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format price with decimals
  const formatPriceWithDecimals = (price: number) => {
    if (!price) return "0.00";
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Get color for a category
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Sedan: "#4285F4",
      SUV: "#34A853",
      Coupe: "#9C27B0",
      Hatchback: "#FBBC05",
      Convertible: "#EA4335",
      Sports: "#FF9800",
      Truck: "#795548",
      Van: "#607D8B",
      Wagon: "#3F51B5",
      Other: "#CCCCCC",
    };

    return colors[category] || "#CCCCCC";
  };

  // Chart colors
  const COLORS = [
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
  ];

  return (
    <div className="min-h-screen bg-white">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-500">
                Track performance and insights for your dealership
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setPeriod("week")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    period === "week"
                      ? "bg-accent text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    period === "month"
                      ? "bg-accent text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setPeriod("year")}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    period === "year"
                      ? "bg-accent text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Year
                </button>
              </div>

              <button
                onClick={handleRefresh}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-accent" />
                ) : (
                  <ArrowPathIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Subscription Warning */}
          {dealership?.subscription_end_date &&
            getDaysUntilExpiration <= SUBSCRIPTION_WARNING_DAYS && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center">
                <div className="bg-amber-500 rounded-full p-2 mr-3 flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-amber-700 font-semibold">
                    Subscription expiring soon
                  </h3>
                  <p className="text-amber-600 text-sm">
                    {getDaysUntilExpiration <= 0
                      ? "Your subscription has expired. Please renew to continue using all features."
                      : `${getDaysUntilExpiration} days remaining. Renew now to avoid service interruption.`}
                  </p>
                </div>
                <button className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors">
                  Renew Now
                </button>
              </div>
            )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
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
                className="px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Views Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-600 text-sm font-medium">
                      Total Views
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-accent/10 text-accent">
                      <EyeIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-800 text-2xl font-semibold">
                      {overviewStats.totalViews.toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-500">
                      <span
                        className={`flex items-center ${
                          overviewStats.viewsChange >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {overviewStats.viewsChange >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(Math.round(overviewStats.viewsChange))}%
                      </span>
                      <span className="ml-2">from last {period}</span>
                    </div>
                  </div>
                </div>

                {/* Likes Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-600 text-sm font-medium">
                      Total Likes
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-rose-100 text-rose-500">
                      <HeartIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-800 text-2xl font-semibold">
                      {overviewStats.totalLikes.toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-500">
                      <span
                        className={`flex items-center ${
                          overviewStats.likesChange >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {overviewStats.likesChange >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(Math.round(overviewStats.likesChange))}%
                      </span>
                      <span className="ml-2">from last {period}</span>
                    </div>
                  </div>
                </div>

                {/* Sales Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-600 text-sm font-medium">
                      Total Sales
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-emerald-100 text-emerald-600">
                      <TagIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-800 text-2xl font-semibold">
                      {overviewStats.totalSales}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-500">
                      <span
                        className={`flex items-center ${
                          overviewStats.salesChange >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {overviewStats.salesChange >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(Math.round(overviewStats.salesChange))}%
                      </span>
                      <span className="ml-2">from last {period}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-600 text-sm font-medium">
                      Total Revenue
                    </p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-amber-100 text-amber-600">
                      <CurrencyDollarIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-800 text-2xl font-semibold">
                      {formatCurrency(overviewStats.revenue)}
                    </p>
                    <div className="flex items-center text-xs mt-1 text-gray-500">
                      <span
                        className={`flex items-center ${
                          overviewStats.revenueChange >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {overviewStats.revenueChange >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(Math.round(overviewStats.revenueChange))}%
                      </span>
                      <span className="ml-2">from last {period}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Views Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Views Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={viewsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorViews"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366F1"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366F1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                          }}
                          labelStyle={{ color: "#111827" }}
                          itemStyle={{ color: "#6366F1" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#6366F1"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Likes Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Likes Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={likesData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorLikes"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#EF4444"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#EF4444"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                          }}
                          labelStyle={{ color: "#111827" }}
                          itemStyle={{ color: "#EF4444" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="likes"
                          stroke="#EF4444"
                          fillOpacity={1}
                          fill="url(#colorLikes)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Sales Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sales & Revenue
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis yAxisId="left" stroke="#10B981" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#F59E0B"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E5E7EB",
                        }}
                        labelStyle={{ color: "#111827" }}
                        formatter={(value: any, name: any) => {
                          if (name === "revenue") return formatCurrency(value);
                          return value;
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sales"
                        stroke="#10B981"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#F59E0B"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory Metrics Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Inventory Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="p-2 rounded-md bg-accent/10 text-accent mr-3">
                        <BuildingStorefrontIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Inventory</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {inventoryMetrics.totalCars}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-3">
                      <div>
                        <p className="text-gray-600">New</p>
                        <p className="text-gray-800">
                          {inventoryMetrics.newCars}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Used</p>
                        <p className="text-gray-800">
                          {inventoryMetrics.usedCars}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Other</p>
                        <p className="text-gray-800">
                          {inventoryMetrics.totalCars -
                            inventoryMetrics.newCars -
                            inventoryMetrics.usedCars}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 mr-3">
                        <CurrencyDollarIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Price</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {formatCurrency(inventoryMetrics.avgPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        Total Inventory Value
                      </p>
                      <p className="text-lg font-medium text-emerald-600">
                        {formatCurrency(inventoryMetrics.totalValue)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-2">
                      <div className="p-2 rounded-md bg-amber-100 text-amber-600 mr-3">
                        <ShoppingCartIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Sales Conversion
                        </p>
                        <p className="text-xl font-semibold text-gray-800">
                          {(performanceMetrics.conversionRate * 100).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Avg. Time to Sell</p>
                      <p className="text-lg font-medium text-amber-600">
                        {performanceMetrics.avgTimeToSell.toFixed(1)} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Category Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Category Distribution
                  </h3>
                  {categoryDistribution.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FFFFFF",
                              borderColor: "#E5E7EB",
                            }}
                            labelStyle={{ color: "#111827" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64 text-gray-500">
                      No category data available
                    </div>
                  )}
                </div>

                {/* Sales Performance */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Sales Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Avg. Sale Price</p>
                        <p className="text-xl font-semibold text-gray-800 mt-1">
                          {formatCurrency(performanceMetrics.avgSalePrice)}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">
                          Avg. Price Difference
                        </p>
                        <p
                          className={`text-xl font-semibold mt-1 ${
                            performanceMetrics.priceDifference >= 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {performanceMetrics.priceDifference >= 0 ? "+" : ""}
                          {formatCurrency(performanceMetrics.priceDifference)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Sales Timeline</p>
                      </div>

                      <div className="space-y-3 mt-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
                            <span className="text-gray-700">
                              Less than 30 days
                            </span>
                          </div>
                          <span className="text-gray-800 font-medium">40%</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                            <span className="text-gray-700">30-60 days</span>
                          </div>
                          <span className="text-gray-800 font-medium">35%</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-rose-500 rounded-full mr-2"></span>
                            <span className="text-gray-700">Over 60 days</span>
                          </div>
                          <span className="text-gray-800 font-medium">25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
