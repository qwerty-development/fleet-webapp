"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface AdBanner {
  id: number;
  created_at: string;
  image_url: string | null;
  redirect_to: string | null;
  active: boolean;
}

export interface UseAdBannersOptions {
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  activeFilter?: 'all' | 'active' | 'inactive';
}

export interface UseAdBannersReturn {
  adBanners: AdBanner[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  totalCount: number;
  currentPage: number;
  refetch: () => Promise<void>;
}

export function useAdBanners(options: UseAdBannersOptions = {}): UseAdBannersReturn {
  const {
    limit = 10,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    activeFilter = 'all'
  } = options;

  const [adBanners, setAdBanners] = useState<AdBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchAdBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      
      let query = supabase
        .from('ad_banners')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply active filter
      if (activeFilter === 'active') {
        query = query.eq('active', true);
      } else if (activeFilter === 'inactive') {
        query = query.eq('active', false);
      }

      // Apply search filter on redirect_to
      if (search) {
        query = query.ilike('redirect_to', `%${search}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      setAdBanners(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (err: any) {
      console.error('Error fetching ad banners:', err);
      setError('Failed to fetch ad banners');
    } finally {
      setIsLoading(false);
    }
  }, [limit, search, sortBy, sortOrder, currentPage, activeFilter]);

  useEffect(() => {
    fetchAdBanners();
  }, [fetchAdBanners]);

  // Update currentPage when page prop changes
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  const refetch = useCallback(async () => {
    await fetchAdBanners();
  }, [fetchAdBanners]);

  return {
    adBanners,
    isLoading,
    error,
    totalPages,
    totalCount,
    currentPage,
    refetch
  };
}

// Utility function to get only active ad banners (for mobile app consumption)
export function useActiveAdBanners(): UseAdBannersReturn {
  return useAdBanners({
    activeFilter: 'active',
    limit: 100, // Get all active banners
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
}
