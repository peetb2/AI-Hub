import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/gateway/apiKeys";
import { listApiKeysForUser } from "@/lib/gateway/apiKeys";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Quota Info
    const headersList = await (await import('next/headers')).headers();
    const cookie = headersList.get('cookie') || '';
    const { data: quotaData } = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/token-quota/my-quota`, {
        headers: { cookie }
    }).then(res => res.json());

    // 2. Access Keys Count
    const keys = await listApiKeysForUser(user.id);
    const activeKeysCount = keys.filter(k => k.is_active).length;

    // 3. Saved Models Count
    const { count: modelsCount } = await supabase
      .from("user_keys")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null);

    return Response.json({
      quota: quotaData,
      activeKeysCount,
      modelsCount: modelsCount || 0
    });
  } catch (err) {
    return Response.json({ error: "Failed to load dashboard stats" }, { status: 500 });
  }
}
