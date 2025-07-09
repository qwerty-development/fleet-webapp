"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/utils/AuthContext';
import {
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  PaperAirplaneIcon,
  BuildingOffice2Icon,
  FunnelIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import AdminNavbar from '@/components/admin/navbar';

interface Dealership {
  id: number;
  name: string;
  user_id: string;
  phone: string;
  location: string;
  subscription_end_date: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface NotificationHistory {
  id: string;
  created_at: string;
  title: string;
  message: string;
  recipients_count: number;
  recipient_type: string;
  sent_by: string;
  metadata: any;
}

type NotificationType = 'dealership_notification' | 'announcement' | 'subscription_reminder';

export default function AdminNotifications() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [selectedDealerships, setSelectedDealerships] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Notification form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationType>('dealership_notification');
  
  // Filter states
  const [filterActive, setFilterActive] = useState(true);
  const [filterExpired, setFilterExpired] = useState(false);

  useEffect(() => {
    fetchDealerships();
    fetchNotificationHistory();
  }, []);

  const fetchDealerships = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dealerships')
        .select(`
          *,
          user:users!dealerships_user_id_fkey(
            id,
            name,
            email,
            role
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      
      // FIXED: Debug dealership data and filter out invalid entries
      console.log('Raw dealership data:', data);
      
      const validDealerships = (data || []).filter(dealership => {
        const hasValidUser = dealership.user_id && dealership.user;
        if (!hasValidUser) {
          console.warn('Dealership missing user account:', {
            id: dealership.id,
            name: dealership.name,
            user_id: dealership.user_id,
            user: dealership.user
          });
        }
        return hasValidUser;
      });

      console.log(`Filtered dealerships: ${validDealerships.length}/${(data || []).length} valid`);
      setDealerships(validDealerships);
    } catch (error) {
      console.error('Error fetching dealerships:', error);
      alert('Failed to fetch dealerships');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.log('Notification logs table might not exist yet');
        return;
      }

      setNotificationHistory(data || []);
    } catch (error) {
      console.error('Error fetching notification history:', error);
    }
  };

  const getFilteredDealerships = useCallback(() => {
    const now = new Date();
    
    return dealerships.filter(dealership => {
      // Search filter
      const matchesSearch = dealership.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dealership.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dealership.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Subscription filter
      const subscriptionEnd = new Date(dealership.subscription_end_date);
      const isActive = subscriptionEnd >= now;
      
      if (filterActive && !filterExpired) return isActive;
      if (!filterActive && filterExpired) return !isActive;
      if (filterActive && filterExpired) return true;
      
      return false;
    });
  }, [dealerships, searchQuery, filterActive, filterExpired]);

  const toggleDealershipSelection = (userId: string) => {
    setSelectedDealerships(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredDealerships();
    if (selectAll) {
      setSelectedDealerships([]);
    } else {
      setSelectedDealerships(filtered.map(d => d.user_id));
    }
    setSelectAll(!selectAll);
  };

  const getNotificationScreenByType = (type: NotificationType) => {
    switch (type) {
      case 'dealership_notification':
        return '/(home)/(dealer)';
      case 'announcement':
        return '/(home)/(dealer)';
      case 'subscription_reminder':
        return '/(home)/(dealer)/profile';
      default:
        return '/(home)/(dealer)';
    }
  };

  const sendNotifications = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and message');
      return;
    }

    if (selectedDealerships.length === 0) {
      alert('Please select at least one dealership');
      return;
    }

    const confirmed = confirm(
      `Send notification to ${selectedDealerships.length} dealership${selectedDealerships.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmed) return;

    try {
      setSending(true);

      // FIXED: Validate that all selected user IDs exist in users table
      console.log('Validating user IDs...', selectedDealerships);
      const { data: validUsers, error: validationError } = await supabase
        .from('users')
        .select('id')
        .in('id', selectedDealerships);

      if (validationError) {
        console.error('Error validating users:', validationError);
        throw new Error('Failed to validate recipient users');
      }

      const validUserIds = validUsers?.map(u => u.id) || [];
      const invalidUserIds = selectedDealerships.filter(id => !validUserIds.includes(id));

      if (invalidUserIds.length > 0) {
        console.warn('Invalid user IDs found:', invalidUserIds);
        const shouldContinue = confirm(
          `${invalidUserIds.length} dealership(s) have invalid user accounts. Continue with ${validUserIds.length} valid recipients?`
        );
        if (!shouldContinue) {
          setSending(false);
          return;
        }
      }

      const finalRecipients = validUserIds;
      if (finalRecipients.length === 0) {
        alert('No valid recipients found. Please check dealership user accounts.');
        setSending(false);
        return;
      }

      // FIXED: Create notifications with required fields
      const now = new Date();
      const hourMark = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      
      const notificationsToInsert = finalRecipients.map(userId => ({
        user_id: userId,
        type: notificationType,
        data: {
          title: title.trim(),
          message: message.trim(),
          screen: getNotificationScreenByType(notificationType),
          metadata: {
            sentBy: user?.id,
            sentAt: now.toISOString(),
            recipientType: 'dealership',
            priority: 'normal'
          }
        },
        processed: false,
        created_at_hour: hourMark.toISOString()
      }));

      console.log('Inserting notifications...', notificationsToInsert.length);

      // FIXED: Batch insert in smaller chunks to avoid limits
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < notificationsToInsert.length; i += BATCH_SIZE) {
        batches.push(notificationsToInsert.slice(i, i + BATCH_SIZE));
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} notifications)`);
        
        try {
          const { error: batchError } = await supabase
            .from('pending_notifications')
            .insert(batch);

          if (batchError) {
            console.error(`Batch ${i + 1} error:`, batchError);
            errorCount += batch.length;
          } else {
            console.log(`Batch ${i + 1} success`);
            successCount += batch.length;
          }
        } catch (batchErr) {
          console.error(`Batch ${i + 1} exception:`, batchErr);
          errorCount += batch.length;
        }

        // Small delay between batches to avoid overwhelming the database
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Batch processing complete. Success: ${successCount}, Errors: ${errorCount}`);

      if (successCount === 0) {
        throw new Error('All notification batches failed to insert');
      }

      // FIXED: Log the admin action with better error handling
      try {
        const { error: logError } = await supabase
          .from('notification_admin_logs')
          .insert({
            sent_by: user?.id,
            title: title.trim(),
            message: message.trim(),
            recipients_count: successCount,
            recipient_type: selectedDealerships.length === dealerships.length ? 'all' : 'selected',
            recipient_ids: finalRecipients,
            notification_type: notificationType,
            metadata: {
              filterActive,
              filterExpired,
              searchQuery,
              batchInfo: {
                totalBatches: batches.length,
                successCount,
                errorCount,
                originalRecipientCount: selectedDealerships.length,
                validRecipientCount: finalRecipients.length
              }
            }
          });

        if (logError) {
          console.error('Failed to log notification:', logError);
          // Don't throw here - the notifications were sent successfully
        }
      } catch (logErr) {
        console.error('Exception logging notification:', logErr);
        // Don't throw here - the notifications were sent successfully
      }

      // Show success message
      if (errorCount > 0) {
        alert(
          `Partially successful: ${successCount} notifications sent, ${errorCount} failed. Check logs for details.`
        );
      } else {
        alert(
          `Success! Notifications sent to ${successCount} dealership${successCount > 1 ? 's' : ''}!`
        );
      }

      // Reset form and refresh
      resetForm();
      fetchNotificationHistory();
    } catch (error) {
      console.error('Error sending notifications:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to send notifications. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('validate')) {
          errorMessage = 'Failed to validate recipients. Please check dealership accounts.';
        } else if (error.message.includes('insert')) {
          errorMessage = 'Database error while sending notifications. Please try again.';
        } else if (error.message.includes('batch')) {
          errorMessage = 'Error processing notification batches. Some may have been sent.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  // ADDED: Test notification system
  const testNotificationSystem = async () => {
    try {
      setLoading(true);
      console.log('Testing notification system...');

      // Test 1: Check if tables exist and are accessible
      const tests = [
        { name: 'pending_notifications table', query: () => supabase.from('pending_notifications').select('id').limit(1) },
        { name: 'notification_admin_logs table', query: () => supabase.from('notification_admin_logs').select('id').limit(1) },
        { name: 'users table', query: () => supabase.from('users').select('id').limit(1) },
        { name: 'dealerships table', query: () => supabase.from('dealerships').select('id').limit(1) }
      ];

      const results = [];
      for (const test of tests) {
        try {
          await test.query();
          results.push(`✅ ${test.name}: OK`);
        } catch (error:any) {
          results.push(`❌ ${test.name}: ${error.message}`);
        }
      }

      // Test 2: Check dealership-user relationships
      const { data: dealershipCheck, error: dealershipError } = await supabase
        .from('dealerships')
        .select('id, name, user_id, user:users!dealerships_user_id_fkey(id, email)')
        .limit(5);

      if (dealershipError) {
        results.push(`❌ Dealership-User join: ${dealershipError.message}`);
      } else {
        const validLinks = dealershipCheck?.filter(d => d.user_id && d.user) || [];
        results.push(`✅ Dealership-User links: ${validLinks.length}/${dealershipCheck?.length || 0} valid`);
      }

      // Test 3: Check current user permissions
      const { data: currentUserTest, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user?.id)
        .single();

      if (userError) {
        results.push(`❌ Current user check: ${userError.message}`);
      } else {
        results.push(`✅ Current user: ${currentUserTest?.role || 'no role'}`);
      }

      alert(`Notification System Test Results:\n\n${results.join('\n')}`);
    } catch (error:any) {
      alert(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setSelectedDealerships([]);
    setSelectAll(false);
    setNotificationType('dealership_notification');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDealerships = getFilteredDealerships();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <AdminNavbar />

      <div className="pt-16 lg:pt-0 lg:pl-64">
        <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-16">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Send Notifications</h1>
              <p className="text-gray-400">Send notifications to dealerships</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <button
                onClick={testNotificationSystem}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Test System
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                View History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notification Form */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BellIcon className="h-6 w-6 mr-2" />
                Notification Details
              </h2>

              {/* Type Selector - FIXED: Mobile responsive */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Notification Type
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setNotificationType('dealership_notification')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                      notificationType === 'dealership_notification'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setNotificationType('announcement')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                      notificationType === 'announcement'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className="hidden sm:inline">Announcement</span>
                    <span className="sm:hidden">Announcement</span>
                  </button>
                  <button
                    onClick={() => setNotificationType('subscription_reminder')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                      notificationType === 'subscription_reminder'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span className="hidden sm:inline">Subscription</span>
                    <span className="sm:hidden">Subscription</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification Title"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Message Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification Message"
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 resize-none"
                />
                <p className="text-right text-gray-400 text-sm mt-1">
                  {message.length}/500 characters
                </p>
              </div>

              {/* Send Button */}
              <button
                onClick={sendNotifications}
                disabled={sending || selectedDealerships.length === 0 || !title.trim() || !message.trim()}
                className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Send to {selectedDealerships.length} Dealership{selectedDealerships.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>

            {/* Dealership Selection */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <UserGroupIcon className="h-6 w-6 mr-2" />
                Select Recipients
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dealerships..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilterActive(!filterActive)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterExpired(!filterExpired)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterExpired
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Expired
                </button>
              </div>

              {/* Select All */}
              <div className="flex items-center justify-between py-3 border-b border-gray-700 mb-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center text-white hover:text-indigo-400 transition-colors"
                >
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    selectAll ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600'
                  }`}>
                    {selectAll && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  Select All ({filteredDealerships.length})
                </button>
                <span className="text-gray-400 text-sm">
                  {selectedDealerships.length} selected
                </span>
              </div>

              {/* Dealership List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : filteredDealerships.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No dealerships found
                  </div>
                ) : (
                  filteredDealerships.map((dealership) => {
                    const isSelected = selectedDealerships.includes(dealership.user_id);
                    const isExpired = new Date(dealership.subscription_end_date) < new Date();

                    return (
                      <div
                        key={dealership.id}
                        onClick={() => toggleDealershipSelection(dealership.user_id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-900/30 border-indigo-500'
                            : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2" />
                              <h3 className="font-medium text-white">{dealership.name}</h3>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {dealership.user?.email || 'No email'} • {dealership.location || 'No location'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isExpired
                                  ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                                  : 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {isExpired ? 'Expired' : 'Active'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Expires: {new Date(dealership.subscription_end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600'
                          }`}>
                            {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Notification History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {notificationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p>No notification history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notificationHistory.map((item) => (
                    <div key={item.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <h3 className="font-medium text-white mb-2">{item.title}</h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.message}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>
                          Sent to {item.recipients_count} {item.recipient_type === 'all' ? 'all dealerships' : 'dealerships'}
                        </span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}