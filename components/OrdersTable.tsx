"use client";

import { useState } from "react";
import { Order, OrderItem, parseItems } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  "offer-analog": { label: "Аналог", className: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
  new: { label: "Новый", className: "bg-primary/10 text-primary border border-primary/20" },
  "in-progress": { label: "В работе", className: "bg-sky-500/10 text-sky-500 border border-sky-500/20" },
  complete: { label: "Завершён", className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  cancel: { label: "Отменён", className: "bg-rose-500/10 text-rose-500 border border-rose-500/20" },
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, className: "bg-[var(--surface-container-high)] text-slate-400 border border-[var(--panel-border)]" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${s.className}`}>
      {s.label}
    </span>
  );
}

function ItemsList({ items }: { items: OrderItem[] }) {
  if (!items.length) return <span className="text-slate-500">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <span key={item.id} className="text-xs">
          <span className="font-medium text-[#c7c4d7]">
            {item.offer?.displayName ?? item.offer?.name}
          </span>
          <span className="text-slate-500 ml-1">× {item.quantity}</span>
        </span>
      ))}
    </div>
  );
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statuses = Array.from(new Set(orders.map((order) => order.status)));

  const filtered = orders.filter((order) => {
    const fullName = `${order.first_name} ${order.last_name}`.toLowerCase();
    const query = search.toLowerCase();
    const matchSearch =
      !search ||
      fullName.includes(query) ||
      order.phone.includes(search) ||
      String(order.retailcrm_id).includes(search);
    const matchStatus = statusFilter === "all" || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="p-5 border-b border-[var(--panel-border)] flex flex-wrap gap-3 justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            className="w-full bg-[var(--surface-bright)] border border-[var(--panel-border)] rounded-xl pl-12 pr-4 py-3 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none placeholder:text-slate-500"
            placeholder="Клиент, телефон или ID"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-[var(--surface-bright)] border border-[var(--panel-border)] rounded-xl py-3 px-4 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
        >
          <option value="all">Все статусы</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{STATUS_LABELS[status]?.label ?? status}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--surface-container-high)]">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Клиент</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Телефон</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Город</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Статус</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Товары</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-border)]">
            {paged.map((order) => {
              const items = parseItems(order.items as string | OrderItem[]);
              return (
                <tr key={order.retailcrm_id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                  <td className="px-6 py-5 font-mono text-sm text-primary font-bold">#{order.retailcrm_id}</td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-foreground">{order.first_name} {order.last_name}</p>
                    <p className="text-[10px] text-slate-500">{order.email}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-foreground">{order.phone}</td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-foreground">{order.city || "—"}</p>
                    {order.delivery_address && (
                      <p className="text-[10px] text-slate-500 max-w-[140px] truncate">{order.delivery_address}</p>
                    )}
                  </td>
                  <td className="px-6 py-5"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-5 min-w-[180px]"><ItemsList items={items} /></td>
                  <td className="px-6 py-5 text-right font-semibold text-foreground whitespace-nowrap">
                    {(order.total_sum || 0).toLocaleString("ru-RU")} ₸
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">Заказы не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-5 border-t border-[var(--panel-border)] flex justify-between items-center gap-4">
        <p className="text-xs text-slate-500">
          {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}—{Math.min(safePage * PAGE_SIZE, filtered.length)} из {filtered.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] text-slate-500 transition-colors disabled:opacity-40"
            aria-label="Предыдущая страница"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-container-high)] hover:bg-[var(--surface-container-highest)] text-slate-500 transition-colors disabled:opacity-40"
            aria-label="Следующая страница"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
