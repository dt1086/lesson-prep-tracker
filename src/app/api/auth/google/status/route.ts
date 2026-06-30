import { NextResponse } from "next/server";
import { getStoredRefreshToken } from "@/lib/googleAuth";

export async function GET() {
  const token = await getStoredRefreshToken();
  return NextResponse.json({ connected: Boolean(token) });
}
