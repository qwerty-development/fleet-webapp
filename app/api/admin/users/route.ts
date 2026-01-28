// app/api/admin/users/route.ts
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type SearchParams = {
  query: string;
  limit: number;
  offset: number;
};

const normalizeQuery = (value: string): string => value.replace(/%/g, '').trim();

const parseSearchParams = (request: NextRequest): SearchParams => {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') ?? '';
  const limitParam = parseInt(searchParams.get('limit') ?? `${DEFAULT_LIMIT}`, 10);
  const offsetParam = parseInt(searchParams.get('offset') ?? '0', 10);

  const limit = Number.isNaN(limitParam)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(limitParam, 1), MAX_LIMIT);
  const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

  return {
    query: normalizeQuery(rawQuery),
    limit,
    offset,
  };
};

const buildUsersQuery = (
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  params: SearchParams,
  dealerUserIds: string[]
) => {
  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, phone_number', { count: 'exact' })
    // Exclude guest users server-side
    .or('email.is.null,email.not.ilike.%guest%')
    .neq('name', 'Guest User')
    .not('id', 'like', 'guest%')
    .order('name', { ascending: true })
    .range(params.offset, params.offset + params.limit - 1);

  if (dealerUserIds.length > 0) {
    query = query.not('id', 'in', `(${dealerUserIds.join(',')})`);
  }

  if (params.query) {
    query = query.or(
      `name.ilike.%${params.query}%,email.ilike.%${params.query}%,phone_number.ilike.%${params.query}%`
    );
  }

  return query;
};

const fetchDealerUserIds = async (
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<string[]> => {
  const { data, error } = await supabaseAdmin
    .from('dealerships')
    .select('user_id')
    .not('user_id', 'is', null);

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row: { user_id: string | null }) => row.user_id)
    .filter((userId): userId is string => Boolean(userId));
};

export async function GET(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const params = parseSearchParams(request);
    const dealerUserIds = await fetchDealerUserIds(supabaseAdmin);
    const { data, error, count } = await buildUsersQuery(
      supabaseAdmin,
      params,
      dealerUserIds
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      count,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}