import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "nodejs";

const MIN_ORDER_TOTAL = 50_000;

type OrderPayload = {
  retailcrm_id?: number | string | null;
  id?: number | string | null;
  number?: string | null;
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  total_sum?: number | string | null;
  totalSumm?: number | string | null;
  total?: number | string | null;
  sum?: number | string | null;
  city?: string | null;
  delivery_address?: string | null;
  delivery?: {
    address?: {
      city?: string | null;
      text?: string | null;
    } | null;
  } | null;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getAuthToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-webhook-secret");
}

function isAuthorized(request: NextRequest): boolean {
  const expectedSecret = process.env.RETAILCRM_WEBHOOK_SECRET;
  if (!expectedSecret) return false;

  return getAuthToken(request) === expectedSecret;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractOrder(payload: unknown): OrderPayload {
  const root = asRecord(payload);

  return asRecord(root.record ?? root.order ?? root.data ?? root) as OrderPayload;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getOrderTotal(order: OrderPayload): number {
  return toNumber(order.total_sum ?? order.totalSumm ?? order.total ?? order.sum);
}

function getOrderId(order: OrderPayload): string {
  const id = order.retailcrm_id ?? order.id ?? order.number;
  return id ? String(id) : "без номера";
}

function getCustomerName(order: OrderPayload): string {
  const firstName = order.first_name ?? order.firstName ?? "";
  const lastName = order.last_name ?? order.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "не указан";
}

function getCity(order: OrderPayload): string {
  return order.city ?? order.delivery?.address?.city ?? "не указан";
}

function getAddress(order: OrderPayload): string {
  return order.delivery_address ?? order.delivery?.address?.text ?? "не указан";
}

function formatTelegramMessage(order: OrderPayload, total: number): string {
  const lines = [
    "Крупный заказ RetailCRM",
    "",
    `Заказ: #${getOrderId(order)}`,
    `Сумма: ${Math.round(total).toLocaleString("ru-RU")} ₸`,
    `Клиент: ${getCustomerName(order)}`,
    `Телефон: ${order.phone || "не указан"}`,
    `Email: ${order.email || "не указан"}`,
    `Статус: ${order.status || "не указан"}`,
    `Город: ${getCity(order)}`,
    `Адрес: ${getAddress(order)}`,
  ];

  return lines.join("\n");
}

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram env vars missing");
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

async function broadcastToAll(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  const { data: users, error } = await supabase
    .from("telegram_users")
    .select("chat_id");

  if (error || !users) {
    console.error("Ошибка получения пользователей:", error);
    return;
  }

  const requests = users.map((user) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: user.chat_id,
        text,
        disable_web_page_preview: true,
      }),
    })
  );

  await Promise.allSettled(requests);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const order = extractOrder(payload);
  const total = getOrderTotal(order);

  if (total > MIN_ORDER_TOTAL) {
    const message = formatTelegramMessage(order, total);
    await broadcastToAll(message);
  }

  return NextResponse.json({ sent: true });
}