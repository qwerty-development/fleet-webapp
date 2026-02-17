-- Migration: Add scheduling fields to ad_banners table
-- Created: 2026-02-17
-- Description: Adds start_date, end_date, and manually_deactivated_at fields to enable scheduled ad banner activation/deactivation
-- Note: active column already exists on this table

-- Add new columns to ad_banners table
ALTER TABLE public.ad_banners
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS manually_deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint to ensure end_date is after start_date
ALTER TABLE public.ad_banners
ADD CONSTRAINT ad_banners_date_range_check 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_ad_banners_dates ON public.ad_banners(start_date, end_date, active);

-- Add comments for documentation
COMMENT ON COLUMN public.ad_banners.start_date IS 'Ad banner becomes active at this date/time. NULL means active immediately.';
COMMENT ON COLUMN public.ad_banners.end_date IS 'Ad banner deactivates at this date/time. NULL means no expiration.';
COMMENT ON COLUMN public.ad_banners.manually_deactivated_at IS 'Timestamp when admin manually deactivated the ad banner. NULL if never manually deactivated or if reactivated.';
