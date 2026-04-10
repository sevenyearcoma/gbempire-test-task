import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const RETAILCRM_PAGE_LIMIT = 20;
const UPLOAD_CHUNK_SIZE = 20;
const MAX_ORDERS_PER_REQUEST = 500;

type JsonRecord = Record<string, unknown>;

type PipelineSummary = {
  received: number;
  uniqueInput: number;
  skippedDuplicateInput: number;
  skippedExistingRetailCrm: number;
  uploadedToRetailCrm: number;
  retailCrmOrdersFetched: number;
  supabaseUpserted: number;
  supabaseInsertedEstimate: number;
  supabaseUpdatedEstimate: number;
};

function getRetailCrmConfig() {
  const domain = process.env.RETAILCRM_PERSONAL_DOMAIN;
  const apiKey = process.env.RETAILCRM_API_KEY;

  if (!domain || !apiKey) {
    throw new Error("RetailCRM env vars missing");
  }

  return {
    apiKey,
    baseUrl: `${domain.replace(/\/$/, "")}/api/v5`,
  };
}

function getPipelineSecret() {
  return process.env.PIPELINE_UPLOAD_SECRET ?? process.env.RETAILCRM_WEBHOOK_SECRET;
}

function isPipelineAuthorized(request: Request) {
  const expectedSecret = getPipelineSecret();
  if (!expectedSecret) return false;

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;

  return request.headers.get("x-pipeline-secret") === expectedSecret || bearer === expectedSecret;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function normalizePhone(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function getOrderPhone(order: JsonRecord): string {
  const phone = order.phone;
  if (typeof phone === "string") return phone;

  const phones = order.phones;
  if (Array.isArray(phones)) {
    const firstPhone = phones.find((item) => typeof item === "string");
    if (firstPhone) return firstPhone;
  }

  return "";
}

function getExternalId(order: JsonRecord, index: number): string {
  const externalId = order.externalId ?? order.external_id;
  if (typeof externalId === "string" && externalId.trim()) return externalId.trim();

  const phone = normalizePhone(getOrderPhone(order));
  if (phone) return `mock_${phone}`;

  const email = typeof order.email === "string" ? order.email.trim().toLowerCase() : "";
  if (email) return `mock_${email}`;

  return `mock_no_phone_${index}`;
}

function prepareIncomingOrders(rawOrders: unknown[]) {
  const seenKeys = new Set<string>();
  const orders: JsonRecord[] = [];
  let skippedDuplicateInput = 0;

  rawOrders.forEach((rawOrder, index) => {
    const order = asRecord(rawOrder);
    const externalId = getExternalId(order, index);
    const phone = normalizePhone(getOrderPhone(order));
    const dedupeKey = externalId || phone || String(index);

    if (seenKeys.has(dedupeKey)) {
      skippedDuplicateInput += 1;
      return;
    }

    seenKeys.add(dedupeKey);
    orders.push({
      ...order,
      externalId,
    });
  });

  return { orders, skippedDuplicateInput };
}

function transformRetailCrmOrder(order: JsonRecord) {
  const delivery = asRecord(order.delivery);
  const deliveryAddress = asRecord(delivery.address);
  const customFields = asRecord(order.customFields);

  return {
    retailcrm_id: order.id,
    first_name: order.firstName ?? "",
    last_name: order.lastName ?? "",
    phone: order.phone ?? "",
    email: order.email ?? "",
    status: order.status ?? "",
    total_sum: order.totalSumm ?? 0,
    order_type: order.orderType ?? "",
    order_method: order.orderMethod ?? "",
    city: deliveryAddress.city ?? "",
    delivery_address: deliveryAddress.text ?? "",
    utm_source: customFields.utm_source ?? "",
    items: order.items ?? [],
  };
}

async function retailCrmRequest(path: string, init?: RequestInit) {
  const { apiKey, baseUrl } = getRetailCrmConfig();
  const url = new URL(`${baseUrl}${path}`);

  if (!init?.body) {
    url.searchParams.set("apiKey", apiKey);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.success === false) {
    throw new Error(data.errorMsg ?? `RetailCRM request failed: ${response.status}`);
  }

  return data as JsonRecord;
}

async function fetchRetailCrmOrders() {
  const orders: JsonRecord[] = [];
  let page = 1;

  while (true) {
    const data = await retailCrmRequest(`/orders?limit=${RETAILCRM_PAGE_LIMIT}&page=${page}`);
    const pageOrders = Array.isArray(data.orders) ? (data.orders as JsonRecord[]) : [];
    orders.push(...pageOrders);

    const pagination = asRecord(data.pagination);
    const totalPages =
      typeof pagination.totalPageCount === "number" ? pagination.totalPageCount : 1;

    if (page >= totalPages) break;
    page += 1;
  }

  return orders;
}

async function uploadRetailCrmOrders(orders: JsonRecord[]) {
  if (orders.length === 0) return 0;

  const { apiKey, baseUrl } = getRetailCrmConfig();
  let uploaded = 0;

  for (let index = 0; index < orders.length; index += UPLOAD_CHUNK_SIZE) {
    const chunk = orders.slice(index, index + UPLOAD_CHUNK_SIZE);
    const body = new URLSearchParams({
      apiKey,
      orders: JSON.stringify(chunk),
    });

    const response = await fetch(`${baseUrl}/orders/upload`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await response.json()) as JsonRecord;

    if (!response.ok || data.success === false) {
      throw new Error(String(data.errorMsg ?? `RetailCRM upload failed: ${response.status}`));
    }

    uploaded += chunk.length;
  }

  return uploaded;
}

function getExistingRetailCrmKeys(orders: JsonRecord[]) {
  const externalIds = new Set<string>();
  const phones = new Set<string>();

  for (const order of orders) {
    const externalId = order.externalId;
    if (typeof externalId === "string" && externalId.trim()) {
      externalIds.add(externalId.trim());
    }

    const phone = normalizePhone(getOrderPhone(order));
    if (phone) phones.add(phone);
  }

  return { externalIds, phones };
}

async function getExistingSupabaseIds(retailcrmIds: unknown[]) {
  const ids = retailcrmIds.filter((id) => typeof id === "number" || typeof id === "string");
  if (ids.length === 0) return new Set<unknown>();

  const { data, error } = await getSupabaseServer()
    .from("orders")
    .select("retailcrm_id")
    .in("retailcrm_id", ids);

  if (error) throw error;

  return new Set((data ?? []).map((row) => row.retailcrm_id));
}

async function syncRetailCrmOrdersToSupabase(retailCrmOrders: JsonRecord[]) {
  const rows = retailCrmOrders.map(transformRetailCrmOrder);
  const existingIds = await getExistingSupabaseIds(rows.map((row) => row.retailcrm_id));

  const { data, error } = await getSupabaseServer()
    .from("orders")
    .upsert(rows, { onConflict: "retailcrm_id" })
    .select("retailcrm_id");

  if (error) throw error;

  const upsertedIds = (data ?? []).map((row) => row.retailcrm_id);
  const insertedEstimate = upsertedIds.filter((id) => !existingIds.has(id)).length;

  return {
    upserted: upsertedIds.length,
    insertedEstimate,
    updatedEstimate: upsertedIds.length - insertedEstimate,
  };
}

export async function POST(request: Request) {
  if (!isPipelineAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawOrders = Array.isArray(body)
    ? body
    : Array.isArray(asRecord(body).orders)
      ? (asRecord(body).orders as unknown[])
      : null;

  if (!rawOrders) {
    return NextResponse.json({ error: "Expected JSON array or { orders: [] }" }, { status: 400 });
  }

  if (rawOrders.length > MAX_ORDERS_PER_REQUEST) {
    return NextResponse.json(
      { error: `Too many orders. Maximum is ${MAX_ORDERS_PER_REQUEST}.` },
      { status: 413 }
    );
  }

  try {
    const existingBeforeUpload = await fetchRetailCrmOrders();
    const existingKeys = getExistingRetailCrmKeys(existingBeforeUpload);
    const { orders: uniqueInput, skippedDuplicateInput } = prepareIncomingOrders(rawOrders);

    const ordersToUpload = uniqueInput.filter((order) => {
      const externalId = String(order.externalId ?? "").trim();
      const phone = normalizePhone(getOrderPhone(order));

      return !existingKeys.externalIds.has(externalId) && (!phone || !existingKeys.phones.has(phone));
    });

    const uploadedToRetailCrm = await uploadRetailCrmOrders(ordersToUpload);
    const retailCrmOrders = await fetchRetailCrmOrders();
    const syncResult = await syncRetailCrmOrdersToSupabase(retailCrmOrders);

    const summary: PipelineSummary = {
      received: rawOrders.length,
      uniqueInput: uniqueInput.length,
      skippedDuplicateInput,
      skippedExistingRetailCrm: uniqueInput.length - ordersToUpload.length,
      uploadedToRetailCrm,
      retailCrmOrdersFetched: retailCrmOrders.length,
      supabaseUpserted: syncResult.upserted,
      supabaseInsertedEstimate: syncResult.insertedEstimate,
      supabaseUpdatedEstimate: syncResult.updatedEstimate,
    };

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Pipeline failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
