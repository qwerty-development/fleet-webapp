import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get auth session from cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use formData to get file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename with timestamp
    const userId = session.user.id;
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${userId}-${timestamp}.${fileExt}`;

    // Convert file to buffer for Supabase storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use admin client for storage operations
    const adminSupabase = createAdminClient();

    // Upload the file to avatars bucket
    const { data, error } = await adminSupabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = adminSupabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = urlData?.publicUrl;

    // Update user metadata with new avatar URL
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { avatar_url: avatarUrl } }
    );

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl
    });
  } catch (error: any) {
    console.error('Unhandled error in avatar upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}