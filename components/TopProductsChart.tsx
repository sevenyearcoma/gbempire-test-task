"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ProductData = {
  name: string;
  quantity: number;
  revenue: number;
};

export default function TopProductsChart({ data }: { data: ProductData[] }) {
  const top = data.slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Топ товары по количеству</h2>
      <ResponsiveContainer width="100%" height={Math.max(200, top.length * 44)}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={200}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "quantity"
                ? [value, "Кол-во"]
                : [`${Number(value).toLocaleString("ru-RU")} ₸`, "Выручка"]
            }
          />
          <Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
