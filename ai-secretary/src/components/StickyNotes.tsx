"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "ai-secretary-notes";
const PASTEL_COLORS = ["#fef9c3", "#fce7f3", "#dbeafe", "#d1fae5", "#ede9fe"];
const DARK_PASTEL_COLORS = ["#423d1a", "#3d2030", "#1a2a3d", "#1a3d2a", "#2a1a3d"];

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function StickyNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const loaded = loadNotes();
    if (loaded.length === 0) {
      const initial: Note[] = [{ id: Date.now().toString(), text: "", createdAt: new Date().toISOString() }];
      setNotes(initial);
      saveNotes(initial);
    } else {
      setNotes(loaded);
    }
    initialized.current = true;
  }, []);

  const persistNotes = useCallback((updated: Note[]) => {
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNotes(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 1000);
  }, []);

  function updateText(text: string) {
    setNotes(prev => {
      const updated = prev.map((n, i) => i === activeIdx ? { ...n, text } : n);
      persistNotes(updated);
      return updated;
    });
  }

  function addNote() {
    setNotes(prev => {
      const updated = [...prev, { id: Date.now().toString(), text: "", createdAt: new Date().toISOString() }];
      saveNotes(updated);
      setActiveIdx(updated.length - 1);
      return updated;
    });
  }

  function removeNote(idx: number) {
    setNotes(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((_, i) => i !== idx);
      saveNotes(updated);
      if (activeIdx >= updated.length) setActiveIdx(updated.length - 1);
      else if (activeIdx > idx) setActiveIdx(activeIdx - 1);
      return updated;
    });
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${h}:${m}`;
  }

  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const colors = isDark ? DARK_PASTEL_COLORS : PASTEL_COLORS;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: colors[0] }}>📝</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>빠른 메모</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveStatus === "saving" && <span style={{ fontSize: 11, color: "var(--orange)", fontWeight: 600 }}>저장 중...</span>}
          {saveStatus === "saved" && <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 600 }}>저장됨 ✓</span>}
          <button
            onClick={addNote}
            style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}
          >
            + 새 메모
          </button>
        </div>
      </div>

      {/* Note tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {notes.map((note, i) => (
          <div
            key={note.id}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 16px", fontSize: 12, fontWeight: activeIdx === i ? 800 : 600, cursor: "pointer", borderBottom: activeIdx === i ? "2px solid var(--accent)" : "2px solid transparent", color: activeIdx === i ? "var(--accent)" : "var(--text-muted)", background: activeIdx === i ? colors[i % colors.length] + "40" : "transparent", transition: "all 0.2s", whiteSpace: "nowrap" }}
          >
            <span onClick={() => setActiveIdx(i)} style={{ cursor: "pointer" }}>
              메모 {i + 1}
            </span>
            {notes.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); removeNote(i); }}
                style={{ width: 18, height: 18, borderRadius: 4, border: "none", background: "transparent", cursor: "pointer", fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Note content */}
      {notes[activeIdx] && (
        <div style={{ background: colors[activeIdx % colors.length] + "30" }}>
          <textarea
            value={notes[activeIdx].text}
            onChange={e => updateText(e.target.value)}
            placeholder="여기에 메모를 작성하세요..."
            style={{ width: "100%", minHeight: 200, padding: "20px 28px", border: "none", outline: "none", resize: "vertical", fontSize: 14, lineHeight: 1.8, fontFamily: "inherit", background: "transparent", color: "var(--text)", boxSizing: "border-box" }}
          />
          <div style={{ padding: "8px 28px 14px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
            생성: {formatTime(notes[activeIdx].createdAt)}
          </div>
        </div>
      )}
    </div>
  );
}
