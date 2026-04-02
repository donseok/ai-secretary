export interface ScheduleEvent {
  time: string;
  end: string;
  title: string;
  duration: string;
}

export interface AllDayEvent {
  title: string;
  icon: string;
}

export interface DaySchedule {
  timed: ScheduleEvent[];
  allDay: AllDayEvent[];
}

// Real Google Calendar data (April 1-7, 2026)
const calendarData: Record<string, DaySchedule> = {
  "2026-04-01": {
    allDay: [
      { title: "선택약정 확인 (SKT)", icon: "📱" },
      { title: "CMC 내방", icon: "🏢" },
      { title: "지환이 용돈 50만원", icon: "💰" },
      { title: "KT 요금제 변경", icon: "📞" },
    ],
    timed: [
      { time: "08:00", end: "09:00", title: "포항 출장 전표", duration: "1시간" },
      { time: "09:00", end: "10:00", title: "컴퓨터 셋팅", duration: "1시간" },
      { time: "10:00", end: "11:00", title: "방세", duration: "1시간" },
      { time: "11:30", end: "12:30", title: "검사증명서 프로그램 분석", duration: "1시간" },
      { time: "13:00", end: "14:00", title: "품질보증서 프로그램 분석", duration: "1시간" },
      { time: "14:30", end: "15:30", title: "주간업무 작성", duration: "1시간" },
      { time: "16:00", end: "17:00", title: "나만의 비서 만들기", duration: "1시간" },
    ],
  },
  "2026-04-02": {
    allDay: [
      { title: "AI비서 작업계속", icon: "🤖" },
      { title: "관리비 지환이한테 확인", icon: "🏠" },
      { title: "MES분석", icon: "📊" },
    ],
    timed: [
      { time: "08:00", end: "09:00", title: "실장님, 근배팀장님 연락", duration: "1시간" },
      { time: "09:00", end: "10:00", title: "정순표 연락", duration: "1시간" },
      { time: "10:00", end: "11:00", title: "시스템 소개 스케줄 작성", duration: "1시간" },
      { time: "11:00", end: "12:00", title: "팀회의", duration: "1시간" },
      { time: "12:00", end: "13:00", title: "점심식사", duration: "1시간" },
      { time: "16:00", end: "17:00", title: "FMES 회의", duration: "1시간" },
    ],
  },
  "2026-04-03": {
    allDay: [
      { title: "지환이 방세, 공과금 확인", icon: "💳" },
      { title: "CMC 내방", icon: "🏢" },
    ],
    timed: [],
  },
  "2026-04-04": {
    allDay: [
      { title: "라운딩", icon: "⛳" },
    ],
    timed: [],
  },
};

export function getScheduleForDate(dateStr: string): DaySchedule {
  return calendarData[dateStr] || { timed: [], allDay: [] };
}

// Today's data shortcuts (for backward compat)
export const scheduleEvents = calendarData["2026-04-01"].timed;
export const allDayEvents = calendarData["2026-04-01"].allDay;

export const emails = [
  {
    type: "important" as const,
    emoji: "🚨",
    sender: "Supabase",
    subject: "Security vulnerabilities detected in your projects",
    snippet: "프로젝트에서 보안 취약점이 감지되었습니다. 확인이 필요합니다.",
    time: "3/31 21:22",
    priority: "high" as const,
    priorityLabel: "중요",
  },
  {
    type: "security" as const,
    emoji: "🔒",
    sender: "Google 보안팀",
    subject: "보안 알림 - Claude for Gmail 액세스 허용",
    snippet: "일부 Google 계정 데이터에 대한 액세스를 허용하셨습니다",
    time: "3/31 12:46",
    priority: "medium" as const,
    priorityLabel: "보안",
  },
  {
    type: "tech" as const,
    emoji: "🚀",
    sender: "Dan at Vercel",
    subject: "Building agents with the right stack",
    snippet: "Reducing the setup tax on agents - 에이전트 구축 가이드",
    time: "3/30 21:50",
    priority: null,
    priorityLabel: null,
  },
  {
    type: "security" as const,
    emoji: "🔒",
    sender: "Google 보안팀",
    subject: "보안 알림 - 새 패스키 추가됨",
    snippet: "계정에 새 패스키가 추가되었습니다. 본인이 아니라면 확인하세요.",
    time: "3/30 09:28",
    priority: "medium" as const,
    priorityLabel: "보안",
  },
];

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 9) return "좋은 아침입니다, 팀장님!";
  if (hour < 12) return "안녕하세요, 팀장님!";
  if (hour < 14) return "점심 식사는 하셨나요, 팀장님?";
  if (hour < 18) return "오후도 힘내세요, 팀장님!";
  return "오늘 하루도 수고 많으셨습니다, 팀장님!";
}

export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 ${days[kst.getUTCDay()]}요일`;
}

export function getTodayStr(): string {
  const n = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getCurrentScheduleContext(): string {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const today = getScheduleForDate(getTodayStr());

  let current = "";
  let next = "";
  let remaining = 0;

  for (const evt of today.timed) {
    const [sh, sm] = evt.time.split(":").map(Number);
    const [eh, em] = evt.end.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (currentMin >= start && currentMin < end) current = evt.title;
    if (currentMin < start && !next) next = `${evt.time} ${evt.title}`;
    if (currentMin < end) remaining++;
  }

  return `현재시각: ${now.getHours()}시 ${now.getMinutes()}분
오늘 시간 일정 (${today.timed.length}개): ${today.timed.map(e => `${e.time} ${e.title}`).join(", ")}
종일 일정 (${today.allDay.length}개): ${today.allDay.map(e => e.title).join(", ")}
${current ? `현재 진행중: ${current}` : "현재 진행중인 일정 없음"}
${next ? `다음 일정: ${next}` : "남은 일정 없음"}
남은 일정: ${remaining}개

주요 이메일:
${emails.map(e => `- [${e.priorityLabel || "일반"}] ${e.sender}: ${e.subject}`).join("\n")}
`;
}
