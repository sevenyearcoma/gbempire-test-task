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
    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 h-full shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue Mix</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">Города</h2>
      </div>
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
