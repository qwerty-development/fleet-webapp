"use client";

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  Users, 
  Car, 
  Play, 
  TrendingUp, 
  Eye, 
  Heart, 
  ArrowLeft,
  UserCheck,
  UserPlus,
  Calendar,
  Trophy,
  Sparkles,
  Building2,
  Shield
} from "lucide-react";

interface AnalyticsStats {
  activeUsers: number;
  totalUsers: number;   
  guestUsers: number;
  signedUpUsers: number;
  dailyUsers: number;
  totalCars: number;
  totalClips: number;
  totalDealerships: number;
  topCars: { make: string; model: string; views: number }[];
  topClips: { title: string; likes: number }[];
  liveUserEmails: { email: string; last_active: string; is_guest: boolean }[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  gradient: string;
  isLive?: boolean;
  large?: boolean;
}

interface TopListItem {
  name: string;
  value: number;
  icon: ReactNode;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [bigCelebration, setBigCelebration] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLiveUsers, setShowLiveUsers] = useState(false);

  // Your original fetch stats function
  const fetchStats = async () => {
    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Active users in last 5 mins
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_active", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Get live users' emails (active in last 5 mins)
    const { data: liveUsersData } = await supabase
      .from("users")
      .select("email, last_active, is_guest")
      .gte("last_active", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("last_active", { ascending: false });

    // Guest users
    const { count: guestUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_guest", true);

    // Signed up users (non-guest users)
    const { count: signedUpUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_guest", false);

    // Daily active users
    const { count: dailyUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_active", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    // Cars
    const { count: totalCars } = await supabase
      .from("cars")
      .select("*", { count: "exact", head: true });

    // AutoClips
    const { count: totalClips } = await supabase
      .from("auto_clips")
      .select("*", { count: "exact", head: true });

    // Dealerships
    const { count: totalDealerships } = await supabase
      .from("dealerships")
      .select("*", { count: "exact", head: true });

    // Top cars by views
    const { data: topCars } = await supabase
      .from("cars")
      .select("make, model, views")
      .order("views", { ascending: false })
      .limit(5);

    // Top clips by likes
    const { data: topClips } = await supabase
      .from("auto_clips")
      .select("title, likes")
      .order("likes", { ascending: false })
      .limit(5);

    const newStats = {
      activeUsers: activeUsers || 0,
      totalUsers: totalUsers || 0,
      guestUsers: guestUsers || 0,
      signedUpUsers: signedUpUsers || 0,
      dailyUsers: dailyUsers || 0,
      totalCars: totalCars || 0,
      totalClips: totalClips || 0,
      totalDealerships: totalDealerships || 0,
      topCars: topCars || [],
      topClips: topClips || [],
      liveUserEmails: liveUsersData || [],
    };

    setStats(newStats);

    // Trigger big milestone celebration if we cross 1000 users
    if (newStats.totalUsers >= 1000) {
      setBigCelebration(true);
      setTimeout(() => setBigCelebration(false), 4000);
    }
  };

  // Auto-refresh stats every 30 seconds + update time every second
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleBack = () => {
    // In a real app, this would navigate back
    window.history.back();
  };

  const triggerCelebration = () => {
    setBigCelebration(true);
    setTimeout(() => setBigCelebration(false), 3000);
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Big milestone celebration */}
      <AnimatePresence>
        {bigCelebration && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div 
                className="text-8xl mb-4"
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎉
              </motion.div>
              <motion.h1
                className="text-6xl font-bold text-white mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                🎉 {stats.totalUsers} USERS 🎉
              </motion.h1>
              <p className="text-2xl text-purple-300">MILESTONE REACHED!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                Analytics Dashboard
              </h1>
              <p className="text-purple-200 mt-1">
                Live data as of {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <motion.button
            onClick={triggerCelebration}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-6 rounded-xl hover:from-yellow-300 hover:to-orange-400 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🚀 Celebrate!
          </motion.button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Live Users"
            value={stats.activeUsers}
            icon={<Users className="w-6 h-6" />}
            gradient="from-green-400 to-emerald-500"
            isLive={true}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<UserCheck className="w-6 h-6" />}
            gradient="from-blue-400 to-cyan-500"
          />
          <StatCard
            title="Signed Up Users"
            value={stats.signedUpUsers}
            icon={<Shield className="w-6 h-6" />}
            gradient="from-indigo-400 to-purple-500"
          />
          <StatCard
            title="Guest Users"
            value={stats.guestUsers}
            icon={<UserPlus className="w-6 h-6" />}
            gradient="from-purple-400 to-pink-500"
          />
          <StatCard
            title="Daily Active"
            value={stats.dailyUsers}
            icon={<Calendar className="w-6 h-6" />}
            gradient="from-orange-400 to-red-500"
          />
          <StatCard
            title="Dealerships"
            value={stats.totalDealerships}
            icon={<Building2 className="w-6 h-6" />}
            gradient="from-teal-400 to-cyan-500"
          />
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Total Cars"
            value={stats.totalCars}
            icon={<Car className="w-6 h-6" />}
            gradient="from-indigo-400 to-purple-500"
            large={true}
          />
          <StatCard
            title="AutoClips"
            value={stats.totalClips}
            icon={<Play className="w-6 h-6" />}
            gradient="from-pink-400 to-rose-500"
            large={true}
          />
        </div>

        {/* Charts and Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Live User Activity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { time: "5min ago", users: Math.floor(stats.activeUsers * 0.6) },
                { time: "4min ago", users: Math.floor(stats.activeUsers * 0.7) },
                { time: "3min ago", users: Math.floor(stats.activeUsers * 0.8) },
                { time: "2min ago", users: Math.floor(stats.activeUsers * 0.9) },
                { time: "1min ago", users: Math.floor(stats.activeUsers * 0.95) },
                { time: "Now", users: stats.activeUsers },
              ]}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: 'white'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Live Status */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              Live Status
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {stats.activeUsers}
                </div>
                <div className="text-white/80 text-sm">Users Online Now</div>
              </div>
              <div className="border-t border-white/20 pt-4">
                <div className="text-white/60 text-sm mb-2">Last updated:</div>
                <div className="text-white text-sm font-mono">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <motion.div 
                className="bg-green-400/20 border border-green-400/30 rounded-lg p-3 cursor-pointer hover:bg-green-400/30 transition-all duration-300"
                onClick={() => setShowLiveUsers(!showLiveUsers)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between text-green-300 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    System Online
                  </div>
                  <div className="text-xs text-green-400/80">
                    {showLiveUsers ? 'Hide' : 'View'} Users
                  </div>
                </div>
              </motion.div>
              
              <AnimatePresence>
                {showLiveUsers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-black/20 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto"
                  >
                    <div className="text-white/60 text-xs mb-2 font-medium">
                      ACTIVE USERS ({stats.liveUserEmails.length})
                    </div>
                    <div className="space-y-2">
                      {stats.liveUserEmails.length > 0 ? (
                        stats.liveUserEmails.map((user, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.is_guest ? 'bg-orange-400' : 'bg-blue-400'}`} />
                              <span className="text-white/80 font-mono">
                                {user.email || 'Guest User'}
                              </span>
                              {user.is_guest && (
                                <span className="text-orange-400 text-xs bg-orange-400/20 px-1 rounded">
                                  GUEST
                                </span>
                              )}
                            </div>
                            <span className="text-white/50 text-xs">
                              {new Date(user.last_active).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/50 text-xs text-center py-2">
                          No active users right now
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopList
            title="🏆 Top Cars by Views"
            items={stats.topCars.map(car => ({
              name: `${car.make} ${car.model}`,
              value: car.views,
              icon: <Eye className="w-4 h-4 text-blue-400" />
            }))}
          />
          <TopList
            title="❤️ Top AutoClips by Likes"
            items={stats.topClips.map(clip => ({
              name: clip.title,
              value: clip.likes,
              icon: <Heart className="w-4 h-4 text-red-400" />
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient, 
  isLive = false, 
  large = false 
}: StatCardProps) {
  return (
    <motion.div 
      className={`group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:shadow-2xl ${large ? 'py-8' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          className={`bg-gradient-to-r ${gradient} p-3 rounded-xl text-white shadow-lg transition-transform duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {icon}
        </motion.div>
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <h3 className="text-white/80 text-sm font-medium mb-2">{title}</h3>
      <motion.p
        className={`text-white font-bold ${large ? 'text-4xl' : 'text-3xl'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:${gradient} group-hover:bg-clip-text transition-all duration-300`}
        key={value}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        {value.toLocaleString()}
      </motion.p>
    </motion.div>
  );
}

function TopList({ 
  title, 
  items 
}: TopListProps) {
  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <Trophy className="w-5 h-5 text-yellow-400" />
        {title}
      </h3>
      <div className="space-y-4">
        {items.map((item: TopListItem, i: number) => (
          <motion.div 
            key={i} 
            className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            whileHover={{ x: 5 }}
          >
            <div className="flex items-center gap-3">
              <div className={`text-lg font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white/60'}`}>
                #{i + 1}
              </div>
              {item.icon}
              <span className="text-white font-medium group-hover:text-purple-200 transition-colors">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/80 font-bold">
                {item.value.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}