"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { createClient } from "@/utils/supabase/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BannerStats {
  totalImpressions: number;
  totalClicks: number;
  uniqueViewers: number;
  ctr: number;
}

interface BannerTrend {
  date: string;
  impressions: number;
  clicks: number;
}

interface TopBanner {
  bannerId: number;
  impressions: number;
  clicks: number;
  ctr: number;
  imageUrl?: string;
  redirectTo?: string;
}

interface ViewerDistribution {
  user: number;
  guest: number;
}

export default function BannerStatsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState(30);
  
  // Banner stats
  const [bannerStats, setBannerStats] = useState<BannerStats>({
    totalImpressions: 0,
    totalClicks: 0,
    uniqueViewers: 0,
    ctr: 0,
  });
  const [bannerTrends, setBannerTrends] = useState<BannerTrend[]>([]);
  const [topBanners, setTopBanners] = useState<TopBanner[]>([]);
  const [bannerViewerDist, setBannerViewerDist] = useState<ViewerDistribution>({ user: 0, guest: 0 });

  // Ad Banner stats
  const [adBannerStats, setAdBannerStats] = useState<BannerStats>({
    totalImpressions: 0,
    totalClicks: 0,
    uniqueViewers: 0,
    ctr: 0,
  });
  const [adBannerTrends, setAdBannerTrends] = useState<BannerTrend[]>([]);
  const [topAdBanners, setTopAdBanners] = useState<TopBanner[]>([]);
  const [adBannerViewerDist, setAdBannerViewerDist] = useState<ViewerDistribution>({ user: 0, guest: 0 });

  useEffect(() => {
    fetchAllStats();
  }, [timePeriod]);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBannerStats(),
        fetchAdBannerStats(),
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBannerStats = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - timePeriod);

    // Get impressions
    const { count: impressions } = await supabase
      .from("banner_analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "impression")
      .gte("created_at", dateThreshold.toISOString());

    // Get clicks
    const { count: clicks } = await supabase
      .from("banner_analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "click")
      .gte("created_at", dateThreshold.toISOString());

    // Get unique viewers
    const { data: uniqueViewersData } = await supabase
      .from("banner_analytics")
      .select("viewer_id")
      .gte("created_at", dateThreshold.toISOString());

    const uniqueViewers = new Set(uniqueViewersData?.map((v) => v.viewer_id) || []).size;

    const totalImpressions = impressions || 0;
    const totalClicks = clicks || 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    setBannerStats({
      totalImpressions,
      totalClicks,
      uniqueViewers,
      ctr,
    });

    // Get trends
    const { data: events } = await supabase
      .from("banner_analytics")
      .select("created_at, event_type")
      .gte("created_at", dateThreshold.toISOString())
      .order("created_at", { ascending: true });

    const trendsMap = new Map<string, { impressions: number; clicks: number }>();
    events?.forEach((event) => {
      const date = new Date(event.created_at).toISOString().split("T")[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { impressions: 0, clicks: 0 });
      }
      const trend = trendsMap.get(date)!;
      if (event.event_type === "impression") {
        trend.impressions++;
      } else if (event.event_type === "click") {
        trend.clicks++;
      }
    });

    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
    setBannerTrends(trends);

    // Get top banners
    const { data: allEvents } = await supabase
      .from("banner_analytics")
      .select("banner_id, event_type");

    const bannerMap = new Map<number, { impressions: number; clicks: number }>();
    allEvents?.forEach((event) => {
      if (!bannerMap.has(event.banner_id)) {
        bannerMap.set(event.banner_id, { impressions: 0, clicks: 0 });
      }
      const banner = bannerMap.get(event.banner_id)!;
      if (event.event_type === "impression") {
        banner.impressions++;
      } else if (event.event_type === "click") {
        banner.clicks++;
      }
    });

    const topBannersData = Array.from(bannerMap.entries())
      .map(([bannerId, data]) => ({
        bannerId,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);

    // Fetch banner details
    if (topBannersData.length > 0) {
      const bannerIds = topBannersData.map(b => b.bannerId);
      const { data: bannerDetails } = await supabase
        .from("banners")
        .select("id, image_url, redirect_to")
        .in("id", bannerIds);

      // Merge banner details with analytics
      const enrichedBanners = topBannersData.map(banner => {
        const details = bannerDetails?.find(d => d.id === banner.bannerId);
        return {
          ...banner,
          imageUrl: details?.image_url,
          redirectTo: details?.redirect_to,
        };
      });
      setTopBanners(enrichedBanners);
    } else {
      setTopBanners(topBannersData);
    }

    // Get viewer distribution
    const { data: viewerEvents } = await supabase
      .from("banner_analytics")
      .select("viewer_type")
      .gte("created_at", dateThreshold.toISOString());

    const distribution = { user: 0, guest: 0 };
    viewerEvents?.forEach((event) => {
      if (event.viewer_type === "user") {
        distribution.user++;
      } else {
        distribution.guest++;
      }
    });
    setBannerViewerDist(distribution);
  };

  const fetchAdBannerStats = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - timePeriod);

    // Get impressions
    const { count: impressions } = await supabase
      .from("ad_banner_analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "impression")
      .gte("created_at", dateThreshold.toISOString());

    // Get clicks
    const { count: clicks } = await supabase
      .from("ad_banner_analytics")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "click")
      .gte("created_at", dateThreshold.toISOString());

    // Get unique viewers
    const { data: uniqueViewersData } = await supabase
      .from("ad_banner_analytics")
      .select("viewer_id")
      .gte("created_at", dateThreshold.toISOString());

    const uniqueViewers = new Set(uniqueViewersData?.map((v) => v.viewer_id) || []).size;

    const totalImpressions = impressions || 0;
    const totalClicks = clicks || 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    setAdBannerStats({
      totalImpressions,
      totalClicks,
      uniqueViewers,
      ctr,
    });

    // Get trends
    const { data: events } = await supabase
      .from("ad_banner_analytics")
      .select("created_at, event_type")
      .gte("created_at", dateThreshold.toISOString())
      .order("created_at", { ascending: true });

    const trendsMap = new Map<string, { impressions: number; clicks: number }>();
    events?.forEach((event) => {
      const date = new Date(event.created_at).toISOString().split("T")[0];
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { impressions: 0, clicks: 0 });
      }
      const trend = trendsMap.get(date)!;
      if (event.event_type === "impression") {
        trend.impressions++;
      } else if (event.event_type === "click") {
        trend.clicks++;
      }
    });

    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
    setAdBannerTrends(trends);

    // Get top ad banners
    const { data: allEvents } = await supabase
      .from("ad_banner_analytics")
      .select("ad_banner_id, event_type");

    const bannerMap = new Map<number, { impressions: number; clicks: number }>();
    allEvents?.forEach((event) => {
      if (!bannerMap.has(event.ad_banner_id)) {
        bannerMap.set(event.ad_banner_id, { impressions: 0, clicks: 0 });
      }
      const banner = bannerMap.get(event.ad_banner_id)!;
      if (event.event_type === "impression") {
        banner.impressions++;
      } else if (event.event_type === "click") {
        banner.clicks++;
      }
    });

    const topBannersData = Array.from(bannerMap.entries())
      .map(([bannerId, data]) => ({
        bannerId,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5);

    // Fetch ad banner details
    if (topBannersData.length > 0) {
      const bannerIds = topBannersData.map(b => b.bannerId);
      const { data: bannerDetails } = await supabase
        .from("ad_banners")
        .select("id, image_url, redirect_to")
        .in("id", bannerIds);

      // Merge banner details with analytics
      const enrichedBanners = topBannersData.map(banner => {
        const details = bannerDetails?.find(d => d.id === banner.bannerId);
        return {
          ...banner,
          imageUrl: details?.image_url,
          redirectTo: details?.redirect_to,
        };
      });
      setTopAdBanners(enrichedBanners);
    } else {
      setTopAdBanners(topBannersData);
    }

    // Get viewer distribution
    const { data: viewerEvents } = await supabase
      .from("ad_banner_analytics")
      .select("viewer_type")
      .gte("created_at", dateThreshold.toISOString());

    const distribution = { user: 0, guest: 0 };
    viewerEvents?.forEach((event) => {
      if (event.viewer_type === "user") {
        distribution.user++;
      } else {
        distribution.guest++;
      }
    });
    setAdBannerViewerDist(distribution);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#ffffff",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
      },
    },
  };

  // Chart data for banners
  const bannerTrendData = {
    labels: bannerTrends.map((t) => new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [
      {
        label: "Impressions",
        data: bannerTrends.map((t) => t.impressions),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Clicks",
        data: bannerTrends.map((t) => t.clicks),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const topBannersData = {
    labels: topBanners.map((b) => {
      if (b.redirectTo) {
        if (b.redirectTo.startsWith('fleet://car/')) {
          return `Car #${b.redirectTo.replace('fleet://car/', '')}`;
        } else if (b.redirectTo.startsWith('fleet://dealership/')) {
          return `Dealership #${b.redirectTo.replace('fleet://dealership/', '')}`;
        } else if (b.redirectTo.startsWith('http')) {
          try {
            return new URL(b.redirectTo).hostname;
          } catch {
            return `Banner #${b.bannerId}`;
          }
        }
      }
      return `Banner #${b.bannerId}`;
    }),
    datasets: [
      {
        label: "CTR %",
        data: topBanners.map((b) => b.ctr),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
      },
    ],
  };

  const bannerViewerData = {
    labels: ["Registered Users", "Guest Users"],
    datasets: [
      {
        data: [bannerViewerDist.user, bannerViewerDist.guest],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(251, 191, 36, 0.8)"],
      },
    ],
  };

  // Chart data for ad banners
  const adBannerTrendData = {
    labels: adBannerTrends.map((t) => new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [
      {
        label: "Impressions",
        data: adBannerTrends.map((t) => t.impressions),
        borderColor: "#ec4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Clicks",
        data: adBannerTrends.map((t) => t.clicks),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const topAdBannersData = {
    labels: topAdBanners.map((b) => {
      if (b.redirectTo) {
        if (b.redirectTo.startsWith('fleet://car/')) {
          return `Car #${b.redirectTo.replace('fleet://car/', '')}`;
        } else if (b.redirectTo.startsWith('fleet://dealership/')) {
          return `Dealership #${b.redirectTo.replace('fleet://dealership/', '')}`;
        } else if (b.redirectTo.startsWith('http')) {
          try {
            return new URL(b.redirectTo).hostname;
          } catch {
            return `Ad Banner #${b.bannerId}`;
          }
        }
      }
      return `Ad Banner #${b.bannerId}`;
    }),
    datasets: [
      {
        label: "CTR %",
        data: topAdBanners.map((b) => b.ctr),
        backgroundColor: [
          "rgba(236, 72, 153, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ],
      },
    ],
  };

  const adBannerViewerData = {
    labels: ["Registered Users", "Guest Users"],
    datasets: [
      {
        data: [adBannerViewerDist.user, adBannerViewerDist.guest],
        backgroundColor: ["rgba(236, 72, 153, 0.8)", "rgba(139, 92, 246, 0.8)"],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AdminNavbar />
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Banner Advertising Stats</h1>
              <p className="text-gray-400 mt-1">Performance analytics for sales insights</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Period Selector */}
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(Number(e.target.value))}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>

            <button
              onClick={fetchAllStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Homepage Banners Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Homepage Banners Performance</h2>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <EyeIcon className="h-5 w-5 text-blue-400" />
                    <p className="text-gray-400 text-sm">Total Impressions</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{bannerStats.totalImpressions.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <CursorArrowRaysIcon className="h-5 w-5 text-green-400" />
                    <p className="text-gray-400 text-sm">Total Clicks</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{bannerStats.totalClicks.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <UserGroupIcon className="h-5 w-5 text-purple-400" />
                    <p className="text-gray-400 text-sm">Unique Viewers</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{bannerStats.uniqueViewers.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-amber-400" />
                    <p className="text-gray-400 text-sm">Click-Through Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{bannerStats.ctr.toFixed(2)}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Trends</h3>
                  <div className="h-64">
                    <Line data={bannerTrendData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Performing Banners</h3>
                  <div className="h-64">
                    <Bar data={topBannersData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Viewer Distribution</h3>
                  <div className="h-64">
                    <Pie data={bannerViewerData} options={pieOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Banner Performance Details</h3>
                  <div className="space-y-3">
                    {topBanners.map((banner, index) => {
                      let redirectLabel = 'No redirect';
                      if (banner.redirectTo) {
                        if (banner.redirectTo.startsWith('fleet://car/')) {
                          redirectLabel = `Car #${banner.redirectTo.replace('fleet://car/', '')}`;
                        } else if (banner.redirectTo.startsWith('fleet://dealership/')) {
                          redirectLabel = `Dealership #${banner.redirectTo.replace('fleet://dealership/', '')}`;
                        } else if (banner.redirectTo.startsWith('http')) {
                          try {
                            redirectLabel = new URL(banner.redirectTo).hostname;
                          } catch {
                            redirectLabel = banner.redirectTo;
                          }
                        } else {
                          redirectLabel = banner.redirectTo;
                        }
                      }
                      
                      return (
                        <div key={banner.bannerId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                            {banner.imageUrl && (
                              <img
                                src={banner.imageUrl}
                                alt={`Banner ${banner.bannerId}`}
                                className="w-16 h-16 object-cover rounded border border-gray-600"
                              />
                            )}
                            <div>
                              <p className="text-white font-medium">{redirectLabel}</p>
                              <p className="text-xs text-gray-500">ID: {banner.bannerId}</p>
                              <p className="text-sm text-gray-400">{banner.impressions} impressions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">{banner.ctr.toFixed(2)}%</p>
                            <p className="text-sm text-gray-400">{banner.clicks} clicks</p>
                          </div>
                        </div>
                      );
                    })}
                    {topBanners.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No banner data available</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile Ad Banners Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Mobile Ad Banners Performance</h2>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <EyeIcon className="h-5 w-5 text-pink-400" />
                    <p className="text-gray-400 text-sm">Total Impressions</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{adBannerStats.totalImpressions.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <CursorArrowRaysIcon className="h-5 w-5 text-purple-400" />
                    <p className="text-gray-400 text-sm">Total Clicks</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{adBannerStats.totalClicks.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <UserGroupIcon className="h-5 w-5 text-cyan-400" />
                    <p className="text-gray-400 text-sm">Unique Viewers</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{adBannerStats.uniqueViewers.toLocaleString()}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-orange-400" />
                    <p className="text-gray-400 text-sm">Click-Through Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{adBannerStats.ctr.toFixed(2)}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Engagement Trends</h3>
                  <div className="h-64">
                    <Line data={adBannerTrendData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Top Performing Ad Banners</h3>
                  <div className="h-64">
                    <Bar data={topAdBannersData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Viewer Distribution</h3>
                  <div className="h-64">
                    <Pie data={adBannerViewerData} options={pieOptions} />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Ad Banner Performance Details</h3>
                  <div className="space-y-3">
                    {topAdBanners.map((banner, index) => {
                      let redirectLabel = 'No redirect';
                      if (banner.redirectTo) {
                        if (banner.redirectTo.startsWith('fleet://car/')) {
                          redirectLabel = `Car #${banner.redirectTo.replace('fleet://car/', '')}`;
                        } else if (banner.redirectTo.startsWith('fleet://dealership/')) {
                          redirectLabel = `Dealership #${banner.redirectTo.replace('fleet://dealership/', '')}`;
                        } else if (banner.redirectTo.startsWith('http')) {
                          try {
                            redirectLabel = new URL(banner.redirectTo).hostname;
                          } catch {
                            redirectLabel = banner.redirectTo;
                          }
                        } else {
                          redirectLabel = banner.redirectTo;
                        }
                      }
                      
                      return (
                        <div key={banner.bannerId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                            {banner.imageUrl && (
                              <img
                                src={banner.imageUrl}
                                alt={`Ad Banner ${banner.bannerId}`}
                                className="w-16 h-16 object-cover rounded border border-gray-600"
                              />
                            )}
                            <div>
                              <p className="text-white font-medium">{redirectLabel}</p>
                              <p className="text-xs text-gray-500">ID: {banner.bannerId}</p>
                              <p className="text-sm text-gray-400">{banner.impressions} impressions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-400">{banner.ctr.toFixed(2)}%</p>
                            <p className="text-sm text-gray-400">{banner.clicks} clicks</p>
                          </div>
                        </div>
                      );
                    })}
                    {topAdBanners.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No ad banner data available</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Sales Insights Section */}
            <section className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-8 border border-indigo-700">
              <h2 className="text-2xl font-bold text-white mb-6">💡 Sales Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Key Talking Points</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        Banners receive{" "}
                        <strong className="text-white">{(bannerStats.totalImpressions + adBannerStats.totalImpressions).toLocaleString()}</strong>{" "}
                        total impressions in the last {timePeriod} days
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        Average CTR of{" "}
                        <strong className="text-white">
                          {((bannerStats.ctr + adBannerStats.ctr) / 2).toFixed(2)}%
                        </strong>{" "}
                        across all banner types
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>
                        Reach{" "}
                        <strong className="text-white">{(bannerStats.uniqueViewers + adBannerStats.uniqueViewers).toLocaleString()}</strong>{" "}
                        unique automotive buyers
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Performance Highlights</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">📊</span>
                      <span>
                        Homepage banners: <strong className="text-white">{bannerStats.totalClicks}</strong> clicks
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">📈</span>
                      <span>
                        Mobile ad banners: <strong className="text-white">{adBannerStats.totalClicks}</strong> clicks
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">👥</span>
                      <span>
                        Mix of registered users and guests ensures broad market coverage
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
