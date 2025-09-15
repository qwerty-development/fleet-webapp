"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Banner {
  id: string;
  image_url: string;
  redirect_to: string | null;
}

interface BannerCardProps {
  banner: Banner;
  className?: string;
}

export default function BannerCard({ banner, className = '' }: BannerCardProps) {
  // If no redirect, render as a div instead of Link
  if (!banner.redirect_to) {
    return (
      <div className={`block group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
        <div className="relative aspect-video">
          <Image
            src={banner.image_url}
            alt="Banner"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={banner.redirect_to}
      className={`block group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Banner Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
        <Image
          src={banner.image_url}
          alt="Banner"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Hover indicator */}
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors duration-300" />
      </div>
    </Link>
  );
}
