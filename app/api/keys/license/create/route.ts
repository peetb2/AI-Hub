import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { models, days } = await request.json();

    if (!models || !Array.isArray(models) || models.length === 0) {
        return NextResponse.json({ error: "Please select at least one model." }, { status: 400 });
    }

    if (!days || days < 1) {
        return NextResponse.json({ error: "Please select a duration." }, { status: 400 });
    }

    // Generate a unique license key: SN-XXXX-XXXX-XXXX
    const keyValue = `SN-${randomBytes(4).toString('hex').toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    // Note: In a real app, you would check the user's balance here before generating.
    const { data, error } = await supabase
      .from("license_keys")
      .insert({
        key_value: keyValue,
        allowed_models: models,
        duration_days: days,
        // Optional: track who bought it
        // created_by: user.id 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate license key" }, { status: 500 });
  }
}

export async function GET() {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      // Users can see licenses they've redeemed or we could track their "Purchased" history
      // For now, let's keep it simple. Admin GET stays in admin routes if needed.
      return NextResponse.json({ message: "Use POST to generate a key." });
    } catch (err) {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
