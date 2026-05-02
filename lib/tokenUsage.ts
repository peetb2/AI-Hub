import { createServiceRoleClient } from '@/lib/gateway/apiKeys';

/**
 * Track token usage for a user
 * @param userId - User ID
 * @param charactersUsed - Number of characters consumed
 * @param context - Optional context about what the characters were used for
 */
export async function trackTokenUsage(
  userId: string,
  charactersUsed: number,
  context?: string
) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('token_usage')
    .insert({
      user_id: userId,
      characters_used: charactersUsed,
      request_context: context || null,
    });

  if (error) {
    console.error('Error tracking token usage:', error);
    throw error;
  }
}

/**
 * Get user's current monthly token usage
 * @param userId - User ID
 * @returns Number of characters used this month
 */
async function getUserMonthlyUsage(userId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  // Get usage from the start of the current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from('token_usage')
    .select('characters_used', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());

  // If table doesn't exist yet, return 0
  if (error && error.message.includes('does not exist')) {
    console.warn('token_usage table not found, returning 0 usage');
    return 0;
  }

  if (error) {
    console.error('Error fetching user monthly usage:', error);
    return 0; // Return 0 instead of throwing
  }

  const total = (data || []).reduce((sum, row) => sum + row.characters_used, 0);
  return total;
}

/**
 * Get user's quota limit
 * @param userId - User ID
 * @returns Monthly character quota limit
 */
async function getUserQuota(userId: string): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('monthly_token_quota')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user quota:', error);
    return 100000;
  }

  return data?.monthly_token_quota || 100000;
}

/**
 * Check if user has quota remaining
 * @param userId - User ID
 * @returns Remaining characters or 0 if quota exceeded
 */
async function getRemainingQuota(userId: string): Promise<number> {
  const usage = await getUserMonthlyUsage(userId);
  const quota = await getUserQuota(userId);
  return Math.max(0, quota - usage);
}

/**
 * Check if user can use the requested amount of tokens
 * @param userId - User ID
 * @param charactersRequested - Number of characters needed
 * @returns true if user has enough quota
 */
export async function canUseTokens(
  userId: string,
  charactersRequested: number
): Promise<boolean> {
  const remaining = await getRemainingQuota(userId);
  return remaining >= charactersRequested;
}

/**
 * Get detailed quota info for a user
 */
export async function getQuotaInfo(userId: string) {
  const usage = await getUserMonthlyUsage(userId);
  const quota = await getUserQuota(userId);
  const remaining = Math.max(0, quota - usage);
  const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

  return {
    used: usage,
    quota,
    remaining,
    percentUsed,
  };
}
