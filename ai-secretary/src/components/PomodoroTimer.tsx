"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type TimerMode = "focus" | "break";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

const STORAGE_KEY = "ai-secretary-pomodoro";

function loadPomodoro(): { cycles: number; totalFocusMin: number; dailyFocus: Record<string, number> } {
  if (typeof window === "undefined") return { cycles: 0, totalFocusMin: 0, dailyFocus: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { cycles: 0, totalFocusMin: 0, dailyFocus: {} };
  } catch { return { cycles: 0, totalFocusMin: 0, dailyFocus: {} }; }
}

function savePomodoro(data: { cycles: number; totalFocusMin: number; dailyFocus: Record<string, number> }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPomodoroStats(): { cycles: number; totalFocusMin: number; dailyFocus: Record<string, number> } {
  return loadPomodoro();
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MIN * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "focus" ? FOCUS_MIN * 60 : BREAK_MIN * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  useEffect(() => {
    const data = loadPomodoro();
    setCycles(data.cycles);
  }, []);

  const completeSession = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (mode === "focus") {
      const data = loadPomodoro();
      const today = new Date().toISOString().slice(0, 10);
      data.cycles += 1;
      data.totalFocusMin += FOCUS_MIN;
      data.dailyFocus[today] = (data.dailyFocus[today] || 0) + FOCUS_MIN;
      savePomodoro(data);
      setCycles(data.cycles);

      // Browser notification
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🍅 집중 완료!", { body: `${FOCUS_MIN}분 집중 완료! 휴식을 시작하세요.`, icon: "/lovely.png" });
      }

      setMode("break");
      setSecondsLeft(BREAK_MIN * 60);
    } else {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("☕ 휴식 끝!", { body: "다시 집중할 시간입니다!", icon: "/lovely.png" });
      }
      setMode("focus");
      setSecondsLeft(FOCUS_MIN * 60);
    }
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, completeSession]);

  function start() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function reset() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode("focus");
    setSecondsLeft(FOCUS_MIN * 60);
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--red-soft)" }}>🍅</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>집중 타이머</span>
        </div>
        <span style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, fontWeight: 700, color: mode === "focus" ? "var(--red)" : "var(--green)", background: "var(--surface-3)" }}>
          {mode === "focus" ? "집중 중 🔥" : "휴식 중 ☕"}
        </span>
      </div>

      {/* Timer display */}
      <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Circular progress */}
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
            <circle cx="70" cy="70" r="54" fill="none" stroke={mode === "focus" ? "var(--accent)" : "var(--green)"} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 2 }}>
              {mode === "focus" ? `${FOCUS_MIN}분 집중` : `${BREAK_MIN}분 휴식`}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10 }}>
          {!running ? (
            <button onClick={start} style={{ height: 40, padding: "0 28px", borderRadius: 12, border: "none", background: "var(--accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              ▶ 시작
            </button>
          ) : (
            <button onClick={pause} style={{ height: 40, padding: "0 28px", borderRadius: 12, border: "none", background: "var(--orange)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              ⏸ 일시정지
            </button>
          )}
          <button onClick={reset} style={{ height: 40, padding: "0 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            ↺ 리셋
          </button>
        </div>

        {/* Cycle counter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
          <span>🍅</span>
          <span>완료 사이클: <strong style={{ color: "var(--text)" }}>{cycles}</strong>회</span>
        </div>
      </div>
    </div>
  );
}
