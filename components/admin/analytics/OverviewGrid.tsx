"use client";

import React from "react";
import {
  ListBulletIcon,
  EyeIcon,
  HeartIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { MetricCard } from "./MetricCard";
import { AnalyticsDataV2 } from "./types";

interface OverviewGridProps {
  analytics: AnalyticsDataV2;
}

/**
 * OverviewGrid Component
 * Displays the 6 platform-wide metric cards with semantic colors
 */
export const OverviewGrid: React.FC<OverviewGridProps> = ({ analytics }) => {
  // Format number helper
  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
      <MetricCard
        title="Total Listings"
        value={formatNumber(analytics.overview.total_listings)}
        icon={<ListBulletIcon className="h-5 w-5 text-indigo-400" />}
        color="bg-indigo-500/20"
        textColor="text-indigo-400"
      />
      
      <MetricCard
        title="Total Views"
        value={formatNumber(analytics.overview.total_views)}
        icon={<EyeIcon className="h-5 w-5 text-slate-400" />}
        color="bg-slate-500/20"
        textColor="text-slate-400"
      />
      
      <MetricCard
        title="Total Likes"
        value={formatNumber(analytics.overview.total_likes)}
        icon={<HeartIcon className="h-5 w-5 text-rose-400" />}
        color="bg-rose-500/20"
        textColor="text-rose-400"
      />
      
      <MetricCard
        title="Dealerships"
        value={formatNumber(analytics.overview.total_dealerships)}
        icon={<BuildingOfficeIcon className="h-5 w-5 text-amber-400" />}
        color="bg-amber-500/20"
        textColor="text-amber-400"
      />
      
      <MetricCard
        title="Total Users"
        value={formatNumber(analytics.overview.total_users)}
        icon={<UserIcon className="h-5 w-5 text-cyan-400" />}
        color="bg-cyan-500/20"
        textColor="text-cyan-400"
      />
      
      <MetricCard
        title="Active Subs"
        value={formatNumber(analytics.overview.active_subscriptions)}
        icon={<CalendarDaysIcon className="h-5 w-5 text-emerald-400" />}
        color="bg-emerald-500/20"
        textColor="text-emerald-400"
      />
    </div>
  );
};
