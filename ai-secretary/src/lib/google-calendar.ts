import { google } from "googleapis";
import type { ScheduleEvent, AllDayEvent } from "./data";

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export async function fetchCalendarEvents(dateStr: string): Promise<{
  timed: ScheduleEvent[];
  allDay: AllDayEvent[];
} | null> {
  const auth = getAuth();
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });
  const timeMin = `${dateStr}T00:00:00+09:00`;
  const timeMax = `${dateStr}T23:59:59+09:00`;

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    timeZone: "Asia/Seoul",
  });

  const events = res.data.items || [];
  const timed: ScheduleEvent[] = [];
  const allDay: AllDayEvent[] = [];

  for (const evt of events) {
    if (evt.start?.date) {
      // All-day event
      allDay.push({
        title: evt.summary || "(제목 없음)",
        icon: pickIcon(evt.summary || ""),
      });
    } else if (evt.start?.dateTime) {
      const start = new Date(evt.start.dateTime);
      const end = new Date(evt.end?.dateTime || evt.start.dateTime);
      const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
      const durStr = diffMin >= 60 ? `${Math.floor(diffMin / 60)}시간${diffMin % 60 ? ` ${diffMin % 60}분` : ""}` : `${diffMin}분`;

      timed.push({
        time: pad(start.getHours()) + ":" + pad(start.getMinutes()),
        end: pad(end.getHours()) + ":" + pad(end.getMinutes()),
        title: evt.summary || "(제목 없음)",
        duration: durStr,
      });
    }
  }

  return { timed, allDay };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function pickIcon(title: string): string {
  const map: [RegExp, string][] = [
    [/회의|미팅/, "🤝"],
    [/점심|식사|밥/, "🍽️"],
    [/출장/, "🚄"],
    [/전화|연락|통화/, "📞"],
    [/메일|이메일/, "📧"],
    [/보고|보고서/, "📝"],
    [/분석/, "📊"],
    [/AI|비서|작업/, "🤖"],
    [/관리비|방세|공과금/, "🏠"],
    [/라운딩|골프/, "⛳"],
    [/CMC|내방|방문/, "🏢"],
    [/용돈|돈|결제/, "💰"],
    [/요금|SKT|KT|LG/, "📱"],
    [/MES|시스템/, "💻"],
  ];
  for (const [re, icon] of map) {
    if (re.test(title)) return icon;
  }
  return "📌";
}
