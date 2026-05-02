import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { models, days } = await request.json();

    if (!models || !Array.isArray(models) || models.length === 0) {
        return NextResponse.json({ error: "Models required" }, { status: 400 });
    }

    if (!days || days < 1) {
        return NextResponse.json({ error: "Duration required" }, { status: 400 });
    }

    // Generate a unique license key: SN-XXXX-XXXX-XXXX
    const keyValue = `SN-${randomBytes(4).toString('hex').toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const { data, error } = await supabase
      .from("license_keys")
      .insert({
        key_value: keyValue,
        allowed_models: models,
        duration_days: days,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate license" }, { status: 500 });
  }
}

export async function GET() {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
      const { data, error } = await supabase
        .from("license_keys")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) throw error;
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: "Failed to list licenses" }, { status: 500 });
    }
}
