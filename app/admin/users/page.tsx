"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  XCircleIcon,
  HeartIcon,
  EyeIcon,
  StopCircleIcon
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Define interfaces
interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
    full_name?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
  banned_until: string | null;
  locked: boolean;
}

interface ProcessedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  user_metadata: {
    role?: string;
  };
  imageUrl: string;
  lastSignInAt: number;
  createdAt: number;
  banned: boolean;
  locked: boolean;
}

interface DealershipForm {
  location: string;
  phone: string;
  subscriptionEndDate: Date;
  name: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();

  // State variables
  const [users, setUsers] = useState<ProcessedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ProcessedUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ProcessedUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDealershipFormOpen, setIsDealershipFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{ field: string; ascending: boolean; }>({  // Added explicit type here
    field: 'createdAt',
    ascending: false
  });

  const [filterConfig, setFilterConfig] = useState<{ role: string; status: string; }>({ // Added explicit type here
    role: 'all',
    status: 'all'
  });

  const [dealershipForm, setDealershipForm] = useState<DealershipForm>({
    location: '',
    phone: '',
    name: '',
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: string, user: ProcessedUser | null }>({
    action: '',
    user: null
  });

  // Process Supabase users to match our component's expected format
  const processSupabaseUsers = (data: User[]) => {
    return data.map(user => {
      // Extract first and last name from metadata or email
      let firstName = '';
      let lastName = '';

      if (user.user_metadata?.name) {
        const nameParts = user.user_metadata.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else if (user.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        // Use email as fallback for the name
        firstName = user.email.split('@')[0] || '';
        lastName = '';
      }

      // Check if user is banned based on banned_until field
      const isBanned = user.banned_until !== null &&
        new Date(user.banned_until) > new Date();

      return {
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        user_metadata: {
          role: user.user_metadata?.role || 'user'
        },
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random`,
        lastSignInAt: user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0,
        createdAt: Date.parse(user.created_at),
        banned: isBanned,
        locked: user.locked || false
      };
    });
  };

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching users from API...");
      const response = await fetch('/api/admin/users');

      console.log("API response status:", response.status);
      const result = await response.json();
      console.log("API response data:", result);

      if (!response.ok) {
        throw new Error(result.error || `API error: ${response.status}`);
      }

      if (result.data && result.data.users) {
        const processedUsers = processSupabaseUsers(result.data.users);
        setUsers(processedUsers);
        applyFiltersAndSort(processedUsers, filterConfig, sortConfig, search);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterConfig, sortConfig, search]);

  // Fetch user's liked cars and viewed cars
  const fetchUserDetails = async (userId: string) => {
    try {
      // Fetch liked cars
      const { data: likedCars, error: likedError } = await supabase
        .from('cars')
        .select('id, make, model, year, price, images, status')
        .contains('liked_users', [userId])
        .order('listed_at', { ascending: false });

      if (likedError) throw likedError;

      // Fetch viewed cars
      const { data: viewedCars, error: viewedError } = await supabase
        .from('cars')
        .select('id, make, model, year, price, images, status')
        .contains('viewed_users', [userId])
        .order('listed_at', { ascending: false });

      if (viewedError) throw viewedError;

      // Get user's detailed info from the public users table
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      setUserDetails({
        likedCars: likedCars || [],
        viewedCars: viewedCars || [],
        userInfo: userInfo || {}
      });
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      // Set some basic details even if fetching additional info failed
      setUserDetails({
        likedCars: [],
        viewedCars: [],
        userInfo: {}
      });
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(
    (
      users: ProcessedUser[],
      filters: typeof filterConfig,
      sort: typeof sortConfig,
      searchTerm: string
    ) => {
      let result = [...users];

      // Apply role filter
      if (filters.role !== 'all') {
        result = result.filter(
          user => user.user_metadata.role === filters.role
        );
      }

      // Apply status filter
      if (filters.status !== 'all') {
        result = result.filter(user => {
          switch (filters.status) {
            case 'active':
              return !user.banned && !user.locked;
            case 'banned':
              return user.banned;
            case 'locked':
              return user.locked;
            default:
              return true;
          }
        });
      }

      // Apply search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          user =>
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sort
      result.sort((a, b) => {
        let compareResult = 0;
        if (sort.field === 'name') {
            compareResult = `${a.firstName} ${a.lastName}`.localeCompare(
                `${b.firstName} ${b.lastName}`
            );
        } else if (sort.field === 'email') {
            compareResult = a.email.localeCompare(b.email);
        } else if (sort.field === 'createdAt') {
            compareResult = a.createdAt - b.createdAt;
        } else if (sort.field === 'lastSignInAt') {
            compareResult = (a.lastSignInAt || 0) - (b.lastSignInAt || 0);
        }

        return sort.ascending ? compareResult : -compareResult;
      });

      setFilteredUsers(result);
    },
    []
  );

  // Effect to fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Effect to apply filters and sort when users, filters, sort config, or search term changes
  useEffect(() => {
    if (users.length > 0) {
      applyFiltersAndSort(users, filterConfig, sortConfig, search);
    }
  }, [users, filterConfig, sortConfig, search, applyFiltersAndSort]);

  // Helper function to handle user role change
  const handleSetRole = (user: ProcessedUser) => {
    if (
      user.user_metadata.role === 'admin' ||
      user.user_metadata.role === 'dealer'
    ) {
      alert('Cannot modify admin or existing dealer roles.');
      return;
    }

    if (user.banned || user.locked) {
      alert('Cannot modify roles for banned or locked accounts.');
      return;
    }

    setSelectedUser(user);
    setIsDealershipFormOpen(true);
  };

  // Validate dealership form
  const validateDealershipForm = () => {
    const newErrors: Record<string, string> = {};
    if (!dealershipForm.name.trim()) newErrors.name = 'Company name is required';
    if (!dealershipForm.location.trim()) newErrors.location = 'Location is required';
    if (!dealershipForm.phone.trim()) newErrors.phone = 'Phone is required';
    if (!/^\d{8,}$/.test(dealershipForm.phone)) newErrors.phone = 'Invalid phone number';
    if (dealershipForm.subscriptionEndDate < new Date())
      newErrors.subscriptionEndDate = 'Date must be in the future';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle dealership form submission
  const handleDealershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDealershipForm() || !selectedUser) {
      return;
    }

    // Optimistic update
    const previousUsers = [...users];
    setUsers(current =>
      current.map(u =>
        u.id === selectedUser.id
          ? {
            ...u,
            user_metadata: {
              ...u.user_metadata,
              role: 'dealer'
            }
          }
          : u
      )
    );

    try {
      // 1. Update user role in auth.users metadata
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        {
          user_metadata: {
            role: 'dealer',
            // Preserve existing metadata fields
            ...(selectedUser.user_metadata || {})
          }
        }
      );

      if (authUpdateError) throw authUpdateError;

      // 2. Update user role in public.users table
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update({ role: 'dealer' })
        .eq('id', selectedUser.id);

      if (dbUpdateError) throw dbUpdateError;

      // 3. Create dealership entry
      const { error: dealershipError } = await supabase
        .from('dealerships')
        .insert({
          name: dealershipForm.name,
          location: dealershipForm.location,
          phone: dealershipForm.phone,
          subscription_end_date: dealershipForm.subscriptionEndDate.toISOString().split('T')[0],
          user_id: selectedUser.id
        });

      if (dealershipError) throw dealershipError;

      alert('User has been promoted to dealer successfully.');

      // Refresh data
      fetchUsers();
    } catch (err: any) {
      // Rollback on error
      console.error('Error updating role:', err);
      setUsers(previousUsers);
      alert('Failed to update user role: ' + err.message);
    } finally {
      setIsDealershipFormOpen(false);
      setSelectedUser(null);

      // Reset form
      setDealershipForm({
        location: '',
        phone: '',
        name: '',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            role: newRole
          }
        }
      );

      if (authError) throw authError;

      // Update role in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (dbError) throw dbError;

      // Refresh the user list
      fetchUsers();
      return true;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      alert('Error updating user role: ' + err.message);
      return false;
    }
  };

  // Ban or unban a user
    const toggleUserBan = async (userId: string, shouldBan: boolean) => {
        try {
            // Set ban duration
            const bannedUntil = shouldBan
                ? new Date(2099, 11, 31).toISOString() // Ban until end of century
                : undefined;  // Changed null to undefined

            // Update user in Supabase Auth
            const { error } = await supabase.auth.admin.updateUserById(
                userId,
                {
                    ban_duration: bannedUntil  // Pass bannedUntil directly
                }
            );

            if (error) throw error;

            // Refresh the user list
            fetchUsers();
            return true;
        } catch (err: any) {
            console.error(`Error ${shouldBan ? 'banning' : 'unbanning'} user:`, err);
            alert(`Error ${shouldBan ? 'banning' : 'unbanning'} user: ` + err.message);
            return false;
        }
    };

  // Handle various user actions
  const handleUserAction = async (action: string) => {
    if (!pendingAction.user) return;

    setConfirmActionOpen(false);
    const user = pendingAction.user;

    switch (action) {
      case 'make-dealer':
        handleSetRole(user);
        break;

      case 'make-admin':
        const adminSuccess = await updateUserRole(user.id, 'admin');
        if (adminSuccess) {
          alert(`${user.firstName} ${user.lastName} is now an admin.`);
        }
        break;

      case 'make-user':
        const userSuccess = await updateUserRole(user.id, 'user');
        if (userSuccess) {
          alert(`${user.firstName} ${user.lastName} has been changed to a regular user.`);
        }
        break;

      case 'ban-user':
        const banSuccess = await toggleUserBan(user.id, true);
        if (banSuccess) {
          alert(`${user.firstName} ${user.lastName} has been banned.`);
        }
        break;

      case 'unban-user':
        const unbanSuccess = await toggleUserBan(user.id, false);
        if (unbanSuccess) {
          alert(`${user.firstName} ${user.lastName} has been unbanned.`);
        }
        break;
    }

    // Reset pending action
    setPendingAction({ action: '', user: null });
  };

  // Format date string
  const formatDate = (dateString: string | number) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user status
  const getUserStatus = (user: ProcessedUser) => {
    if (user.banned) return 'banned';
    if (user.locked) return 'locked';
    return 'active';
  };

  // Get status color based on user status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'banned':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'locked':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'dealer':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/30';
    }
  };

  // Open confirmation dialog for user actions
  const confirmAction = (user: ProcessedUser, action: string) => {
    setPendingAction({ user, action });
    setConfirmActionOpen(true);
  };

  // Handle clicking on a user
  const handleUserClick = (user: ProcessedUser) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
    setIsUserModalOpen(true);
  };

  // Get confirmation message based on action
  const getConfirmationMessage = () => {
    if (!pendingAction.user) return '';

    const userName = `${pendingAction.user.firstName} ${pendingAction.user.lastName}`;

    switch (pendingAction.action) {
      case 'make-admin':
        return `Are you sure you want to promote ${userName} to an admin? This will give them full access to the admin dashboard.`;
      case 'make-user':
        return `Are you sure you want to demote ${userName} to a regular user? This will remove their current privileges.`;
      case 'ban-user':
        return `Are you sure you want to ban ${userName}? They will no longer be able to access the platform.`;
      case 'unban-user':
        return `Are you sure you want to unban ${userName}? This will restore their access to the platform.`;
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar/>
      
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">User Management</h1>
              <p className="text-gray-400">Manage and monitor user accounts</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <span className="font-semibold text-white">{users.length}</span> total users
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <span className="font-semibold text-white">
                  {users.filter(u => u.user_metadata.role === 'dealer').length}
                </span> dealers
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <span className="font-semibold text-white">
                  {users.filter(u => !u.banned && !u.locked).length}
                </span> active
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="block w-full pl-10 pr-10 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
            
            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSortConfig({ field: 'name', ascending: sortConfig.field === 'name' ? !sortConfig.ascending : true })}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortConfig.field === 'name'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Name
                  {sortConfig.field === 'name' && (
                    sortConfig.ascending ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </button>
                
                <button
                  onClick={() => setSortConfig({ field: 'createdAt', ascending: sortConfig.field === 'createdAt' ? !sortConfig.ascending : true })}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortConfig.field === 'createdAt'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Date Joined
                  {sortConfig.field === 'createdAt' && (
                    sortConfig.ascending ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </button>
                
                <button
                  onClick={() => setSortConfig({ field: 'lastSignInAt', ascending: sortConfig.field === 'lastSignInAt' ? !sortConfig.ascending : true })}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    sortConfig.field === 'lastSignInAt'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Last Active
                  {sortConfig.field === 'lastSignInAt' && (
                    sortConfig.ascending ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterConfig(prev => ({
                  ...prev,
                  status: prev.status === 'active' ? 'all' : 'active'
                }))}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterConfig.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                Active Users
              </button>
              
              <button
                onClick={() => setFilterConfig(prev => ({
                  ...prev,
                  status: prev.status === 'banned' ? 'all' : 'banned'
                }))}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterConfig.status === 'banned'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <StopCircleIcon className="h-4 w-4 mr-1.5" />
                Banned Users
              </button>
              
              <button
                onClick={() => setFilterConfig(prev => ({
                  ...prev,
                  status: prev.status === 'locked' ? 'all' : 'locked'
                }))}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterConfig.status === 'locked'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <LockClosedIcon className="h-4 w-4 mr-1.5" />
                Locked Users
              </button>
              
              <button
                onClick={() => setFilterConfig(prev => ({
                  ...prev,
                  role: prev.role === 'dealer' ? 'all' : 'dealer'
                }))}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterConfig.role === 'dealer'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                Dealers
              </button>
              
              <button
                onClick={() => setFilterConfig(prev => ({
                  ...prev,
                  role: prev.role === 'admin' ? 'all' : 'admin'
                }))}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterConfig.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                Admins
              </button>
            </div>
          </div>
          
          {/* Users List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <XCircleIcon className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Users</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => fetchUsers()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400">
                {search 
                  ? "No users match your search criteria. Try a different search term or clear filters." 
                  : "No users match the selected filters. Try adjusting your filter settings."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300 cursor-pointer"
                >
                  <div className="p-5">
                    <div className="flex items-center mb-4">
                      <img 
                        src={user.imageUrl} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-12 h-12 rounded-full object-cover border border-gray-700" 
                      />
                      <div className="ml-3 min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-lg truncate">{user.firstName} {user.lastName}</h3>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(getUserStatus(user))}`}>
                        {getUserStatus(user)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        {user.user_metadata.role === 'admin' ? (
                          <ShieldCheckIcon className="h-4 w-4 text-purple-400 mr-1.5" />
                        ) : user.user_metadata.role === 'dealer' ? (
                          <BriefcaseIcon className="h-4 w-4 text-blue-400 mr-1.5" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                        )}
                        <span className={`${getRoleBadgeColor(user.user_metadata.role || 'user')} px-2 py-0.5 rounded text-xs`}>
                          {user.user_metadata.role || 'user'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                        <span className="text-gray-400">
                          {user.lastSignInAt 
                            ? new Date(user.lastSignInAt).toLocaleDateString() 
                            : 'Never logged in'}
                        </span>
                      </div>
                    </div>
                    
                    {(user.banned || user.locked) && (
                      <div className="mt-3 bg-rose-500/10 p-3 rounded-lg">
                        <p className="text-rose-400 text-sm">
                          {user.banned ? 'Account is banned' : 'Account is locked'}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {/* Show action buttons based on user role and status */}
                      {!user.banned && !user.locked && user.user_metadata.role !== 'dealer' && user.user_metadata.role !== 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetRole(user);
                          }}
                          className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <BriefcaseIcon className="h-3.5 w-3.5 mr-1" />
                          Make Dealer
                        </button>
                      )}
                      
                      {!user.banned && !user.locked && user.user_metadata.role !== 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction(user, 'make-admin');
                          }}
                          className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                          Make Admin
                        </button>
                      )}
                      
                      {(user.user_metadata.role === 'dealer' || user.user_metadata.role === 'admin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction(user, 'make-user');
                          }}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <UserIcon className="h-3.5 w-3.5 mr-1" />
                          Make User
                        </button>
                      )}
                      
                      {!user.banned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction(user, 'ban-user');
                          }}
                          className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <StopCircleIcon className="h-3.5 w-3.5 mr-1" />
                          Ban User
                        </button>
                      )}
                      
                      {user.banned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAction(user, 'unban-user');
                          }}
                          className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs transition-colors flex items-center"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                          Unban User
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          </div>
          </div>
  )
}