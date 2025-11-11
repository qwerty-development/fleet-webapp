'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import AdminNavbar from '@/components/admin/navbar';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  EyeIcon,
  CursorArrowRaysIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface BoostAnalytic {
  id: number;
  car_id: number;
  dealership_id: number | null;
  user_id: string | null;
  event_type: 'impression' | 'click' | 'call' | 'whatsapp' | 'chat';
  boost_priority: number | null;
  created_at: string;
  metadata: any;
  cars?: {
    make: string;
    model: string;
    year: number;
  };
  dealerships?: {
    name: string;
  };
}

interface BoostHistory {
  id: number;
  car_id: number;
  dealership_id: number | null;
  user_id: string | null;
  action_type: 'purchased' | 'expired' | 'cancelled' | 'upgraded';
  boost_priority: number;
  duration_days: number;
  credits_spent: number;
  start_date: string;
  end_date: string;
  created_at: string;
  notes: string | null;
  cars?: {
    make: string;
    model: string;
    year: number;
  };
  dealerships?: {
    name: string;
  };
}

interface CreditTransaction {
  id: number;
  created_at: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'purchase' | 'deduction' | 'refund' | 'admin_adjustment';
  purpose: 'credit_purchase' | 'post_listing' | 'boost_listing' | 'refund' | 'admin_credit';
  reference_id: string | null;
  description: string;
  whish_external_id: number | null;
  payment_status: 'pending' | 'success' | 'failed' | null;
  metadata: any;
  users?: {
    email: string;
    full_name: string;
  };
}

interface Stats {
  totalImpressions: number;
  totalClicks: number;
  totalCalls: number;
  totalWhatsapp: number;
  totalChat: number;
  activeBoosts: number;
  totalCreditsSpent: number;
  totalRevenue: number;
}

const ITEMS_PER_PAGE = 15;

