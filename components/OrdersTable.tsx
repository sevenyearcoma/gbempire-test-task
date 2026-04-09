"use client";

import { useState } from "react";
import { Order, OrderItem, parseItems } from "@/lib/supabase";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "offer-analog": { label: "Предложение аналога", color: "bg-yellow-100 text-yellow-800" },
  "new": { label: "Новый", color: "bg-blue-100 text-blue-800" },
  "in-progress": { label: "В работе", color: "bg-indigo-100 text-indigo-800" },
  "complete": { label: "Завершён", color: "bg-green-100 text-green-800" },
  "cancel": { label: "Отменён", color: "bg-red-100 text-red-800" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

function ItemsList({ items }: { items: OrderItem[] }) {
  if (!items.length) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id} className="text-xs text-gray-700">
          <span className="font-medium">{item.offer?.displayName ?? item.offer?.name}</span>
          <span className="text-gray-400 ml-1">
            × {item.quantity} · {(item.initialPrice * item.quantity).toLocaleString("ru-RU")} ₸
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statuses = Array.from(new Set(orders.map((o) => o.status)));

  const filtered = orders.filter((o) => {
    const fullName = `${o.first_name} ${o.last_name}`.toLowerCase();
    const matchSearch =
      !search ||
      fullName.includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Список заказов</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Поиск по клиенту, телефону, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">Все статусы</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Клиент</th>
              <th className="pb-2 pr-4 font-medium">Телефон</th>
              <th className="pb-2 pr-4 font-medium">Город</th>
              <th className="pb-2 pr-4 font-medium">Адрес</th>
              <th className="pb-2 pr-4 font-medium">Статус</th>
              <th className="pb-2 pr-4 font-medium">Товары</th>
              <th className="pb-2 font-medium text-right">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const items = parseItems(order.items as string | OrderItem[]);
              return (
                <tr
                  key={order.retailcrm_id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 pr-4 text-gray-400">{order.retailcrm_id}</td>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900">
                      {order.first_name} {order.last_name}
                    </div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{order.phone}</td>
                  <td className="py-3 pr-4 text-gray-600">{order.city || "—"}</td>
                  <td className="py-3 pr-4 text-gray-500 max-w-[180px] truncate" title={order.delivery_address}>
                    {order.delivery_address || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 pr-4 min-w-[200px]">
                    <ItemsList items={items} />
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {(order.total_sum || 0).toLocaleString("ru-RU")} ₸
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Заказы не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Показано {filtered.length} из {orders.length} заказов
      </p>
    </div>
  );
}
