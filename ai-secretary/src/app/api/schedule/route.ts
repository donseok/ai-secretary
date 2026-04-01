import { getScheduleForDate, getTodayStr } from "@/lib/data";
import { fetchCalendarEvents } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || getTodayStr();

  // Try Google Calendar API first
  try {
    const gcalData = await fetchCalendarEvents(dateStr);
    if (gcalData) {
      return Response.json({ date: dateStr, source: "google", ...gcalData });
    }
  } catch (e) {
    console.error("Google Calendar API error:", e);
  }

  // Fallback to hardcoded data
  const schedule = getScheduleForDate(dateStr);
  return Response.json({ date: dateStr, source: "local", ...schedule });
}
