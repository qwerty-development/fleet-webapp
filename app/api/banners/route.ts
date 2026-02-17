import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/banners - Fetch all banners
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'all'; // all | scheduled | active | expired

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('banners')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply status filter
    const now = new Date().toISOString();
    if (status === 'scheduled') {
      query = query.gt('start_date', now);
    } else if (status === 'active') {
      query = query.eq('active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gt.${now}`);
    } else if (status === 'expired') {
      query = query.lt('end_date', now);
    }

    // Apply search filter if exists (note: title/description removed from schema)
    if (search) {
      query = query.or(
        `redirect_to.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching banners:', error);
      return NextResponse.json(
        { error: 'Failed to fetch banners' },
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
    console.error('Error in banners GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/banners - Create a new banner
export async function POST(request: NextRequest) {
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
    const { image_url, redirect_to, start_date, end_date, active = true } = body;

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

    // Create banner
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image_url,
        redirect_to,
        start_date: start_date || null,
        end_date: end_date || null,
        active
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating banner:', error);
      return NextResponse.json(
        { error: 'Failed to create banner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in banners POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
