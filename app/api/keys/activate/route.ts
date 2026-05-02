import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { licenseKey } = await request.json();

    if (!licenseKey) {
      return NextResponse.json({ error: "License key required" }, { status: 400 });
    }

    // 1. Find the license key
    const { data: license, error: licenseError } = await supabase
      .from("license_keys")
      .select("*")
      .eq("key_value", licenseKey)
      .maybeSingle();

    if (licenseError || !license) {
      return NextResponse.json({ error: "Invalid license key" }, { status: 404 });
    }

    // Note: We intentionally DO NOT check if the license is redeemed here.
    // The business model allows the same key to be activated across multiple accounts.
    // The restriction is enforced by the per-account Token Quota.

    // 2. Calculate expiry
    const expiresAt = new Date(Date.now() + license.duration_days * 86400000).toISOString();

    // 3. Update user_access for each model
    for (const model of license.allowed_models) {
      const { data: existingAccess } = await supabase
        .from("user_access")
        .select("expires_at")
        .eq("user_id", user.id)
        .eq("model_name", model)
        .maybeSingle();

      let newExpiry = expiresAt;
      if (existingAccess) {
          const currentExpiry = new Date(existingAccess.expires_at).getTime();
          // To prevent infinite stacking by spamming the same key, we only extend if the new expiry 
          // pushes the date further than their current expiry.
          // (In a full production app, we would track redemptions in a 'user_redemptions' table).
          const potentialExpiry = new Date(Math.max(Date.now(), currentExpiry) + license.duration_days * 86400000).toISOString();
          
          // Only add time if they are legitimately extending. 
          // For simplicity in this multi-use model, we'll just set it to max(current, newExpiry).
          // If they want to stack 2 different keys, they can.
          newExpiry = new Date(Math.max(currentExpiry, new Date(expiresAt).getTime())).toISOString();
      }

      await supabase.from("user_access").upsert({
        user_id: user.id,
        model_name: model,
        expires_at: newExpiry,
      }, { onConflict: "user_id,model_name" });
    }

    // We do NOT mark the license as is_redeemed = true, so others can use it.

    return NextResponse.json({ success: true, models: license.allowed_models });
  } catch (err) {
    return NextResponse.json({ error: "Failed to redeem license" }, { status: 500 });
  }
}
