import { google } from "googleapis";

export interface Email {
  id: string;
  type: "important" | "security" | "tech" | "general";
  emoji: string;
  sender: string;
  subject: string;
  snippet: string;
  time: string;
  priority: "high" | "medium" | null;
  priorityLabel: string | null;
}

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function classifyEmail(from: string, subject: string): Pick<Email, "type" | "emoji" | "priority" | "priorityLabel"> {
  const s = (from + " " + subject).toLowerCase();

  if (/security|vulnerability|취약점|침해|긴급|urgent|alert/i.test(s)) {
    return { type: "important", emoji: "🚨", priority: "high", priorityLabel: "중요" };
  }
  if (/보안|security alert|패스키|비밀번호|password|액세스|access|인증|verification/i.test(s)) {
    return { type: "security", emoji: "🔒", priority: "medium", priorityLabel: "보안" };
  }
  if (/결제|payment|청구|billing|invoice|송금/i.test(s)) {
    return { type: "important", emoji: "💳", priority: "medium", priorityLabel: "결제" };
  }
  if (/github|vercel|supabase|deploy|build|release|update/i.test(s)) {
    return { type: "tech", emoji: "🚀", priority: null, priorityLabel: null };
  }
  if (/newsletter|뉴스레터|digest|weekly|monthly/i.test(s)) {
    return { type: "general", emoji: "📰", priority: null, priorityLabel: null };
  }

  return { type: "general", emoji: "📧", priority: null, priorityLabel: null };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  // Same day: show time only
  if (d.toDateString() === now.toDateString()) {
    return `${hours}:${mins}`;
  }
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `어제 ${hours}:${mins}`;
  }
  return `${month}/${day} ${hours}:${mins}`;
}

function extractSender(from: string): string {
  // "Name <email>" → "Name"
  const match = from.match(/^"?(.+?)"?\s*<.*>$/);
  if (match) return match[1].trim();
  // "email@domain.com" → "email"
  const emailMatch = from.match(/^([^@]+)@/);
  if (emailMatch) return emailMatch[1];
  return from;
}

export async function fetchEmails(maxResults = 10): Promise<Email[] | null> {
  const auth = getAuth();
  if (!auth) return null;

  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "is:unread category:primary",
  });

  const messageIds = listRes.data.messages || [];
  if (messageIds.length === 0) {
    // If no unread primary, try recent messages
    const recentRes = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: "category:primary",
    });
    const recentIds = recentRes.data.messages || [];
    if (recentIds.length === 0) return [];
    return fetchMessageDetails(gmail, recentIds.map(m => m.id!));
  }

  return fetchMessageDetails(gmail, messageIds.map(m => m.id!));
}

async function fetchMessageDetails(
  gmail: ReturnType<typeof google.gmail>,
  ids: string[]
): Promise<Email[]> {
  const results = await Promise.all(
    ids.map(id =>
      gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      })
    )
  );

  return results.map(res => {
    const headers = res.data.payload?.headers || [];
    const from = headers.find(h => h.name === "From")?.value || "";
    const subject = headers.find(h => h.name === "Subject")?.value || "(제목 없음)";
    const date = headers.find(h => h.name === "Date")?.value || "";
    const snippet = res.data.snippet || "";
    const classification = classifyEmail(from, subject);

    return {
      id: res.data.id || "",
      ...classification,
      sender: extractSender(from),
      subject,
      snippet: snippet.length > 80 ? snippet.slice(0, 80) + "…" : snippet,
      time: formatTime(date),
    };
  });
}

export async function getUnreadCount(): Promise<number | null> {
  const auth = getAuth();
  if (!auth) return null;

  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.get({
    userId: "me",
    id: "UNREAD",
  });

  return res.data.messagesTotal || 0;
}
