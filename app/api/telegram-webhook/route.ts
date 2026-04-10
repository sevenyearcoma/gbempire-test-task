import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const chatId = body.message?.chat?.id?.toString();
        const firstName = body.message?.from?.first_name || "Unknown";
        const text = body.message?.text;

        if (chatId && text === "/start") {
            const { error } = await getSupabaseServer()
                .from("telegram_users")
                .upsert({ chat_id: chatId, first_name: firstName }, { onConflict: "chat_id" });

            if (error) throw error;

            await sendTelegramMessage(chatId, "Вы подписаны на уведомления о крупных заказах.");
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
