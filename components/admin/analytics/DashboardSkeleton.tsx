"use client";

import React from "react";

/**
 * DashboardSkeleton Component
 * Loading state that mirrors the actual dashboard layout to prevent layout shift
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-9 w-64 bg-gray-700/30 rounded-lg mb-2"></div>
        <div className="h-5 w-96 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* Time Range Selector Skeleton */}
      <div className="flex justify-end mb-6">
        <div className="h-10 w-64 bg-gray-700/30 rounded-lg"></div>
      </div>

      {/* Command Center Header Skeleton */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
        <div className="h-8 w-72 bg-gray-700/30 rounded-lg mb-2"></div>
        <div className="h-5 w-96 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* Overview Grid (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 bg-gray-700/40 rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-gray-700/30 rounded"></div>
              <div className="h-7 w-16 bg-gray-700/40 rounded"></div>
              <div className="h-3 w-24 bg-gray-700/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Breakdown Chart */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-64 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="h-80 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* Three Column Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="h-6 w-40 bg-gray-700/30 rounded-lg mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-700/20 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Period Metrics Grid */}
      <div className="mb-8">
        <div className="h-6 w-48 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <div className="h-10 w-10 bg-gray-700/40 rounded-lg mb-2"></div>
              <div className="h-3 w-20 bg-gray-700/30 rounded mb-2"></div>
              <div className="h-7 w-16 bg-gray-700/40 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards (4 across) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center mb-2">
              <div className="h-9 w-9 bg-gray-700/40 rounded-lg mr-2"></div>
              <div className="h-5 w-32 bg-gray-700/30 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-gray-700/40 rounded"></div>
          </div>
        ))}
      </div>

      {/* AutoClips Section */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-40 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 w-16 bg-gray-700/40 rounded"></div>
              <div className="h-3 w-20 bg-gray-700/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="h-6 w-48 bg-gray-700/30 rounded-lg mb-4"></div>
            <div className="h-72 bg-gray-700/20 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Three Column Chart Grid (Inventory Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="h-6 w-40 bg-gray-700/30 rounded-lg mb-4"></div>
            <div className="h-64 bg-gray-700/20 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Full Width Chart */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-56 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="h-72 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* Top Dealerships Full Width */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-64 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="h-96 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* Top Listings Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="h-6 w-40 bg-gray-700/30 rounded-lg mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-700/20 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Geographic Distribution */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-56 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="h-80 bg-gray-700/20 rounded-lg"></div>
      </div>

      {/* User Engagement Tables (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
            <div className="h-6 w-40 bg-gray-700/30 rounded-lg mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-12 bg-gray-700/20 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Regional Highlights */}
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="h-6 w-48 bg-gray-700/30 rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-700/20 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
