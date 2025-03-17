// utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const createAdminClient = () => {
  // Check that environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables for Supabase admin client');
    throw new Error('Missing environment variables for Supabase admin client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};