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

    // 1. Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Try to fetch all profiles to test query
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, email, role');

    // 3. Try to query token_usage
    const { data: tokenData, error: tokenError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    return NextResponse.json({
      auth_user: {
        id: user.id,
        email: user.email,
      },
      your_profile: {
        error: profileError?.message,
        data: profile,
      },
      all_profiles: {
        error: allError?.message,
        count: allProfiles?.length,
        data: allProfiles,
      },
      token_usage_test: {
        error: tokenError?.message,
        data: tokenData,
      },
      is_admin: profile?.role === 'admin',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
