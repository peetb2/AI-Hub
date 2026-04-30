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

    // Check if profile exists
    const { data: profiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);

    if (checkError) {
      return NextResponse.json({
        error: 'Failed to check profiles',
        details: checkError.message,
      });
    }

    if (!profiles || profiles.length === 0) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: 'user',
          monthly_token_quota: 100000,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          error: 'Failed to create profile',
          details: createError.message,
        });
      }

      return NextResponse.json({
        status: 'Profile created',
        profile: newProfile,
      });
    }

    return NextResponse.json({
      status: 'Profile exists',
      profile: profiles[0],
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
