import { NextResponse } from "next/server";
import { listUpcomingEvents } from "@/lib/calendar";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const events = await listUpcomingEvents(3);
  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, name");

  const sessions = events.map((event) => {
    const matchedStudent = (students ?? []).find((s) =>
      event.summary.toLowerCase().includes(s.name.toLowerCase())
    );
    return {
      ...event,
      studentId: matchedStudent?.id ?? null,
      studentName: matchedStudent?.name ?? null,
    };
  });

  return NextResponse.json({ sessions });
}
