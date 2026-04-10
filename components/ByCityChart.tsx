"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type CityData = {
  city: string;
  orders: number;
  revenue: number;
};

const chartConfig = {
  orders: { label: "Заказы", color: "var(--chart-1)" },
  revenue: { label: "Выручка, ₸", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function ByCityChart({ data }: { data: CityData[] }) {
  const top = data.slice(0, 12);
  return (
    <div className="bg-[#131b2e] p-6 rounded-xl h-full">
      <h2 className="text-lg font-bold text-[#dae2fd] mb-6">Города</h2>
      <ChartContainer config={chartConfig} className="max-h-72 w-full">
        <BarChart data={top} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#46455440" />
          <XAxis dataKey="city" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}к`}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) =>
                  name === "revenue"
                    ? `${Number(value).toLocaleString("ru-RU")} ₸`
                    : String(value)
                }
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" radius={4} />
          <Bar yAxisId="right" dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
