import { fetchEmails, getUnreadCount } from "@/lib/gmail";
import { emails as fallbackEmails } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [emails, unreadCount] = await Promise.all([
      fetchEmails(10),
      getUnreadCount(),
    ]);

    if (emails) {
      return Response.json({
        source: "gmail",
        emails,
        unreadCount: unreadCount ?? emails.length,
      });
    }
  } catch (e) {
    console.error("Gmail API error:", e);
  }

  // Fallback to hardcoded
  return Response.json({
    source: "local",
    emails: fallbackEmails,
    unreadCount: fallbackEmails.length,
  });
}
