import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/ad-banners - Fetch all ad banners
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const activeFilter = searchParams.get('active'); // 'true', 'false', or null for all
    const status = searchParams.get('status') || 'all'; // all | scheduled | active | expired

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('ad_banners')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply status filter (takes precedence over activeFilter)
    const now = new Date().toISOString();
    if (status === 'scheduled') {
      query = query.gt('start_date', now);
    } else if (status === 'active') {
      query = query.eq('active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gt.${now}`);
    } else if (status === 'expired') {
      query = query.lt('end_date', now);
    } else if (activeFilter === 'true') {
      // Legacy active filter for backward compatibility
      query = query.eq('active', true);
    } else if (activeFilter === 'false') {
      query = query.eq('active', false);
    }

    // Apply search filter on redirect_to if exists
    if (search) {
      query = query.ilike('redirect_to', `%${search}%`);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching ad banners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ad banners' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in ad-banners GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ad-banners - Create a new ad banner
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { image_url, redirect_to, active = true, start_date, end_date } = body;

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

    // Create ad banner
    const { data, error } = await supabase
      .from('ad_banners')
      .insert({
        image_url,
        redirect_to: redirect_to || null,
        active,
        start_date: start_date || null,
        end_date: end_date || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad banner:', error);
      return NextResponse.json(
        { error: 'Failed to create ad banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in ad-banners POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
