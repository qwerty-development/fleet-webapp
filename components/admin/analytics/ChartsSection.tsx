"use client";

import React, { useMemo } from "react";
import { Pie, Bar, Line, Doughnut } from "react-chartjs-2";
import { AnalyticsDataV2, CHART_COLORS, ChartOptions } from "./types";

interface ChartsSectionProps {
  analytics: AnalyticsDataV2;
}

/**
 * ChartsSection Component
 * Contains all chart visualizations with consistent styling
 */
export const ChartsSection: React.FC<ChartsSectionProps> = ({ analytics }) => {
  // Chart options configurations
  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: "rgba(75, 85, 99, 0.1)" }, ticks: { color: "rgba(156, 163, 175, 1)" } },
      y: { grid: { color: "rgba(75, 85, 99, 0.1)" }, ticks: { color: "rgba(156, 163, 175, 1)" } },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "rgba(156, 163, 175, 1)", boxWidth: 12, padding: 15 },
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

  const pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: { color: "rgba(156, 163, 175, 1)", boxWidth: 15, padding: 10, font: { size: 11 } },
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

  const stackedBarOptions: ChartOptions = {
    ...chartOptions,
    scales: {
      x: { ...chartOptions.scales!.x, stacked: true },
      y: { ...chartOptions.scales!.y, stacked: true },
    },
  };

  const horizontalBarOptions: ChartOptions = {
    ...chartOptions,
    indexAxis: "y" as const,
  };

  // Prepare all chart data
  const chartData = useMemo(() => ({
    weeklyBreakdown: {
      labels: analytics.weekly_breakdown?.map((w) =>
        new Date(w.week_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      ) || [],
      datasets: [
        {
          label: "Cars for Sale",
          data: analytics.weekly_breakdown?.map((w) => w.cars_sale) || [],
          backgroundColor: CHART_COLORS.primary,
          barThickness: 20,
        },
        {
          label: "Cars for Rent",
          data: analytics.weekly_breakdown?.map((w) => w.cars_rent) || [],
          backgroundColor: CHART_COLORS.teal,
          barThickness: 20,
        },
        {
          label: "Number Plates",
          data: analytics.weekly_breakdown?.map((w) => w.number_plates) || [],
          backgroundColor: CHART_COLORS.accent,
          barThickness: 20,
        },
      ],
    },
    listingTypeDistribution: {
      labels: analytics.listing_type_distribution?.map((item) => item.type) || [],
      datasets: [
        {
          data: analytics.listing_type_distribution?.map((item) => item.count) || [],
          backgroundColor: [CHART_COLORS.primary, CHART_COLORS.teal, CHART_COLORS.accent],
          borderColor: "rgba(38, 38, 38, 0.8)",
          borderWidth: 2,
        },
      ],
    },
    listingsTrend: {
      labels: analytics.listings_trend?.map((item) =>
        new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      ) || [],
      datasets: [
        {
          label: "Cars for Sale",
          data: analytics.listings_trend?.map((item) => item.cars_sale) || [],
          backgroundColor: CHART_COLORS.primary,
          stack: "stack1",
        },
        {
          label: "Cars for Rent",
          data: analytics.listings_trend?.map((item) => item.cars_rent) || [],
          backgroundColor: CHART_COLORS.teal,
          stack: "stack1",
        },
        {
          label: "Number Plates",
          data: analytics.listings_trend?.map((item) => item.number_plates) || [],
          backgroundColor: CHART_COLORS.accent,
          stack: "stack1",
        },
      ],
    },
    salesTrend: {
      labels: analytics.sales_trend?.map((item) =>
        new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      ) || [],
      datasets: [
        {
          label: "Cars Sold",
          data: analytics.sales_trend?.map((item) => item.cars_sold) || [],
          borderColor: CHART_COLORS.primary,
          backgroundColor: `${CHART_COLORS.primary}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Plates Sold",
          data: analytics.sales_trend?.map((item) => item.plates_sold) || [],
          borderColor: CHART_COLORS.accent,
          backgroundColor: `${CHART_COLORS.accent}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    userGrowth: {
      labels: analytics.user_growth?.map((item) =>
        new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      ) || [],
      datasets: [
        {
          label: "New Users",
          data: analytics.user_growth?.map((item) => item.new_users) || [],
          borderColor: CHART_COLORS.success,
          backgroundColor: `${CHART_COLORS.success}20`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    topDealerships: {
      labels: analytics.top_dealerships?.map((d) => d.name) || [],
      datasets: [
        {
          label: "Cars for Sale",
          data: analytics.top_dealerships?.map((d) => d.cars_sale) || [],
          backgroundColor: CHART_COLORS.primary,
          barThickness: 16,
        },
        {
          label: "Cars for Rent",
          data: analytics.top_dealerships?.map((d) => d.cars_rent) || [],
          backgroundColor: CHART_COLORS.teal,
          barThickness: 16,
        },
        {
          label: "Number Plates",
          data: analytics.top_dealerships?.map((d) => d.number_plates) || [],
          backgroundColor: CHART_COLORS.accent,
          barThickness: 16,
        },
      ],
    },
    inventoryCondition: {
      labels: Object.keys(analytics.inventory_summary?.condition_distribution || {}),
      datasets: [
        {
          data: Object.values(analytics.inventory_summary?.condition_distribution || {}),
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
    transmissionDistribution: {
      labels: Object.keys(analytics.inventory_summary?.transmission_distribution || {}),
      datasets: [
        {
          data: Object.values(analytics.inventory_summary?.transmission_distribution || {}),
          backgroundColor: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent],
          borderColor: "rgba(38, 38, 38, 0.8)",
          borderWidth: 1,
        },
      ],
    },
    drivetrainDistribution: {
      labels: Object.keys(analytics.inventory_summary?.drivetrain_distribution || {}),
      datasets: [
        {
          data: Object.values(analytics.inventory_summary?.drivetrain_distribution || {}),
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
      labels: analytics.price_distribution?.map((p) => p.range) || [],
      datasets: [
        {
          label: "Vehicles",
          data: analytics.price_distribution?.map((p) => p.count) || [],
          backgroundColor: CHART_COLORS.accent,
          barThickness: 30,
        },
      ],
    },
    geographicalData: {
      labels: analytics.geographical_data?.map((g) => g.name) || [],
      datasets: [
        {
          label: "Listings",
          data: analytics.geographical_data?.map((g) => g.listings) || [],
          backgroundColor: CHART_COLORS.primary,
          barThickness: 20,
        },
        {
          label: "Sales",
          data: analytics.geographical_data?.map((g) => g.sales) || [],
          backgroundColor: CHART_COLORS.success,
          barThickness: 20,
        },
      ],
    },
  }), [analytics]);

  return (
    <>
      {/* Weekly Breakdown Trend */}
      <div className="mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">
            Weekly Breakdown - New Listings (Last 12 Weeks)
          </h2>
          <p className="text-sm text-gray-400 mb-4">Track new listings across all types over the past 12 weeks</p>
          <div className="h-80">
            <Bar data={chartData.weeklyBreakdown} options={chartOptions as any} />
          </div>
        </div>
      </div>

      {/* Charts Row 1: Distribution & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Listing Type Distribution</h3>
          <div className="h-72">
            <Doughnut data={chartData.listingTypeDistribution} options={pieChartOptions as any} />
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">New Listings Trend</h3>
          <div className="h-72">
            <Bar data={chartData.listingsTrend} options={stackedBarOptions as any} />
          </div>
        </div>
      </div>

      {/* Charts Row 2: Sales & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Trend</h3>
          <div className="h-72">
            <Line data={chartData.salesTrend} options={chartOptions as any} />
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-72">
            <Line data={chartData.userGrowth} options={chartOptions as any} />
          </div>
        </div>
      </div>

      {/* Inventory Breakdown (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Car Condition</h3>
          <div className="h-64">
            <Pie data={chartData.inventoryCondition} options={pieChartOptions as any} />
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Transmission Types</h3>
          <div className="h-64">
            <Pie data={chartData.transmissionDistribution} options={pieChartOptions as any} />
          </div>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Drivetrain</h3>
          <div className="h-64">
            <Pie data={chartData.drivetrainDistribution} options={pieChartOptions as any} />
          </div>
        </div>
      </div>

      {/* Price Distribution */}
      <div className="mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Price Distribution</h3>
          <div className="h-72">
            <Bar data={chartData.priceDistribution} options={chartOptions as any} />
          </div>
        </div>
      </div>

      {/* Top Dealerships */}
      <div className="mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Top Dealerships by Listing Type</h3>
          <div className="h-96">
            <Bar data={chartData.topDealerships} options={horizontalBarOptions as any} />
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
          <div className="h-80">
            <Bar data={chartData.geographicalData} options={chartOptions as any} />
          </div>
        </div>
      </div>
    </>
  );
};
