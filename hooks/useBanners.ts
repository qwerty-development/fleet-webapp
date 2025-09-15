"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface Banner {
  id: string;
  created_at: string;
  image_url: string;
  redirect_to: string | null;
}

export interface UseBannersOptions {
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
}

export interface UseBannersReturn {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  refetch: () => Promise<void>;
}

export function useBanners(options: UseBannersOptions = {}): UseBannersReturn {
  const {
    limit = 10,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1
  } = options;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      
      let query = supabase
        .from('banners')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Note: No search filter since we removed title and description

      // Apply pagination
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw error;
      }

      setBanners(data || []);
      setTotalPages(Math.ceil((count || 0) / limit));
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError('Failed to fetch banners');
    } finally {
      setIsLoading(false);
    }
  }, [limit, search, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const refetch = useCallback(async () => {
    await fetchBanners();
  }, [fetchBanners]);

  return {
    banners,
    isLoading,
    error,
    totalPages,
    currentPage,
    refetch
  };
}
