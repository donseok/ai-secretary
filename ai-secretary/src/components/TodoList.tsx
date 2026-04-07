"use client";

import { useState, useEffect } from "react";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = "ai-secretary-todos";

function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function getTodoStats(): { total: number; done: number } {
  const todos = loadTodos();
  return { total: todos.length, done: todos.filter(t => t.done).length };
}

export default function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => { setTodos(loadTodos()); }, []);
  useEffect(() => { if (todos.length > 0 || localStorage.getItem(STORAGE_KEY)) saveTodos(todos); }, [todos]);

  const doneCount = todos.filter(t => t.done).length;

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos(prev => [...prev, { id: Date.now().toString(), text: input.trim(), done: false, createdAt: new Date().toISOString() }]);
    setInput("");
  }

  function toggle(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function remove(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--green-soft)" }}>✅</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>오늘의 할 일</span>
        </div>
        <span style={{ fontSize: 12, padding: "5px 14px", borderRadius: 8, fontWeight: 700, color: todos.length > 0 ? "var(--green)" : "var(--text-muted)", background: "var(--surface-3)" }}>
          {todos.length > 0 ? `${doneCount}/${todos.length} 완료` : "0건"}
        </span>
      </div>

      {/* Add form */}
      <form onSubmit={addTodo} style={{ display: "flex", gap: 10, padding: "16px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="할 일을 입력하세요..."
          style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", fontSize: 13, outline: "none", background: "var(--surface-3)", color: "var(--text)", fontFamily: "inherit" }}
        />
        <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: input.trim() ? 1 : 0.4, transition: "all 0.2s" }}>
          추가
        </button>
      </form>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div style={{ padding: "12px 28px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "var(--green)", width: `${(doneCount / todos.length) * 100}%`, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Todo items */}
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {todos.length === 0 ? (
          <div style={{ padding: "48px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>할 일이 없습니다</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>위에서 할 일을 추가해보세요!</div>
          </div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 28px", borderBottom: "1px solid var(--border)", transition: "all 0.2s", opacity: todo.done ? 0.5 : 1 }}>
              <button
                onClick={() => toggle(todo.id)}
                style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${todo.done ? "var(--green)" : "var(--border-light)"}`, background: todo.done ? "var(--green)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", flexShrink: 0, transition: "all 0.2s" }}
              >
                {todo.done && "✓"}
              </button>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textDecoration: todo.done ? "line-through" : "none", color: todo.done ? "var(--text-muted)" : "var(--text)", transition: "all 0.2s" }}>
                {todo.text}
              </span>
              <button
                onClick={() => remove(todo.id)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "var(--text-muted)", transition: "all 0.2s", flexShrink: 0 }}
                title="삭제"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
