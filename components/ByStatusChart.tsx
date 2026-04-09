"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type StatusData = { name: string; value: number };

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#3b82f6"];

export default function ByStatusChart({ data }: { data: StatusData[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Заказы по статусу</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, "Заказов"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
