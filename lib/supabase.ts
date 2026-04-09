import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    _client = createClient(url, key);
  }
  return _client;
}

export type OrderItem = {
  id: number;
  offer: {
    id: number;
    name: string;
    displayName: string;
  };
  quantity: number;
  initialPrice: number;
  prices: { price: number; quantity: number }[];
  status: string;
};

export type Order = {
  retailcrm_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  status: string;
  total_sum: number;
  order_type: string;
  order_method: string;
  city: string;
  delivery_address: string;
  utm_source: string;
  items: string | OrderItem[];
};

export function parseItems(items: string | OrderItem[]): OrderItem[] {
  if (typeof items === "string") {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return items ?? [];
}
