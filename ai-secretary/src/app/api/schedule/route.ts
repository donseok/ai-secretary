import { getScheduleForDate, getTodayStr } from "@/lib/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || getTodayStr();

  // Block past dates
  const today = getTodayStr();
  if (dateStr < today) {
    return Response.json(
      { error: "과거 일정은 조회할 수 없습니다." },
      { status: 400 }
    );
  }

  const schedule = getScheduleForDate(dateStr);
  return Response.json({ date: dateStr, ...schedule });
}
