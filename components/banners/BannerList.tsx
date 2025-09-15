"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import BannerCard from './BannerCard';

interface Banner {
  id: string;
  image_url: string;
  redirect_to: string | null;
  created_at: string;
}

interface BannerListProps {
  limit?: number;
  className?: string;
}

export default function BannerList({ limit, className = '' }: BannerListProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        
        let query = supabase
          .from('banners')
          .select('*')
          .order('created_at', { ascending: false });

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setBanners(data || []);
      } catch (err: any) {
        console.error('Error fetching banners:', err);
        setError('Failed to load banners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [limit]);

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: limit || 3 }).map((_, index) => (
          <div
            key={index}
            className="aspect-video bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Failed to load banners</p>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No banners available</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {banners.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}
