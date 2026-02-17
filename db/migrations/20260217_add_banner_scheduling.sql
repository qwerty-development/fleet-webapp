-- Migration: Add scheduling fields to banners table
-- Created: 2026-02-17
-- Description: Adds start_date, end_date, active, and manually_deactivated_at fields to enable scheduled banner activation/deactivation

-- Add new columns to banners table
ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS manually_deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint to ensure end_date is after start_date
ALTER TABLE public.banners
ADD CONSTRAINT banners_date_range_check 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_banners_dates ON public.banners(start_date, end_date, active);

-- Add comment for documentation
COMMENT ON COLUMN public.banners.start_date IS 'Banner becomes active at this date/time. NULL means active immediately.';
COMMENT ON COLUMN public.banners.end_date IS 'Banner deactivates at this date/time. NULL means no expiration.';
COMMENT ON COLUMN public.banners.active IS 'Current active status. Can be manually toggled by admin or automatically updated by cron job.';
COMMENT ON COLUMN public.banners.manually_deactivated_at IS 'Timestamp when admin manually deactivated the banner. NULL if never manually deactivated or if reactivated.';
