"use client";

import React, { useState, useEffect } from "react";
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
  Area
} from 'recharts';

export default function DealerAnalyticsPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dealershipId, setDealershipId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Analytics data states
  const [overviewStats, setOverviewStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalSales: 0,
    revenue: 0,
    viewsChange: 0,
    likesChange: 0,
    salesChange: 0,
    revenueChange: 0
  });

  const [viewsData, setViewsData] = useState<any[]>([]);
  const [likesData, setLikesData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [popularCars, setPopularCars] = useState<any[]>([]);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalyticsData() {
      if (!user) return;

      try {
        // Get the dealership ID for this dealer
        const { data: dealershipData, error: dealershipError } = await supabase
          .from("dealerships")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (dealershipError) throw dealershipError;
        setDealershipId(dealershipData.id);

        // Fetch all cars for this dealership
        const { data: cars, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("dealership_id", dealershipData.id);

        if (carsError) throw carsError;

        // Calculate overview stats
        if (cars) {
          // Mock previous period data for demonstration
          const mockPreviousPeriodMultiplier = Math.random() * 0.4 + 0.7; // 0.7 to 1.1

          const totalViews = cars.reduce((sum, car) => sum + (car.views || 0), 0);
          const totalLikes = cars.reduce((sum, car) => sum + (car.likes || 0), 0);
          const soldCars = cars.filter(car => car.status === 'sold');
          const totalSales = soldCars.length;
          const revenue = soldCars.reduce((sum, car) => sum + (car.sold_price || car.price || 0), 0);

          // Get "previous period" data (mock for this example)
          const previousViews = Math.floor(totalViews * mockPreviousPeriodMultiplier);
          const previousLikes = Math.floor(totalLikes * mockPreviousPeriodMultiplier);
          const previousSales = Math.floor(totalSales * mockPreviousPeriodMultiplier);
          const previousRevenue = Math.floor(revenue * mockPreviousPeriodMultiplier);

          setOverviewStats({
            totalViews,
            totalLikes,
            totalSales,
            revenue,
            viewsChange: previousViews > 0 ? (totalViews - previousViews) / previousViews * 100 : 0,
            likesChange: previousLikes > 0 ? (totalLikes - previousLikes) / previousLikes * 100 : 0,
            salesChange: previousSales > 0 ? (totalSales - previousSales) / previousSales * 100 : 0,
            revenueChange: previousRevenue > 0 ? (revenue - previousRevenue) / previousRevenue * 100 : 0
          });

          // Generate time series data based on period
          generateTimeSeriesData(cars);

          // Generate inventory status data
          const inventoryStatus = [
            { name: 'Available', value: cars.filter(car => car.status === 'available').length },
            { name: 'Pending', value: cars.filter(car => car.status === 'pending').length },
            { name: 'Sold', value: cars.filter(car => car.status === 'sold').length }
          ];
          setInventoryData(inventoryStatus);

          // Get most popular cars
          const sorted = [...cars].sort((a, b) => (b.views || 0) - (a.views || 0));
          setPopularCars(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [user, supabase]);

  // Generate example time series data based on selected period
  const generateTimeSeriesData = (cars: any[]) => {
    let timeLabels: string[] = [];
    const now = new Date();

    // Generate appropriate time labels based on period
    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        timeLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      }
    } else if (period === 'month') {
      // Last 30 days, grouped by week
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        timeLabels.push(`Week ${5-i}`);
      }
    } else if (period === 'year') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        timeLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      }
    }

    // Generate mock data for views, likes, and sales
    const viewsData = timeLabels.map((label, index) => {
      // Base value is proportional to total views
      const baseValue = overviewStats.totalViews / (timeLabels.length * 1.5);
      // Add some randomness
      const value = Math.floor(baseValue * (0.7 + Math.random() * 0.6) * (1 + index/timeLabels.length));
      return { name: label, views: value };
    });

    const likesData = timeLabels.map((label, index) => {
      // Base value is proportional to total likes
      const baseValue = overviewStats.totalLikes / (timeLabels.length * 1.5);
      // Add some randomness
      const value = Math.floor(baseValue * (0.7 + Math.random() * 0.6) * (1 + index/timeLabels.length));
      return { name: label, likes: value };
    });

    const salesData = timeLabels.map((label, index) => {
      // Base value is proportional to total sales
      let baseValue = overviewStats.totalSales / (timeLabels.length * 1.5);
      if (baseValue < 1) baseValue = 1; // Ensure at least some sales
      // Add some randomness, but keep it as integer
      const sales = Math.floor(baseValue * (0.5 + Math.random() * 1.0) * (1 + index/timeLabels.length));
      // Revenue is based on sales with some variation per unit
      const avgPrice = overviewStats.revenue / (overviewStats.totalSales || 1);
      const revenue = Math.floor(sales * avgPrice * (0.9 + Math.random() * 0.2));
      return { name: label, sales, revenue };
    });

    setViewsData(viewsData);
    setLikesData(likesData);
    setSalesData(salesData);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Chart colors
  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  // Custom tooltip formatter for charts
  const currencyTooltipFormatter = (value: number) => formatCurrency(value);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>

            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  period === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  period === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  period === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Views Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">Total Views</p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-indigo-500/20 text-indigo-300">
                      <EyeIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">{overviewStats.totalViews.toLocaleString()}</p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className={`flex items-center ${
                        overviewStats.viewsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
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
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">Total Likes</p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-rose-500/20 text-rose-300">
                      <HeartIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">{overviewStats.totalLikes.toLocaleString()}</p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className={`flex items-center ${
                        overviewStats.likesChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
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
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">Total Sales</p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-emerald-500/20 text-emerald-300">
                      <TagIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">{overviewStats.totalSales}</p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className={`flex items-center ${
                        overviewStats.salesChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
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
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                    <span className="flex items-center justify-center p-1.5 rounded-md bg-amber-500/20 text-amber-300">
                      <CurrencyDollarIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-2xl font-semibold">{formatCurrency(overviewStats.revenue)}</p>
                    <div className="flex items-center text-xs mt-1 text-gray-400">
                      <span className={`flex items-center ${
                        overviewStats.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
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
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Views Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={viewsData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }}
                          labelStyle={{ color: 'white' }}
                          itemStyle={{ color: '#6366F1' }}
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
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Likes Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={likesData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }}
                          labelStyle={{ color: 'white' }}
                          itemStyle={{ color: '#EF4444' }}
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

                {/* Sales Chart */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Sales & Revenue</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis yAxisId="left" stroke="#10B981" />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }}
                          labelStyle={{ color: 'white' }}
                          formatter={(value: any, name: any) => {
                            if (name === 'revenue') return formatCurrency(value);
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

                {/* Inventory Status */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Inventory Status</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {inventoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }}
                          labelStyle={{ color: 'white' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Popular Cars Section */}
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Most Popular Cars</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                        <th className="pb-2 font-medium">Car</th>
                        <th className="pb-2 font-medium">Price</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Listed Date</th>
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
                              className={`px-2 py-1 rounded-full text-xs ${
                                car.status === 'available'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : car.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {car.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-300 text-sm">
                            {new Date(car.listed_at).toLocaleDateString()}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}