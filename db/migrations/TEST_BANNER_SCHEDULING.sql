-- ============================================================================
-- BANNER SCHEDULING TEST CASES
-- Date Context: Today is February 17, 2026
-- ============================================================================

-- Clean up any existing test banners (optional - comment out if you want to keep existing data)
-- DELETE FROM banners WHERE image_url LIKE '%test-banner%';
-- DELETE FROM ad_banners WHERE image_url LIKE '%test-banner%';

-- ============================================================================
-- TEST CASE 1: EXPIRED BANNER (end_date = yesterday)
-- Expected: Should become inactive after Edge Function runs
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-banner-expired',
  NULL,
  true,  -- Currently active
  '2026-02-15 00:00:00+00',  -- Started 2 days ago
  '2026-02-16 23:59:59+00'   -- Ended yesterday (Feb 16)
);

-- Same for ad_banners
INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-expired',
  'https://example.com/expired',
  true,  -- Currently active
  '2026-02-15 00:00:00+00',  -- Started 2 days ago
  '2026-02-16 23:59:59+00'   -- Ended yesterday (Feb 16)
);


-- ============================================================================
-- TEST CASE 2: ACTIVE BANNER (end_date = tomorrow)
-- Expected: Should STAY active after Edge Function runs
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-banner-active',
  'fleet://car/123e4567-e89b-12d3-a456-426614174000',
  true,  -- Currently active
  '2026-02-15 00:00:00+00',  -- Started 2 days ago
  '2026-02-18 23:59:59+00'   -- Ends tomorrow (Feb 18)
);

INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-active',
  'https://example.com/active',
  true,  -- Currently active
  '2026-02-15 00:00:00+00',  -- Started 2 days ago
  '2026-02-18 23:59:59+00'   -- Ends tomorrow (Feb 18)
);


-- ============================================================================
-- TEST CASE 3: SCHEDULED BANNER (start_date = tomorrow)
-- Expected: Should STAY inactive (not started yet)
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-banner-scheduled',
  'fleet://dealership/456',
  false,  -- Not active yet
  '2026-02-18 00:00:00+00',  -- Starts tomorrow (Feb 18)
  '2026-02-25 23:59:59+00'   -- Ends next week
);

INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-scheduled',
  'https://example.com/scheduled',
  false,  -- Not active yet
  '2026-02-18 00:00:00+00',  -- Starts tomorrow (Feb 18)
  '2026-02-25 23:59:59+00'   -- Ends next week
);


-- ============================================================================
-- TEST CASE 4: BANNER BECOMING ACTIVE (start_date = yesterday, no end_date)
-- Expected: Should become active after Edge Function runs
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-banner-becoming-active',
  NULL,
  false,  -- Not active yet
  '2026-02-16 00:00:00+00',  -- Started yesterday (Feb 16)
  NULL                        -- No end date (runs forever)
);

INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-becoming-active',
  'https://example.com/becoming-active',
  false,  -- Not active yet
  '2026-02-16 00:00:00+00',  -- Started yesterday (Feb 16)
  NULL                        -- No end date (runs forever)
);


-- ============================================================================
-- TEST CASE 5: MANUALLY PAUSED BANNER (within 24hr grace period)
-- Expected: Should be SKIPPED (grace period not elapsed)
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date, manually_deactivated_at)
VALUES (
  'https://picsum.photos/800/400?test-banner-manually-paused',
  'fleet://car/789',
  false,  -- Manually paused
  '2026-02-10 00:00:00+00',  -- Started a week ago
  '2026-02-20 23:59:59+00',  -- Ends in 3 days
  '2026-02-17 00:00:00+00'   -- Manually deactivated today (within 24hr grace period)
);

INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date, manually_deactivated_at)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-manually-paused',
  'https://example.com/manually-paused',
  false,  -- Manually paused
  '2026-02-10 00:00:00+00',  -- Started a week ago
  '2026-02-20 23:59:59+00',  -- Ends in 3 days
  '2026-02-17 00:00:00+00'   -- Manually deactivated today (within 24hr grace period)
);


-- ============================================================================
-- TEST CASE 6: NO SCHEDULE BANNER (no dates, should follow active flag)
-- Expected: Should NOT be changed by Edge Function (no schedule = no auto-management)
-- ============================================================================
INSERT INTO banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-banner-no-schedule',
  NULL,
  true,  -- Active
  NULL,  -- No start date
  NULL   -- No end date
);

INSERT INTO ad_banners (image_url, redirect_to, active, start_date, end_date)
VALUES (
  'https://picsum.photos/800/400?test-ad-banner-no-schedule',
  'https://example.com/no-schedule',
  true,  -- Active
  NULL,  -- No start date
  NULL   -- No end date
);


-- ============================================================================
-- VERIFICATION QUERIES - Run BEFORE triggering Edge Function
-- ============================================================================

-- Check banners status BEFORE Edge Function
SELECT 
  id,
  substring(image_url from 'test-banner-[^?]+') as test_case,
  active,
  start_date AT TIME ZONE 'UTC' as start_date_utc,
  end_date AT TIME ZONE 'UTC' as end_date_utc,
  manually_deactivated_at AT TIME ZONE 'UTC' as manually_deactivated_utc,
  created_at AT TIME ZONE 'UTC' as created_utc
FROM banners
WHERE image_url LIKE '%test-banner%'
ORDER BY created_at DESC;

-- Check ad_banners status BEFORE Edge Function
SELECT 
  id,
  substring(image_url from 'test-ad-banner-[^?]+') as test_case,
  active,
  start_date AT TIME ZONE 'UTC' as start_date_utc,
  end_date AT TIME ZONE 'UTC' as end_date_utc,
  manually_deactivated_at AT TIME ZONE 'UTC' as manually_deactivated_utc,
  created_at AT TIME ZONE 'UTC' as created_utc
FROM ad_banners
WHERE image_url LIKE '%test-ad-banner%'
ORDER BY created_at DESC;


-- ============================================================================
-- EXPECTED RESULTS AFTER EDGE FUNCTION EXECUTION
-- ============================================================================
/*
TEST CASE 1 (EXPIRED): active = false (was true, end_date passed)
TEST CASE 2 (ACTIVE): active = true (unchanged, end_date tomorrow)
TEST CASE 3 (SCHEDULED): active = false (unchanged, start_date tomorrow)
TEST CASE 4 (BECOMING ACTIVE): active = true (was false, start_date passed)
TEST CASE 5 (MANUALLY PAUSED): active = false (unchanged, grace period active)
TEST CASE 6 (NO SCHEDULE): active = true (unchanged, no dates set)
*/


-- ============================================================================
-- CLEANUP QUERY - Run after testing to remove test data
-- ============================================================================
-- DELETE FROM banners WHERE image_url LIKE '%test-banner%';
-- DELETE FROM ad_banners WHERE image_url LIKE '%test-ad-banner%';
