import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const chatId = body.message?.chat?.id?.toString();
        const firstName = body.message?.from?.first_name || "Unknown";
        const text = body.message?.text;

        if (chatId && text === "/start") {
            const { error } = await supabase
                .from("telegram_users")
                .upsert({ chat_id: chatId, first_name: firstName }, { onConflict: "chat_id" });

            if (error) throw error;

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "Вы подписаны на уведомления о крупных заказах! 🚀",
                }),
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}