import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type ApiKeyRow = {
  id: string;
  user_id: string;
  key_prefix: string;
  key_hash: string;
  allowed_models: string[];
  is_active: boolean;
  expires_at: string | null;
};

export type ValidatedApiKey = {
  id: string;
  userId: string;
  allowedModels: string[];
};

type ServiceEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  signingSalt: string;
};

function getServiceEnv(): ServiceEnv {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signingSalt = process.env.API_KEY_SIGNING_SALT;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey || serviceRoleKey === "your_service_role_key_here") {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  if (!signingSalt || signingSalt === "long_random_secret_here") {
    throw new Error("Missing API_KEY_SIGNING_SALT environment variable.");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    signingSalt,
  };
}

export function createServiceRoleClient() {
  const env = getServiceEnv();
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function hashApiKeySecret(secret: string): string {
  const env = getServiceEnv();
  return createHash("sha256").update(`${secret}:${env.signingSalt}`).digest("hex");
}

function generateRawApiKey() {
  const prefix = randomBytes(6).toString("hex");
  const secret = randomBytes(24).toString("hex");
  const fullKey = `mha_live_${prefix}_${secret}`;

  return {
    prefix,
    secret,
    fullKey,
  };
}

function parseRawApiKey(raw: string) {
  if (!raw.startsWith("mha_live_")) {
    return null;
  }

  const parts = raw.split("_");

  if (parts.length !== 4 || parts[0] !== "mha" || parts[1] !== "live") {
    return null;
  }

  const prefix = parts[2];
  const secret = parts[3];

  if (!prefix || !secret) {
    return null;
  }

  return {
    prefix,
    secret,
  };
}

export function bearerTokenFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function createApiKeyRecord(params: {
  userId: string;
  allowedModels: string[];
  expiresAt?: string | null;
}) {
  const supabase = createServiceRoleClient();
  const key = generateRawApiKey();
  const keyHash = hashApiKeySecret(key.secret);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: params.userId,
      key_prefix: key.prefix,
      key_hash: keyHash,
      allowed_models: params.allowedModels,
      expires_at: params.expiresAt ?? null,
    })
    .select("id, allowed_models, created_at, expires_at")
    .single();

  if (error) {
    throw new Error(`Unable to create API key: ${error.message}`);
  }

  return {
    plainKey: key.fullKey,
    ...data,
  };
}

export async function listApiKeysForUser(userId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, allowed_models, is_active, created_at, expires_at, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to list API keys: ${error.message}`);
  }

  return data ?? [];
}

export async function revokeApiKeyForUser(userId: string, keyId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to revoke API key: ${error.message}`);
  }
}

export async function deleteApiKeyForUser(userId: string, keyId: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to delete API key: ${error.message}`);
  }
}

export async function validateApiKey(rawKey: string): Promise<ValidatedApiKey | null> {
  const parsed = parseRawApiKey(rawKey);

  if (!parsed) {
    return null;
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, key_prefix, key_hash, allowed_models, is_active, expires_at")
    .eq("key_prefix", parsed.prefix)
    .maybeSingle<ApiKeyRow>();

  if (error || !data) {
    return null;
  }

  const incomingHash = hashApiKeySecret(parsed.secret);

  if (incomingHash !== data.key_hash || !data.is_active) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    allowedModels: data.allowed_models || [],
  };
}

export async function touchApiKeyLastUsed(apiKeyId: string) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyId);
}

export async function logApiKeyUsage(params: { apiKeyId: string; model: string; statusCode: number }) {
  const supabase = createServiceRoleClient();
  await supabase.from("api_key_usage").insert({
    api_key_id: params.apiKeyId,
    model: params.model,
    status_code: params.statusCode,
  });
}
