"use client";

import { useState, useCallback } from "react";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceColor: string;
  time: string;
  url: string;
}

const DUMMY_NEWS: NewsItem[] = [
  { id: "1", title: "OpenAI, GPT-5 출시 임박… 멀티모달 성능 대폭 개선", source: "TechCrunch", sourceColor: "#22c55e", time: "2시간 전", url: "#" },
  { id: "2", title: "Next.js 17 베타 릴리즈 - Server Actions 안정화", source: "Vercel Blog", sourceColor: "#3b82f6", time: "3시간 전", url: "#" },
  { id: "3", title: "구글 클라우드, AI 기반 코드 리뷰 도구 발표", source: "Google Cloud", sourceColor: "#f59e0b", time: "4시간 전", url: "#" },
  { id: "4", title: "한국 AI 스타트업 투자, 2026년 사상 최고치 기록", source: "조선비즈", sourceColor: "#ef4444", time: "5시간 전", url: "#" },
  { id: "5", title: "TypeScript 6.0 로드맵 공개 - 패턴 매칭 지원", source: "Microsoft", sourceColor: "#8b5cf6", time: "6시간 전", url: "#" },
  { id: "6", title: "Docker Desktop 5.0 업데이트 - Wasm 컨테이너 지원 확대", source: "Docker", sourceColor: "#06b6d4", time: "7시간 전", url: "#" },
];

function shuffleNews(news: NewsItem[]): NewsItem[] {
  const shuffled = [...news];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((item, idx) => ({
    ...item,
    time: `${idx + 1}시간 전`,
  }));
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>(DUMMY_NEWS);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call with shuffle
    setTimeout(() => {
      setNews(shuffleNews(DUMMY_NEWS));
      setRefreshing(false);
    }, 600);
  }, []);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, boxShadow: "var(--shadow)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "var(--accent-soft)" }}>📰</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>뉴스 / 트렌드</span>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: refreshing ? "wait" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
        >
          <span style={{ display: "inline-block", transition: "transform 0.6s", transform: refreshing ? "rotate(360deg)" : "none" }}>🔄</span>
          새로고침
        </button>
      </div>

      {/* News list */}
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {news.map((item, i) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "start", gap: 14, padding: "16px 28px", borderBottom: i < news.length - 1 ? "1px solid var(--border)" : "none", textDecoration: "none", color: "inherit", cursor: "pointer", transition: "background 0.2s" }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.sourceColor, marginTop: 7, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 6, color: "var(--text)" }}>
                {item.title}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontWeight: 700, background: item.sourceColor + "18", color: item.sourceColor }}>
                  {item.source}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{item.time}</span>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0, marginTop: 4 }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
