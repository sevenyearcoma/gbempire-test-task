"use client";

type Props = {
  totalOrders: number;
  totalRevenue: number;
  topCity: string;
  topSource: string;
  avgOrder: number;
  totalItems: number;
};

export default function StatsCards({ totalOrders, totalRevenue, topCity, topSource, avgOrder, totalItems }: Props) {
  const cards = [
    { label: "Всего заказов", value: totalOrders.toString() },
    { label: "Выручка", value: `${totalRevenue.toLocaleString("ru-RU")} ₸` },
    { label: "Средний чек", value: `${Math.round(avgOrder).toLocaleString("ru-RU")} ₸` },
    { label: "Позиций продано", value: totalItems.toString() },
    { label: "Топ город", value: topCity || "—" },
    { label: "Топ источник", value: topSource || "—" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl shadow p-5 flex flex-col gap-1">
          <span className="text-sm text-gray-500">{card.label}</span>
          <span className="text-2xl font-bold text-gray-900">{card.value}</span>
        </div>
      ))}
    </div>
  );
}
