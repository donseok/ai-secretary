"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getTimeGreeting, getTodayStr, addDays, formatDateKR } from "@/lib/data";
import type { ScheduleEvent, AllDayEvent } from "@/lib/data";

interface EmailItem {
  id?: string;
  type: "important" | "security" | "tech" | "general";
  emoji: string;
  sender: string;
  subject: string;
  snippet: string;
  time: string;
  priority: "high" | "medium" | null;
  priorityLabel: string | null;
}

interface ChatMessage { role: "user" | "assistant"; content: string; }
interface Weather { temp: number | null; tempMax?: number; tempMin?: number; humidity?: number; wind?: number; description: string; icon: string; city: string; }

export default function Secretary() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [time, setTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [daySchedule, setDaySchedule] = useState<ScheduleEvent[]>([]);
  const [dayAllDay, setDayAllDay] = useState<AllDayEvent[]>([]);
  const isToday = selectedDate === getTodayStr();
  const isPast = selectedDate < getTodayStr();
  const [date, setDate] = useState("");
  const [briefing, setBriefing] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function tick() {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}:${String(n.getSeconds()).padStart(2, "0")}`);
      const d = ["일", "월", "화", "수", "목", "금", "토"];
      setDate(`${n.getFullYear()}년 ${n.getMonth() + 1}월 ${n.getDate()}일 ${d[n.getDay()]}요일`);
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  useEffect(() => { localStorage.removeItem("theme"); }, []);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("theme", theme); }, [theme]);
  useEffect(() => { fetch("/api/weather").then(r => r.json()).then(setWeather).catch(() => {}); }, []);
  useEffect(() => {
    fetch("/api/emails").then(r => r.json()).then(d => {
      setEmails(d.emails || []);
      setUnreadCount(d.unreadCount || 0);
    }).catch(() => {});
  }, []);

  // Fetch schedule from API
  const fetchSchedule = useCallback(async (dateStr: string) => {
    try {
      const res = await fetch(`/api/schedule?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDaySchedule(data.timed || []);
        setDayAllDay(data.allDay || []);
      }
    } catch {
      setDaySchedule([]);
      setDayAllDay([]);
    }
  }, []);

  useEffect(() => { fetchSchedule(selectedDate); }, [selectedDate, fetchSchedule]);

  // Date navigation
  function changeDate(offset: number) {
    const next = addDays(selectedDate, offset);
    if (next < getTodayStr()) return;
    setSelectedDate(next);
  }

  function goToDate(dateStr: string) {
    if (dateStr < getTodayStr()) return;
    setSelectedDate(dateStr);
  }

  // Briefing uses today's schedule from state (when viewing today)
  const [todaySchedule, setTodaySchedule] = useState<ScheduleEvent[]>([]);
  const [todayAllDay, setTodayAllDay] = useState<AllDayEvent[]>([]);

  // Fetch today's schedule once for briefing
  useEffect(() => {
    fetch(`/api/schedule?date=${getTodayStr()}`)
      .then(r => r.json())
      .then(d => { setTodaySchedule(d.timed || []); setTodayAllDay(d.allDay || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function gen() {
      setGreeting(getTimeGreeting());
      const n = new Date(), cm = n.getHours() * 60 + n.getMinutes();
      let cur = null, nxt = null;
      for (const e of todaySchedule) {
        const [sh, sm] = e.time.split(":").map(Number), [eh, em] = e.end.split(":").map(Number);
        if (cm >= sh * 60 + sm && cm < eh * 60 + em) cur = e;
        if (cm < sh * 60 + sm && !nxt) nxt = e;
      }
      const rem = todaySchedule.filter(e => { const [eh, em] = e.end.split(":").map(Number); return cm < eh * 60 + em; }).length;
      let t = "";
      if (cur) { t += `지금은 <strong>${cur.title}</strong> 시간입니다. `; if (nxt) t += `다음은 <strong>${nxt.time}</strong>에 <strong>${nxt.title}</strong>이 예정되어 있어요. `; }
      else if (nxt) { const [sh, sm] = nxt.time.split(":").map(Number), diff = sh * 60 + sm - cm; t += diff <= 30 ? `<strong>${diff}분 후</strong> <strong>${nxt.title}</strong>이 시작됩니다!` : `다음 일정은 <strong>${nxt.time}</strong>에 <strong>${nxt.title}</strong>입니다. `; }
      else t += "오늘 남은 일정이 모두 완료되었습니다! 🎉 ";
      t += `<br/>오늘 <strong>${todaySchedule.length}개</strong> 시간 일정 중 <strong>${rem}개</strong> 남음, 종일 할 일 <strong>${todayAllDay.length}건</strong>.`;
      const importantEmails = emails.filter(e => e.priority === "high");
      const securityEmails = emails.filter(e => e.type === "security");
      if (importantEmails.length > 0) t += ` 📧 <strong>${importantEmails[0].sender} ${importantEmails[0].subject.slice(0, 20)}</strong> 확인 필요`;
      if (securityEmails.length > 0) t += `, Google 보안 <strong>${securityEmails.length}건</strong>.`;
      else t += ".";
      setBriefing(t);
    }
    gen(); const id = setInterval(gen, 300000); return () => clearInterval(id);
  }, [todaySchedule, todayAllDay]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);

  function toggleVoice() {
    const sy = window.speechSynthesis;
    if (isSpeaking) { sy.cancel(); setIsSpeaking(false); return; }
    const t = document.getElementById("speechText")?.textContent || "";
    const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1.15;
    const v = sy.getVoices(), ko = v.find(v => v.lang.startsWith("ko") && (v.name.includes("Yuna") || v.name.includes("SunHi"))) || v.find(v => v.lang.startsWith("ko"));
    if (ko) u.voice = ko;
    u.onstart = () => setIsSpeaking(true); u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false);
    sy.speak(u);
  }

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim(); setChatInput("");
    const msgs: ChatMessage[] = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(msgs); setChatLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgs.map(m => ({ role: m.role, content: m.content })), message: msg }) });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) { const d = await res.json(); setChatMessages(p => [...p, { role: "assistant", content: d.reply }]); }
      else {
        const reader = res.body?.getReader(); const dec = new TextDecoder(); let a = "";
        setChatMessages(p => [...p, { role: "assistant", content: "" }]);
        if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; for (const l of dec.decode(value, { stream: true }).split("\n")) { if (l.startsWith("0:")) { try { const x = JSON.parse(l.slice(2)); if (typeof x === "string") { a += x; setChatMessages(p => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: a }; return u; }); } } catch {} } } } }
      }
    } catch { setChatMessages(p => [...p, { role: "assistant", content: "죄송합니다, 오류가 발생했습니다." }]); }
    setChatLoading(false);
  }, [chatInput, chatLoading, chatMessages]);

  function getStatus(evt: ScheduleEvent) {
    const cm = new Date().getHours() * 60 + new Date().getMinutes();
    const [sh, sm] = evt.time.split(":").map(Number), [eh, em] = evt.end.split(":").map(Number);
    if (cm >= sh * 60 + sm && cm < eh * 60 + em) return "current";
    if (cm >= eh * 60 + em) return "past";
    return "future";
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ═══════ HEADER ═══════ */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "linear-gradient(135deg, var(--accent), #a78bfa)" }}>📋</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>AI Secretary</div>
              <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Personal Briefing</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[
              { click: () => setChatOpen(!chatOpen), active: chatOpen, icon: "💬", label: "대화하기" },
              { click: toggleVoice, active: isSpeaking, icon: isSpeaking ? "⏹" : "🔊", label: isSpeaking ? "중지" : "음성" },
            ].map(b => (
              <button key={b.label} onClick={b.click} style={{ height: 36, padding: "0 16px", borderRadius: 10, border: `1px solid ${b.active ? "var(--accent)" : "var(--border)"}`, background: b.active ? "var(--accent-soft)" : "var(--surface-2)", color: b.active ? "var(--accent)" : "var(--text-secondary)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                {b.icon} <span className="hidden sm:inline">{b.label}</span>
              </button>
            ))}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ width: 50, height: 28, borderRadius: 14, border: `1px solid var(--border)`, background: "var(--surface-3)", position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", left: theme === "dark" ? 3 : 25, transition: "all 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: theme === "light" ? 1 : 0, transition: "opacity 0.3s" }}>☀️</span>
              <span style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", fontSize: 11, opacity: theme === "dark" ? 1 : 0, transition: "opacity 0.3s" }}>🌙</span>
            </button>
            <div className="hidden md:block" style={{ textAlign: "right", marginLeft: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 300, letterSpacing: 2, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{time}</div>
              <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: "var(--text-muted)" }}>{date}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ CONTENT ═══════ */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 20px" }}>

        {/* ─── HERO ─── */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "var(--shadow)", overflow: "hidden", marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 240px", minHeight: 280 }} className="hero-grid">
            {/* Avatar */}
            <div style={{ position: "relative", overflow: "hidden" }}>
              <Image src="/secretary.png" alt="AI Secretary" fill style={{ objectFit: "cover", objectPosition: "top center" }} priority />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, var(--surface))" }} />
              <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 8, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, backdropFilter: "blur(12px)", background: "var(--status-bg)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s ease-in-out infinite" }} />
                온라인
              </div>
            </div>

            {/* Briefing */}
            <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>김하은 비서</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700, background: "var(--accent-soft)", color: "var(--accent)" }}>AI</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--accent)", marginTop: 8, marginBottom: 16 }}>{greeting}</div>
              <div id="speechText" style={{ fontSize: 14, lineHeight: 2, color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: briefing }} />
            </div>

            {/* Weather */}
            <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {weather ? (<>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 36, animation: "float 3s ease-in-out infinite" }}>{weather.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{weather.city} 날씨</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{weather.description}</div>
                  </div>
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginBottom: 20 }}>
                  {weather.temp !== null ? `${weather.temp}°` : "--"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>최고/최저</span>
                    <span style={{ fontWeight: 700 }}><span style={{ color: "var(--red)" }}>{weather.tempMax}°</span> / <span style={{ color: "var(--accent)" }}>{weather.tempMin}°</span></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>습도</span>
                    <span style={{ fontWeight: 700 }}>{weather.humidity}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>바람</span>
                    <span style={{ fontWeight: 700 }}>{weather.wind} km/h</span>
                  </div>
                </div>
              </>) : (
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>날씨 로딩 중...</div>
              )}
            </div>
          </div>
        </section>

        {/* ─── SUMMARY CARDS ─── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }} className="summary-grid">
          {[
            { icon: "📅", label: "시간 일정", value: daySchedule.length, unit: "건", color: "var(--accent)", bg: "var(--accent-soft)" },
            { icon: "📌", label: "종일 할 일", value: dayAllDay.length, unit: "건", color: "var(--green)", bg: "var(--green-soft)" },
            { icon: "📧", label: "안 읽은 메일", value: unreadCount, unit: "통", color: "var(--orange)", bg: "var(--orange-soft)" },
            { icon: "🚨", label: "중요 알림", value: emails.filter(e => e.priority === "high" || e.priority === "medium").length, unit: "건", color: "var(--red)", bg: "var(--red-soft)" },
          ].map(c => (
            <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px", boxShadow: "var(--shadow)", transition: "transform 0.2s", cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: c.bg, marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1, color: c.color }}>{c.value}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>{c.unit}</span>
              </div>
            </div>
          ))}
        </section>

        {/* ─── SCHEDULE + EMAILS (2 columns) ─── */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }} className="content-grid">
          {/* Schedule */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
            {/* Header with date nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--accent-soft)" }}>📅</span>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>{isToday ? "오늘의 일정" : "일정 조회"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => changeDate(-1)} disabled={isPast || selectedDate <= getTodayStr()} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: selectedDate <= getTodayStr() ? "not-allowed" : "pointer", opacity: selectedDate <= getTodayStr() ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontFamily: "inherit", color: "var(--text-secondary)", transition: "all 0.2s" }}>◀</button>
                <button onClick={() => goToDate(getTodayStr())} style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid var(--border)", background: isToday ? "var(--accent-soft)" : "var(--surface-2)", color: isToday ? "var(--accent)" : "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                  {isToday ? "📍 오늘" : formatDateKR(selectedDate)}
                </button>
                <button onClick={() => changeDate(1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontFamily: "inherit", color: "var(--text-secondary)", transition: "all 0.2s" }}>▶</button>
              </div>
            </div>

            {/* Date chips - quick nav */}
            <div style={{ display: "flex", gap: 6, padding: "12px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", overflowX: "auto" }}>
              {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                const d = addDays(getTodayStr(), offset);
                const isSelected = d === selectedDate;
                const dayDate = new Date(d + "T00:00:00+09:00");
                const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                const label = offset === 0 ? "오늘" : offset === 1 ? "내일" : `${dayDate.getDate()}일(${dayNames[dayDate.getDay()]})`;
                return (
                  <button key={d} onClick={() => goToDate(d)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`, background: isSelected ? "var(--accent-soft)" : "var(--surface-3)", color: isSelected ? "var(--accent)" : "var(--text-secondary)", fontSize: 12, fontWeight: isSelected ? 800 : 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s", position: "relative" }}>
                    {label}
                  </button>
                );
              })}
            </div>

            {/* All Day */}
            {dayAllDay.length > 0 && (
              <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>종일 일정</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {dayAllDay.map(e => (
                    <span key={e.title} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-3)", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {e.icon} {e.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timed */}
            <div style={{ padding: "8px 0" }}>
              {daySchedule.length > 0 ? daySchedule.map((evt, i) => {
                const st = isToday ? getStatus(evt) : "future";
                return (
                  <div key={evt.time} style={{ display: "grid", gridTemplateColumns: "60px 20px 1fr", gap: 12, padding: "16px 28px", alignItems: "start", background: st === "current" ? "var(--accent-soft)" : "transparent", opacity: st === "past" ? 0.35 : 1, transition: "all 0.2s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", textAlign: "right", paddingTop: 1, color: st === "current" ? "var(--accent)" : "var(--text)" }}>{evt.time}</div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid", flexShrink: 0, background: st === "current" ? "var(--accent)" : "var(--surface-3)", borderColor: st === "current" ? "var(--accent)" : "var(--border-light)", boxShadow: st === "current" ? "0 0 12px rgba(123,147,255,0.5)" : "none" }} />
                      {i < daySchedule.length - 1 && <div style={{ width: 1.5, flex: 1, marginTop: 6, background: "var(--border)" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: st === "current" ? "var(--accent)" : "var(--text)" }}>{evt.title}</span>
                        {st === "current" && <span style={{ fontSize: 9, color: "white", padding: "2px 8px", borderRadius: 6, fontWeight: 800, letterSpacing: 0.5, background: "var(--accent)", animation: "pulse 2s ease-in-out infinite" }}>NOW</span>}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: "var(--text-muted)" }}>{evt.time} ~ {evt.end} · {evt.duration}</div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: "48px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{dayAllDay.length > 0 ? "📌" : "📭"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                    {dayAllDay.length > 0 ? "시간 지정 일정이 없습니다" : "등록된 일정이 없습니다"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {dayAllDay.length > 0 ? "종일 일정만 있는 날입니다" : "여유로운 하루입니다! ☕"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emails */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--orange-soft)" }}>✉️</span>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>주요 이메일</span>
              </div>
              <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-3)" }}>최근 수신</span>
            </div>
            <div>
              {emails.map((e, i) => (
                <div key={e.subject} style={{ display: "flex", alignItems: "start", gap: 16, padding: "24px 28px", borderBottom: i < emails.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, background: e.type === "important" ? "var(--red-soft)" : e.type === "security" ? "var(--orange-soft)" : "var(--accent-soft)" }}>
                    {e.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{e.sender}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4, marginBottom: 6 }}>{e.subject}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.snippet}</span>
                      {e.priority && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 800, flexShrink: 0, background: e.priority === "high" ? "var(--red-soft)" : "var(--orange-soft)", color: e.priority === "high" ? "var(--red)" : "var(--orange)" }}>
                          {e.priorityLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══════ CHAT PANEL ═══════ */}
      {chatOpen && (
        <div style={{ position: "fixed", bottom: 0, right: 0, width: "100%", maxWidth: 400, height: "min(560px, 75vh)", borderRadius: "20px 20px 0 0", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", zIndex: 200, animation: "slideUp 0.25s ease-out", overflow: "hidden" }} className="sm:bottom-6 sm:right-6 sm:rounded-2xl">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Image src="/secretary.png" alt="비서" width={36} height={36} style={{ borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--surface-2)" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>김하은 비서</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>무엇이든 물어보세요</div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer", border: "none", background: "transparent", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>안녕하세요! 김하은 비서입니다.</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>일정, 이메일, 빈 시간 등을 물어보세요</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {["오늘 일정 알려줘", "다음 일정은?", "빈 시간 있어?", "이메일 확인"].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); setTimeout(() => document.getElementById("chatForm")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })), 50); }} style={{ fontSize: 12, padding: "8px 16px", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)", background: "var(--surface-2)", fontFamily: "inherit", transition: "all 0.2s" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "slideUp 0.2s ease-out" }}>
                <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: 18, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", background: m.role === "user" ? "var(--accent)" : "var(--surface-3)", color: m.role === "user" ? "white" : "var(--text)", borderBottomRightRadius: m.role === "user" ? 6 : 18, borderBottomLeftRadius: m.role === "user" ? 18 : 6 }}>{m.content}</div>
              </div>
            ))}
            {chatLoading && <div style={{ display: "flex" }}><div style={{ padding: "12px 16px", borderRadius: 18, display: "flex", gap: 6, background: "var(--surface-3)" }}>{[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}</div></div>}
            <div ref={chatEndRef} />
          </div>

          <form id="chatForm" onSubmit={sendMessage} style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexShrink: 0 }}>
            <input ref={inputRef} type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="메시지를 입력하세요..." style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--surface-2)", color: "var(--text)", fontFamily: "inherit" }} />
            <button type="submit" disabled={chatLoading || !chatInput.trim()} style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16, fontWeight: 800, flexShrink: 0, background: "var(--accent)", border: "none", cursor: "pointer", opacity: chatLoading || !chatInput.trim() ? 0.3 : 1, transition: "all 0.2s", fontFamily: "inherit" }}>↑</button>
          </form>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "40px 0", fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
        AI Secretary v3.0 · Google Calendar · Gmail · 부산 날씨 · Built with Next.js + Claude Code
      </footer>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .content-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
