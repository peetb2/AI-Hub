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

    const results = {
      user_id: user.id,
      email: user.email,
      fixes_applied: [] as string[],
    };

    // 1. Ensure profile exists
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (!profiles || profiles.length === 0) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        role: 'user',
        monthly_token_quota: 100000,
      });
      if (insertError) {
        results.fixes_applied.push(`⚠️ Failed to create profile: ${insertError.message}`);
      } else {
        results.fixes_applied.push('✅ Profile created with user role');
      }
    } else if (profiles[0].role !== 'user') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', user.id);
      if (updateError) {
        results.fixes_applied.push(`⚠️ Failed to update role: ${updateError.message}`);
      } else {
        results.fixes_applied.push('✅ Role updated to user');
      }
    } else {
      results.fixes_applied.push('✅ Profile already exists as user');
    }

    // 2. Try to verify token_usage table exists
    const { data: tableData, error: tableError } = await supabase
      .from('token_usage')
      .select('count()', { count: 'exact' })
      .limit(1);

    if (
      tableError &&
      tableError.message.includes('does not exist')
    ) {
      results.fixes_applied.push(
        '⚠️ token_usage table not found - you need to run SQL in Supabase'
      );
    } else if (tableError) {
      results.fixes_applied.push(
        `⚠️ token_usage check error: ${tableError.message}`
      );
    } else {
      results.fixes_applied.push('✅ token_usage table exists');
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
