"use client";

import React from "react";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import { MetricCardProps } from "./types";

/**
 * Smart MetricCard Component V2
 * Features: Glassmorphism, hover effects, trend indicators, optional click handler
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  textColor,
  subtitle,
  trend,
  onClick,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-3 shadow-sm 
        flex flex-col transition-all duration-200
        ${isClickable ? "cursor-pointer hover:scale-105 hover:border-gray-600/70 hover:shadow-lg" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${color} rounded-lg`}>{icon}</div>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-gray-400">{title}</p>
        <p className={`text-xl font-bold ${textColor}`}>{value}</p>
        
        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {trend.isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-rose-400" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-gray-500">{trend.label}</span>
          </div>
        )}
        
        {subtitle && !trend && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
};
