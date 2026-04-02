"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push("/");
      } else {
        setError(data.error || "로그인 실패");
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)",
      fontFamily: "var(--font-noto), sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 380,
        padding: "48px 40px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0", margin: 0 }}>AI 비서 - 김하은</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>로그인하여 비서 시스템에 접속하세요</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>아이디</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            required
            autoFocus
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#e8e8f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#e8e8f0",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,80,80,0.1)",
            border: "1px solid rgba(255,80,80,0.2)",
            color: "#ff6b6b",
            fontSize: 13,
            textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: loading ? "rgba(123,147,255,0.3)" : "linear-gradient(135deg, #7b93ff, #6366f1)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            marginTop: 4,
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
