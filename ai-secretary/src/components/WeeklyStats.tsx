"use client";

import { useState, useEffect } from "react";
import { getTodoStats } from "./TodoList";
import { getPomodoroStats } from "./PomodoroTimer";

interface DayStats {
  label: string;
  count: number;
}

export default function WeeklyStats() {
  const [todoStats, setTodoStats] = useState({ total: 0, done: 0 });
  const [pomodoroStats, setPomodoroStats] = useState({ cycles: 0, totalFocusMin: 0, dailyFocus: {} as Record<string, number> });
  const [weeklySchedule, setWeeklySchedule] = useState<DayStats[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTodoStats(getTodoStats());
    setPomodoroStats(getPomodoroStats());

    // Build weekly schedule data from API
    const today = new Date();
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const promises = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return fetch(`/api/schedule?date=${dateStr}`)
        .then(r => r.json())
        .then(data => ({ label: dayNames[i], count: (data.timed?.length || 0) + (data.allDay?.length || 0) }))
        .catch(() => ({ label: dayNames[i], count: 0 }));
    });

    Promise.all(promises).then(setWeeklySchedule);

    // Refresh stats periodically
    const interval = setInterval(() => {
      setTodoStats(getTodoStats());
      setPomodoroStats(getPomodoroStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const todoRate = todoStats.total > 0 ? Math.round((todoStats.done / todoStats.total) * 100) : 0;
  const totalWeekEvents = weeklySchedule.reduce((sum, d) => sum + d.count, 0);
  const maxDayCount = Math.max(...weeklySchedule.map(d => d.count), 1);
  const focusHours = Math.floor(pomodoroStats.totalFocusMin / 60);
  const focusMins = pomodoroStats.totalFocusMin % 60;

  // Summary message
  let summary = "";
  if (todoRate >= 80) summary = `할 일 완료율 ${todoRate}% 🎉 훌륭합니다!`;
  else if (todoRate >= 50) summary = `할 일 완료율 ${todoRate}% 👍 잘하고 있어요!`;
  else if (todoStats.total > 0) summary = `할 일 완료율 ${todoRate}% 💪 조금만 더 힘내세요!`;
  else summary = "할 일을 추가하고 업무를 시작해보세요! 📝";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--accent-soft)" }}>📊</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>주간 업무 통계</span>
        </div>
        <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-3)" }}>이번 주</span>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* Total events */}
          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: 14, background: "var(--surface-2)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "-1px" }}>{totalWeekEvents}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>전체 일정</div>
          </div>
          {/* Todo rate */}
          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: 14, background: "var(--surface-2)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)", letterSpacing: "-1px" }}>{todoRate}%</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>할 일 완료율</div>
          </div>
          {/* Focus time */}
          <div style={{ textAlign: "center", padding: "16px 8px", borderRadius: 14, background: "var(--surface-2)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--orange)", letterSpacing: "-1px" }}>
              {focusHours > 0 ? `${focusHours}h` : `${focusMins}m`}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 4 }}>집중 시간</div>
          </div>
        </div>

        {/* Todo progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>할 일 진행률</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{todoStats.done}/{todoStats.total}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--surface-3)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: "var(--green)", width: `${todoRate}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* Bar chart - daily events */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>요일별 일정</div>
          <div style={{ display: "flex", alignItems: "end", gap: 8, height: 80 }}>
            {weeklySchedule.map((day, i) => {
              const height = day.count > 0 ? Math.max((day.count / maxDayCount) * 100, 15) : 8;
              const isToday = new Date().getDay() === i;
              return (
                <div key={day.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{day.count}</span>
                  <div style={{ width: "100%", height: `${height}%`, borderRadius: 6, background: isToday ? "var(--accent)" : "var(--accent-soft)", transition: "height 0.5s ease", minHeight: 4 }} />
                  <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--accent)" : "var(--text-muted)" }}>{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--surface-2)", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>
          {summary}
        </div>
      </div>
    </div>
  );
}