export default function BoostAnalyticsPage() {
  const [analytics, setAnalytics] = useState<BoostAnalytic[]>([]);
  const [boostHistory, setBoostHistory] = useState<BoostHistory[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalImpressions: 0,
    totalClicks: 0,
    totalCalls: 0,
    totalWhatsapp: 0,
    totalChat: 0,
    activeBoosts: 0,
    totalCreditsSpent: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'transactions'>('analytics');
  const [dateRange, setDateRange] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - dateRange);
      const dateFilter = dateThreshold.toISOString();

      // Fetch boost analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('boost_analytics')
        .select(`
          *,
          cars(make, model, year),
          dealerships(name)
        `)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
      }

      // Fetch boost history
      const { data: historyData, error: historyError } = await supabase
        .from('boost_history')
        .select(`
          *,
          cars(make, model, year),
          dealerships(name)
        `)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(500);

      if (historyError) {
        console.error('History error:', historyError);
      }

      // Fetch all credit transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(500);

      if (transactionsError) {
        console.error('Transactions error:', transactionsError);
        console.error('Full error details:', JSON.stringify(transactionsError, null, 2));
      }

      // Fetch user details separately if transactions exist
      let transactionsWithUsers = transactionsData || [];
      if (transactionsData && transactionsData.length > 0) {
        const userIds = Array.from(new Set(transactionsData.map(t => t.user_id)));
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds);

        // Map users to transactions
        transactionsWithUsers = transactionsData.map(transaction => ({
          ...transaction,
          users: usersData?.find(u => u.id === transaction.user_id)
        }));
      }

      setAnalytics(analyticsData || []);
      setBoostHistory(historyData || []);
      setCreditTransactions(transactionsWithUsers || []);

      console.log('Fetched data:', {
        analytics: analyticsData?.length || 0,
        history: historyData?.length || 0,
        transactions: transactionsWithUsers?.length || 0,
        transactionsSample: transactionsWithUsers?.[0]
      });

      // Calculate stats
      const impressions = analyticsData?.filter(a => a.event_type === 'impression').length || 0;
      const clicks = analyticsData?.filter(a => a.event_type === 'click').length || 0;
      const calls = analyticsData?.filter(a => a.event_type === 'call').length || 0;
      const whatsapp = analyticsData?.filter(a => a.event_type === 'whatsapp').length || 0;
      const chat = analyticsData?.filter(a => a.event_type === 'chat').length || 0;

      const now = new Date();
      const activeBoosts = historyData?.filter(h => 
        new Date(h.end_date) > now && h.action_type === 'purchased'
      ).length || 0;

      const totalCreditsSpent = historyData?.reduce((sum, h) => sum + h.credits_spent, 0) || 0;
      
      const totalRevenue = transactionsWithUsers?.filter(t => 
        (t.transaction_type === 'deduction' || t.transaction_type === 'purchase') && 
        t.payment_status === 'success'
      ).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      setStats({
        totalImpressions: impressions,
        totalClicks: clicks,
        totalCalls: calls,
        totalWhatsapp: whatsapp,
        totalChat: chat,
        activeBoosts,
        totalCreditsSpent,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data
  const filteredAnalytics = useMemo(() => {
    if (!searchTerm) return analytics;
    const searchLower = searchTerm.toLowerCase();
    return analytics.filter(a => 
      a.cars?.make.toLowerCase().includes(searchLower) ||
      a.cars?.model.toLowerCase().includes(searchLower) ||
      a.dealerships?.name.toLowerCase().includes(searchLower)
    );
  }, [analytics, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return boostHistory;
    const searchLower = searchTerm.toLowerCase();
    return boostHistory.filter(h => 
      h.cars?.make.toLowerCase().includes(searchLower) ||
      h.cars?.model.toLowerCase().includes(searchLower) ||
      h.dealerships?.name.toLowerCase().includes(searchLower)
    );
  }, [boostHistory, searchTerm]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return creditTransactions;
    const searchLower = searchTerm.toLowerCase();
    return creditTransactions.filter(t => 
      t.users?.email.toLowerCase().includes(searchLower) ||
      t.users?.full_name?.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower)
    );
  }, [creditTransactions, searchTerm]);

  // Pagination
  const getCurrentData = () => {
    const data = activeTab === 'analytics' ? filteredAnalytics : 
                  activeTab === 'history' ? filteredHistory : 
                  filteredTransactions;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = useMemo(() => {
    const data = activeTab === 'analytics' ? filteredAnalytics : 
                  activeTab === 'history' ? filteredHistory : 
                  filteredTransactions;
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  }, [activeTab, filteredAnalytics, filteredHistory, filteredTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Chart data
  const getEventTypeChartData = () => {
    return {
      labels: ['Impressions', 'Clicks', 'Calls', 'WhatsApp', 'Chat'],
      datasets: [{
        data: [stats.totalImpressions, stats.totalClicks, stats.totalCalls, stats.totalWhatsapp, stats.totalChat],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2
      }]
    };
  };

  const getConversionData = () => {
    const conversionRate = stats.totalImpressions > 0 
      ? (stats.totalClicks / stats.totalImpressions) * 100
      : 0;
    
    const engagementRate = stats.totalClicks > 0
      ? ((stats.totalCalls + stats.totalWhatsapp + stats.totalChat) / stats.totalClicks) * 100
      : 0;

    return {
      labels: ['Conversion Rate', 'Engagement Rate'],
      datasets: [{
        label: 'Percentage',
        data: [conversionRate, engagementRate],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(234, 88, 12, 0.8)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(234, 88, 12)'],
        borderWidth: 2
      }]
    };
  };

  const getDailyTrendsData = () => {
    const days = Array.from({ length: dateRange }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dateRange - 1 - i));
      return date.toISOString().split('T')[0];
    });

    const impressionsByDay = days.map(day => 
      analytics.filter(a => a.event_type === 'impression' && a.created_at.startsWith(day)).length
    );

    const clicksByDay = days.map(day => 
      analytics.filter(a => a.event_type === 'click' && a.created_at.startsWith(day)).length
    );

    return {
      labels: days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Impressions',
          data: impressionsByDay,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Clicks',
          data: clicksByDay,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
        },
        beginAtZero: true
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(156, 163, 175, 1)',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(156, 163, 175, 1)',
          boxWidth: 15,
          padding: 10,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
        <AdminNavbar />
        <div className="pt-16 lg:pt-0 lg:pl-64">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">Boost Analytics & Credits</h1>
              <p className="text-gray-400">Track boost performance, credit spending on boosts, and boost engagement metrics</p>
            </div>
            <button
              onClick={fetchData}
              className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Impressions</p>
                  <p className="text-white text-2xl font-semibold mt-1">{stats.totalImpressions.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Clicks</p>
                  <p className="text-white text-2xl font-semibold mt-1">{stats.totalClicks.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CursorArrowRaysIcon className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Active Boosts</p>
                  <p className="text-white text-2xl font-semibold mt-1">{stats.activeBoosts}</p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BoltIcon className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">Total Credits Activity</p>
                  <p className="text-white text-2xl font-semibold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={60}>Last 60 Days</option>
                  <option value={90}>Last 90 Days</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by car, dealership, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {(analytics.length > 0 || boostHistory.length > 0 || creditTransactions.length > 0) ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Event Distribution</h3>
                  <div className="h-64">
                    <Pie data={getEventTypeChartData()} options={pieChartOptions} />
                  </div>
                </div>

                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="h-64">
                    <Bar data={getConversionData()} options={chartOptions} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Daily Trends</h3>
                <div className="h-72">
                  <Line data={getDailyTrendsData()} options={chartOptions} />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center mb-8">
              <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
              <p className="text-gray-400">No boost analytics or credit transactions found for the selected date range.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
            <div className="border-b border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-b-2 border-indigo-500 text-indigo-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Analytics Events ({filteredAnalytics.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'border-b-2 border-indigo-500 text-indigo-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Boost History ({filteredHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'transactions'
                      ? 'border-b-2 border-indigo-500 text-indigo-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  All Credit Transactions ({filteredTransactions.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'analytics' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Car</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dealership</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                      {getCurrentData().map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {item.cars ? `${item.cars.year} ${item.cars.make} ${item.cars.model}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.dealerships?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.event_type === 'impression' ? 'bg-blue-500/20 text-blue-300' :
                              item.event_type === 'click' ? 'bg-green-500/20 text-green-300' :
                              item.event_type === 'call' ? 'bg-yellow-500/20 text-yellow-300' :
                              item.event_type === 'whatsapp' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-pink-500/20 text-pink-300'
                            }`}>
                              {item.event_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {item.boost_priority || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getCurrentData().length === 0 && (
                    <div className="text-center py-12 text-gray-400">No analytics data found</div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Car</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dealership</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                      {getCurrentData().map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {item.cars ? `${item.cars.year} ${item.cars.make} ${item.cars.model}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.dealerships?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.action_type === 'purchased' ? 'bg-green-500/20 text-green-300' :
                              item.action_type === 'expired' ? 'bg-gray-500/20 text-gray-300' :
                              item.action_type === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {item.action_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {item.boost_priority}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {item.duration_days} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {item.credits_spent} credits
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getCurrentData().length === 0 && (
                    <div className="text-center py-12 text-gray-400">No boost history found</div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance After</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                      {getCurrentData().map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div>
                              <div className="font-medium text-white">{item.users?.full_name || 'N/A'}</div>
                              <div className="text-gray-400 text-xs">{item.users?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.transaction_type === 'purchase' ? 'bg-green-500/20 text-green-300' :
                              item.transaction_type === 'deduction' ? 'bg-red-500/20 text-red-300' :
                              item.transaction_type === 'refund' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {item.transaction_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {item.purpose.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            ${formatCurrency(Number(item.amount))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            ${formatCurrency(Number(item.balance_after))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.payment_status && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.payment_status === 'success' ? 'bg-green-500/20 text-green-300' :
                                item.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-red-500/20 text-red-300'
                              }`}>
                                {item.payment_status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(item.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getCurrentData().length === 0 && (
                    <div className="text-center py-12 text-gray-400">No transactions found</div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                      currentPage === 1
                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  <span className="text-gray-300 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
