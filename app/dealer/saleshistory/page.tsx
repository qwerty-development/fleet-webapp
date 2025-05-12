"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import DealerNavbar from "@/components/dealer/navbar";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/utils/AuthContext";
import {
  ShoppingBagIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  BanknotesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import {
  LineChart,
  BarChart,
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
  Bar,
} from "recharts";

interface SaleRecord {
  id: number;
  make: string;
  model: string;
  year: number;
  sold_price: number;
  date_sold: string;
  price: number;
  listed_at: string;
  images: string[];
  description: string;
  buyer_name: string | null;
  bought_price: number;
  date_bought: string;
  seller_name: string | null;
  views?: number;
}

const COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];

// KPI Card Component
const KPICard = ({
  title,
  value,
  icon,
  trend = null,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | null;
}) => (
  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 flex-1 mx-1 shadow-sm">
    <div className="flex justify-between items-center mb-2">
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <span className="flex items-center justify-center p-1.5 rounded-md bg-indigo-500/20 text-indigo-300">
        {icon}
      </span>
    </div>
    <p className="text-white text-2xl font-semibold">{value}</p>
    {trend !== null && (
      <div className="flex items-center text-xs mt-1">
        <span
          className={`flex items-center ${
            trend >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {trend >= 0 ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586V7a1 1 0 112 0v5a1 1 0 01-1 1h-5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {Math.abs(trend)}%
        </span>
        <span className="ml-2 text-gray-400">from last period</span>
      </div>
    )}
  </div>
);

// Sale Card Component
const SaleCard = ({
  sale,
  onViewDetails,
}: {
  sale: SaleRecord;
  onViewDetails: () => void;
}) => {
  const profit = sale.sold_price - sale.bought_price;
  const profitPercentage = ((profit / sale.bought_price) * 100).toFixed(1);
  const daysInStock = Math.ceil(
    (new Date(sale.date_sold).getTime() -
      new Date(sale.date_bought).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl mb-4 overflow-hidden cursor-pointer hover:shadow-xl hover:border-gray-600 transition-all duration-300"
      onClick={onViewDetails}
    >
      <div className="p-4">
        {/* Header: Vehicle Name and Profit */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-white">
            {sale.year} {sale.make} {sale.model}
          </h3>
          <div
            className={`px-3 py-1.5 rounded-full flex items-center space-x-1 ${
              profit >= 0
                ? "bg-green-500/20 text-green-400"
                : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {profit >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17l5-5m0 0l-5-5m5 5H6"
                />
              </svg>
            )}
            <span className="font-medium">
              ${Math.abs(profit).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Buyer and Seller Info */}
        <div className="flex justify-between items-center py-2 border-b border-t border-gray-700/30">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Bought From</p>
              <p className="text-sm font-medium text-white">
                {sale.seller_name || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BuildingStorefrontIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Sold To</p>
              <p className="text-sm font-medium text-white">
                {sale.buyer_name || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Price and Stock Information */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">In Stock</p>
              <p className="text-sm font-medium text-white">
                {daysInStock} days
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BanknotesIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Listed Price</p>
              <p className="text-sm font-medium text-white">
                ${sale.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-700/30">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Bought</p>
              <p className="text-sm font-medium text-white">
                {new Date(sale.date_bought).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400">Sold</p>
              <p className="text-sm font-medium text-white">
                {new Date(sale.date_sold).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component for Details Modal
const StatsCard = ({
  title,
  value,
  trend = null,
  subValue = null,
}: {
  title: string;
  value: string | number;
  trend?: number | null;
  subValue?: string | null;
}) => (
  <div className="bg-gray-800 p-4 rounded-xl flex-1 mx-1">
    <p className="text-xs text-gray-400 mb-2">{title}</p>
    <div className="flex items-baseline">
      <p className="text-lg font-bold text-white">
        {typeof value === "number" ? `$${value?.toLocaleString()}` : value}
      </p>
      {trend !== null && (
        <div
          className={`ml-2 px-2 py-1 rounded-full ${
            trend >= 0
              ? "bg-green-500/20 text-green-400"
              : "bg-rose-500/20 text-rose-400"
          }`}
        >
          <span className="text-xs">
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
    {subValue && <p className="text-xs mt-1 text-gray-400">{subValue}</p>}
  </div>
);

// Stats Card for non-currency values
const StatsCardPlain = ({
  title,
  value,
  trend = null,
  subValue = null,
}: {
  title: string;
  value: string | number;
  trend?: number | null;
  subValue?: string | null;
}) => (
  <div className="bg-gray-800 p-4 rounded-xl flex-1 mx-1">
    <p className="text-xs text-gray-400 mb-2">{title}</p>
    <div className="flex items-baseline">
      <p className="text-lg font-bold text-white">{value}</p>
      {trend !== null && (
        <div
          className={`ml-2 px-2 py-1 rounded-full ${
            trend >= 0
              ? "bg-green-500/20 text-green-400"
              : "bg-rose-500/20 text-rose-400"
          }`}
        >
          <span className="text-xs">
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
    {subValue && <p className="text-xs mt-1 text-gray-400">{subValue}</p>}
  </div>
);

// Sale Details Modal
const SaleDetailsModal = ({
  isOpen,
  onClose,
  sale,
}: {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleRecord | null;
}) => {
  if (!sale) return null;

  const daysListed = Math.ceil(
    (new Date(sale.date_sold).getTime() - new Date(sale.listed_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const daysInStock = Math.ceil(
    (new Date(sale.date_sold).getTime() -
      new Date(sale.date_bought).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const priceDifference = sale.sold_price - sale.price;
  const actualProfit = sale.sold_price - sale.bought_price;
  const expectedProfit = sale.price - sale.bought_price;
  const priceDifferencePercentage = (
    (priceDifference / sale.price) *
    100
  ).toFixed(2);

  const barChartData = [
    { name: "Bought", value: sale.bought_price },
    { name: "Listed", value: sale.price },
    { name: "Sold", value: sale.sold_price },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          ></div>
        </div>

        <div className="inline-block align-bottom bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white">Sale Details</h3>
              <p className="text-gray-300">
                {sale.year} {sale.make} {sale.model}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            {/* Key Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatsCard title="Listed Price" value={sale.price} />
                <StatsCard
                  title="Sold Price"
                  value={sale.sold_price}
                  trend={parseFloat(priceDifferencePercentage)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatsCard
                  title="Actual Profit"
                  value={actualProfit}
                  trend={parseFloat(
                    ((actualProfit / sale.bought_price) * 100).toFixed(1)
                  )}
                />
                <StatsCard title="Expected Profit" value={expectedProfit} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatsCardPlain
                  title="Days Listed"
                  value={daysListed}
                  subValue="Until Sale"
                />
                <StatsCardPlain
                  title="Days in Stock"
                  value={daysInStock}
                  subValue="Total Duration"
                />
              </div>
            </div>

            {/* Transaction Details */}
            <div className="px-6 pb-6">
              <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Transaction Details
                </h4>

                <div className="space-y-3">
                  {sale.buyer_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyer</span>
                      <span className="font-medium text-white">
                        {sale.buyer_name}
                      </span>
                    </div>
                  )}

                  {sale.seller_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seller</span>
                      <span className="font-medium text-white">
                        {sale.seller_name}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-400">Purchase Date</span>
                    <span className="font-medium text-white">
                      {new Date(sale.date_bought)?.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Sale Date</span>
                    <span className="font-medium text-white">
                      {new Date(sale.date_sold)?.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Chart */}
            <div className="px-6 pb-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Price Breakdown
              </h4>
              <div className="h-64 bg-gray-900/50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderColor: "#4B5563",
                      }}
                      formatter={(value) => [`$${value}`, "Price"]}
                    />
                    <Bar dataKey="value" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export Modal Component
const ExportSalesModal = ({
  isOpen,
  onClose,
  salesData,
}: {
  isOpen: boolean;
  onClose: () => void;
  salesData: SaleRecord[];
}) => {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">(
    "csv"
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      onClose();
      // In a real implementation, you would generate and download the file here
      alert(`Sales data exported as ${exportFormat.toUpperCase()}`);
    }, 1500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          ></div>
        </div>

        <div className="inline-block align-bottom bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Export Sales Data
            </h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Choose Export Format
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setExportFormat("csv")}
                  className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center border ${
                    exportFormat === "csv"
                      ? "border-indigo-500 bg-indigo-900/20 text-indigo-400"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50 text-gray-300"
                  }`}
                >
                  <DocumentArrowDownIcon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">CSV</span>
                </button>

                <button
                  onClick={() => setExportFormat("excel")}
                  className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center border ${
                    exportFormat === "excel"
                      ? "border-indigo-500 bg-indigo-900/20 text-indigo-400"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50 text-gray-300"
                  }`}
                >
                  <svg
                    className="h-6 w-6 mb-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14,2H6C4.89,2 4,2.89 4,4V20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L15,19V17L13,17V16L15,16V14L13,14V13L15,13V11L10,11Z" />
                  </svg>
                  <span className="text-sm font-medium">Excel</span>
                </button>

                <button
                  onClick={() => setExportFormat("pdf")}
                  className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center border ${
                    exportFormat === "pdf"
                      ? "border-indigo-500 bg-indigo-900/20 text-indigo-400"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50 text-gray-300"
                  }`}
                >
                  <svg
                    className="h-6 w-6 mb-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12,10.5H13V13.5H12V10.5M7,11.5H8V10.5H7V11.5M20,6V18C20,19.1 19.1,20 18,20H6C4.9,20 4,19.1 4,18V6C4,4.9 4.9,4 6,4H18C19.1,4 20,4.9 20,6M9.5,10.5C9.5,9.67 8.83,9 8,9H6V15H7V13H8C8.83,13 9.5,12.33 9.5,11.5M14.5,10.5C14.5,9.67 13.83,9 13,9H11V15H13C13.83,15 14.5,14.33 14.5,13.5V10.5M18,9H15.5V15H16.5V13H18V11.5H16.5V10H18V9Z" />
                  </svg>
                  <span className="text-sm font-medium">PDF</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Data to Include
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="include-all"
                    name="include-all"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    defaultChecked
                  />
                  <label
                    htmlFor="include-all"
                    className="ml-2 text-sm text-gray-300"
                  >
                    All sale records ({salesData.length} items)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="include-details"
                    name="include-details"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    defaultChecked
                  />
                  <label
                    htmlFor="include-details"
                    className="ml-2 text-sm text-gray-300"
                  >
                    Include detailed price information
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="include-summary"
                    name="include-summary"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-800"
                    defaultChecked
                  />
                  <label
                    htmlFor="include-summary"
                    className="ml-2 text-sm text-gray-300"
                  >
                    Include summary statistics
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-700 flex flex-row-reverse">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Export as {exportFormat.toUpperCase()}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="mr-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function calculateKPIs(salesHistory: SaleRecord[]) {
  const totalSold = salesHistory.length;
  const totalViews = salesHistory.reduce(
    (sum, sale) => sum + (sale.views || 0),
    0
  );
  const totalRevenue = salesHistory.reduce(
    (sum, sale) => sum + sale.sold_price,
    0
  );
  const totalProfit = salesHistory.reduce(
    (sum, sale) => sum + (sale.sold_price - sale.bought_price),
    0
  );

  // Calculate trends (example: compare with previous month)
  const currentMonth = new Date().getMonth();
  const currentYearSales = salesHistory.filter(
    (sale) => new Date(sale.date_sold).getMonth() === currentMonth
  );
  const previousMonthSales = salesHistory.filter(
    (sale) => new Date(sale.date_sold).getMonth() === currentMonth - 1
  );

  const trend =
    previousMonthSales.length > 0
      ? ((currentYearSales.length - previousMonthSales.length) /
          previousMonthSales.length) *
        100
      : 0;

  return {
    totalSold,
    totalViews,
    totalRevenue,
    totalProfit,
    trend: parseFloat(trend.toFixed(1)),
  };
}

// Enhanced Sales Chart Component
const EnhancedSalesChart = ({ salesData }: { salesData: any[] }) => {
  const [chartType, setChartType] = useState<"profit" | "revenue">("profit");

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Sales Performance</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType("profit")}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              chartType === "profit"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Profit
          </button>
          <button
            onClick={() => setChartType("revenue")}
            className={`px-3 py-1.5 text-xs rounded-lg ${
              chartType === "revenue"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Revenue
          </button>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "profit" ? (
            <AreaChart
              data={salesData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#4B5563",
                  color: "#F9FAFB",
                }}
                formatter={(value: any) => [
                  `$${value.toLocaleString()}`,
                  "Profit",
                ]}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#6366F1"
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          ) : (
            <AreaChart
              data={salesData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#4B5563",
                  color: "#F9FAFB",
                }}
                formatter={(value: any) => [
                  `$${value.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function DealerSalesHistoryPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();

  // State for sales history data
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // KPI metrics state
  const [kpis, setKpis] = useState({
    totalSold: 0,
    totalViews: 0,
    totalRevenue: 0,
    totalProfit: 0,
    trend: 0,
  });

  // Dealership information state
  const [dealership, setDealership] = useState<any>(null);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const hasOpenModal = isSaleModalOpen || isExportModalOpen;
    document.body.style.overflow = hasOpenModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSaleModalOpen, isExportModalOpen]);

  // Fetch dealership details
  const fetchDealershipDetails = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("dealerships")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setDealership(data);
    } catch (error) {
      console.error("Error fetching dealership details:", error);
    }
  }, [user, supabase]);

  // Fetch sales history data
  const fetchSalesHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const { data: dealershipData } = await supabase
        .from("dealerships")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (dealershipData) {
        const { data, error } = await supabase
          .from("cars")
          .select(
            "id, make, model, year, sold_price, date_sold, price, listed_at, images, description, buyer_name, bought_price, date_bought, seller_name, views"
          )
          .eq("dealership_id", dealershipData.id)
          .eq("status", "sold");

        if (error) throw error;
        setSalesHistory(data || []);

        // Calculate KPIs based on sales data
        if (data && data.length > 0) {
          setKpis(calculateKPIs(data));
        }
      }
    } catch (error) {
      console.error("Error fetching sales history:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchDealershipDetails();
    fetchSalesHistory();
  }, [fetchDealershipDetails, fetchSalesHistory]);

  // Toggle sort order between ascending and descending
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Filter and sort sales data based on sort order
  const filteredAndSortedSales = useMemo(() => {
    return [...salesHistory].sort((a, b) => {
      const dateA = new Date(a.date_sold).getTime();
      const dateB = new Date(b.date_sold).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [salesHistory, sortOrder]);

  // Calculate monthly sales data for chart
  const salesData = useMemo(() => {
    const monthlyData: Record<
      string,
      { count: number; total: number; profit: number }
    > = {};

    salesHistory.forEach((sale) => {
      const saleDate = new Date(sale.date_sold);
      const monthYear = saleDate.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          count: 0,
          total: 0,
          profit: 0,
        };
      }

      monthlyData[monthYear].count += 1;
      monthlyData[monthYear].total += sale.sold_price;
      monthlyData[monthYear].profit += sale.sold_price - sale.bought_price;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        total: data.total,
        profit: data.profit,
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(" ");
        const [bMonth, bYear] = b.month.split(" ");
        return (
          new Date(`${aMonth} 20${aYear}`).getTime() -
          new Date(`${bMonth} 20${bYear}`).getTime()
        );
      });
  }, [salesHistory]);

  const handleRefresh = () => {
    fetchSalesHistory();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <DealerNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Sales History
              </h1>
              {dealership && (
                <div className="flex items-center">
                  {dealership.logo && (
                    <img
                      src={dealership.logo}
                      alt={dealership.name}
                      className="h-6 w-6 rounded-full mr-2 object-cover"
                    />
                  )}
                  <p className="text-gray-400">{dealership.name}</p>
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleRefresh}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                disabled={isRefreshing}
              >
                <ArrowPathIcon
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* KPI Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard
                  title="Total Sold"
                  value={kpis.totalSold}
                  icon={<ShoppingBagIcon className="h-4 w-4" />}
                />
                <KPICard
                  title="Total Views"
                  value={kpis.totalViews}
                  icon={<EyeIcon className="h-4 w-4" />}
                />
                <KPICard
                  title="Total Revenue"
                  value={`$${kpis.totalRevenue.toLocaleString()}`}
                  icon={<CurrencyDollarIcon className="h-4 w-4" />}
                />
                <KPICard
                  title="Total Profit"
                  value={`$${kpis.totalProfit.toLocaleString()}`}
                  icon={<ArrowTrendingUpIcon className="h-4 w-4" />}
                  trend={kpis.trend}
                />
              </div>

              {/* Export Button */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center mb-6"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export Sales Data
              </button>

              {/* Sales Performance Chart */}
              <EnhancedSalesChart salesData={salesData} />

              {/* Sales List */}
              <div id="recent-sales" className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Recent Sales
                  </h3>
                  <button
                    onClick={toggleSortOrder}
                    className="flex items-center text-gray-400 hover:text-white"
                  >
                    <span className="mr-1">
                      {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                    </span>
                    {sortOrder === "desc" ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronUpIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {filteredAndSortedSales.length > 0 ? (
                  filteredAndSortedSales.map((sale) => (
                    <SaleCard
                      key={sale.id}
                      sale={sale}
                      onViewDetails={() => {
                        setSelectedSale(sale);
                        setIsSaleModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-gray-800/50 rounded-xl py-12 px-4 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-600 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-400">No sales records found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Complete a sale to see it listed here
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaleDetailsModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        sale={selectedSale}
      />

      <ExportSalesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        salesData={salesHistory}
      />
    </div>
  );
}
