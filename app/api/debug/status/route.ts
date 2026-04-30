import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' });
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        error: 'Profile query failed',
        details: profileError.message,
        user_id: user.id,
      });
    }

    // Try to query token_usage table
    const { data: usage, error: usageError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    let usageStatus = 'OK';
    if (usageError) {
      usageStatus = `ERROR: ${usageError.message}`;
    }

    return NextResponse.json({
      authenticated: true,
      user_id: user.id,
      email: user.email,
      profile,
      token_usage_table_status: usageStatus,
      is_admin: profile?.role === 'admin',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
