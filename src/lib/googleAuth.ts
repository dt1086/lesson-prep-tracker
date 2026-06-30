import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabaseAdmin";

const REDIRECT_URI = `${process.env.APP_BASE_URL}/api/auth/google/callback`;

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
}

export async function saveRefreshToken(refreshToken: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("google_tokens")
    .upsert({ id: true, refresh_token: refreshToken, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getStoredRefreshToken(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("google_tokens")
    .select("refresh_token")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return data?.refresh_token ?? null;
}

export async function getAuthorizedClient() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}
