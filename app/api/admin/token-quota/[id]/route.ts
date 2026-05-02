import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, context: any) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strictly check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { monthly_token_quota } = body;

    if (typeof monthly_token_quota !== 'number' || monthly_token_quota < 0) {
      return NextResponse.json(
        { error: 'Invalid quota value' },
        { status: 400 }
      );
    }

    const targetId = context?.params?.id ?? (await context?.params)?.id;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ monthly_token_quota })
      .eq('id', targetId)
      .select('id, email, monthly_token_quota')
      .single();

    if (error) {
      console.error('Error updating quota in database:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Critical error updating token quota:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
