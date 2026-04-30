import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const userRes = await supabase.auth.getUser();
    const user = userRes?.data?.user ?? null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();


    if (!profile) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email ?? '',
        role: 'user',
        monthly_token_quota: 100000,
      });

      if (insertError) {
        return NextResponse.json({ error: 'Failed to bootstrap profile' }, { status: 500 });
      }
    }



    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all users with their quota and current month usage
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, monthly_token_quota');

    if (usersError) throw usersError;

    // For each user, calculate their current month usage
    const usersWithUsage = await Promise.all(
      (users || []).map(async (u) => {
        const { data: usage } = await supabase
          .from('token_usage')
          .select('characters_used', { count: 'exact' })
          .eq('user_id', u.id)
          .gte('created_at', monthStart.toISOString());

        const totalUsed = (usage || []).reduce((sum, row) => sum + row.characters_used, 0);
        const remaining = Math.max(0, u.monthly_token_quota - totalUsed);
        const percentUsed = u.monthly_token_quota > 0 
          ? Math.round((totalUsed / u.monthly_token_quota) * 100)
          : 0;

        return {
          id: u.id,
          email: u.email,
          quota: u.monthly_token_quota,
          used: totalUsed,
          remaining,
          percentUsed,
        };
      })
    );

    return NextResponse.json(usersWithUsage);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching token quotas:', msg, error);
    return NextResponse.json(
      { error: 'Failed to fetch token quotas', details: msg },
      { status: 500 }
    );
  }
}
