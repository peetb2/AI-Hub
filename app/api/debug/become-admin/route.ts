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

    // Update or insert profile with admin role
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        monthly_token_quota: 9999999,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to promote to admin',
        details: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      message: '✅ You have been promoted to admin successfully!',
      profile: data,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
