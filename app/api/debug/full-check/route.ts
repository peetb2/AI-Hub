import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 1. Check if profile exists
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    let profileStatus = 'NOT FOUND';
    let profile = null;
    if (profileError) {
      profileStatus = `ERROR: ${profileError.message}`;
    } else if (profiles && profiles.length > 0) {
      profileStatus = 'EXISTS';
      profile = profiles[0];
    }

    // 2. Check if token_usage table exists by trying to query it
    const { data: tokenUsage, error: tokenError } = await supabase
      .from('token_usage')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .limit(1);

    let tableStatus = 'OK - Table exists';
    if (tokenError && tokenError.message.includes('does not exist')) {
      tableStatus = 'MISSING - token_usage table not created';
    } else if (tokenError) {
      tableStatus = `ERROR: ${tokenError.message}`;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        status: profileStatus,
        data: profile,
      },
      token_usage_table: {
        status: tableStatus,
      },
      is_admin: profile?.role === 'admin',
      is_user: profile?.role === 'user',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
