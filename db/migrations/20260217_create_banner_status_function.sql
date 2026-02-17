-- Migration: Create banner status calculation function
-- Created: 2026-02-17
-- Description: Creates a reusable SQL function to calculate if a banner should be active based on start/end dates

-- Create function to calculate banner active status
CREATE OR REPLACE FUNCTION calculate_banner_active_status(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
BEGIN
  -- If no dates set, always active (no scheduling constraints)
  IF p_start_date IS NULL AND p_end_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if current time is within the scheduled range
  -- Banner is active if:
  -- 1. start_date is NULL (no start constraint) OR current time >= start_date
  -- 2. AND end_date is NULL (no end constraint) OR current time < end_date
  IF (p_start_date IS NULL OR NOW() >= p_start_date) AND
     (p_end_date IS NULL OR NOW() < p_end_date) THEN
    RETURN TRUE;
  END IF;
  
  -- Outside the scheduled range
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for documentation
COMMENT ON FUNCTION calculate_banner_active_status IS 'Calculates whether a banner should be active based on its start_date and end_date. Returns TRUE if current time is within the date range, or if dates are NULL (no constraints).';
