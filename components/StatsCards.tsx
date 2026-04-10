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
      className: "text-primary bg-primary/10",
    },
    {
      label: "Выручка",
      value: `${props.totalRevenue.toLocaleString("ru-RU")} ₸`,
      icon: TrendingUp,
      className: "text-[#4edea3] bg-[#4edea3]/10",
    },
    {
      label: "Средний чек",
      value: `${Math.round(props.avgOrder).toLocaleString("ru-RU")} ₸`,
      icon: Receipt,
      className: "text-[#b9c8de] bg-[#b9c8de]/10",
    },
    {
      label: "Товары",
      value: props.totalItems.toLocaleString("ru-RU"),
      icon: Package,
      className: "text-primary bg-primary/10",
    },
    {
      label: "Город",
      value: props.topCity || "—",
      icon: MapPin,
      className: "text-[#c7c4d7] bg-[#2d3449]",
    },
    {
      label: "Источник",
      value: props.topSource || "—",
      icon: Radio,
      className: "text-[#b9c8de] bg-[#39485a]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, className }) => (
        <div key={label} className="bg-[#131b2e] p-5 rounded-xl space-y-4">
          <span className={`${className} p-2 rounded-lg inline-flex items-center justify-center`}>
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-[#dae2fd] truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
