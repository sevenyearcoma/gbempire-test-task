"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type StatusData = { name: string; value: number };

const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function ByStatusChart({ data }: { data: StatusData[] }) {
  const chartConfig = Object.fromEntries(
    data.map((item, index) => [
      item.name,
      { label: item.name, color: CHART_VARS[index % CHART_VARS.length] },
    ])
  ) satisfies ChartConfig;

  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-[0_10px_28px_rgba(14,18,28,.05)]">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Distribution</p>
        <h2 className="mt-1 text-lg font-bold text-foreground">Статусы</h2>
      </div>
      <ChartContainer config={chartConfig} className="mx-auto max-h-64">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((item, index) => (
              <Cell key={item.name} fill={CHART_VARS[index % CHART_VARS.length]} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
