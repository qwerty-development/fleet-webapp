// utils/bannerDateUtils.ts
// Utility functions for banner date handling and status calculation

import { BannerStatus, Banner, AdBanner, BannerDateRange } from '@/types';

/**
 * Calculates the current status of a banner based on its dates and active flag
 */
export function calculateBannerStatus(
  banner: Banner | AdBanner
): BannerStatus {
  const now = new Date();
  const startDate = banner.start_date ? new Date(banner.start_date) : null;
  const endDate = banner.end_date ? new Date(banner.end_date) : null;

  // If banner is manually deactivated (paused) but within date range
  if (!banner.active && startDate && endDate) {
    if (now >= startDate && now < endDate) {
      return 'paused';
    }
  }

  // If banner is inactive and outside date range (or no dates)
  if (!banner.active) {
    return 'paused';
  }

  // No scheduling constraints - always active
  if (!startDate && !endDate) {
    return 'no_schedule';
  }

  // Scheduled for future
  if (startDate && now < startDate) {
    return 'scheduled';
  }

  // Expired
  if (endDate && now >= endDate) {
    return 'expired';
  }

  // Within active date range
  return 'active';
}

/**
 * Determines if a banner should be displayed to end users
 */
export function isBannerActive(banner: Banner | AdBanner): boolean {
  // Must be marked as active
  if (!banner.active) {
    return false;
  }

  const now = new Date();
  const startDate = banner.start_date ? new Date(banner.start_date) : null;
  const endDate = banner.end_date ? new Date(banner.end_date) : null;

  // Check start date constraint
  if (startDate && now < startDate) {
    return false;
  }

  // Check end date constraint
  if (endDate && now >= endDate) {
    return false;
  }

  return true;
}

/**
 * Generates a human-readable date range text for display
 */
export function getBannerDateRangeText(
  startDate: string | null,
  endDate: string | null
): string {
  if (!startDate && !endDate) {
    return 'Always active (no schedule)';
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `Starts ${formatDate(startDate)}`;
  }

  if (endDate) {
    return `Ends ${formatDate(endDate)}`;
  }

  return 'No schedule';
}

/**
 * Validates banner dates and returns error message if invalid
 * Returns null if dates are valid
 */
export function validateBannerDates(
  startDate: string | null,
  endDate: string | null
): string | null {
  // If either is null, no validation needed
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if dates are valid
  if (isNaN(start.getTime())) {
    return 'Invalid start date';
  }

  if (isNaN(end.getTime())) {
    return 'Invalid end date';
  }

  // End date must be after start date
  if (end <= start) {
    return 'End date must be after start date';
  }

  return null;
}

/**
 * Converts a local datetime-local input value to UTC ISO string for database storage
 */
export function localDateTimeToUTC(localDateTime: string): string {
  if (!localDateTime) return '';
  
  // datetime-local input gives us a string in format: "YYYY-MM-DDTHH:MM"
  // We need to treat this as local time and convert to UTC
  const date = new Date(localDateTime);
  return date.toISOString();
}

/**
 * Converts a UTC ISO string from database to local datetime-local input format
 */
export function utcToLocalDateTime(utcString: string | null): string {
  if (!utcString) return '';
  
  const date = new Date(utcString);
  
  // Format for datetime-local input: "YYYY-MM-DDTHH:MM"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Gets a banner date range object with parsed dates and status
 */
export function getBannerDateRange(
  banner: Banner | AdBanner
): BannerDateRange {
  return {
    start: banner.start_date ? new Date(banner.start_date) : null,
    end: banner.end_date ? new Date(banner.end_date) : null,
    status: calculateBannerStatus(banner),
    displayText: getBannerDateRangeText(banner.start_date, banner.end_date),
  };
}

/**
 * Gets the badge color class for a given banner status
 */
export function getBannerStatusColor(status: BannerStatus): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'expired':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'paused':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'no_schedule':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Gets the display label for a banner status
 */
export function getBannerStatusLabel(status: BannerStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    case 'paused':
      return 'Paused';
    case 'no_schedule':
      return 'Always Active';
    default:
      return 'Unknown';
  }
}
