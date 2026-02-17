-- Migration: Setup cron job for automatic banner status updates
-- Created: 2026-02-17
-- Description: Creates a pg_cron job that runs daily at midnight UTC to update banner active status

-- Step 1: Store the service role key in Supabase Vault (run this first)
-- This keeps the sensitive key secure and out of the codebase
-- First delete if exists, then insert (simple upsert pattern)
DELETE FROM vault.secrets WHERE name = 'service_role_key';

INSERT INTO vault.secrets (name, secret)
VALUES (
  'service_role_key',
  'service_key_value_here' -- Replace with the actual service role key value
);

-- Step 2: Schedule the cron job to run daily at midnight UTC
-- The job retrieves the service role key from Vault securely
SELECT cron.schedule(
  'update-banner-status-daily',     -- Job name
  '0 0 * * *',                       -- Cron schedule: Daily at midnight UTC
  $$
  SELECT net.http_post(
    url := 'https://auth.fleetapp.me/functions/v1/update-banner-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret 
        FROM vault.decrypted_secrets 
        WHERE name = 'service_role_key'
      )
    ),
    body := jsonb_build_object(
      'triggered_by', 'cron',
      'timestamp', NOW()::text
    )
  ) AS request_id;
  $$
);

-- Step 3: Verify the setup
-- Check that the vault secret was created
SELECT name, created_at, updated_at 
FROM vault.secrets 
WHERE name = 'service_role_key';

-- Check that the cron job was created successfully
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'update-banner-status-daily';

-- ============================================
-- MANAGEMENT COMMANDS (for reference)
-- ============================================

-- To manually unschedule (for testing or removal):
-- SELECT cron.unschedule('update-banner-status-daily');

-- To manually trigger the job for testing (runs every minute):
-- SELECT cron.schedule(
--   'update-banner-status-test',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://auth.fleetapp.me/functions/v1/update-banner-status',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || (
--         SELECT decrypted_secret 
--         FROM vault.decrypted_secrets 
--         WHERE name = 'service_role_key'
--       )
--     ),
--     body := jsonb_build_object(
--       'triggered_by', 'manual_test',
--       'timestamp', NOW()::text
--     )
--   ) AS request_id;
--   $$
-- );
-- Then unschedule after testing: SELECT cron.unschedule('update-banner-status-test');

-- To update the vault secret if needed:
-- UPDATE vault.secrets 
-- SET secret = 'new_service_role_key_here'
-- WHERE name = 'service_role_key';

-- To delete the vault secret:
-- DELETE FROM vault.secrets WHERE name = 'service_role_key';
