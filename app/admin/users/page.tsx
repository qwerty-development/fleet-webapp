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
  StopCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import AdminNavbar from "@/components/admin/navbar";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

// Define interfaces
interface User {
  role: string | undefined;
  id: string;
  email: string | null;
  name?: string;
  user_metadata?: {
    name?: string;
    role?: string;
    full_name?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
  last_active?: string;
  banned_until: string | null;
  locked: boolean;
  phone_number?: string;
}

interface ProcessedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  user_metadata: {
    role?: string;
  };
  imageUrl: string;
  lastSignInAt: number;
  createdAt: number;
  banned: boolean;
  locked: boolean;
  phone_number?: string;
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
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ProcessedUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDealershipFormOpen, setIsDealershipFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    ascending: boolean;
  }>({
    field: "createdAt",
    ascending: false,
  });

  const [filterConfig, setFilterConfig] = useState<{
    role: string;
    status: string;
  }>({
    role: "all",
    status: "all",
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAllUsersCount, setTotalAllUsersCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalGuestUsersCount, setTotalGuestUsersCount] = useState(0);
  const [totalDealersCount, setTotalDealersCount] = useState(0);
  const [totalActiveCount, setTotalActiveCount] = useState(0);

  const [dealershipForm, setDealershipForm] = useState<DealershipForm>({
    location: "",
    phone: "",
    name: "",
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    user: ProcessedUser | null;
    context?: any;
  }>({
    action: "",
    user: null,
  });

  // Helper function to check if user is a guest user
  const isGuestUser = (user: any): boolean => {
    return (
      user.id?.startsWith('guest_') ||
      user.name === 'Guest User' ||
      user.email?.includes('guest') ||
      (user.user_metadata?.name && user.user_metadata.name === 'Guest User')
    );
  };

  // Fetch users from Supabase with enhanced filtering
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Determine ordering column based on sortConfig
      const sortFieldToColumn: Record<string, string> = {
        name: 'name',
        email: 'email',
        createdAt: 'created_at',
        lastSignInAt: 'last_active',
      };
      const orderColumn = sortFieldToColumn[sortConfig.field] || 'created_at';

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        // Exclude guest users server-side
        // NOTE: phone-based accounts may have NULL email; don't exclude them.
        .or('email.is.null,email.not.ilike.%guest%')
        .neq('name', 'Guest User')
        .not('id', 'like', 'guest%')
        .order(orderColumn, { ascending: sortConfig.ascending })
        .range(from, to);

      // Apply search if present
      if (appliedSearch) {
        const term = appliedSearch.replace(/%/g, '').trim();
        if (term.length > 0) {
          query = query.or(
            `name.ilike.%${term}%,email.ilike.%${term}%,id.ilike.%${term}%,phone_number.ilike.%${term}%`
          );
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setTotalCount(count || 0);

      // Fetch global counters (independent of pagination and search)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: allUsersIncludingGuestsCount, error: allUsersErr },
        { count: authenticatedUsersCount, error: authenticatedErr },
        { count: guestUsersCount, error: guestErr },
        { count: dealersCount, error: dealersErr },
        { count: activeCount, error: activeErr }
      ] = await Promise.all([
        // Total all users including guests
        supabase.from('users').select('id', { count: 'exact', head: true }),
        // Authenticated users only (excluding guests)
        supabase.from('users').select('id', { count: 'exact', head: true })
          .or('email.is.null,email.not.ilike.%guest%')
          .neq('name', 'Guest User')
          .not('id', 'like', 'guest%'),
        // Guest users only
        supabase.from('users').select('id', { count: 'exact', head: true })
          .or('id.like.guest%,email.ilike.%guest%')
          .eq('name', 'Guest User'),
        // Dealers (authenticated only)
        supabase.from('users').select('id', { count: 'exact', head: true })
          .or('email.is.null,email.not.ilike.%guest%')
          .neq('name', 'Guest User')
          .not('id', 'like', 'guest%')
          .eq('role', 'dealer'),
        // Active users (authenticated only, active in last 30 days)
        supabase.from('users').select('id', { count: 'exact', head: true })
          .or('email.is.null,email.not.ilike.%guest%')
          .neq('name', 'Guest User')
          .not('id', 'like', 'guest%')
          .gte('last_active', thirtyDaysAgo)
      ]);

      if (allUsersErr) throw allUsersErr;
      if (authenticatedErr) throw authenticatedErr;
      if (guestErr) throw guestErr;
      if (dealersErr) throw dealersErr;
      if (activeErr) throw activeErr;

      setTotalAllUsersCount(allUsersIncludingGuestsCount || 0);
      setTotalUsersCount(authenticatedUsersCount || 0);
      setTotalGuestUsersCount(guestUsersCount || 0);
      setTotalDealersCount(dealersCount || 0);
      setTotalActiveCount(activeCount || 0);

      // Filter out guest users and process the remaining users
      const filteredUsersList = (data || []).filter(user => !isGuestUser(user));

      // Process the users directly from the table
      const processedUsers = filteredUsersList.map(user => ({
        id: user.id,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email ?? null,
        user_metadata: {
          role: user.role || 'user'
        },
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '')}&background=random`,
        lastSignInAt: user.last_active ? Date.parse(user.last_active) : 0,
        createdAt: user.created_at ? Date.parse(user.created_at) : 0,
        banned: false,
        locked: false,
        phone_number: user.phone_number
      }));

      setUsers(processedUsers);
      applyFiltersAndSort(processedUsers, filterConfig, sortConfig, appliedSearch);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterConfig, sortConfig, appliedSearch, page, pageSize, supabase]);

  // Fetch user's liked cars and viewed cars with enhanced error handling
  const fetchUserDetails = async (userId: string) => {
    try {
      // Fetch liked cars
      const { data: likedCars, error: likedError } = await supabase
        .from("cars")
        .select("id, make, model, year, price, images, status")
        .contains("liked_users", [userId])
        .order("listed_at", { ascending: false });

      if (likedError) throw likedError;

      // Fetch viewed cars
      const { data: viewedCars, error: viewedError } = await supabase
        .from("cars")
        .select("id, make, model, year, price, images, status")
        .contains("viewed_users", [userId])
        .order("listed_at", { ascending: false });

      if (viewedError) throw viewedError;

      // Get user's detailed info from the public users table
      const { data: userInfo, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError && userError.code !== "PGRST116") throw userError;

      // Check if user is a dealer and get dealership info
      let dealershipInfo = null;
      let dealershipCars: any = [];
      if (userInfo?.role === 'dealer') {
        const { data: dealership, error: dealershipError } = await supabase
          .from("dealerships")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!dealershipError && dealership) {
          dealershipInfo = dealership;

          // Fetch dealership cars
          const { data: cars, error: carsError } = await supabase
            .from("cars")
            .select("id, make, model, year, price, status")
            .eq("dealership_id", dealership.id)
            .order("listed_at", { ascending: false });

          if (!carsError) {
            dealershipCars = cars || [];
          }
        }
      }

      setUserDetails({
        likedCars: likedCars || [],
        viewedCars: viewedCars || [],
        userInfo: userInfo || {},
        dealershipInfo: dealershipInfo,
        dealershipCars: dealershipCars
      });
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      // Set some basic details even if fetching additional info failed
      setUserDetails({
        likedCars: [],
        viewedCars: [],
        userInfo: {},
        dealershipInfo: null,
        dealershipCars: []
      });
    }
  };

  // Apply filters and sorting with enhanced logic
  const applyFiltersAndSort = useCallback(
    (
      users: ProcessedUser[],
      filters: typeof filterConfig,
      sort: typeof sortConfig,
      searchTerm: string
    ) => {
      let result = [...users];

      // Apply role filter
      if (filters.role !== "all") {
        result = result.filter(
          (user) => user.user_metadata.role === filters.role
        );
      }

      // Apply status filter
      if (filters.status !== "all") {
        result = result.filter((user) => {
          switch (filters.status) {
            case "active":
              return !user.banned && !user.locked;
            case "banned":
              return user.banned;
            case "locked":
              return user.locked;
            default:
              return true;
          }
        });
      }

      // Apply search with enhanced matching
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(
          (user) =>
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            user.id?.toLowerCase().includes(searchLower) ||
            (user.phone_number && user.phone_number.toLowerCase().includes(searchLower))
        );
      }

      // Apply sort
      result.sort((a, b) => {
        let compareResult = 0;
        if (sort.field === "name") {
          compareResult = `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          );
        } else if (sort.field === "email") {
          // Handle null emails for phone-only users
          const emailA = a.email || '';
          const emailB = b.email || '';
          compareResult = emailA.localeCompare(emailB);
        } else if (sort.field === "createdAt") {
          compareResult = a.createdAt - b.createdAt;
        } else if (sort.field === "lastSignInAt") {
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
      applyFiltersAndSort(users, filterConfig, sortConfig, appliedSearch);
    }
  }, [users, filterConfig, sortConfig, appliedSearch, applyFiltersAndSort]);

  // Enhanced role transition validation
  const isAllowedRoleTransition = (currentRole: string, newRole: string): boolean => {
    const allowedTransitions: Record<string, string[]> = {
      'user': ['dealer', 'admin'],
      'admin': ['user'],
      'dealer': ['user']
    };

    return allowedTransitions[currentRole]?.includes(newRole) || false;
  };

  // Initialize dealership form with user data
  const initializeDealershipForm = (user: ProcessedUser) => {
    setDealershipForm({
      name: `${user.firstName} ${user.lastName}`,
      location: "",
      phone: "",
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    setSelectedUser(user);
    setIsDealershipFormOpen(true);
  };

  // Enhanced role change handler with better user feedback
  const handleSetRole = async (user: ProcessedUser, targetRole: string) => {
    const currentRole = user.user_metadata.role || 'user';

    // Check if the role transition is allowed
    if (!isAllowedRoleTransition(currentRole, targetRole)) {
      alert(`Cannot change role from ${currentRole} to ${targetRole}. Invalid role transition.`);
      return;
    }

    if (user.banned || user.locked) {
      alert("Cannot modify roles for banned or locked accounts.");
      return;
    }

    // Special handling for dealer role
    if (targetRole === 'dealer') {
      initializeDealershipForm(user);
      return;
    }

    // For dealer to user conversion, check for dealership and prepare for deletion
    if (currentRole === 'dealer' && targetRole === 'user') {
      try {
        // Check if there are dealership associated with this user
        const { data: dealershipData, error: dealershipError } = await supabase
          .from('dealerships')
          .select('id, name')
          .eq('user_id', user.id)
          .single();

        if (!dealershipError && dealershipData) {
          const dealershipId = dealershipData.id;
          const dealershipName = dealershipData.name;

          // Check for active cars (for information purposes)
          const { count: totalCars, error: countError } = await supabase
            .from('cars')
            .select('id', { count: 'exact', head: true })
            .eq('dealership_id', dealershipId);

          const carCount = totalCars || 0;

          // Set context for confirmation dialog
          setPendingAction({
            action: 'delete-dealership-and-demote',
            user: user,
            context: {
              dealershipId,
              dealershipName,
              totalCars: carCount,
              isDealershipDeletion: true
            }
          });
          setConfirmActionOpen(true);
          return;
        } else {
          // No dealership found, just change role
          confirmAction(user, 'make-user');
        }
      } catch (err) {
        console.error('Error checking dealership:', err);
        // Fallback to direct role update
        confirmAction(user, 'make-user');
      }
    }

    // For other roles, use direct role update
    confirmAction(user, targetRole === 'admin' ? 'make-admin' : 'make-user');
  };

  // Check for existing dealership
  const checkExistingDealership = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("dealerships")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (err) {
      console.error("Error checking existing dealership:", err);
      return false;
    }
  };

  // Enhanced form validation
  const validateDealershipForm = () => {
    const newErrors: Record<string, string> = {};

    if (!dealershipForm.name.trim()) {
      newErrors.name = "Company name is required";
    } else if (dealershipForm.name.length < 3) {
      newErrors.name = "Company name must be at least 3 characters";
    }

    if (!dealershipForm.location.trim()) {
      newErrors.location = "Location is required";
    }

    if (!dealershipForm.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{8,}$/.test(dealershipForm.phone)) {
      newErrors.phone = "Phone must be at least 8 digits";
    }

    if (dealershipForm.subscriptionEndDate < new Date()) {
      newErrors.subscriptionEndDate = "Subscription end date must be in the future";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle dealership form submission with enhanced error handling
  const handleDealershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDealershipForm() || !selectedUser) {
      return;
    }

    setIsActionLoading(true);

    // Optimistic update
    const previousUsers = [...users];
    setUsers((current) =>
      current.map((u) =>
        u.id === selectedUser.id
          ? {
            ...u,
            user_metadata: {
              ...u.user_metadata,
              role: "dealer",
            },
          }
          : u
      )
    );

    try {
      // Check if dealership already exists for this user
      const dealershipExists = await checkExistingDealership(selectedUser.id);

      if (dealershipExists) {
        throw new Error("User already has a dealership associated with their account");
      }

      // Update user role in public.users table
      const { error: dbUpdateError } = await supabase
        .from("users")
        .update({ role: "dealer" })
        .eq("id", selectedUser.id);

      if (dbUpdateError) throw dbUpdateError;

      // Create dealership entry
      const { error: dealershipError } = await supabase
        .from("dealerships")
        .insert({
          name: dealershipForm.name,
          location: dealershipForm.location,
          phone: dealershipForm.phone,
          subscription_end_date: dealershipForm.subscriptionEndDate
            .toISOString()
            .split("T")[0],
          user_id: selectedUser.id,
        });

      if (dealershipError) throw dealershipError;

      alert(`${selectedUser.firstName} ${selectedUser.lastName} has been successfully promoted to dealer with dealership "${dealershipForm.name}".`);

      // Refresh data
      await fetchUsers();
    } catch (err: any) {
      // Rollback on error
      console.error("Error updating role:", err);
      setUsers(previousUsers);
      alert("Failed to update user role: " + err.message);
    } finally {
      setIsActionLoading(false);
      setIsDealershipFormOpen(false);
      setSelectedUser(null);

      // Reset form
      setDealershipForm({
        location: "",
        phone: "",
        name: "",
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      setFormErrors({});
    }
  };

  // Enhanced user role update with dealership deletion capability
  const updateUserRole = async (userId: string, newRole: string, context?: any) => {
    setIsActionLoading(true);

    try {
      // Get current user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const currentRole = userData?.role || 'user';

      // Check if role transition is allowed
      if (!isAllowedRoleTransition(currentRole, newRole)) {
        throw new Error(`Cannot change role from ${currentRole} to ${newRole}.`);
      }

      // Handle dealer to user conversion with complete dealership deletion
      if (currentRole === 'dealer' && newRole === 'user') {
        if (context?.isDealershipDeletion && context?.dealershipId) {
          console.log(`Deleting dealership ${context.dealershipId} and all associated records...`);

          // Delete the dealership (cascade will handle cars and autoclips)
          const { error: deleteDealershipError } = await supabase
            .from('dealerships')
            .delete()
            .eq('id', context.dealershipId);

          if (deleteDealershipError) {
            console.error('Error deleting dealership:', deleteDealershipError);
            throw new Error(`Failed to delete dealership: ${deleteDealershipError.message}`);
          }

          console.log(`Successfully deleted dealership ${context.dealershipName} and all associated records.`);
        }
      }

      // Update user role in the database
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Refresh user list
      await fetchUsers();

      // Show success message with context
      const user = users.find(u => u.id === userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'User';

      if (currentRole === 'dealer' && newRole === 'user' && context?.isDealershipDeletion) {
        alert(`✅ Success!\n\n${userName} has been changed to a regular user.\n\nDealership "${context.dealershipName}" has been completely removed from the system.\n\n${context.totalCars || 0} associated cars and all related records have been automatically deleted.`);
      } else {
        alert(`${userName}'s role has been successfully changed to ${newRole}.`);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      alert(`❌ Error updating user role: ${err.message}`);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Ban or unban a user (keeping existing functionality)
  const toggleUserBan = async (userId: string, shouldBan: boolean) => {
    setIsActionLoading(true);

    try {
      const bannedUntil = shouldBan
        ? new Date(2099, 11, 31).toISOString()
        : undefined;

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: bannedUntil,
      });

      if (error) throw error;

      await fetchUsers();
      return true;
    } catch (err: any) {
      console.error(`Error ${shouldBan ? "banning" : "unbanning"} user:`, err);
      alert(`Error ${shouldBan ? "banning" : "unbanning"} user: ` + err.message);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Enhanced user action handler
  const handleUserAction = async (action: string) => {
    if (!pendingAction.user) return;

    setConfirmActionOpen(false);
    const user = pendingAction.user;
    const context = pendingAction.context;

    switch (action) {
      case "make-dealer":
        handleSetRole(user, "dealer");
        break;

      case "make-admin":
        const adminSuccess = await updateUserRole(user.id, "admin");
        if (adminSuccess) {
          console.log(`${user.firstName} ${user.lastName} is now an admin.`);
        }
        break;

      case "make-user":
        const userSuccess = await updateUserRole(user.id, "user", context);
        if (userSuccess) {
          console.log(`${user.firstName} ${user.lastName} has been changed to a regular user.`);
        }
        break;

      case "delete-dealership-and-demote":
        const demoteSuccess = await updateUserRole(user.id, "user", context);
        if (demoteSuccess) {
          console.log(`${user.firstName} ${user.lastName} has been demoted and dealership deleted.`);
        }
        break;

      case "ban-user":
        const banSuccess = await toggleUserBan(user.id, true);
        if (banSuccess) {
          alert(`${user.firstName} ${user.lastName} has been banned.`);
        }
        break;

      case "unban-user":
        const unbanSuccess = await toggleUserBan(user.id, false);
        if (unbanSuccess) {
          alert(`${user.firstName} ${user.lastName} has been unbanned.`);
        }
        break;
    }

    // Reset pending action
    setPendingAction({ action: "", user: null });
  };

  // Format date string with enhanced formatting
  const formatDate = (dateString: string | number) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get user status
  const getUserStatus = (user: ProcessedUser) => {
    if (user.banned) return "banned";
    if (user.locked) return "locked";
    return "active";
  };

  // Get status color based on user status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "banned":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
      case "locked":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/30";
      case "dealer":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  // Open confirmation dialog for user actions
  const confirmAction = (user: ProcessedUser, action: string, context?: any) => {
    setPendingAction({ user, action, context });
    setConfirmActionOpen(true);
  };

  // Handle clicking on a user
  const handleUserClick = (user: ProcessedUser) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
    setIsUserModalOpen(true);
  };

  // Enhanced confirmation message with context
  const getConfirmationMessage = () => {
    if (!pendingAction.user) return "";

    const userName = `${pendingAction.user.firstName} ${pendingAction.user.lastName}`;
    const context = pendingAction.context;

    switch (pendingAction.action) {
      case "make-admin":
        return `Are you sure you want to promote ${userName} to an admin? This will give them full access to the admin dashboard.`;

      case "make-user":
        return `Are you sure you want to demote ${userName} to a regular user? This will remove their current privileges.`;

      case "delete-dealership-and-demote":
        return `⚠️ CRITICAL ACTION: Complete Dealership Deletion\n\nYou are about to:\n\n🔹 Demote ${userName} from dealer to regular user\n🔹 PERMANENTLY DELETE dealership "${context.dealershipName}"\n\n\n❌ THIS ACTION CANNOT BE UNDONE!\n\nAll dealership data will be permanently lost. Are you absolutely certain you want to proceed?`;

      case "ban-user":
        return `Are you sure you want to ban ${userName}? They will no longer be able to access the platform.`;

      case "unban-user":
        return `Are you sure you want to unban ${userName}? This will restore their access to the platform.`;

      default:
        return "";
    }
  };

  // Get action button style based on context
  const getConfirmButtonStyle = () => {
    if (pendingAction.action === "ban-user") {
      return "bg-rose-600 hover:bg-rose-700";
    }
    if (pendingAction.action === "delete-dealership-and-demote") {
      return "bg-red-600 hover:bg-red-700";
    }
    if (pendingAction.action === "make-user" && pendingAction.context?.isDealerDemotion) {
      return "bg-amber-600 hover:bg-amber-700";
    }
    return "bg-indigo-600 hover:bg-indigo-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-white">
                User Management
              </h1>
              <p className="text-gray-400">Manage and monitor user accounts</p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center gap-2 flex-wrap">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <span className="font-semibold text-white">{totalAllUsersCount}</span>{" "}
                total
              </div>

              <div className="bg-emerald-800/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm border border-emerald-700/30">
                <span className="font-semibold text-emerald-300">{totalUsersCount}</span>{" "}
                <span className="text-emerald-200">authenticated</span>
              </div>

              <div className="bg-amber-800/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm border border-amber-700/30">
                <span className="font-semibold text-amber-300">{totalGuestUsersCount}</span>{" "}
                <span className="text-amber-200">guests</span>
              </div>

              <div className="bg-blue-800/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm border border-blue-700/30">
                <span className="font-semibold text-blue-300">{totalDealersCount}</span>{" "}
                <span className="text-blue-200">dealers</span>
              </div>

              <div className="bg-purple-800/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm border border-purple-700/30">
                <span className="font-semibold text-purple-300">{totalActiveCount}</span>{" "}
                <span className="text-purple-200">active (30d)</span>
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search users by name, email, phone, or ID..."
                className="block w-full pl-10 pr-24 py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-24 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
              )}
              <button
                onClick={() => { setAppliedSearch(searchInput); setPage(1); fetchUsers(); }}
                className="absolute inset-y-0 right-0 mr-2 my-1 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm"
              >
                Search
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setSortConfig({
                      field: "name",
                      ascending:
                        sortConfig.field === "name"
                          ? !sortConfig.ascending
                          : true,
                    })
                  }
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${sortConfig.field === "name"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  Name
                  {sortConfig.field === "name" &&
                    (sortConfig.ascending ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() =>
                    setSortConfig({
                      field: "createdAt",
                      ascending:
                        sortConfig.field === "createdAt"
                          ? !sortConfig.ascending
                          : true,
                    })
                  }
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${sortConfig.field === "createdAt"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  Date Joined
                  {sortConfig.field === "createdAt" &&
                    (sortConfig.ascending ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() =>
                    setSortConfig({
                      field: "lastSignInAt",
                      ascending:
                        sortConfig.field === "lastSignInAt"
                          ? !sortConfig.ascending
                          : true,
                    })
                  }
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${sortConfig.field === "lastSignInAt"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  Last Active
                  {sortConfig.field === "lastSignInAt" &&
                    (sortConfig.ascending ? (
                      <ChevronUpIcon className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    ))}
                </button>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setFilterConfig((prev) => ({
                    ...prev,
                    status: prev.status === "active" ? "all" : "active",
                  }))
                }
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${filterConfig.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                Active Users
              </button>

              <button
                onClick={() =>
                  setFilterConfig((prev) => ({
                    ...prev,
                    status: prev.status === "banned" ? "all" : "banned",
                  }))
                }
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${filterConfig.status === "banned"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <StopCircleIcon className="h-4 w-4 mr-1.5" />
                Banned Users
              </button>

              <button
                onClick={() =>
                  setFilterConfig((prev) => ({
                    ...prev,
                    status: prev.status === "locked" ? "all" : "locked",
                  }))
                }
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${filterConfig.status === "locked"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <LockClosedIcon className="h-4 w-4 mr-1.5" />
                Locked Users
              </button>

              <button
                onClick={() =>
                  setFilterConfig((prev) => ({
                    ...prev,
                    role: prev.role === "dealer" ? "all" : "dealer",
                  }))
                }
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${filterConfig.role === "dealer"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                Dealers
              </button>

              <button
                onClick={() =>
                  setFilterConfig((prev) => ({
                    ...prev,
                    role: prev.role === "admin" ? "all" : "admin",
                  }))
                }
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${filterConfig.role === "admin"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-gray-800/60 text-gray-300 hover:bg-gray-700"
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
              <h3 className="text-xl font-semibold text-white mb-2">
                Error Loading Users
              </h3>
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
              <h3 className="text-xl font-semibold text-white mb-2">
                No Users Found
              </h3>
              <p className="text-gray-400">
                {appliedSearch
                  ? "No users match your search criteria. Try a different search term or clear filters."
                  : "No users match the selected filters. Try adjusting your filter settings."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const currentRole = user.user_metadata.role || 'user';
                  return (
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
                            <h3 className="text-white font-semibold text-lg truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-gray-400 text-sm truncate">
                              {user.email || '—'}
                            </p>
                            <p className="text-gray-400 text-sm truncate flex items-center mt-1">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {user.phone_number || '—'}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              getUserStatus(user)
                            )}`}
                          >
                            {getUserStatus(user)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-4">
                          <div className="flex items-center">
                            {user.user_metadata.role === "admin" ? (
                              <ShieldCheckIcon className="h-4 w-4 text-purple-400 mr-1.5" />
                            ) : user.user_metadata.role === "dealer" ? (
                              <BriefcaseIcon className="h-4 w-4 text-blue-400 mr-1.5" />
                            ) : (
                              <UserIcon className="h-4 w-4 text-gray-400 mr-1.5" />
                            )}
                            <span
                              className={`${getRoleBadgeColor(
                                user.user_metadata.role || "user"
                              )} px-2 py-0.5 rounded text-xs`}
                            >
                              {user.user_metadata.role || "user"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                            <span className="text-gray-400 text-xs">
                              {user.lastSignInAt
                                ? new Date(user.lastSignInAt).toLocaleDateString()
                                : "Never"}
                            </span>
                          </div>
                        </div>

                        {(user.banned || user.locked) && (
                          <div className="mb-4 bg-rose-500/10 p-3 rounded-lg">
                            <p className="text-rose-400 text-sm flex items-center">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                              {user.banned
                                ? "Account is banned"
                                : "Account is locked"}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 w-full">
                          {/* Role transition buttons based on current role */}
                          {currentRole === 'user' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetRole(user, 'dealer');
                                }}
                                disabled={isActionLoading || user.banned || user.locked}
                                className="w-full px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isActionLoading ? (
                                  <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <BriefcaseIcon className="h-3.5 w-3.5 mr-1" />
                                )}
                                Make Dealer
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetRole(user, 'admin');
                                }}
                                disabled={isActionLoading || user.banned || user.locked}
                                className="w-full px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isActionLoading ? (
                                  <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
                                )}
                                Make Admin
                              </button>
                            </>
                          )}

                          {currentRole === 'dealer' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetRole(user, 'user');
                              }}
                              disabled={isActionLoading || user.banned || user.locked}
                              className="w-full px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Delete Dealership
                            </button>
                          )}

                          {currentRole === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetRole(user, 'user');
                              }}
                              disabled={isActionLoading || user.banned || user.locked}
                              className="w-full px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <UserIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Demote to User
                            </button>
                          )}

                          {/* Ban/Unban button */}
                          {!user.banned ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction(user, 'ban-user');
                              }}
                              disabled={isActionLoading}
                              className="w-full px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <StopCircleIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Ban User
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAction(user, 'unban-user');
                              }}
                              disabled={isActionLoading}
                              className="w-full px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isActionLoading ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                              )}
                              Unban User
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-gray-400 text-sm">
                  {totalCount > 0 ? (
                    <>
                      Showing {(page - 1) * pageSize + 1}
                      -{Math.min(page * pageSize, totalCount)} of {totalCount}
                    </>
                  ) : (
                    <>No results</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-gray-800/60 border border-gray-700 text-gray-300 rounded-md px-2 py-1 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value || '24', 10)); setPage(1); fetchUsers(); }}
                  >
                    <option value={12}>12 / page</option>
                    <option value={24}>24 / page</option>
                    <option value={48}>48 / page</option>
                    <option value={96}>96 / page</option>
                  </select>
                  <button
                    onClick={() => { if (page > 1) { setPage(page - 1); fetchUsers(); } }}
                    disabled={page === 1 || isLoading}
                    className="px-3 py-1.5 bg-gray-800/60 border border-gray-700 text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => { const maxPage = Math.ceil(totalCount / pageSize); if (page < maxPage) { setPage(page + 1); fetchUsers(); } }}
                    disabled={isLoading || page >= Math.ceil((totalCount || 0) / pageSize)}
                    className="px-3 py-1.5 bg-gray-800/60 border border-gray-700 text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced User Details Modal */}
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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
                  {selectedUser && userDetails && (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center">
                          <img
                            src={selectedUser.imageUrl}
                            alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                            className="w-16 h-16 rounded-full mr-4 border border-gray-700"
                          />
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {selectedUser.firstName} {selectedUser.lastName}
                            </h3>
                            <p className="text-gray-400">{selectedUser.email}</p>
                            {selectedUser.phone_number && (
                              <p className="text-gray-400 flex items-center mt-1">
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {selectedUser.phone_number}
                              </p>
                            )}
                            <div className="flex items-center mt-1 gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(selectedUser.user_metadata.role || "user")}`}>
                                {selectedUser.user_metadata.role || "user"}
                              </span>
                              <span className="text-xs text-gray-400">
                                ID: {selectedUser.id}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              Joined {formatDate(selectedUser.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsUserModalOpen(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {userDetails.dealershipInfo && (
                        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                          <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                            <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Dealership Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-sm">Name</p>
                              <p className="text-white">{userDetails.dealershipInfo.name}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Location</p>
                              <p className="text-white">{userDetails.dealershipInfo.location}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Phone</p>
                              <p className="text-white">{userDetails.dealershipInfo.phone}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Subscription Ends</p>
                              <p className="text-white">
                                {formatDate(userDetails.dealershipInfo.subscription_end_date)}
                              </p>
                            </div>
                          </div>

                          {userDetails.dealershipCars?.length > 0 && (
                            <div className="mt-4">
                              <p className="text-gray-400 text-sm mb-2">
                                Car Listings ({userDetails.dealershipCars.length})
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {userDetails.dealershipCars.map((car: any) => (
                                  <div key={car.id} className="p-2 bg-gray-900/50 rounded text-sm">
                                    <p className="text-white font-medium">
                                      {car.make} {car.model} ({car.year})
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <p className="text-gray-400">${car.price?.toLocaleString()}</p>
                                      <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(car.status)}`}>
                                        {car.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                            <HeartIcon className="h-5 w-5 mr-2 text-rose-400" />
                            Liked Cars ({userDetails.likedCars?.length || 0})
                          </h4>
                          <div className="bg-gray-900/50 rounded-lg overflow-y-auto max-h-60">
                            {userDetails.likedCars?.length > 0 ? (
                              <div className="divide-y divide-gray-800">
                                {userDetails.likedCars.map((car: any) => (
                                  <div key={car.id} className="p-3 hover:bg-gray-800/50">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="text-white font-medium">
                                          {car.make} {car.model}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                          {car.year} • ${car.price?.toLocaleString()}
                                        </p>
                                      </div>
                                      <span className={`self-start px-2 py-0.5 text-xs rounded-full ${getStatusColor(car.status)}`}>
                                        {car.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-400">
                                No liked cars
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                            <EyeIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Viewed Cars ({userDetails.viewedCars?.length || 0})
                          </h4>
                          <div className="bg-gray-900/50 rounded-lg overflow-y-auto max-h-60">
                            {userDetails.viewedCars?.length > 0 ? (
                              <div className="divide-y divide-gray-800">
                                {userDetails.viewedCars.map((car: any) => (
                                  <div key={car.id} className="p-3 hover:bg-gray-800/50">
                                    <div className="flex justify-between">
                                      <div>
                                        <p className="text-white font-medium">
                                          {car.make} {car.model}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                          {car.year} • ${car.price?.toLocaleString()}
                                        </p>
                                      </div>
                                      <span className={`self-start px-2 py-0.5 text-xs rounded-full ${getStatusColor(car.status)}`}>
                                        {car.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-400">
                                No viewed cars
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setIsUserModalOpen(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          Close
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

      {/* Dealership Creation Form Modal */}
      <Transition appear show={isDealershipFormOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDealershipFormOpen(false)}
        >
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
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold text-white"
                    >
                      Create Dealership
                    </Dialog.Title>
                    <button
                      onClick={() => setIsDealershipFormOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {selectedUser && (
                    <div className="flex items-center mb-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <img
                        src={selectedUser.imageUrl}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="text-white font-medium">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                        <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleDealershipSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Dealership Name*
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={dealershipForm.name}
                        onChange={(e) =>
                          setDealershipForm({
                            ...dealershipForm,
                            name: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border ${formErrors.name
                            ? "border-rose-500"
                            : "border-gray-600"
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                      />
                      {formErrors.name && (
                        <p className="text-rose-500 text-xs mt-1">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Location*
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        <input
                          type="text"
                          id="location"
                          value={dealershipForm.location}
                          onChange={(e) =>
                            setDealershipForm({
                              ...dealershipForm,
                              location: e.target.value,
                            })
                          }
                          className={`w-full pl-10 px-3 py-2 bg-gray-700 border ${formErrors.location
                              ? "border-rose-500"
                              : "border-gray-600"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                          placeholder="Enter dealership address"
                        />
                      </div>
                      {formErrors.location && (
                        <p className="text-rose-500 text-xs mt-1">
                          {formErrors.location}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Phone Number*
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        <input
                          type="tel"
                          id="phone"
                          value={dealershipForm.phone}
                          onChange={(e) =>
                            setDealershipForm({
                              ...dealershipForm,
                              phone: e.target.value,
                            })
                          }
                          className={`w-full pl-10 px-3 py-2 bg-gray-700 border ${formErrors.phone
                              ? "border-rose-500"
                              : "border-gray-600"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                          placeholder="e.g. 12345678"
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-rose-500 text-xs mt-1">
                          {formErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="subscriptionEndDate"
                        className="block text-sm font-medium text-gray-400 mb-1"
                      >
                        Subscription End Date*
                      </label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        <input
                          type="date"
                          id="subscriptionEndDate"
                          value={dealershipForm.subscriptionEndDate.toISOString().split("T")[0]}
                          onChange={(e) =>
                            setDealershipForm({
                              ...dealershipForm,
                              subscriptionEndDate: new Date(e.target.value),
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className={`w-full pl-10 px-3 py-2 bg-gray-700 border ${formErrors.subscriptionEndDate
                              ? "border-rose-500"
                              : "border-gray-600"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white`}
                        />
                      </div>
                      {formErrors.subscriptionEndDate && (
                        <p className="text-rose-500 text-xs mt-1">
                          {formErrors.subscriptionEndDate}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsDealershipFormOpen(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        disabled={isActionLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <>
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>Create Dealership</>
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Enhanced Confirmation Dialog */}
      <Transition appear show={confirmActionOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setConfirmActionOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
                    className="text-lg font-medium leading-6 text-white text-center mb-4 flex items-center justify-center"
                  >
                    {pendingAction.action === "delete-dealership-and-demote" ? (
                      <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-2" />
                    ) : pendingAction.context?.isDealershipDeletion ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-400 mr-2" />
                    ) : pendingAction.action === "ban-user" ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-rose-400 mr-2" />
                    ) : (
                      <InformationCircleIcon className="h-6 w-6 text-blue-400 mr-2" />
                    )}
                    Confirm Action
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-gray-300 text-center whitespace-pre-line">{getConfirmationMessage()}</p>
                  </div>

                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      onClick={() => setConfirmActionOpen(false)}
                      disabled={isActionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 ${getConfirmButtonStyle()} text-white rounded-lg transition-colors flex items-center`}
                      onClick={() => handleUserAction(pendingAction.action)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : pendingAction.action === "delete-dealership-and-demote" ? (
                        <>
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete & Demote
                        </>
                      ) : (
                        <>Confirm</>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Global loading overlay */}
      {isActionLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex items-center">
            <ArrowPathIcon className="h-6 w-6 text-indigo-500 mr-3 animate-spin" />
            <p className="text-white">Processing user action...</p>
          </div>
        </div>
      )}
    </div>
  );
}