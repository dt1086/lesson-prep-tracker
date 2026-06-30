import { google } from "googleapis";
import { getAuthorizedClient } from "@/lib/googleAuth";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
}

export async function listUpcomingEvents(days = 3): Promise<CalendarEvent[]> {
  const client = await getAuthorizedClient();
  if (!client) return [];

  const calendar = google.calendar({ version: "v3", auth: client });
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (res.data.items ?? [])
    .filter((e) => e.id && e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      id: e.id!,
      summary: e.summary ?? "(No title)",
      start: e.start!.dateTime!,
      end: e.end!.dateTime!,
    }));
}
