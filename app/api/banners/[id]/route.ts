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
    const { image_url, redirect_to, start_date, end_date, active } = body;

    // Validate required fields
    if (!image_url) {
      return NextResponse.json(
        { error: 'Missing required field: image_url' },
        { status: 400 }
      );
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      image_url,
      redirect_to,
    };

    // Add optional fields if provided
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (active !== undefined) {
      updateData.active = active;
      // Track manual deactivation
      if (!active) {
        updateData.manually_deactivated_at = new Date().toISOString();
      } else {
        updateData.manually_deactivated_at = null;
      }
    }

    // Update banner
    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
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

// PATCH /api/banners/[id] - Partial update (mainly for toggling active status)
export async function PATCH(
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

    const body = await request.json();\n    const { active } = body;

    if (active === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: active' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = { active };
    
    // Track manual deactivation/activation
    if (!active) {
      updateData.manually_deactivated_at = new Date().toISOString();
    } else {
      updateData.manually_deactivated_at = null;
    }

    // Update banner
    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
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
    console.error('Error in banner PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
