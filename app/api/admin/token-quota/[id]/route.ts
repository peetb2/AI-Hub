import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, context: any) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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

    if (error) throw error;

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating token quota:', error);
    return NextResponse.json(
      { error: 'Failed to update token quota' },
      { status: 500 }
    );
  }
}
