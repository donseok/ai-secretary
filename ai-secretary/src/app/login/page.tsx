"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
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
      background: "linear-gradient(135deg, #f0f2f5 0%, #e8eaf0 50%, #f5f6fa 100%)",
      fontFamily: "var(--font-noto), sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 380,
        padding: "48px 40px",
        borderRadius: 24,
        background: "#fff",
        border: "1px solid #e2e5ea",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Image src="/sec2.png" alt="김하은" width={80} height={80} style={{ borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>AI 비서 - 김하은</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>로그인하여 비서 시스템에 접속하세요</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>아이디</label>
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
              border: "1px solid #dde0e5",
              background: "#f8f9fb",
              color: "#1a1a2e",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666" }}>비밀번호</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              style={{
                width: "100%",
                padding: "14px 44px 14px 16px",
                borderRadius: 12,
                border: "1px solid #dde0e5",
                background: "#f8f9fb",
                color: "#1a1a2e",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "#999",
                padding: 0,
                lineHeight: 1,
              }}
            >
              {showPw ? "ᐧ‿ᐧ" : "─‿─"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fff0f0",
            border: "1px solid #ffd4d4",
            color: "#d44",
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
