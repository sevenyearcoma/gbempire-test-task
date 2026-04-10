"use client";

import { MapPin, Package, Radio, Receipt, ShoppingBag, TrendingUp } from "lucide-react";

type Props = {
  totalOrders: number;
  totalRevenue: number;
  topCity: string;
  topSource: string;
  avgOrder: number;
  totalItems: number;
};

export default function StatsCards(props: Props) {
  const cards = [
    {
      label: "Заказы",
      value: props.totalOrders.toLocaleString("ru-RU"),
      icon: ShoppingBag,
      iconClassName: "text-[#4f3d75] bg-[#f0e8ff] dark:text-[#d8ccff] dark:bg-[#322b4b]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
    {
      label: "Выручка",
      value: `${props.totalRevenue.toLocaleString("ru-RU")} ₸`,
      icon: TrendingUp,
      iconClassName: "text-[#1c6a52] bg-[#e3fbf1] dark:text-[#baf1da] dark:bg-[#19392f]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
    {
      label: "Средний чек",
      value: `${Math.round(props.avgOrder).toLocaleString("ru-RU")} ₸`,
      icon: Receipt,
      iconClassName: "text-[#0f5a75] bg-[#e6f8ff] dark:text-[#c1ecff] dark:bg-[#1c3643]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
    {
      label: "Товары",
      value: props.totalItems.toLocaleString("ru-RU"),
      icon: Package,
      iconClassName: "text-[#8a5c11] bg-[#fff4d8] dark:text-[#ffd67f] dark:bg-[#43351b]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
    {
      label: "Город",
      value: props.topCity || "—",
      icon: MapPin,
      iconClassName: "text-[#8b4960] bg-[#ffe9f1] dark:text-[#ffc5d7] dark:bg-[#432533]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
    {
      label: "Источник",
      value: props.topSource || "—",
      icon: Radio,
      iconClassName: "text-[#325286] bg-[#ebf1ff] dark:text-[#c7dbff] dark:bg-[#243551]",
      cardClassName: "border-[var(--panel-border)] bg-[var(--panel)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, iconClassName, cardClassName }) => (
        <div key={label} className={`rounded-xl border p-5 space-y-4 shadow-[0_10px_28px_rgba(14,18,28,.05)] ${cardClassName}`}>
          <span className={`${iconClassName} p-2 rounded-lg inline-flex items-center justify-center`}>
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
