import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Create a response object for consistent error handling
  const createResponse = (success: boolean, message: string, status: number = 200) => {
    return NextResponse.json({ 
      success, 
      message 
    }, { status });
  };

  try {
    // 1. AUTHORIZATION PHASE
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return createResponse(false, "Unauthorized: Valid session required", 401);
    }

    const userId = user.id;
    console.log(`[DELETE USER] Started for user ID: ${userId}`);
    
    // 2. ADMIN CLIENT INITIALIZATION
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      console.error("[DELETE USER] Failed to create admin client");
      return createResponse(false, "Server configuration error", 500);
    }

    // 3. VERIFICATION PHASE - Check if user exists in both places
    console.log(`[DELETE USER] Verifying user exists in database and auth system`);
    
    // 3.1 Check public.users table
    const { data: dbUser, error: dbCheckError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (dbCheckError && dbCheckError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error(`[DELETE USER] Database verification error:`, dbCheckError);
      return createResponse(false, "Failed to verify user in database", 500);
    }
    
    const userExistsInDb = !!dbUser;
    console.log(`[DELETE USER] User exists in database: ${userExistsInDb}`);

    // 3.2 Check auth.users
    const { data: authUser, error: authCheckError } = await adminSupabase.auth.admin.getUserById(userId);
    
    if (authCheckError) {
      console.error(`[DELETE USER] Auth verification error:`, authCheckError);
      return createResponse(false, "Failed to verify user in auth system", 500);
    }
    
    const userExistsInAuth = !!authUser?.user;
    console.log(`[DELETE USER] User exists in auth system: ${userExistsInAuth}`);

    // 4. DELETION PHASE - Using raw SQL for database user
    if (userExistsInDb) {
      console.log(`[DELETE USER] Deleting from public.users table using raw SQL`);
      
      // 4.1 Execute raw SQL deletion for database user
      const { error: sqlError } = await adminSupabase.rpc(
        'admin_delete_user_record',
        { user_id_param: userId }
      );
      
      if (sqlError) {
        console.error(`[DELETE USER] Raw SQL deletion failed:`, sqlError);
        
        // 4.2 Fallback to standard delete
        console.log(`[DELETE USER] Attempting fallback deletion from users table`);
        const { error: fallbackError } = await adminSupabase
          .from('users')
          .delete()
          .eq('id', userId);
        
        if (fallbackError) {
          console.error(`[DELETE USER] Fallback deletion failed:`, fallbackError);
          return createResponse(false, "Failed to delete user from database after multiple attempts", 500);
        }
      }
      
      // 4.3 Verify deletion from database
      const { data: verifyData, error: verifyError } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!verifyError && verifyData) {
        console.error(`[DELETE USER] Database deletion verification failed - user still exists`);
        return createResponse(false, "Failed to delete user from database - user still exists", 500);
      }
      
      console.log(`[DELETE USER] Successfully deleted from public.users table`);
    } else {
      console.log(`[DELETE USER] User not found in database, skipping database deletion`);
    }

    // 5. AUTH USER DELETION PHASE
    if (userExistsInAuth) {
      console.log(`[DELETE USER] Deleting from auth.users system`);
      const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error(`[DELETE USER] Auth deletion error:`, authDeleteError);
        return createResponse(false, "Failed to delete user authentication record", 500);
      }
      
      console.log(`[DELETE USER] Successfully deleted from auth system`);
    } else {
      console.log(`[DELETE USER] User not found in auth system, skipping auth deletion`);
    }
    
    // 6. FINAL VERIFICATION
    // 6.1 Check public.users table again
    const { data: finalDbCheck } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    // 6.2 Check auth.users again
    const { data: finalAuthCheck } = await adminSupabase.auth.admin.getUserById(userId);
    
    if (finalDbCheck || finalAuthCheck?.user) {
      console.error(`[DELETE USER] Final verification failed - user still exists in one or more systems`);
      return createResponse(false, "Deletion process completed but user may still exist in one or more systems", 500);
    }
    
    // 7. SUCCESS RESPONSE
    console.log(`[DELETE USER] Operation complete: User fully deleted from all systems`);
    return createResponse(true, "Account successfully deleted");
    
  } catch (error: any) {
    console.error(`[DELETE USER] CRITICAL ERROR:`, error);
    return createResponse(false, "System error during account deletion: " + (error.message || "Unknown error"), 500);
  }
}