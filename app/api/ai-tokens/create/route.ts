import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const tokenPrefix = `${token.slice(0, 8)}...${token.slice(-4)}`;

    const { data, error } = await supabase
      .from("user_ai_tokens")
      .upsert(
        {
          user_id: user.id,
          provider: "personal",
          token_prefix: tokenPrefix,
          token_encrypted: token,
          is_active: true,
        },
        { onConflict: "user_id" }
      )
      .select("id, token_prefix, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
