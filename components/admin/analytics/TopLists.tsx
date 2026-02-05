"use client";

import React from "react";
import {
  EyeIcon,
  HeartIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TruckIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { AnalyticsDataV2 } from "./types";

interface TopListsProps {
  analytics: AnalyticsDataV2;
}

/**
 * TopLists Component
 * Displays top performers: cars for sale, rentals, plates, user engagement, and regional data
 */
export const TopLists: React.FC<TopListsProps> = ({ analytics }) => {
  // Format helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num);

  return (
    <>
      {/* Top Listings by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Cars for Sale */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg mr-2">
              <ShoppingCartIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Cars for Sale</h3>
          </div>
          <div className="space-y-3">
            {analytics.top_cars?.slice(0, 5).map((car, idx) => (
              <div key={car.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                <div className="flex items-center">
                  <span className="text-indigo-400 font-bold mr-3 w-5">{idx + 1}</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {car.make} {car.model}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {car.year} • {formatCurrency(car.price)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400 text-sm">{formatNumber(car.views)} views</p>
                  <p className="text-rose-400 text-xs">{formatNumber(car.likes)} likes</p>
                </div>
              </div>
            ))}
            {(!analytics.top_cars || analytics.top_cars.length === 0) && (
              <p className="text-gray-500 text-center py-4">No cars for sale yet</p>
            )}
          </div>
        </div>

        {/* Top Cars for Rent */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-teal-500/20 rounded-lg mr-2">
              <TruckIcon className="h-5 w-5 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Cars for Rent</h3>
          </div>
          <div className="space-y-3">
            {analytics.top_rentals?.slice(0, 5).map((car, idx) => (
              <div key={car.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                <div className="flex items-center">
                  <span className="text-teal-400 font-bold mr-3 w-5">{idx + 1}</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {car.make} {car.model}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {car.year} • {formatCurrency(car.price)}/{car.rental_period}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400 text-sm">{formatNumber(car.views)} views</p>
                  <p className="text-rose-400 text-xs">{formatNumber(car.likes)} likes</p>
                </div>
              </div>
            ))}
            {(!analytics.top_rentals || analytics.top_rentals.length === 0) && (
              <p className="text-gray-500 text-center py-4">No rental listings yet</p>
            )}
          </div>
        </div>

        {/* Top Number Plates */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg mr-2">
              <KeyIcon className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Number Plates</h3>
          </div>
          <div className="space-y-3">
            {analytics.top_plates?.slice(0, 5).map((plate, idx) => (
              <div
                key={plate.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30"
              >
                <div className="flex items-center">
                  <span className="text-amber-400 font-bold mr-3 w-5">{idx + 1}</span>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {plate.letter} {plate.digits}
                    </p>
                    <p className="text-gray-400 text-xs">{formatCurrency(plate.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400 text-sm">{formatNumber(plate.views)} views</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      plate.status === "available"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : plate.status === "sold"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {plate.status}
                  </span>
                </div>
              </div>
            ))}
            {(!analytics.top_plates || analytics.top_plates.length === 0) && (
              <p className="text-gray-500 text-center py-4">No plates yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Viewers */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg mr-2">
              <EyeIcon className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Viewers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {analytics.user_engagement?.top_viewers?.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {v.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{v.email || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-right text-cyan-400 font-semibold">
                      {v.views_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Likers */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-rose-500/20 rounded-lg mr-2">
              <HeartIcon className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Top Likers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                    Likes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {analytics.user_engagement?.top_likers?.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-white">
                      {l.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{l.email || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-right text-rose-400 font-semibold">
                      {l.likes_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Regional Highlights */}
      <div className="mb-8">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg mr-2">
              <MapPinIcon className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Regional Highlights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.geographical_data?.slice(0, 6).map((region) => (
              <div
                key={region.name}
                className="p-4 rounded-lg bg-gray-700/30 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                    <h4 className="text-white font-medium">{region.name}</h4>
                  </div>
                  <div className="mt-1 text-sm text-gray-400">
                    {region.listings} listings, {region.sales} sales
                  </div>
                </div>
                <div className="text-xl font-bold text-indigo-400">
                  {region.listings > 0 ? ((region.sales / region.listings) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
