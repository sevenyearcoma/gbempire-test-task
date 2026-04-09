"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type CityData = {
  city: string;
  orders: number;
  revenue: number;
};

export default function ByCityChart({ data }: { data: CityData[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Заказы по городам</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) =>
              name === "revenue"
                ? [`${Number(value).toLocaleString("ru-RU")} ₸`, "Выручка"]
                : [value, "Заказов"]
            }
          />
          <Legend formatter={(v) => (v === "orders" ? "Заказов" : "Выручка")} />
          <Bar yAxisId="left" dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="revenue" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
