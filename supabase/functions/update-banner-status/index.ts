// Supabase Edge Function: update-banner-status
// Automatically updates banner active status based on start_date and end_date
// Runs daily via pg_cron at midnight UTC

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Banner {
  id: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  manually_deactivated_at: string | null;
}

interface AdBanner {
  id: number;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  manually_deactivated_at: string | null;
}

interface UpdateResult {
  table: string;
  activated: number;
  deactivated: number;
  errors: string[];
}

/**
 * Calculates if a banner should be active based on its dates
 */
function shouldBeActive(
  startDate: string | null,
  endDate: string | null
): boolean {
  const now = new Date();

  // No dates = always active
  if (!startDate && !endDate) {
    return true;
  }

  // Check if within date range
  const isAfterStart = !startDate || now >= new Date(startDate);
  const isBeforeEnd = !endDate || now < new Date(endDate);

  return isAfterStart && isBeforeEnd;
}

/**
 * Updates banner status for a given table
 */
async function updateBannerTable(
  supabase: any,
  tableName: 'banners' | 'ad_banners'
): Promise<UpdateResult> {
  const result: UpdateResult = {
    table: tableName,
    activated: 0,
    deactivated: 0,
    errors: [],
  };

  try {
    // Fetch all banners that have at least one date set (scheduled banners)
    // Exclude manually deactivated banners (those with manually_deactivated_at set recently)
    const { data: banners, error: fetchError } = await supabase
      .from(tableName)
      .select('id, start_date, end_date, active, manually_deactivated_at')
      .or('start_date.not.is.null,end_date.not.is.null');

    if (fetchError) {
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    if (!banners || banners.length === 0) {
      console.log(`No scheduled banners found in ${tableName}`);
      return result;
    }

    console.log(`Processing ${banners.length} banners from ${tableName}`);

    // Process each banner
    for (const banner of banners) {
      const expectedActive = shouldBeActive(banner.start_date, banner.end_date);

      // Skip if banner is already in the correct state
      if (banner.active === expectedActive) {
        continue;
      }

      // Skip if manually deactivated within last 24 hours (admin override)
      if (
        banner.manually_deactivated_at &&
        new Date(banner.manually_deactivated_at) >
          new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) {
        console.log(
          `Skipping ${tableName} ID ${banner.id} - recently manually deactivated`
        );
        continue;
      }

      // Update the banner
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ active: expectedActive })
        .eq('id', banner.id);

      if (updateError) {
        result.errors.push(
          `Update error for ${tableName} ID ${banner.id}: ${updateError.message}`
        );
      } else {
        if (expectedActive) {
          result.activated++;
          console.log(`Activated ${tableName} ID ${banner.id}`);
        } else {
          result.deactivated++;
          console.log(`Deactivated ${tableName} ID ${banner.id}`);
        }
      }
    }
  } catch (error: any) {
    result.errors.push(`Exception: ${error.message}`);
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting banner status update job...');
    const startTime = Date.now();

    // Update both tables
    const bannersResult = await updateBannerTable(supabase, 'banners');
    const adBannersResult = await updateBannerTable(supabase, 'ad_banners');

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      results: {
        banners: bannersResult,
        ad_banners: adBannersResult,
      },
      total: {
        activated: bannersResult.activated + adBannersResult.activated,
        deactivated: bannersResult.deactivated + adBannersResult.deactivated,
        errors: [...bannersResult.errors, ...adBannersResult.errors],
      },
    };

    console.log('Banner status update completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in banner status update:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
