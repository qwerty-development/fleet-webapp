import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/banners/[id] - Fetch a specific banner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching banner:', error);
      return NextResponse.json(
        { error: 'Failed to fetch banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in banner GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/banners/[id] - Update a specific banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { image_url, redirect_to } = body;

    // Validate required fields
    if (!image_url) {
      return NextResponse.json(
        { error: 'Missing required field: image_url' },
        { status: 400 }
      );
    }

    // Note: We can't validate redirect target without knowing the type
    // The frontend will handle this validation

    // Update banner
    const { data, error } = await supabase
      .from('banners')
      .update({
        image_url,
        redirect_to
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }
      console.error('Error updating banner:', error);
      return NextResponse.json(
        { error: 'Failed to update banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in banner PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/banners/[id] - Delete a specific banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting banner:', error);
      return NextResponse.json(
        { error: 'Failed to delete banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error in banner DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
