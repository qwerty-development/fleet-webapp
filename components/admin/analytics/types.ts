/**
 * Analytics Types & Constants
 * Shared type definitions for Admin Analytics Dashboard V2
 */

// Define interface for the analytics data structure
export interface AnalyticsDataV2 {
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

// Trend indicator for metric cards
export interface TrendData {
  value: number;
  isPositive: boolean;
  label: string;
}

// Props for the Smart MetricCard component
export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  subtitle?: string;
  trend?: TrendData;
  onClick?: () => void;
}

// Chart color palette - semantic colors for consistency
export const CHART_COLORS = {
  primary: "#4f46e5",      // Indigo - Primary/Listings
  secondary: "#0891b2",    // Cyan
  accent: "#d97706",       // Amber - Alerts/Pending
  success: "#16a34a",      // Emerald - Revenue/Success
  danger: "#dc2626",       // Red
  warning: "#f59e0b",      // Yellow
  info: "#0284c7",         // Blue
  purple: "#8b5cf6",       // Purple
  pink: "#ec4899",         // Pink
  teal: "#14b8a6",         // Teal
  new: "#3b82f6",          // Blue
  used: "#8b5cf6",         // Purple
  certified: "#10b981",    // Green
  classic: "#f59e0b",      // Orange
  custom: "#ef4444",       // Red
} as const;

// Time range options
export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

// Chart configuration types
export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: {
    x: {
      grid: { color: string };
      ticks: { color: string };
      stacked?: boolean;
    };
    y: {
      grid: { color: string };
      ticks: { color: string };
      stacked?: boolean;
    };
  };
  plugins: {
    legend: {
      position: "top" | "right" | "bottom" | "left";
      labels: {
        color: string;
        boxWidth: number;
        padding: number;
        font?: { size: number };
      };
    };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
      padding: number;
      boxPadding: number;
      cornerRadius: number;
      usePointStyle: boolean;
    };
  };
  indexAxis?: "x" | "y";
}
