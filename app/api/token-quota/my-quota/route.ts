import { getQuotaInfo } from '@/lib/tokenUsage';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotaInfo = await getQuotaInfo(user.id);
    return NextResponse.json(quotaInfo);
  } catch (error) {
    console.error('Error fetching quota info:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch quota info';
    return NextResponse.json(
      { error: errorMsg, details: String(error) },
      { status: 500 }
    );
  }
}
