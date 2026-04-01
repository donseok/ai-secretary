import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { emails, getTodayStr } from "@/lib/data";
import { fetchCalendarEvents } from "@/lib/google-calendar";
import type { ScheduleEvent, AllDayEvent } from "@/lib/data";

const SYSTEM_PROMPT = `당신은 "김하은"이라는 이름의 AI 비서입니다.
당신의 역할은 팀장님의 일정과 이메일을 관리하고 브리핑해주는 것입니다.

## 성격과 말투
- 밝고 친절하며 프로페셔널한 여성 비서
- 존댓말을 사용하되 딱딱하지 않고 따뜻한 톤
- "팀장님"이라고 호칭
- 간결하고 핵심적인 답변 (너무 길지 않게)
- 적절한 이모지 사용 (과하지 않게)

## 현재 팀장님의 일정 및 이메일 정보
{CONTEXT}

## 응답 규칙
- 일정 관련 질문: 시간표 형태로 깔끔하게 정리
- 이메일 관련 질문: 중요도 순으로 정리
- 빈 시간 질문: 여유 시간대를 구체적으로 안내
- 일반 대화: 짧고 친절하게 응답
- 모르는 질문: 솔직하게 모른다고 하되, 도울 수 있는 다른 방법 제안`;

async function getLiveScheduleContext(): Promise<{
  context: string;
  timed: ScheduleEvent[];
  allDay: AllDayEvent[];
}> {
  const todayStr = getTodayStr();
  let timed: ScheduleEvent[] = [];
  let allDay: AllDayEvent[] = [];

  try {
    const gcal = await fetchCalendarEvents(todayStr);
    if (gcal) {
      timed = gcal.timed;
      allDay = gcal.allDay;
    }
  } catch {
    // fallback: import from data
    const { getScheduleForDate } = await import("@/lib/data");
    const data = getScheduleForDate(todayStr);
    timed = data.timed;
    allDay = data.allDay;
  }

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  let current = "";
  let next = "";
  let remaining = 0;

  for (const evt of timed) {
    const [sh, sm] = evt.time.split(":").map(Number);
    const [eh, em] = evt.end.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (currentMin >= start && currentMin < end) current = evt.title;
    if (currentMin < start && !next) next = `${evt.time} ${evt.title}`;
    if (currentMin < end) remaining++;
  }

  const context = `현재시각: ${now.getHours()}시 ${now.getMinutes()}분
오늘 시간 일정 (${timed.length}개): ${timed.map(e => `${e.time} ${e.title}`).join(", ")}
종일 일정 (${allDay.length}개): ${allDay.map(e => e.title).join(", ")}
${current ? `현재 진행중: ${current}` : "현재 진행중인 일정 없음"}
${next ? `다음 일정: ${next}` : "남은 일정 없음"}
남은 일정: ${remaining}개

주요 이메일:
${emails.map(e => `- [${e.priorityLabel || "일반"}] ${e.sender}: ${e.subject}`).join("\n")}
`;

  return { context, timed, allDay };
}

function getRuleBasedReply(
  query: string,
  timed: ScheduleEvent[],
  allDay: AllDayEvent[]
): string {
  const q = query.toLowerCase();
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  if (q.includes("일정") || q.includes("스케줄") || q.includes("오늘")) {
    const remaining = timed.filter((e) => {
      const [h, m] = e.end.split(":").map(Number);
      return currentMin < h * 60 + m;
    });
    let r = `팀장님, 오늘 시간 일정은 총 ${timed.length}개입니다.\n\n`;
    timed.forEach((e) => {
      const [sh, sm] = e.time.split(":").map(Number);
      const [eh, em] = e.end.split(":").map(Number);
      const isPast = currentMin >= eh * 60 + em;
      const isCurrent = currentMin >= sh * 60 + sm && currentMin < eh * 60 + em;
      r += `${isCurrent ? "👉 " : isPast ? "✅ " : "⏳ "}${e.time}-${e.end} ${e.title}\n`;
    });
    if (allDay.length > 0) r += `\n종일: ${allDay.map((e) => `${e.icon} ${e.title}`).join(", ")}`;
    r += `\n\n남은 일정 ${remaining.length}개입니다.`;
    return r;
  }
  if (q.includes("다음") || q.includes("next")) {
    const next = timed.find((e) => {
      const [h, m] = e.time.split(":").map(Number);
      return currentMin < h * 60 + m;
    });
    if (next) {
      const [h, m] = next.time.split(":").map(Number);
      return `다음 일정은 ${next.time}에 ${next.title}입니다. 약 ${h * 60 + m - currentMin}분 후 시작됩니다.`;
    }
    return "오늘 남은 일정이 없습니다. 수고하셨습니다! 🎉";
  }
  if (q.includes("빈 시간") || q.includes("여유") || q.includes("비어")) {
    const gaps: string[] = [];
    for (let i = 0; i < timed.length - 1; i++) {
      const [eh, em] = timed[i].end.split(":").map(Number);
      const [sh, sm] = timed[i + 1].time.split(":").map(Number);
      if (sh * 60 + sm - (eh * 60 + em) >= 30)
        gaps.push(`⏰ ${timed[i].end} ~ ${timed[i + 1].time} (${sh * 60 + sm - (eh * 60 + em)}분)`);
    }
    if (timed.length > 0) gaps.push(`⏰ ${timed[timed.length - 1].end} 이후 퇴근까지`);
    return `팀장님, 오늘 빈 시간입니다:\n\n${gaps.join("\n")}`;
  }
  if (q.includes("이메일") || q.includes("메일")) {
    let r = `읽지 않은 주요 이메일 ${emails.length}건입니다:\n\n`;
    emails.forEach((e) => {
      r += `${e.priority === "high" ? "🔴" : e.priority === "medium" ? "🟡" : "⚪"} ${e.sender}: ${e.subject}\n`;
    });
    return r;
  }
  if (q.includes("지금") || q.includes("현재")) {
    const cur = timed.find((e) => {
      const [sh, sm] = e.time.split(":").map(Number);
      const [eh, em] = e.end.split(":").map(Number);
      return currentMin >= sh * 60 + sm && currentMin < eh * 60 + em;
    });
    return cur ? `지금은 ${cur.title} 시간입니다. (${cur.time}-${cur.end})` : "현재 진행 중인 일정이 없습니다.";
  }
  if (q.includes("안녕") || q.includes("하이")) return "안녕하세요, 팀장님! 김하은 비서입니다. 😊\n무엇을 도와드릴까요?";

  return `팀장님, 이렇게 물어보시면 도와드릴 수 있어요:\n\n📅 오늘 일정 알려줘\n⏭️ 다음 일정은?\n⏰ 빈 시간 있어?\n📧 이메일 확인해줘\n🕐 지금 뭐해?\n\n💡 Gemini API 키를 .env.local에 설정하시면 자유로운 AI 대화가 가능합니다!`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { context, timed, allDay } = await getLiveScheduleContext();

  // AI mode with Gemini
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const messages = body.messages || [{ role: "user", content: body.message }];
    const systemPrompt = SYSTEM_PROMPT.replace("{CONTEXT}", context);

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  }

  // Fallback: rule-based
  const userMessage = body.messages?.at(-1)?.content || body.message || "";
  const reply = getRuleBasedReply(userMessage, timed, allDay);
  return Response.json({ reply });
}
