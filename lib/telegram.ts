import { getSupabaseServer } from "@/lib/supabase-server";

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN env var missing");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram send failed: ${response.status} ${body}`);
  }
}

export async function getTelegramChatIds(): Promise<string[]> {
  const { data, error } = await getSupabaseServer()
    .from("telegram_users")
    .select("chat_id");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((user) => String(user.chat_id ?? "").trim())
    .filter(Boolean);
}

export async function broadcastTelegramMessage(text: string) {
  const chatIds = await getTelegramChatIds();

  if (chatIds.length === 0) {
    return { sent: 0 };
  }

  const results = await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage(chatId, text))
  );

  const failed = results.filter((result) => result.status === "rejected");

  if (failed.length > 0) {
    console.error("Telegram broadcast partially failed", failed);
  }

  return { sent: results.length - failed.length, failed: failed.length };
}
