import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, monthly_token_quota")
      .order("email", { ascending: true });

    if (usersError) {
      console.error("Error fetching user profiles:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    // Fetch all usage for this month in one go
    const { data: usageLogs, error: usageError } = await supabase
      .from("token_usage")
      .select("user_id, characters_used")
      .gte("created_at", monthStart.toISOString());

    if (usageError) {
      console.error("Error fetching token usage logs:", usageError);
      // We'll continue but usage will be 0
    }

    // Aggregate usage by user_id
    const usageMap: Record<string, number> = {};
    usageLogs?.forEach(log => {
      usageMap[log.user_id] = (usageMap[log.user_id] || 0) + log.characters_used;
    });

    // Map users with their usage
    const usersWithUsage = (users || []).map((u) => {
      const totalUsed = usageMap[u.id] || 0;
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
    });

    return NextResponse.json(usersWithUsage);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Critical error in admin token-quota list:", msg);
    return NextResponse.json(
      { error: "Internal server error", details: msg },
      { status: 500 }
    );
  }
}
