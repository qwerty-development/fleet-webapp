"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingCartIcon,
  GiftIcon,
  ReceiptRefundIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  credit_balance: number;
  created_at: string;
  last_active: string;
}

interface Dealership {
  id: number;
  name: string;
  user_id: string;
  subscription_end_date: string;
}

interface CreditTransaction {
  id: number;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'purchase' | 'deduction' | 'refund' | 'admin_adjustment';
  purpose: 'credit_purchase' | 'post_listing' | 'boost_listing' | 'refund' | 'admin_credit';
  description: string;
  created_at: string;
  reference_id?: string;
  payment_status?: 'pending' | 'success' | 'failed';
  metadata?: any;
}

interface UserWithTransactions extends User {
  recent_transactions: CreditTransaction[];
  total_spent: number;
  total_purchased: number;
  dealership?: Dealership;
}

// Constants
const ITEMS_PER_PAGE = 15;

export default function AdminCreditsPage() {
  const supabase = createClient();

  // State variables
  const [users, setUsers] = useState<UserWithTransactions[]>([]);
  const [dealers, setDealers] = useState<UserWithTransactions[]>([]);
  const [filteredData, setFilteredData] = useState<UserWithTransactions[]>([]);
  
  const [activeTab, setActiveTab] = useState<'users' | 'dealers'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [sortBy, setSortBy] = useState('credit_balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedUser, setSelectedUser] = useState<UserWithTransactions | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDealers: 0,
    totalCreditsUsers: 0,
    totalCreditsDealers: 0,
    avgCreditsUser: 0,
    avgCreditsDealer: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });

  const [filterBalance, setFilterBalance] = useState<'all' | 'zero' | 'positive'>('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);

      // Fetch all users with their credit info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .not('email', 'ilike', '%guest%')
        .neq('name', 'Guest User')
        .not('id', 'like', 'guest%')
        .order('credit_balance', { ascending: false });

      if (usersError) throw usersError;

      // Fetch dealerships
      const { data: dealershipsData, error: dealershipsError } = await supabase
        .from('dealerships')
        .select('*');

      if (dealershipsError) throw dealershipsError;

      // Fetch all credit transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Process users and dealers separately
      const processedUsers: UserWithTransactions[] = [];
      const processedDealers: UserWithTransactions[] = [];

      usersData?.forEach(user => {
        // Get user's transactions
        const userTransactions = transactionsData?.filter(t => t.user_id === user.id) || [];
        
        // Calculate totals
        const totalSpent = userTransactions
          .filter(t => t.transaction_type === 'deduction')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const totalPurchased = userTransactions
          .filter(t => t.transaction_type === 'purchase')
          .reduce((sum, t) => sum + t.amount, 0);

        const userWithTransactions: UserWithTransactions = {
          ...user,
          recent_transactions: userTransactions.slice(0, 10),
          total_spent: totalSpent,
          total_purchased: totalPurchased,
          dealership: undefined
        };

        // Check if user is a dealer
        if (user.role === 'dealer') {
          const dealership = dealershipsData?.find(d => d.user_id === user.id);
          if (dealership) {
            userWithTransactions.dealership = dealership;
          }
          processedDealers.push(userWithTransactions);
        } else {
          processedUsers.push(userWithTransactions);
        }
      });

      setUsers(processedUsers);
      setDealers(processedDealers);

      // Calculate statistics
      const totalCreditsUsers = processedUsers.reduce((sum, u) => sum + (u.credit_balance || 0), 0);
      const totalCreditsDealers = processedDealers.reduce((sum, u) => sum + (u.credit_balance || 0), 0);
      
      const totalRevenue = transactionsData
        ?.filter(t => t.transaction_type === 'purchase' && t.payment_status === 'success')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalUsers: processedUsers.length,
        totalDealers: processedDealers.length,
        totalCreditsUsers: totalCreditsUsers,
        totalCreditsDealers: totalCreditsDealers,
        avgCreditsUser: processedUsers.length > 0 ? totalCreditsUsers / processedUsers.length : 0,
        avgCreditsDealer: processedDealers.length > 0 ? totalCreditsDealers / processedDealers.length : 0,
        totalTransactions: transactionsData?.length || 0,
        totalRevenue: totalRevenue
      });

    } catch (err: any) {
      console.error('Error fetching credit data:', err);
      setError('Failed to fetch credit data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    const dataSource = activeTab === 'users' ? users : dealers;
    let result = [...dataSource];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        u => 
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.id?.toLowerCase().includes(searchLower) ||
          (u.dealership?.name?.toLowerCase().includes(searchLower))
      );
    }

    // Apply balance filter
    if (filterBalance === 'zero') {
      result = result.filter(u => u.credit_balance === 0);
    } else if (filterBalance === 'positive') {
      result = result.filter(u => u.credit_balance > 0);
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'credit_balance':
          compareValue = (a.credit_balance || 0) - (b.credit_balance || 0);
          break;
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
        case 'total_spent':
          compareValue = (a.total_spent || 0) - (b.total_spent || 0);
          break;
        case 'total_purchased':
          compareValue = (a.total_purchased || 0) - (b.total_purchased || 0);
          break;
        case 'last_active':
          compareValue = new Date(a.last_active).getTime() - new Date(b.last_active).getTime();
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // Pagination
    setTotalPages(Math.ceil(result.length / ITEMS_PER_PAGE));
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = result.slice(start, start + ITEMS_PER_PAGE);

    setFilteredData(paginated);
  }, [users, dealers, activeTab, searchQuery, filterBalance, sortBy, sortOrder, currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  // Open user details modal
  const openUserModal = useCallback((user: UserWithTransactions) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  }, []);

  // Open credit adjustment modal
  const openAdjustModal = useCallback((user: UserWithTransactions, type: 'add' | 'deduct') => {
    setSelectedUser(user);
    setAdjustmentType(type);
    setAdjustmentAmount('');
    setIsAdjustModalOpen(true);
  }, []);

  // Handle credit adjustment
  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !adjustmentAmount) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (adjustmentType === 'deduct' && amount > selectedUser.credit_balance) {
      alert('Cannot deduct more than current balance');
      return;
    }

    setIsActionLoading(true);

    try {
      // Calculate new balance
      const finalAmount = adjustmentType === 'add' ? amount : -amount;
      const newBalance = selectedUser.credit_balance + finalAmount;

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ credit_balance: newBalance })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.id,
          amount: finalAmount,
          balance_after: newBalance,
          transaction_type: 'admin_adjustment',
          purpose: 'admin_credit',
          description: `Admin ${adjustmentType === 'add' ? 'added' : 'deducted'} ${amount} credits`,
          payment_status: 'success',
          metadata: {
            admin_action: true,
            adjustment_type: adjustmentType
          }
        });

      if (transactionError) throw transactionError;

      alert(`Successfully ${adjustmentType === 'add' ? 'added' : 'deducted'} ${amount} credits!`);

      // Refresh data
      await fetchData();
      setIsAdjustModalOpen(false);
      setIsUserModalOpen(false);
    } catch (err: any) {
      console.error('Error adjusting credits:', err);
      alert(`Failed to adjust credits: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCartIcon className="h-4 w-4" />;
      case 'deduction':
        return <MinusCircleIcon className="h-4 w-4" />;
      case 'refund':
        return <ReceiptRefundIcon className="h-4 w-4" />;
      case 'admin_adjustment':
        return <GiftIcon className="h-4 w-4" />;
      default:
        return <CurrencyDollarIcon className="h-4 w-4" />;
    }
  };

  // Get transaction color
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'refund':
      case 'admin_adjustment':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'deduction':
        return 'text-rose-400 bg-rose-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  // Chart data
  const distributionChartData = {
    labels: ['Users with Credits', 'Users with Zero Balance'],
    datasets: [
      {
        data: [
          activeTab === 'users' 
            ? users.filter(u => u.credit_balance > 0).length
            : dealers.filter(u => u.credit_balance > 0).length,
          activeTab === 'users'
            ? users.filter(u => u.credit_balance === 0).length
            : dealers.filter(u => u.credit_balance === 0).length
        ],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(107, 114, 128, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'white',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">Credits Management</h1>
              <p className="text-gray-400">Manage user and dealer credit balances</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-white text-2xl font-semibold">{stats.totalUsers}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Avg: {formatCurrency(stats.avgCreditsUser)} credits
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <UserIcon className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Dealers</p>
                  <p className="text-white text-2xl font-semibold">{stats.totalDealers}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Avg: {formatCurrency(stats.avgCreditsDealer)} credits
                  </p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Credits</p>
                  <p className="text-white text-2xl font-semibold">
                    {formatCurrency(stats.totalCreditsUsers + stats.totalCreditsDealers)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    U: {formatCurrency(stats.totalCreditsUsers)} | D: {formatCurrency(stats.totalCreditsDealers)}
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Transactions</p>
                  <p className="text-white text-2xl font-semibold">{stats.totalTransactions}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Revenue: {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <ArrowPathIcon className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <UserIcon className="h-5 w-5 inline mr-2" />
              Users ({stats.totalUsers})
            </button>
            <button
              onClick={() => setActiveTab('dealers')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'dealers'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <BriefcaseIcon className="h-5 w-5 inline mr-2" />
              Dealers ({stats.totalDealers})
            </button>
          </div>

          {/* Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Credit Distribution</h3>
              <div className="h-48">
                <Pie data={distributionChartData} options={chartOptions} />
              </div>
            </div>

            <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Balance</p>
                  <p className="text-emerald-400 text-xl font-bold">
                    {formatCurrency(activeTab === 'users' ? stats.totalCreditsUsers : stats.totalCreditsDealers)}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Average Balance</p>
                  <p className="text-blue-400 text-xl font-bold">
                    {formatCurrency(activeTab === 'users' ? stats.avgCreditsUser : stats.avgCreditsDealer)}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">With Credits</p>
                  <p className="text-purple-400 text-xl font-bold">
                    {activeTab === 'users' 
                      ? users.filter(u => u.credit_balance > 0).length
                      : dealers.filter(u => u.credit_balance > 0).length
                    }
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Zero Balance</p>
                  <p className="text-gray-400 text-xl font-bold">
                    {activeTab === 'users'
                      ? users.filter(u => u.credit_balance === 0).length
                      : dealers.filter(u => u.credit_balance === 0).length
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="block w-full pl-10 pr-10 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Sort and Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('credit_balance')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'credit_balance'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Balance
                {sortBy === 'credit_balance' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('name')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'name'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('total_spent')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'total_spent'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Total Spent
                {sortBy === 'total_spent' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <button
                onClick={() => handleSort('total_purchased')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sortBy === 'total_purchased'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Total Purchased
                {sortBy === 'total_purchased' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              {/* Balance Filter */}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setFilterBalance('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterBalance === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterBalance('positive')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterBalance === 'positive'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Has Credits
                </button>
                <button
                  onClick={() => setFilterBalance('zero')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterBalance === 'zero'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Zero Balance
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <XCircleIcon className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <InformationCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Data Found</h3>
              <p className="text-gray-400">No {activeTab} match your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map(user => (
                <div
                  key={user.id}
                  className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300 cursor-pointer"
                  onClick={() => openUserModal(user)}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mr-4 flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold text-lg truncate">{user.name || 'Unknown'}</h3>
                            {user.role === 'dealer' && user.dealership && (
                              <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                                {user.dealership.name}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <p className="text-gray-400 text-xs mb-1">Current Balance</p>
                          <p className="text-emerald-400 font-bold text-xl">
                            {formatCurrency(user.credit_balance)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-gray-400 text-xs mb-1">Total Spent</p>
                          <p className="text-rose-400 font-semibold">
                            {formatCurrency(user.total_spent)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-gray-400 text-xs mb-1">Total Purchased</p>
                          <p className="text-blue-400 font-semibold">
                            {formatCurrency(user.total_purchased)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdjustModal(user, 'add');
                            }}
                            className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs transition-colors flex items-center"
                          >
                            <PlusCircleIcon className="h-4 w-4 mr-1" />
                            Add
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdjustModal(user, 'deduct');
                            }}
                            className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors flex items-center"
                            disabled={user.credit_balance === 0}
                          >
                            <MinusCircleIcon className="h-4 w-4 mr-1" />
                            Deduct
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex justify-between items-center py-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                    currentPage === 1
                      ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                  }`}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>

                <span className="text-gray-300 text-sm">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? 'bg-gray-700/80 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600/90 hover:bg-indigo-600 text-white'
                  }`}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Transition appear show={isUserModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsUserModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  {selectedUser && (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mr-4">
                            {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{selectedUser.name || 'Unknown'}</h3>
                            <p className="text-gray-400">{selectedUser.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                selectedUser.role === 'dealer'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {selectedUser.role}
                              </span>
                              {selectedUser.dealership && (
                                <span className="text-xs text-gray-400">
                                  {selectedUser.dealership.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsUserModalOpen(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Credit Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                          <p className="text-emerald-400 text-sm mb-1">Current Balance</p>
                          <p className="text-white text-2xl font-bold">{formatCurrency(selectedUser.credit_balance)}</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                          <p className="text-rose-400 text-sm mb-1">Total Spent</p>
                          <p className="text-white text-2xl font-bold">{formatCurrency(selectedUser.total_spent)}</p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <p className="text-blue-400 text-sm mb-1">Total Purchased</p>
                          <p className="text-white text-2xl font-bold">{formatCurrency(selectedUser.total_purchased)}</p>
                        </div>
                      </div>

                      {/* Transaction History */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Recent Transactions
                        </h4>
                        <div className="bg-gray-900/50 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                          {selectedUser.recent_transactions.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                              {selectedUser.recent_transactions.map((transaction) => (
                                <div key={transaction.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start flex-1">
                                      <div className={`p-2 rounded-lg mr-3 ${getTransactionColor(transaction.transaction_type)}`}>
                                        {getTransactionIcon(transaction.transaction_type)}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-white font-medium">{transaction.description}</p>
                                        <p className="text-gray-400 text-sm">{transaction.purpose.replace(/_/g, ' ')}</p>
                                        <p className="text-gray-500 text-xs mt-1">{formatDate(transaction.created_at)}</p>
                                        {transaction.payment_status && (
                                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                                            transaction.payment_status === 'success'
                                              ? 'bg-emerald-500/20 text-emerald-300'
                                              : transaction.payment_status === 'failed'
                                              ? 'bg-rose-500/20 text-rose-300'
                                              : 'bg-amber-500/20 text-amber-300'
                                          }`}>
                                            {transaction.payment_status}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className={`font-bold ${
                                        transaction.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}>
                                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                      </p>
                                      <p className="text-gray-500 text-xs">
                                        Balance: {formatCurrency(transaction.balance_after)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-gray-400">
                              No transaction history
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setIsUserModalOpen(false);
                            openAdjustModal(selectedUser, 'add');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center"
                        >
                          <PlusCircleIcon className="h-5 w-5 mr-2" />
                          Add Credits
                        </button>
                        <button
                          onClick={() => {
                            setIsUserModalOpen(false);
                            openAdjustModal(selectedUser, 'deduct');
                          }}
                          disabled={selectedUser.credit_balance === 0}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MinusCircleIcon className="h-5 w-5 mr-2" />
                          Deduct Credits
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Credit Adjustment Modal */}
      <Transition appear show={isAdjustModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsAdjustModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold text-white text-center mb-4"
                  >
                    {adjustmentType === 'add' ? 'Add Credits' : 'Deduct Credits'}
                  </Dialog.Title>

                  {selectedUser && (
                    <form onSubmit={handleCreditAdjustment} className="space-y-4">
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <p className="text-gray-400 text-sm">Current Balance</p>
                        <p className="text-emerald-400 text-2xl font-bold">
                          {formatCurrency(selectedUser.credit_balance)}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">{selectedUser.name}</p>
                      </div>

                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <input
                            type="number"
                            id="amount"
                            step="1"
                            min="1"
                            max={adjustmentType === 'deduct' ? selectedUser.credit_balance : undefined}
                            value={adjustmentAmount}
                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                            className="w-full pl-10 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                            placeholder="0"
                            required
                          />
                        </div>
                        {adjustmentType === 'deduct' && (
                          <p className="text-gray-500 text-xs mt-1">
                            Max: {formatCurrency(selectedUser.credit_balance)}
                          </p>
                        )}
                      </div>

                      {adjustmentAmount && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-400 text-sm">New Balance Preview</p>
                          <p className="text-white text-xl font-bold">
                            {formatCurrency(
                              selectedUser.credit_balance + 
                              (adjustmentType === 'add' ? 1 : -1) * parseFloat(adjustmentAmount || '0')
                            )}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsAdjustModalOpen(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                          disabled={isActionLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-2 ${
                            adjustmentType === 'add'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          } text-white rounded-lg transition-colors flex items-center`}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <>
                              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {adjustmentType === 'add' ? (
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                              ) : (
                                <MinusCircleIcon className="h-5 w-5 mr-2" />
                              )}
                              Confirm
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Loading Overlay */}
      {isActionLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-white">Processing credit adjustment...</p>
          </div>
        </div>
      )}
    </div>
  );
}
