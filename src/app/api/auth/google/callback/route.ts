import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, saveRefreshToken } from "@/lib/googleAuth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?google_error=${encodeURIComponent(error)}`, request.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?google_error=missing_code", request.url)
    );
  }

  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      new URL("/settings?google_error=no_refresh_token", request.url)
    );
  }

  await saveRefreshToken(tokens.refresh_token);

  return NextResponse.redirect(new URL("/settings?google_connected=1", request.url));
}
