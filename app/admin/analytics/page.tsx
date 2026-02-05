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
import { Pie, Bar, Line } from "react-chartjs-2";

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

// Define interface for analytics data
interface AnalyticsData {
  total_listings: number;
  total_views: number;
  total_likes: number;
  total_sales: number;
  total_revenue: number;
  total_dealerships: number;
  total_users: number;
  sales_trend: {
    month: string;
    sales: number;
  }[];
  user_growth: {
    month: string;
    new_users: number;
  }[];
  top_dealerships: {
    id: number;
    name: string;
    listings: number;
    views: number;
    likes: number;
    sales: number;
    revenue: number;
  }[];
  top_cars: {
    id: number;
    make: string;
    model: string;
    views: number;
    likes: number;
    sales: number;
    revenue: number;
  }[];
  inventory_summary: {
    condition_distribution: Record<string, number>;
    transmission_distribution: Record<string, number>;
    drivetrain_distribution: Record<string, number>;
  };
  price_distribution: {
    range: string;
    count: number;
  }[];
  performance_metrics: {
    avg_time_to_sell: number;
    conversion_rate: number;
    avg_listing_price: number;
    avg_sale_price: number;
    price_difference: number;
  };
  user_engagement: {
    top_likers: {
      id: string;
      name: string;
      email: string;
      likes_count: number;
    }[];
    top_viewers: {
      id: string;
      name: string;
      email: string;
      views_count: number;
    }[];
  };
  geographical_data: {
    name: string;
    listings: number;
    sales: number;
  }[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

// Define chart colors
const CHART_COLORS = {
  primary: "#4f46e5", // indigo-600
  secondary: "#0891b2", // cyan-600
  accent: "#d97706", // amber-600
  success: "#16a34a", // green-600
  danger: "#dc2626", // red-600
  warning: "#f59e0b", // amber-500
  info: "#0284c7", // sky-600

  // Category colors for pie/donut charts
  new: "#3b82f6", // blue-500
  used: "#8b5cf6", // violet-500
  certified: "#10b981", // emerald-500
  classic: "#f59e0b", // amber-500
  custom: "#ef4444", // red-500
};

// Define a reusable MetricCard component
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  textColor,
}) => (
  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 shadow-sm flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 ${color} rounded-lg`}>{icon}</div>
    </div>
    <div className="space-y-1">
      <p className="text-xs text-gray-400">{title}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
    </div>
  </div>
);

export default function AdminAnalyticsDashboard() {
  const supabase = createClient();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("30d");

  // Fetch analytics data
  // Replace the fetchAnalytics function in your AdminAnalyticsDashboard component
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all required data from Supabase
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*, dealership:dealerships(id, name, location)")
        .neq("status", "deleted");

      if (carsError) throw carsError;

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*");

      if (usersError) throw usersError;

      const { data: clipsData, error: clipsError } = await supabase //Added clipsData even though unused
        .from("auto_clips")
        .select("*");

      if (clipsError) throw clipsError;

      const { data: dealershipsData, error: dealershipsError } = await supabase
        .from("dealerships")
        .select("*");

      if (dealershipsError) throw dealershipsError;

      // Process the data to create the analytics object

      // Count total listings
      const total_listings = carsData.length;

      // Sum up all views and likes
      const total_views = carsData.reduce(
        (sum, car) => sum + (car.views || 0),
        0
      );
      const total_likes = carsData.reduce(
        (sum, car) => sum + (car.likes || 0),
        0
      );

      // Count sold cars and calculate revenue
      const soldCars = carsData.filter((car) => car.status === "sold");
      const total_sales = soldCars.length;
      const total_revenue = soldCars.reduce(
        (sum, car) => sum + (car.sold_price || car.price || 0),
        0
      );

      // Count unique dealerships and users
      const total_dealerships = new Set(
        carsData.map((car) => car.dealership_id)
      ).size;
      const total_users = usersData.filter((user) => !user.is_guest).length;

      // Process sales trends by month
      const salesByMonth: Record<string, number> = soldCars.reduce(
        (acc, car) => {
          if (!car.date_sold) return acc;
          const monthYear = car.date_sold.substring(0, 7); // Format: "YYYY-MM"
          acc[monthYear] = (acc[monthYear] || 0) + 1;
          return acc;
        },
        {}
      );

      // Convert to array and ensure last 6 months
      const sales_trend: { month: string; sales: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const monthYear = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        sales_trend.push({
          month: monthYear,
          sales: salesByMonth[monthYear] || 0,
        });
      }

      // Process user growth by month
      const usersByMonth: Record<string, number> = usersData.reduce(
        (acc, user) => {
          if (!user.created_at) return acc;
          const monthYear = user.created_at.substring(0, 7); // Format: "YYYY-MM"
          acc[monthYear] = (acc[monthYear] || 0) + 1;
          return acc;
        },
        {}
      );

      // Convert to array for user growth trend
      const user_growth: { month: string; new_users: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const monthYear = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;
        user_growth.push({
          month: monthYear,
          new_users: usersByMonth[monthYear] || 0,
        });
      }

      // Process top dealerships
      const dealershipStats: Record<
        number,
        {
          id: number;
          name: string;
          listings: number;
          views: number;
          likes: number;
          sales: number;
          revenue: number;
        }
      > = carsData.reduce((acc, car) => {
        const dealershipId = car.dealership_id;
        if (!dealershipId) return acc;

        if (!acc[dealershipId]) {
          const dealership =
            dealershipsData.find((d) => d.id === dealershipId) || {};
          acc[dealershipId] = {
            id: dealershipId,
            name: dealership.name || `Dealership ${dealershipId}`,
            listings: 0,
            views: 0,
            likes: 0,
            sales: 0,
            revenue: 0,
          };
        }

        acc[dealershipId].listings += 1;
        acc[dealershipId].views += car.views || 0;
        acc[dealershipId].likes += car.likes || 0;

        if (car.status === "sold") {
          acc[dealershipId].sales += 1;
          acc[dealershipId].revenue += car.sold_price || car.price || 0;
        }

        return acc;
      }, {});

      // Convert to array and sort by revenue
      const top_dealerships: AnalyticsData["top_dealerships"] = Object.values(
        dealershipStats
      )
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Process top cars by views
      const top_cars: AnalyticsData["top_cars"] = carsData
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((car) => ({
          id: car.id,
          make: car.make || "Unknown",
          model: car.model || "Unknown",
          views: car.views || 0,
          likes: car.likes || 0,
          sales: car.status === "sold" ? 1 : 0,
          revenue: car.status === "sold" ? car.sold_price || car.price || 0 : 0,
        }));

      // Process inventory distributions
      const conditionDistribution = carsData.reduce((acc, car) => {
        const condition = car.condition || "Unknown";
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const transmissionDistribution = carsData.reduce((acc, car) => {
        const transmission = car.transmission || "Unknown";
        acc[transmission] = (acc[transmission] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const drivetrainDistribution = carsData.reduce((acc, car) => {
        const drivetrain = car.drivetrain || "Unknown";
        acc[drivetrain] = (acc[drivetrain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process price distribution
      const priceRanges = [
        { min: 0, max: 10000, label: "Under $10k" },
        { min: 10000, max: 20000, label: "$10k-$20k" },
        { min: 20000, max: 30000, label: "$20k-$30k" },
        { min: 30000, max: 50000, label: "$30k-$50k" },
        { min: 50000, max: Infinity, label: "Over $50k" },
      ];

      const price_distribution: AnalyticsData["price_distribution"] =
        priceRanges.map((range) => ({
          range: range.label,
          count: carsData.filter((car) => {
            const price = car.price || 0;
            return price >= range.min && price < range.max;
          }).length,
        }));

      // Calculate performance metrics
      const avg_time_to_sell =
        soldCars.length > 0
          ? soldCars.reduce((sum, car) => {
              if (!car.date_sold || !car.listed_at) return sum;
              const listedDate = new Date(car.listed_at);
              const soldDate = new Date(car.date_sold);
              const days =
                (soldDate.getTime() - listedDate.getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / soldCars.length
          : 0;

      const conversion_rate = total_views > 0 ? total_sales / total_views : 0;

      const avg_listing_price =
        carsData.length > 0
          ? carsData.reduce((sum, car) => sum + (car.price || 0), 0) /
            carsData.length
          : 0;

      const avg_sale_price =
        soldCars.length > 0
          ? soldCars.reduce(
              (sum, car) => sum + (car.sold_price || car.price || 0),
              0
            ) / soldCars.length
          : 0;

      const price_difference = avg_sale_price - avg_listing_price;

      // Process user engagement
      const processUserLikes = (liked_users: any) => {
        //any type, since it can be string or string[]
        if (!liked_users) return [];
        try {
          const userIds = Array.isArray(liked_users)
            ? liked_users
            : JSON.parse(liked_users);

          return userIds;
        } catch (e) {
          return [];
        }
      };

      const userLikesCount: Record<string, number> = {};
      const userViewsCount: Record<string, number> = {};

      carsData.forEach((car) => {
        // Process likes
        const likedUserIds = processUserLikes(car.liked_users);
        likedUserIds.forEach((userId: string) => {
          userLikesCount[userId] = (userLikesCount[userId] || 0) + 1;
        });

        // Process views
        const viewedUserIds = processUserLikes(car.viewed_users);
        viewedUserIds.forEach((userId: string) => {
          userViewsCount[userId] = (userViewsCount[userId] || 0) + 1;
        });
      });

      // Get top likers and viewers
      const getUserDetails = (userId: string) => {
        const user = usersData.find((u) => u.id === userId) || {};
        return {
          id: userId,
          name: user.name || "Unknown User",
          email: user.email || "unknown@example.com",
        };
      };

      const top_likers: AnalyticsData["user_engagement"]["top_likers"] =
        Object.entries(userLikesCount)
          .sort(([, a], [, b]) => b - a) //Proper destructuring for sorting
          .slice(0, 5)
          .map(([userId, likes_count]) => ({
            ...getUserDetails(userId),
            likes_count,
          }));

      const top_viewers: AnalyticsData["user_engagement"]["top_viewers"] =
        Object.entries(userViewsCount)
          .sort(([, a], [, b]) => b - a) //Proper destructuring for sorting
          .slice(0, 5)
          .map(([userId, views_count]) => ({
            ...getUserDetails(userId),
            views_count,
          }));

      // Process geographical data
      // Assuming dealerships have location data that we can use
      const locationCounts: Record<
        string,
        { listings: number; sales: number }
      > = {};

      carsData.forEach((car) => {
        const dealership = dealershipsData.find(
          (d) => d.id === car.dealership_id
        );
        if (!dealership || !dealership.location) return;

        // Extract city from location (assuming format like "New York, NY")
        const city = dealership.location.split(",")[0].trim();

        if (!locationCounts[city]) {
          locationCounts[city] = { listings: 0, sales: 0 };
        }

        locationCounts[city].listings += 1;
        if (car.status === "sold") {
          locationCounts[city].sales += 1;
        }
      });

      const geographical_data: AnalyticsData["geographical_data"] =
        Object.entries(locationCounts)
          .sort(([, a], [, b]) => b.listings - a.listings) //Proper destructuring
          .slice(0, 10)
          .map(([name, data]) => ({
            name,
            listings: data.listings,
            sales: data.sales,
          }));

      // Compile all data
      const analyticsData: AnalyticsData = {
        total_listings,
        total_views,
        total_likes,
        total_sales,
        total_revenue,
        total_dealerships,
        total_users,
        sales_trend,
        user_growth,
        top_dealerships,
        top_cars,
        inventory_summary: {
          condition_distribution: conditionDistribution,
          transmission_distribution: transmissionDistribution,
          drivetrain_distribution: drivetrainDistribution,
        },
        price_distribution,
        performance_metrics: {
          avg_time_to_sell,
          conversion_rate,
          avg_listing_price,
          avg_sale_price,
          price_difference,
        },
        user_engagement: {
          top_likers,
          top_viewers,
        },
        geographical_data,
      };

      setAnalytics(analyticsData);
    } catch (err: any) {
      //Catch error as any
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, timeRange]); // Add supabase as a dependency

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  function saveAs(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!analytics) return null;

    return {
      viewsPerListing: (
        analytics.total_views / analytics.total_listings
      ).toFixed(1),
      likesPerListing: (
        analytics.total_likes / analytics.total_listings
      ).toFixed(1),
      likesToViewsRate:
        ((analytics.total_likes / analytics.total_views) * 100).toFixed(1) +
        "%",
      avgRevenuePerSale: (
        analytics.total_revenue / analytics.total_sales
      ).toFixed(0),
      listingsPerDealership: (
        analytics.total_listings / analytics.total_dealerships
      ).toFixed(1),
      avoidedPriceDrops: analytics.performance_metrics.price_difference > 0,
      profitability:
        (
          (analytics.performance_metrics.avg_sale_price /
            analytics.performance_metrics.avg_listing_price -
            1) *
          100
        ).toFixed(1) + "%",
    };
  }, [analytics]);

  // Export data to Excel
  const exportToExcel = useCallback(() => {
    if (!analytics) return;

    // Create workbook and add sheets
    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ["Metric", "Value"],
      ["Total Listings", analytics.total_listings],
      ["Total Views", analytics.total_views],
      ["Total Likes", analytics.total_likes],
      ["Total Sales", analytics.total_sales],
      ["Total Revenue", `$${analytics.total_revenue.toLocaleString()}`],
      ["Total Dealerships", analytics.total_dealerships],
      ["Total Users", analytics.total_users],
      ["Views Per Listing", derivedMetrics?.viewsPerListing],
      ["Likes Per Listing", derivedMetrics?.likesPerListing],
      ["Likes to Views Rate", derivedMetrics?.likesToViewsRate],
      ["Average Revenue Per Sale", `$${derivedMetrics?.avgRevenuePerSale}`],
      ["Listings Per Dealership", derivedMetrics?.listingsPerDealership],
      [
        "Average Time to Sell",
        `${analytics.performance_metrics.avg_time_to_sell.toFixed(1)} days`,
      ],
      [
        "Conversion Rate",
        `${(analytics.performance_metrics.conversion_rate * 100).toFixed(2)}%`,
      ],
      [
        "Average Listing Price",
        `$${analytics.performance_metrics.avg_listing_price.toLocaleString()}`,
      ],
      [
        "Average Sale Price",
        `$${analytics.performance_metrics.avg_sale_price.toLocaleString()}`,
      ],
      [
        "Average Price Difference",
        `$${analytics.performance_metrics.price_difference.toLocaleString()}`,
      ],
      ["Profitability", derivedMetrics?.profitability],
    ];

    const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewWs, "Overview");

    // Top Dealerships sheet
    const dealershipsData = [
      ["Name", "Listings", "Views", "Likes", "Sales", "Revenue"],
      ...analytics.top_dealerships.map((d) => [
        d.name,
        d.listings,
        d.views,
        d.likes,
        d.sales,
        `$${d.revenue.toLocaleString()}`,
      ]),
    ];
    const dealershipsWs = XLSX.utils.aoa_to_sheet(dealershipsData);
    XLSX.utils.book_append_sheet(wb, dealershipsWs, "Top Dealerships");

    // Top Cars sheet
    const carsData = [
      ["Make", "Model", "Views", "Likes", "Sales", "Revenue"],
      ...analytics.top_cars.map((c) => [
        c.make,
        c.model,
        c.views,
        c.likes,
        c.sales,
        `$${c.revenue.toLocaleString()}`,
      ]),
    ];
    const carsWs = XLSX.utils.aoa_to_sheet(carsData);
    XLSX.utils.book_append_sheet(wb, carsWs, "Top Cars");

    // Inventory Condition sheet
    const inventoryData = [
      ["Condition", "Count"],
      ...Object.entries(analytics.inventory_summary.condition_distribution).map(
        ([condition, count]) => [condition, count]
      ),
    ];
    const inventoryWs = XLSX.utils.aoa_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, inventoryWs, "Inventory Condition");

    // Price Distribution sheet
    const priceData = [
      ["Price Range", "Count"],
      ...analytics.price_distribution.map((p) => [p.range, p.count]),
    ];
    const priceWs = XLSX.utils.aoa_to_sheet(priceData);
    XLSX.utils.book_append_sheet(wb, priceWs, "Price Distribution");

    // User Engagement sheet
    const engagementData = [
      ["Name", "Email", "Likes", "Views"],
      ...analytics.user_engagement.top_likers.map((u) => [
        u.name,
        u.email,
        u.likes_count,
        analytics.user_engagement.top_viewers.find((v) => v.id === u.id)
          ?.views_count || 0,
      ]),
    ];
    const engagementWs = XLSX.utils.aoa_to_sheet(engagementData);
    XLSX.utils.book_append_sheet(wb, engagementWs, "User Engagement");

    // Geographical Data sheet
    const geoData = [
      ["Location", "Listings", "Sales"],
      ...analytics.geographical_data.map((g) => [g.name, g.listings, g.sales]),
    ];
    const geoWs = XLSX.utils.aoa_to_sheet(geoData);
    XLSX.utils.book_append_sheet(wb, geoWs, "Geographical Data");

    // Generate Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "car-platform-analytics.xlsx");
  }, [analytics, derivedMetrics]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1) + "%";
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analytics) return null;

    return {
      salesTrend: {
        labels: analytics.sales_trend.map((item) => {
          const date = new Date(item.month);
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        }),
        datasets: [
          {
            label: "Sales",
            data: analytics.sales_trend.map((item) => item.sales),
            borderColor: CHART_COLORS.primary,
            backgroundColor: `${CHART_COLORS.primary}20`,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      userGrowth: {
        labels: analytics.user_growth.map((item) => {
          const date = new Date(item.month);
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });
        }),
        datasets: [
          {
            label: "New Users",
            data: analytics.user_growth.map((item) => item.new_users),
            borderColor: CHART_COLORS.success,
            backgroundColor: `${CHART_COLORS.success}20`,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      topDealerships: {
        labels: analytics.top_dealerships.map((d) => d.name),
        datasets: [
          {
            label: "Listings",
            data: analytics.top_dealerships.map((d) => d.listings),
            backgroundColor: CHART_COLORS.primary,
            barThickness: 20,
          },
        ],
      },
      topCars: {
        labels: analytics.top_cars.map((c) => `${c.make} ${c.model}`),
        datasets: [
          {
            label: "Views",
            data: analytics.top_cars.map((c) => c.views),
            backgroundColor: CHART_COLORS.secondary,
            barThickness: 20,
          },
        ],
      },
      inventoryCondition: {
        labels: Object.keys(analytics.inventory_summary.condition_distribution),
        datasets: [
          {
            label: "Condition",
            data: Object.values(
              analytics.inventory_summary.condition_distribution
            ),
            backgroundColor: [
              CHART_COLORS.new,
              CHART_COLORS.used,
              CHART_COLORS.certified,
              CHART_COLORS.classic,
              CHART_COLORS.custom,
            ],
            borderColor: "rgba(38, 38, 38, 0.8)",
            borderWidth: 1,
          },
        ],
      },
      inventoryTransmission: {
        labels: Object.keys(
          analytics.inventory_summary.transmission_distribution
        ),
        datasets: [
          {
            label: "Transmission",
            data: Object.values(
              analytics.inventory_summary.transmission_distribution
            ),
            backgroundColor: [
              CHART_COLORS.primary,
              CHART_COLORS.secondary,
              CHART_COLORS.accent,
            ],
            borderColor: "rgba(38, 38, 38, 0.8)",
            borderWidth: 1,
          },
        ],
      },
      inventoryDrivetrain: {
        labels: Object.keys(
          analytics.inventory_summary.drivetrain_distribution
        ),
        datasets: [
          {
            label: "Drivetrain",
            data: Object.values(
              analytics.inventory_summary.drivetrain_distribution
            ),
            backgroundColor: [
              CHART_COLORS.info,
              CHART_COLORS.success,
              CHART_COLORS.warning,
              CHART_COLORS.danger,
            ],
            borderColor: "rgba(38, 38, 38, 0.8)",
            borderWidth: 1,
          },
        ],
      },
      priceDistribution: {
        labels: analytics.price_distribution.map((p) => p.range),
        datasets: [
          {
            label: "Vehicles",
            data: analytics.price_distribution.map((p) => p.count),
            backgroundColor: CHART_COLORS.accent,
            barThickness: 30,
          },
        ],
      },
      geographicalData: {
        labels: analytics.geographical_data.map((g) => g.name),
        datasets: [
          {
            label: "Listings",
            data: analytics.geographical_data.map((g) => g.listings),
            backgroundColor: CHART_COLORS.primary,
            barThickness: 20,
          },
          {
            label: "Sales",
            data: analytics.geographical_data.map((g) => g.sales),
            backgroundColor: CHART_COLORS.success,
            barThickness: 20,
          },
        ],
      },
    };
  }, [analytics]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(75, 85, 99, 0.1)",
        },
        ticks: {
          color: "rgba(156, 163, 175, 1)",
        },
      },
      y: {
        grid: {
          color: "rgba(75, 85, 99, 0.1)",
        },
        ticks: {
          color: "rgba(156, 163, 175, 1)",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "rgba(156, 163, 175, 1)",
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        titleColor: "rgba(255, 255, 255, 1)",
        bodyColor: "rgba(255, 255, 255, 0.8)",
        borderColor: "rgba(107, 114, 128, 0.2)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 3,
        cornerRadius: 8,
        usePointStyle: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "rgba(156, 163, 175, 1)",
          boxWidth: 15,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        titleColor: "rgba(255, 255, 255, 1)",
        bodyColor: "rgba(255, 255, 255, 0.8)",
        borderColor: "rgba(107, 114, 128, 0.2)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 3,
        cornerRadius: 8,
        usePointStyle: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-400">
                Comprehensive analytics and performance metrics for your car
                marketplace
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-2">
              {/* Time Range Selector */}
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
                    {range === "7d"
                      ? "7D"
                      : range === "30d"
                      ? "30D"
                      : range === "90d"
                      ? "90D"
                      : range === "1y"
                      ? "1Y"
                      : "All"}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                onClick={exportToExcel}
                disabled={!analytics || isLoading}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                Export
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
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
              <h3 className="text-xl font-semibold text-white mb-2">
                Error Loading Analytics
              </h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchAnalytics()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : analytics ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                <MetricCard
                  title="Total Listings"
                  value={formatNumber(analytics.total_listings)}
                  icon={<ListBulletIcon className="h-5 w-5" />}
                  color="bg-blue-500/20"
                  textColor="text-blue-400"
                />

                <MetricCard
                  title="Total Views"
                  value={formatNumber(analytics.total_views)}
                  icon={<EyeIcon className="h-5 w-5" />}
                  color="bg-emerald-500/20"
                  textColor="text-emerald-400"
                />

                <MetricCard
                  title="Total Likes"
                  value={formatNumber(analytics.total_likes)}
                  icon={<HeartIcon className="h-5 w-5" />}
                  color="bg-rose-500/20"
                  textColor="text-rose-400"
                />

                <MetricCard
                  title="Total Sales"
                  value={formatNumber(analytics.total_sales)}
                  icon={<ShoppingCartIcon className="h-5 w-5" />}
                  color="bg-purple-500/20"
                  textColor="text-purple-400"
                />

                <MetricCard
                  title="Total Dealerships"
                  value={formatNumber(analytics.total_dealerships)}
                  icon={<BuildingOfficeIcon className="h-5 w-5" />}
                  color="bg-amber-500/20"
                  textColor="text-amber-400"
                />

                <MetricCard
                  title="Total Users"
                  value={formatNumber(analytics.total_users)}
                  icon={<UserIcon className="h-5 w-5" />}
                  color="bg-cyan-500/20"
                  textColor="text-cyan-400"
                />
              </div>

              {/* KPIs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg mr-2">
                      <ClockIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-medium">
                      Average Time to Sell
                    </h3>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-white mr-2">
                      {analytics.performance_metrics.avg_time_to_sell.toFixed(
                        1
                      )}
                    </p>
                    <p className="text-gray-400">days</p>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg mr-2">
                      <CalendarDaysIcon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-medium">Conversion Rate</h3>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-white mr-2">
                      {formatPercent(
                        analytics.performance_metrics.conversion_rate
                      )}
                    </p>
                    <p className="text-gray-400">views to sales</p>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg mr-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-amber-400" />
                    </div>
                    <h3 className="text-white font-medium">
                      Average Sale Price
                    </h3>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-white mr-2">
                      {formatCurrency(
                        analytics.performance_metrics.avg_sale_price
                      )}
                    </p>
                    <p
                      className={`${
                        analytics.performance_metrics.price_difference > 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {analytics.performance_metrics.price_difference > 0
                        ? "+"
                        : ""}
                      {formatCurrency(
                        analytics.performance_metrics.price_difference
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-rose-500/20 rounded-lg mr-2">
                      <HeartIcon className="h-5 w-5 text-rose-400" />
                    </div>
                    <h3 className="text-white font-medium">Engagement Rate</h3>
                  </div>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-white mr-2">
                      {derivedMetrics?.likesToViewsRate}
                    </p>
                    <p className="text-gray-400">likes per view</p>
                  </div>
                </div>
              </div>

              {/* Sales Trend and User Growth */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Sales Trend
                  </h3>
                  <div className="h-72">
                    {chartData && (
                      <Line
                        data={chartData.salesTrend}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    User Growth
                  </h3>
                  <div className="h-72">
                    {chartData && (
                      <Line
                        data={chartData.userGrowth}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Inventory Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Car Condition
                  </h3>
                  <div className="h-64">
                    {chartData && (
                      <Pie
                        data={chartData.inventoryCondition}
                        options={pieChartOptions}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Transmission Types
                  </h3>
                  <div className="h-64">
                    {chartData && (
                      <Pie
                        data={chartData.inventoryTransmission}
                        options={pieChartOptions}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Drivetrain Distribution
                  </h3>
                  <div className="h-64">
                    {chartData && (
                      <Pie
                        data={chartData.inventoryDrivetrain}
                        options={pieChartOptions}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Price Distribution */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Price Distribution
                  </h3>
                  <div className="h-72">
                    {chartData && (
                      <Bar
                        data={chartData.priceDistribution}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Top Dealerships and Cars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Dealerships
                  </h3>
                  <div className="h-96">
                    {chartData && (
                      <Bar
                        data={chartData.topDealerships}
                        options={{
                          ...chartOptions,
                          indexAxis: "y" as const,
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Cars
                  </h3>
                  <div className="h-96">
                    {chartData && (
                      <Bar
                        data={chartData.topCars}
                        options={{
                          ...chartOptions,
                          indexAxis: "y" as const,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Geographical Data */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Geographic Distribution
                  </h3>
                  <div className="h-80">
                    {chartData && (
                      <Bar
                        data={chartData.geographicalData}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* User Engagement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Viewers
                  </h3>
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/30">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              User
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Email
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Views
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                          {analytics.user_engagement.top_viewers.map(
                            (viewer) => (
                              <tr
                                key={viewer.id}
                                className="hover:bg-gray-700/30"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                  {viewer.name}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                  {viewer.email}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-cyan-400 font-semibold">
                                  {viewer.views_count}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Top Likers
                  </h3>
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/30">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              User
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Email
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              Likes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                          {analytics.user_engagement.top_likers.map((liker) => (
                            <tr key={liker.id} className="hover:bg-gray-700/30">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                {liker.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {liker.email}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-rose-400 font-semibold">
                                {liker.likes_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Additional Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-4 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-300 text-sm">
                          Views Per Listing
                        </h4>
                        <div className="p-1.5 rounded-full bg-blue-500/20">
                          <EyeIcon className="h-4 w-4 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {derivedMetrics?.viewsPerListing}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-300 text-sm">
                          Likes Per Listing
                        </h4>
                        <div className="p-1.5 rounded-full bg-rose-500/20">
                          <HeartIcon className="h-4 w-4 text-rose-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {derivedMetrics?.likesPerListing}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-300 text-sm">
                          Avg Revenue Per Sale
                        </h4>
                        <div className="p-1.5 rounded-full bg-green-500/20">
                          <CurrencyDollarIcon className="h-4 w-4 text-green-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(
                          parseInt(derivedMetrics?.avgRevenuePerSale || "0")
                        )}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-300 text-sm">
                          Listings Per Dealership
                        </h4>
                        <div className="p-1.5 rounded-full bg-amber-500/20">
                          <BuildingOfficeIcon className="h-4 w-4 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {derivedMetrics?.listingsPerDealership}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Highlights */}
              <div className="mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Regional Highlights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.geographical_data.slice(0, 6).map((region) => (
                      <div
                        key={region.name}
                        className="p-4 rounded-lg bg-gray-700/30 flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                            <h4 className="text-white font-medium">
                              {region.name}
                            </h4>
                          </div>
                          <div className="mt-1 text-sm text-gray-400">
                            {`${region.listings} listings, ${region.sales} sales`}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-indigo-400">
                          {((region.sales / region.listings) * 100).toFixed(1)}%
                        </div>
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

function saveAs(blob: Blob, arg1: string) {
  throw new Error("Function not implemented.");
}
